import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, username, language, invitedBonusDays } = await request.json()
    if (!email) return NextResponse.json({ success: false, error: 'No email' }, { status: 400 })

    const isDe = language === 'de'
    const name = username || (isDe ? 'da' : 'there')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kiwardrobe.com'
    const lang = isDe ? 'de' : 'en'

    const wasInvited = typeof invitedBonusDays === 'number' && invitedBonusDays > 0

    const subject = wasInvited
      ? (isDe ? `🎁 Willkommen — deine ${invitedBonusDays} Tage Pro sind aktiv!` : `🎁 Welcome — your ${invitedBonusDays} days of Pro are active!`)
      : (isDe ? '👕 Willkommen bei KiWardrobe!' : '👕 Welcome to KiWardrobe!')

    const features = isDe
      ? [
          { icon: '📸', title: 'Schrank digitalisieren', desc: 'Foto machen, fertig. Die KI erkennt Kategorie, Farbe und Marke automatisch.' },
          { icon: '✨', title: 'KI-Stylist jeden Tag', desc: 'Outfit-Vorschläge passend zu Wetter und Anlass — täglich neu.' },
          { icon: '🪞', title: 'Virtual Try-On', desc: 'Lade ein Selfie hoch und probier deine Kleidung virtuell an.' },
        ]
      : [
          { icon: '📸', title: 'Digitize your wardrobe', desc: 'Snap a photo, done. AI detects category, color and brand automatically.' },
          { icon: '✨', title: 'AI stylist every day', desc: 'Outfit suggestions matched to weather and occasion — new every day.' },
          { icon: '🪞', title: 'Virtual Try-On', desc: 'Upload a selfie and try on your clothes virtually.' },
        ]

    const featureHtml = features.map(f => `
      <tr>
        <td style="padding: 10px 0; vertical-align: top; width: 40px; font-size: 22px;">${f.icon}</td>
        <td style="padding: 10px 0; vertical-align: top;">
          <p style="margin: 0 0 2px; font-size: 14px; font-weight: 700; color: #1D1D20;">${f.title}</p>
          <p style="margin: 0; font-size: 13px; color: #8C8776; line-height: 1.5;">${f.desc}</p>
        </td>
      </tr>
    `).join('')

    // Nur relevant, wenn wasInvited: zeigt was der Nutzer durch das Geschenk-Premium zusaetzlich bekommt
    const proPerksHtml = wasInvited ? `
      <table cellpadding="0" cellspacing="0" style="width: 100%; background: #FDF6E8; border-radius: 14px; margin-bottom: 24px; border: 1px solid #F1D9A0;">
        <tr>
          <td style="padding: 18px 20px;">
            <p style="margin: 0 0 10px; font-size: 14px; font-weight: 800; color: #9C6B1F;">
              ${isDe ? `✦ ${invitedBonusDays} Tage Pro geschenkt — das ist mit dabei:` : `✦ ${invitedBonusDays} days of Pro, on us — here's what's included:`}
            </p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #6B5426;">${isDe ? '• 14 statt 3 Outfits pro Woche' : '• 14 instead of 3 outfits per week'}</p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #6B5426;">${isDe ? '• Unbegrenzter Kleiderschrank' : '• Unlimited wardrobe'}</p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #6B5426;">${isDe ? '• 6 statt 2 Virtual-Try-On-Avatare' : '• 6 instead of 2 Virtual Try-On avatars'}</p>
            <p style="margin: 0; font-size: 13px; color: #6B5426;">${isDe ? '• Outfits mit Freunden teilen' : '• Share outfits with friends'}</p>
          </td>
        </tr>
      </table>
    ` : ''

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background:#F7F4EC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EC; padding: 32px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:20px; overflow:hidden; font-family: -apple-system, 'Poppins', sans-serif;">

          <tr>
            <td style="background: ${wasInvited ? 'linear-gradient(135deg, #F1B951, #C98A3A)' : 'linear-gradient(135deg, #7FA98E, #355C7D)'}; padding: 32px; text-align: center;">
              <p style="margin:0; font-size: 22px; font-weight: 800; color: ${wasInvited ? '#24211B' : '#ffffff'}; letter-spacing: -0.02em;">
                ${wasInvited ? '🎁 KiWardrobe Pro' : 'KiWardrobe'}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 700; color: #1D1D20;">
                ${isDe ? `Hey ${name}! 🎉` : `Hey ${name}! 🎉`}
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #8C8776; line-height: 1.6;">
                ${wasInvited
                  ? (isDe
                      ? `Schön, dass du dabei bist! Du wurdest eingeladen, deshalb ist dein Account direkt mit <strong>${invitedBonusDays} Tagen KiWardrobe Pro</strong> gestartet — komplett kostenlos.`
                      : `Great to have you! You were invited, so your account started with <strong>${invitedBonusDays} days of KiWardrobe Pro</strong> — completely free.`)
                  : (isDe
                      ? 'Schön, dass du dabei bist! Hier ist, was dich bei KiWardrobe erwartet:'
                      : "Great to have you! Here's what's waiting for you at KiWardrobe:")}
              </p>

              ${proPerksHtml}

              <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 28px;">
                ${featureHtml}
              </table>

              <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/${lang}/dresser" style="display: inline-block; background: linear-gradient(135deg, #7FA98E, #355C7D); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                      ${isDe ? 'Jetzt loslegen →' : 'Get started →'}
                    </a>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" style="width: 100%; background: #F7F4EC; border-radius: 14px; padding: 4px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #355C7D;">
                      ${isDe ? '🎁 Freunde einladen = Pro gratis' : '🎁 Invite friends = free Pro'}
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #8C8776; line-height: 1.5;">
                      ${isDe
                        ? 'Für jeden eingeladenen Freund bekommst du 7 Tage Pro gratis — dein Freund bekommt ebenfalls 7 Tage. Findest du in deinem Profil.'
                        : 'For every friend you invite you get 7 days of Pro free — your friend gets 7 days too. Find it in your profile.'}
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #E7E2D5; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9C6B1F; line-height: 1.5;">
                ${isDe
                  ? 'Du bekommst diese Email, weil du dich bei KiWardrobe registriert hast.'
                  : 'You received this email because you signed up for KiWardrobe.'}
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}