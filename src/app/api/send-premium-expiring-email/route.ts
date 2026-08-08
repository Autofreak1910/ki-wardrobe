import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Läuft täglich per Vercel Cron (siehe vercel.json).
// Schreibt jeden Nutzer an, dessen Premium in 3 Tagen (oder weniger) ausläuft,
// UND der noch nicht gewarnt wurde, UND der nicht bereits ein laufendes Stripe-Abo hat
// (denn bei aktivem Abo verlängert sich Premium automatisch, keine Warnung nötig).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY)

  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // premium_source != 'stripe' => nur Bonustage/Geschenk-Premium warnen,
  // laufende Stripe-Abos verlängern sich automatisch und brauchen keine Ablaufwarnung
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, language, premium_until, premium_source, subscription_cancel_pending')
    .eq('is_premium', true)
    .eq('premium_expiry_warning_sent', false)
    .not('premium_until', 'is', null)
    .lte('premium_until', in3Days.toISOString())
    .gt('premium_until', now.toISOString())
    .or('premium_source.neq.stripe,subscription_cancel_pending.eq.true')

  if (error) {
    console.error('Query failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  let sent = 0
  let failed = 0

  for (const profile of profiles) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
      if (!user?.email) continue

      const { data: items } = await supabase
        .from('clothing_items')
        .select('id, name, category, image_url, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      const toLock = (items ?? []).slice(20)

      await sendExpiryWarningEmail({
        email: user.email,
        username: profile.username,
        language: profile.language ?? 'de',
        expiresAt: new Date(profile.premium_until),
        itemsToLock: toLock,
      })

      await supabase.from('profiles').update({
        premium_expiry_warning_sent: true,
        pending_lock_warning_count: toLock.length,
        pending_lock_warning_shown_at: new Date().toISOString(),
      }).eq('id', profile.id)
      sent++
    } catch (err) {
      console.error('Expiry warning failed for', profile.id, err)
      failed++
    }
  }

  return NextResponse.json({ success: true, sent, failed })
}

async function sendExpiryWarningEmail({ email, username, language, expiresAt, itemsToLock }: { email: string; username?: string; language: string; expiresAt: Date; itemsToLock: any[] }) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const isDe = language === 'de'
  const name = username || (isDe ? 'da' : 'there')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kiwardrobe.com'
  const lang = isDe ? 'de' : 'en'
  const dateStr = expiresAt.toLocaleDateString(isDe ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long' })
  const daysLeft = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))

  const subject = isDe
    ? `⏳ Dein Pro endet in ${daysLeft} Tag${daysLeft === 1 ? '' : 'en'} — das verlierst du`
    : `⏳ Your Pro ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — here's what you'll lose`

  const losing = isDe
    ? [
        { icon: '✨', title: '14 statt 3 Outfits pro Woche', desc: 'Zurück auf 3 KI-Outfits pro Woche im Free Plan.' },
        { icon: '👗', title: 'Unbegrenzter Kleiderschrank', desc: 'Zurück auf max. 20 Kleidungsstücke.' },
        { icon: '🪞', title: '6 statt 2 Avatare', desc: 'Nur noch 2 Virtual-Try-On-Avatare im Monat.' },
        { icon: '📤', title: 'Outfits teilen', desc: 'Das Teilen-Feature ist dann gesperrt.' },
      ]
    : [
        { icon: '✨', title: '14 instead of 3 outfits/week', desc: 'Back down to 3 AI outfits per week on Free.' },
        { icon: '👗', title: 'Unlimited wardrobe', desc: 'Back to a max of 20 clothing items.' },
        { icon: '🪞', title: '6 instead of 2 avatars', desc: 'Only 2 Virtual Try-On avatars per month.' },
        { icon: '📤', title: 'Share outfits', desc: 'The share feature gets locked.' },
      ]

  const rowsHtml = losing.map(p => `
    <tr>
      <td style="padding: 10px 0; vertical-align: top; width: 40px; font-size: 20px;">${p.icon}</td>
      <td style="padding: 10px 0; vertical-align: top;">
        <p style="margin: 0 0 2px; font-size: 14px; font-weight: 700; color: #1D1D20;">${p.title}</p>
        <p style="margin: 0; font-size: 13px; color: #8C8776; line-height: 1.5;">${p.desc}</p>
      </td>
      <td style="padding: 10px 0; vertical-align: top; width: 24px; text-align: right; font-size: 15px; color: #ef4444;">✕</td>
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
            <td style="background: linear-gradient(135deg, #C9963C, #9C6B1F); padding: 28px 32px; text-align: center;">
              <p style="margin:0 0 4px; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.85);">
                ${isDe ? 'Läuft bald ab' : 'Expiring soon'}
              </p>
              <p style="margin:0; font-size: 22px; font-weight: 800; color: #fff;">
                ${isDe ? `Noch ${daysLeft} Tag${daysLeft === 1 ? '' : 'e'} Pro` : `${daysLeft} day${daysLeft === 1 ? '' : 's'} of Pro left`}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 8px; font-size: 19px; font-weight: 700; color: #1D1D20;">
                ${isDe ? `Hey ${name},` : `Hey ${name},`}
              </h1>
              <p style="margin: 0 0 20px; font-size: 14px; color: #8C8776; line-height: 1.6;">
                ${isDe
                  ? `dein KiWardrobe Pro endet am <strong>${dateStr}</strong>. Ab dann fehlen dir folgende Funktionen:`
                  : `your KiWardrobe Pro ends on <strong>${dateStr}</strong>. After that, you'll be missing:`}
              </p>

             <table cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 24px;">${rowsHtml}</table>

              ${itemsToLock.length > 0 ? `
              <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:14px; padding:14px 16px; margin-bottom:24px;">
                <p style="margin:0 0 10px; font-size:13px; font-weight:700; color:#dc2626;">
                  ${isDe ? `🔒 Außerdem: ${itemsToLock.length} deiner Kleidungsstücke werden gesperrt` : `🔒 Also: ${itemsToLock.length} of your items will get locked`}
                </p>
                <table cellpadding="0" cellspacing="0" style="width:100%;">
                  ${itemsToLock.slice(0, 6).map((it: any) => `
                    <tr><td style="padding:4px 0; font-size:12px; color:#7f1d1d;">${it.name ?? it.category}</td></tr>
                  `).join('')}
                </table>
                ${itemsToLock.length > 6 ? `<p style="margin:6px 0 0; font-size:11px; color:#7f1d1d;">${isDe ? `+ ${itemsToLock.length - 6} weitere` : `+ ${itemsToLock.length - 6} more`}</p>` : ''}
              </div>
              ` : ''}

              <table cellpadding="0" cellspacing="0" style="width:100%; background:#FDF6E8; border-radius:14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #9C6B1F;">
                      ${isDe ? 'Behalte alles für nur 4,99 € / Monat' : 'Keep it all for just €4.99 / month'}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #8C8776;">
                      ${isDe ? 'Jederzeit kündbar. Kein Risiko.' : 'Cancel anytime. No risk.'}
                    </p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/${lang}/profile" style="display:inline-block; background: linear-gradient(135deg, #F1B951, #C98A3A); color:#24211B; font-size:15px; font-weight:700; text-decoration:none; padding:14px 32px; border-radius:12px;">
                      ${isDe ? 'Jetzt für 4,99 € upgraden →' : 'Upgrade for €4.99 →'}
                    </a>
                  </td>
                </tr>
              </table>
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