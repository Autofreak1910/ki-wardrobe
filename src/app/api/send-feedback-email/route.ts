import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY missing, skipping email send')
      return NextResponse.json({ success: false, error: 'Email service not configured' })
    }
    const resend = new Resend(process.env.RESEND_API_KEY)
   const { type, message, email, wantsReply } = await request.json()

    const typeLabels: Record<string, string> = {
      feedback: '💬 Feedback',
      feature: '✨ Feature Idee',
      bug: '🐛 Bug Report',
      other: '📝 Sonstiges',
    }

await resend.emails.send({
     from: 'KiWardrobe <noreply@kiwardrobe.com>',
      to: 'support@kiwardrobe.com',   // statt 'support.kiwardrobe@gmail.com'
      subject: `${typeLabels[type] ?? 'Feedback'} — neue Nachricht`,
      text: `Typ: ${typeLabels[type] ?? type}\nVon: ${email ?? 'unbekannt'}\n\nNachricht:\n${message}\n\n---\nIch melde mich.`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #f5f7fb; padding: 24px;">
          <div style="background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #4d7eff, #6b9fff); padding: 18px 24px;">
              <p style="margin: 0; color: #fff; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">${typeLabels[type] ?? 'Feedback'}</p>
            </div>
            <div style="padding: 24px;">
              <table style="width: 100%; margin-bottom: 18px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7fa8; font-size: 12px; font-weight: 600; width: 80px; vertical-align: top;">Von</td>
                  <td style="padding: 6px 0; color: #0a1628; font-size: 14px;">${email ?? 'unbekannt'}</td>
                </tr>
              </table>
              <div style="height: 1px; background: #e2e8f0; margin-bottom: 18px;"></div>
              <p style="margin: 0 0 6px; color: #6b7fa8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">Nachricht</p>
              <p style="margin: 0; color: #0a1628; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
   <div style="background: ${wantsReply ? '#ecfdf5' : '#fef2f2'}; padding: 14px 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: ${wantsReply ? '#0ea472' : '#ef4444'}; font-size: 13px; font-weight: 700;">
                ${wantsReply ? '✅ Antwort erwartet' : '❌ Keine Antwort erwartet'}
              </p>
              <p style="margin: 4px 0 0; color: #6b7fa8; font-size: 12px;">
                ${wantsReply ? `Antworte an: ${email ?? 'keine Email angegeben'}` : 'Nutzer hat keine Antwort angefordert.'}
              </p>
            </div>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send feedback email error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}