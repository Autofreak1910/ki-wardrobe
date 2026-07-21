import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, username, language } = await request.json()
    if (!email) return NextResponse.json({ success: false, error: 'No email' }, { status: 400 })

    const isDe = language === 'de'
    const name = username || (isDe ? 'da' : 'there')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kiwardrobe.com'
    const lang = isDe ? 'de' : 'en'

    const subject = isDe
      ? '👕 Willkommen bei KiWardrobe!'
      : '👕 Welcome to KiWardrobe!'

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
        <td style="padding: 12px 0; border-bottom: 1px solid #E7E2D5;">
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
        <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 480px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(53,92,125,0.1);">

          <tr>
            <td style="background: linear-gradient(135deg, #7FA98E, #355C7D); padding: 36px 32px; text-align: center;">
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">KiWardrobe</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 8px; font-size: 23px; font-weight: 700; color: #24211B; letter-spacing: -0.02em;">
                ${isDe ? `Hey ${name}! 🎉` : `Hey ${name}! 🎉`}
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #8C8776; line-height: 1.6;">
                ${isDe
                  ? 'Schön, dass du dabei bist! Hier ist, was dich bei KiWardrobe erwartet:'
                  : "Great to have you! Here's what's waiting for you at KiWardrobe:"}
              </p>

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