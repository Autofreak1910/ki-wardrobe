import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { type, message, email } = await request.json()

    const typeLabels: Record<string, string> = {
      feedback: '💬 Feedback',
      feature: '✨ Feature Idee',
      bug: '🐛 Bug Report',
      other: '📝 Sonstiges',
    }

    await resend.emails.send({
      from: 'KiWardrobe <onboarding@resend.dev>', // anpassen, falls eigene Domain verifiziert ist
      to: 'support.kiwardrobe@gmail.com',
      subject: `${typeLabels[type] ?? 'Feedback'} — neue Nachricht`,
      text: `Typ: ${typeLabels[type] ?? type}\nVon: ${email ?? 'unbekannt'}\n\nNachricht:\n${message}\n\n---\nIch melde mich.`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send feedback email error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}