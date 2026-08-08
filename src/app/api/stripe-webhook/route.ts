import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

// Stripe hat in neueren API-Versionen current_period_end vom Subscription-Objekt
// auf die einzelnen Abo-Positionen (subscription.items) verschoben. Dieser Helper
// funktioniert mit beiden Varianten, damit's unabhaengig von der API-Version klappt.
function getPeriodEnd(subscription: Stripe.Subscription): number {
  const itemPeriodEnd = (subscription as any).items?.data?.[0]?.current_period_end
  const topLevelPeriodEnd = (subscription as any).current_period_end
  const periodEnd = itemPeriodEnd ?? topLevelPeriodEnd
  if (!periodEnd) {
    console.error('getPeriodEnd: could not find current_period_end on subscription', subscription.id)
    // Fallback: 1 Monat ab jetzt, damit der Webhook nie crasht
    return Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
  }
  return periodEnd
}

// Rundet einen Unix-Timestamp auf 23:59:59 Uhr desselben Tages hoch.
// Sorgt dafuer, dass Premium-Zugang immer bis Tagesende laeuft statt zu einer
// "krummen" Uhrzeit mitten am Tag -- entspricht der ueblichen Nutzererwartung
// (wie bei Netflix/Spotify), auch wenn Stripe intern exakt zur Abschluss-Uhrzeit abrechnet.
function roundUpToEndOfDay(unixSeconds: number): Date {
  const d = new Date(unixSeconds * 1000)
  d.setHours(23, 59, 59, 999)
  return d
}

  // --- Checkout abgeschlossen: erstes Abo-Setup -----------------------------------
  // WICHTIG: premium_until kommt jetzt direkt von Stripe (current_period_end) statt
  // fix "+1 Monat" -- das beruecksichtigt automatisch eine evtl. laufende Trial-Zeit
  // (z.B. wenn noch gratis Pro-Tage durch Einladungen uebrig waren).
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    console.log('checkout.session.completed received. userId:', userId, 'subscription:', session.subscription)
    if (userId && session.subscription) {
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const premiumUntil = roundUpToEndOfDay(getPeriodEnd(subscription))

        const { error: updateError } = await supabase.from('profiles').update({
          is_premium: true,
          premium_until: premiumUntil.toISOString(),
          premium_source: 'stripe',
          pending_lock_warning_count: 0,
          subscription_cancel_pending: false,
        }).eq('id', userId)

        if (updateError) {
          console.error('checkout.session.completed: profiles update FAILED for userId', userId, updateError)
        } else {
          console.log('checkout.session.completed: profiles updated OK for userId', userId, 'until', premiumUntil.toISOString())
        }

        // NEU: Lock-Status synchronisieren (falls vorher Items gesperrt waren)
        await supabase.rpc('sync_wardrobe_lock_state', { p_user_id: userId })

        try {
          const { data: { user } } = await supabase.auth.admin.getUserById(userId)
          const { data: profile } = await supabase.from('profiles').select('username, language').eq('id', userId).single()

          if (user?.email) {
            await sendProWelcomeEmail({
              email: user.email,
              username: profile?.username,
              language: profile?.language ?? 'de',
              premiumUntil,
            })
          }
        } catch (emailErr) {
          console.error('Pro welcome email failed:', emailErr)
        }
      } catch (err) {
        console.error('Failed to retrieve subscription on checkout.session.completed:', err)
      }
    }
  }

  // --- Jede erfolgreiche Zahlung (erste Abbuchung nach Trial ODER jede spaetere ---
  // monatliche Verlaengerung) -- das ist der zuverlaessige Ort, um premium_until
  // bei jedem Abrechnungszyklus zu verlaengern. Ohne diesen Handler wuerde is_premium
  // nach Ablauf des ersten Monats faelschlicherweise auslaufen, obwohl der Nutzer
  // weiterbezahlt.
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = (invoice as any).subscription as string | null
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.userId
        if (userId) {
          const premiumUntil = roundUpToEndOfDay(getPeriodEnd(subscription))
          const { error: updateError } = await supabase.from('profiles').update({
            is_premium: true,
            premium_until: premiumUntil.toISOString(),
            premium_source: 'stripe',
            pending_lock_warning_count: 0,
          }).eq('id', userId)
          if (updateError) {
            console.error('invoice.payment_succeeded: profiles update FAILED for userId', userId, updateError)
          } else {
            console.log('invoice.payment_succeeded: profiles updated OK for userId', userId)
          }

          // NEU: Lock-Status synchronisieren
          await supabase.rpc('sync_wardrobe_lock_state', { p_user_id: userId })
        }
      } catch (err) {
        console.error('Failed to process invoice.payment_succeeded:', err)
      }
    }
  }

  // --- Zahlung fehlgeschlagen (z.B. Karte abgelaufen) ------------------------------
  // Wir entziehen den Zugang HIER noch nicht -- Stripe versucht automatisch mehrfach
  // erneut abzubuchen und schickt erst 'customer.subscription.deleted', wenn das
  // Abo endgueltig beendet wird. Wir informieren den Nutzer nur, damit er seine
  // Zahlungsmethode aktualisieren kann, bevor der Zugang tatsaechlich ausläuft.
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = (invoice as any).subscription as string | null
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.userId
        if (userId) {
          const { data: { user } } = await supabase.auth.admin.getUserById(userId)
          const { data: profile } = await supabase.from('profiles').select('username, language').eq('id', userId).single()
          if (user?.email) {
            await sendPaymentFailedEmail({
              email: user.email,
              username: profile?.username,
              language: profile?.language ?? 'de',
            })
          }
        }
      } catch (err) {
        console.error('Failed to process invoice.payment_failed:', err)
      }
    }
  }

  // --- Abo tatsaechlich beendet (nach Kuendigung oder endgueltig fehlgeschlagener --
  // Zahlung) -- Zugang entziehen und Bestaetigungs-Mail schicken.
  // --- Abo gekündigt, laeuft aber noch bis Periodenende --------------------------
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId
    if (userId) {
      await supabase.from('profiles').update({
        subscription_cancel_pending: subscription.cancel_at_period_end === true,
      }).eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    if (userId) {
      const { data: profileBefore } = await supabase.from('profiles').select('premium_until, username, language').eq('id', userId).single()

      const { error: updateError } = await supabase.from('profiles').update({
        is_premium: false,
        premium_until: null,
      }).eq('id', userId)
      if (updateError) {
        console.error('customer.subscription.deleted: profiles update FAILED for userId', userId, updateError)
      }

      // NEU: Lock-Status sofort synchronisieren, nicht erst beim naechsten App-Open
      const { error: syncError } = await supabase.rpc('sync_wardrobe_lock_state', { p_user_id: userId })
      if (syncError) {
        console.error('customer.subscription.deleted: sync_wardrobe_lock_state FAILED for userId', userId, syncError)
      }

      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId)
        if (user?.email) {
          await sendCancellationEmail({
            email: user.email,
            username: profileBefore?.username,
            language: profileBefore?.language ?? 'de',
            accessUntil: profileBefore?.premium_until ? new Date(profileBefore.premium_until) : new Date(),
          })
        }
      } catch (emailErr) {
        console.error('Cancellation email failed:', emailErr)
      }
    }
  }

  return NextResponse.json({ received: true })
}

async function sendProWelcomeEmail({ email, username, language, premiumUntil }: { email: string; username?: string; language: string; premiumUntil: Date }) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const isDe = language === 'de'
  const name = username || (isDe ? 'da' : 'there')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe.com'
  const lang = isDe ? 'de' : 'en'
  const dateStr = premiumUntil.toLocaleDateString(isDe ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const subject = isDe ? '✦ Willkommen bei KiWardrobe Pro!' : '✦ Welcome to KiWardrobe Pro!'

  const perks = isDe
    ? [
        { icon: '✨', title: '14 Outfits pro Woche', desc: 'Statt 3 im Free Plan — fast täglich ein neuer Look.' },
        { icon: '👗', title: 'Unbegrenzt Kleidung', desc: 'Kein Limit mehr bei deinem digitalen Kleiderschrank.' },
        { icon: '🪞', title: '6 Avatare pro Woche', desc: 'Statt 2 im Monat — probier viel mehr Outfits virtuell an.' },
        { icon: '📤', title: 'Outfits teilen', desc: 'Teile deine Looks mit Freunden, direkt aus der App.' },
      ]
    : [
        { icon: '✨', title: '14 outfits per week', desc: 'Instead of 3 on Free — a new look almost every day.' },
        { icon: '👗', title: 'Unlimited wardrobe', desc: 'No more limit on your digital wardrobe.' },
        { icon: '🪞', title: '6 avatars per week', desc: 'Instead of 2 per month — try on way more outfits virtually.' },
        { icon: '📤', title: 'Share outfits', desc: 'Share your looks with friends, right from the app.' },
      ]

  const perkHtml = perks.map(p => `
    <tr>
      <td style="padding: 10px 0; vertical-align: top; width: 40px; font-size: 22px;">${p.icon}</td>
      <td style="padding: 10px 0; vertical-align: top;">
        <p style="margin: 0 0 2px; font-size: 14px; font-weight: 700; color: #1D1D20;">${p.title}</p>
        <p style="margin: 0; font-size: 13px; color: #8C8776; line-height: 1.5;">${p.desc}</p>
      </td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#F7F4EC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EC; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:20px; overflow:hidden; font-family: -apple-system, 'Poppins', sans-serif;">
          <tr>
            <td style="background: linear-gradient(135deg, #F1B951, #C98A3A); padding: 32px; text-align: center;">
              <p style="margin:0; font-size: 22px; font-weight: 800; color: #24211B; letter-spacing: -0.02em;">✦ KiWardrobe Pro</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 700; color: #1D1D20;">${isDe ? `Willkommen, ${name}!` : `Welcome, ${name}!`}</h1>
              <p style="margin: 0 0 20px; font-size: 15px; color: #8C8776; line-height: 1.6;">
                ${isDe ? 'Dein Upgrade ist aktiv. Das bekommst du jetzt:' : 'Your upgrade is active. Here\'s what you get now:'}
              </p>
              <table cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 20px;">${perkHtml}</table>

              <table cellpadding="0" cellspacing="0" style="width:100%; background:#FDF6E8; border-radius:12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin:0; font-size: 13px; color: #9C6B1F;">
                      ${isDe ? `Aktiv bis <strong>${dateStr}</strong>. Verlängert sich automatisch, falls nicht vorher gekündigt.` : `Active until <strong>${dateStr}</strong>. Renews automatically unless cancelled beforehand.`}
                    </p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/${lang}/profile" style="display:inline-block; background: linear-gradient(135deg, #7FA98E, #355C7D); color:#fff; font-size:15px; font-weight:700; text-decoration:none; padding:14px 32px; border-radius:12px;">
                      ${isDe ? 'Zum Profil →' : 'Go to profile →'}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #E7E2D5; text-align:center;">
              <p style="margin:0 0 6px; font-size: 11px; color: #B0AA9A; line-height:1.5;">
                ${isDe ? 'Du kannst dein Abo jederzeit in deinem Profil verwalten oder kündigen.' : 'You can manage or cancel your subscription anytime in your profile.'}
              </p>
              <p style="margin:0; font-size: 11px; color: #B0AA9A;">
                KiWardrobe · Luca Darvas · Bernd-Rosemeyer-Straße 14, 85551 Kirchheim bei München
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  await resend.emails.send({ from: 'KiWardrobe <noreply@kiwardrobe.com>', to: email, subject, html })
}

async function sendPaymentFailedEmail({ email, username, language }: { email: string; username?: string; language: string }) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const isDe = language === 'de'
  const name = username || (isDe ? 'da' : 'there')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe.com'
  const lang = isDe ? 'de' : 'en'

  const subject = isDe ? '⚠ Zahlung für KiWardrobe Pro fehlgeschlagen' : '⚠ Payment for KiWardrobe Pro failed'

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#F7F4EC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EC; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:20px; overflow:hidden; font-family: -apple-system, 'Poppins', sans-serif;">
          <tr>
            <td style="background:#1D1D20; padding: 28px 32px; text-align:center;">
              <p style="margin:0; font-size: 18px; font-weight: 800; color:#F5F3EE;">KiWardrobe</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin:0 0 10px; font-size: 20px; font-weight:700; color:#1D1D20;">
                ${isDe ? `Hey ${name}, deine Zahlung hat nicht geklappt` : `Hey ${name}, your payment didn't go through`}
              </h1>
              <p style="margin:0 0 20px; font-size: 14px; color:#8C8776; line-height:1.6;">
                ${isDe
                  ? 'Wir konnten die fällige Zahlung für dein KiWardrobe Pro-Abo nicht abbuchen — meist liegt das an einer abgelaufenen Karte oder unzureichender Deckung. Stripe versucht es automatisch nochmal, du kannst deine Zahlungsmethode aber auch direkt aktualisieren.'
                  : "We couldn't process the payment for your KiWardrobe Pro subscription — usually due to an expired card or insufficient funds. Stripe will automatically retry, but you can also update your payment method directly."}
              </p>

              <table cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 8px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/${lang}/profile" style="display:inline-block; background: linear-gradient(135deg, #F1B951, #C98A3A); color:#24211B; font-size:14px; font-weight:700; text-decoration:none; padding:13px 28px; border-radius:12px;">
                      ${isDe ? 'Zahlungsmethode aktualisieren' : 'Update payment method'}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0; font-size: 12px; color:#8C8776; line-height:1.6;">
                ${isDe
                  ? 'Falls die Zahlung weiterhin fehlschlägt, wird dein Pro-Zugang automatisch beendet.'
                  : 'If the payment keeps failing, your Pro access will end automatically.'}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #E7E2D5; text-align:center;">
              <p style="margin:0; font-size: 11px; color:#B0AA9A;">
                KiWardrobe · Luca Darvas · Bernd-Rosemeyer-Straße 14, 85551 Kirchheim bei München
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  await resend.emails.send({ from: 'KiWardrobe <noreply@kiwardrobe.com>', to: email, subject, html })
}

async function sendCancellationEmail({ email, username, language, accessUntil }: { email: string; username?: string; language: string; accessUntil: Date }) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const isDe = language === 'de'
  const name = username || (isDe ? 'da' : 'there')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe.com'
  const lang = isDe ? 'de' : 'en'
  const dateStr = accessUntil.toLocaleDateString(isDe ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const alreadyPast = accessUntil.getTime() < Date.now()

  const subject = isDe ? 'Dein KiWardrobe Pro wurde gekündigt' : 'Your KiWardrobe Pro has been cancelled'

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#F7F4EC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EC; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:20px; overflow:hidden; font-family: -apple-system, 'Poppins', sans-serif;">
          <tr>
            <td style="background:#1D1D20; padding: 28px 32px; text-align:center;">
              <p style="margin:0; font-size: 18px; font-weight: 800; color:#F5F3EE;">KiWardrobe</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin:0 0 10px; font-size: 20px; font-weight:700; color:#1D1D20;">
                ${isDe ? `Schade, dass du gehst, ${name}.` : `Sorry to see you go, ${name}.`}
              </h1>
              <p style="margin:0 0 20px; font-size: 14px; color:#8C8776; line-height:1.6;">
                ${isDe
                  ? 'Deine Kündigung wurde erfolgreich bearbeitet. Dein Pro-Abo wird nicht weiter verlängert.'
                  : 'Your cancellation was processed successfully. Your Pro subscription will not renew.'}
              </p>

              <table cellpadding="0" cellspacing="0" style="width:100%; background:#F7F4EC; border-radius:12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin:0; font-size: 13px; color:#1D1D20;">
                      ${alreadyPast
                        ? (isDe ? 'Dein Zugang zu den Pro-Funktionen ist bereits beendet.' : 'Your access to Pro features has already ended.')
                        : (isDe ? `Du kannst alle Pro-Funktionen noch bis <strong>${dateStr}</strong> nutzen.` : `You can still use all Pro features until <strong>${dateStr}</strong>.`)}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px; font-size: 13px; color:#8C8776; line-height:1.6;">
                ${isDe
                  ? 'Deine gespeicherten Outfits, dein Kleiderschrank und dein Profil bleiben natürlich erhalten. Du kannst Pro jederzeit wieder aktivieren.'
                  : 'Your saved outfits, wardrobe and profile stay exactly as they are. You can reactivate Pro anytime.'}
              </p>

              <table cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 8px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/${lang}/profile" style="display:inline-block; background: linear-gradient(135deg, #F1B951, #C98A3A); color:#24211B; font-size:14px; font-weight:700; text-decoration:none; padding:13px 28px; border-radius:12px;">
                      ${isDe ? 'Pro reaktivieren' : 'Reactivate Pro'}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #E7E2D5; text-align:center;">
              <p style="margin:0 0 6px; font-size: 11px; color:#B0AA9A; line-height:1.5;">
                ${isDe ? 'Feedback dazu, warum du gekündigt hast? Antworte einfach auf diese Mail.' : 'Feedback on why you cancelled? Just reply to this email.'}
              </p>
              <p style="margin:0; font-size: 11px; color:#B0AA9A;">
                KiWardrobe · Luca Darvas · Bernd-Rosemeyer-Straße 14, 85551 Kirchheim bei München
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  await resend.emails.send({ from: 'KiWardrobe <noreply@kiwardrobe.com>', to: email, subject, html, replyTo: 'support@kiwardrobe.com' })
}