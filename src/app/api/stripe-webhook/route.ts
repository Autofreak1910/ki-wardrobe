import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-05-28.basil' })
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    if (userId) {
      const premiumUntil = new Date()
      premiumUntil.setMonth(premiumUntil.getMonth() + 1)
      await supabase.from('profiles').update({
        is_premium: true,
        premium_until: premiumUntil.toISOString(),
        premium_source: 'stripe',
      }).eq('id', userId)

      // Pro-Willkommens-Email verschicken
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId)
        const { data: profile } = await supabase.from('profiles').select('username, language').eq('id', userId).single()

        if (user?.email) {
          await sendProWelcomeEmail({
            email: user.email,
            username: profile?.username,
            language: profile?.language ?? 'de',
          })
        }
      } catch (emailErr) {
        console.error('Pro welcome email failed:', emailErr)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId
    if (userId) {
      await supabase.from('profiles').update({
        is_premium: false,
        premium_until: null,
      }).eq('id', userId)
    }
  }

  return NextResponse.json({ received: true })
}

async function sendProWelcomeEmail({ email, username, language }: { email: string; username?: string; language: string }) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const isDe = language === 'de'
  const name = username || (isDe ? 'da' : 'there')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe-app.vercel.app'
  const lang = isDe ? 'de' : 'en'

  const subject = isDe ? '✦ Willkommen bei KiWardrobe Pro!' : '✦ Welcome to KiWardrobe Pro!'

  const perks = isDe
    ? [
        { icon: '✨', title: '14 Outfits pro Woche', desc: 'Statt 3 im Free Plan — fast täglich ein neuer Look.' },
        { icon: '👗', title: 'Unbegrenzt Kleidung', desc: 'Kein Limit mehr bei deinem digitalen Kleiderschrank.' },
        { icon: '🧬', title: 'Style DNA', desc: 'Tägliche KI-Analyse deines persönlichen Stils.' },
        { icon: '📸', title: 'Mehrfach-Upload', desc: 'Bis zu 10 Kleidungsstücke auf einmal scannen.' },
      ]
    : [
        { icon: '✨', title: '14 outfits per week', desc: 'Instead of 3 on the Free plan — almost a new look daily.' },
        { icon: '👗', title: 'Unlimited items', desc: 'No more limit on your digital wardrobe.' },
        { icon: '🧬', title: 'Style DNA', desc: 'Daily AI analysis of your personal style.' },
        { icon: '📸', title: 'Multi-upload', desc: 'Scan up to 10 clothing items at once.' },
      ]

  const perkHtml = perks.map(f => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0e6d2;">
        <table cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            <td style="width: 44px; vertical-align: top; font-size: 26px;">${f.icon}</td>
            <td style="vertical-align: top;">
              <p style="margin: 0 0 3px; font-size: 15px; font-weight: 700; color: #24211B;">${f.title}</p>
              <p style="margin: 0; font-size: 13px; color: #8C8776; line-height: 1.5;">${f.desc}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #F2EFE7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table cellpadding="0" cellspacing="0" style="width: 100%; background: #F2EFE7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 480px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(201,150,60,0.15);">

          <tr>
            <td style="background: linear-gradient(135deg, #EFB43A, #C9963C); padding: 36px 32px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: 0.1em; text-transform: uppercase;">
                ${isDe ? '✦ Willkommen im Club' : '✦ Welcome to the club'}
              </p>
              <p style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">KiWardrobe Pro</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 8px; font-size: 21px; font-weight: 800; color: #24211B; letter-spacing: -0.02em;">
                ${isDe ? `Danke, ${name}! 🎉` : `Thank you, ${name}! 🎉`}
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #8C8776; line-height: 1.6;">
                ${isDe
                  ? 'Dein Pro-Abo ist jetzt aktiv. Das erwartet dich ab sofort:'
                  : 'Your Pro subscription is now active. Here is what awaits you:'}
              </p>

              <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 28px;">
                ${perkHtml}
              </table>

              <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/${lang}/dresser" style="display: inline-block; background: linear-gradient(135deg, #EFB43A, #C9963C); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                      ${isDe ? 'Jetzt entdecken →' : 'Discover now →'}
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" style="width: 100%; background: #F7F4EC; border-radius: 14px; padding: 4px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #355C7D;">
                      ${isDe ? '💡 Abo verwalten' : '💡 Manage subscription'}
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #8C8776; line-height: 1.5;">
                      ${isDe
                        ? 'Du kannst dein Abo jederzeit in deinem Profil unter "Abo verwalten / kündigen" anpassen.'
                        : 'You can manage your subscription anytime in your profile under "Manage / cancel subscription".'}
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #f0e6d2; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9C6B1F; line-height: 1.5;">
                ${isDe
                  ? 'Du bekommst diese Email, weil du KiWardrobe Pro abonniert hast.'
                  : 'You received this email because you subscribed to KiWardrobe Pro.'}
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

  await resend.emails.send({
    from: 'KiWardrobe <noreply@kiwardrobe.com>',
    to: email,
    subject,
    html,
  })
}