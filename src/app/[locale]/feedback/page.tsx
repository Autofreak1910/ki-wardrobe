'use client'

import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function FeedbackPage() {
const [type, setType] = useState('feedback')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [wantsReply, setWantsReply] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isDark = theme === 'dark'

  const bg      = isDark ? '#161616' : '#F2EFE7'
  const card    = isDark ? '#1D1D20' : '#ffffff'
  const border  = isDark ? '#2a2a2e' : '#E7E2D5'
  const text    = isDark ? '#F5F3EE' : '#24211B'
  const muted   = isDark ? '#9a978f' : '#8C8776'
  const accent  = isDark ? '#5C82A0' : '#355C7D'
  const navyGradient = 'linear-gradient(135deg, #2C4E72, #16283D)'
  const gold    = isDark ? '#E5B45B' : '#C9963C'

async function handleSubmit() {
    if (!message.trim()) return
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const finalEmail = email || session?.user?.email
    await supabase.from('feedback').insert({
      user_id: session?.user?.id ?? null,
      type, message, email: finalEmail, wants_reply: wantsReply,
    })
    try {
      await fetch('/api/send-feedback-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, email: finalEmail, wantsReply }),
      })
    } catch (err) {
      console.error('Email send failed, feedback still saved:', err)
    }
    setSent(true)
    setLoading(false)
  }

  const types = [
    { key: 'feedback', emoji: '💬', label: locale === 'de' ? 'Feedback' : 'Feedback' },
    { key: 'feature', emoji: '✨', label: locale === 'de' ? 'Feature Idee' : 'Feature Idea' },
    { key: 'bug', emoji: '🐛', label: locale === 'de' ? 'Bug melden' : 'Report Bug' },
    { key: 'other', emoji: '📝', label: locale === 'de' ? 'Sonstiges' : 'Other' },
  ]

return (
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' as const, background: bg, fontFamily: "'Poppins', 'Inter', sans-serif", overflow: 'hidden' }}>
      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '600px', width: '100%', margin: '0 auto', padding: '32px 16px 40px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: muted, fontFamily: "'Poppins', 'Inter', sans-serif", padding: '0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← {locale === 'de' ? 'Zurück' : 'Back'}
          </button>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 500, color: text, marginBottom: '6px' }}>
            {locale === 'de' ? 'Feedback' : 'Feedback'}
          </h1>
          <p style={{ fontSize: '14px', color: muted }}>
            {locale === 'de' ? 'Deine Meinung hilft uns die App zu verbessern' : 'Your feedback helps us improve the app'}
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: card, border: `1px solid ${border}`, borderRadius: '20px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 500, color: text, marginBottom: '8px' }}>
              {locale === 'de' ? 'Danke!' : 'Thank you!'}
            </h2>
            <p style={{ fontSize: '14px', color: muted, marginBottom: '24px' }}>
              {locale === 'de' ? 'Wir haben dein Feedback erhalten und melden uns bald!' : 'We received your feedback and will get back to you soon!'}
            </p>
            <button onClick={() => router.push('/' + locale + '/profile')}
              style={{ background: navyGradient, border: 'none', borderRadius: '12px', padding: '13px 28px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
              {locale === 'de' ? 'Zurück zum Profil' : 'Back to Profile'}
            </button>
          </div>
        ) : (
          <>
            {/* Type Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {types.map(t => (
                <button key={t.key} onClick={() => setType(t.key)}
                  style={{ padding: '14px', borderRadius: '14px', border: type === t.key ? 'none' : `1px solid ${border}`, background: type === t.key ? navyGradient : card, color: type === t.key ? '#fff' : text, fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '20px' }}>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Message */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: text, display: 'block', marginBottom: '8px' }}>
                {locale === 'de' ? 'Deine Nachricht' : 'Your message'} *
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={locale === 'de' ? 'Was möchtest du uns mitteilen?' : 'What would you like to tell us?'}
                rows={5}
                style={{ width: '100%', background: isDark ? '#161616' : '#F7F4EC', border: `1.5px solid ${border}`, borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: text, outline: 'none', resize: 'none' as const, fontFamily: "'Poppins', 'Inter', sans-serif", boxSizing: 'border-box' as const, transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = border}
              />
            </div>

   {/* Antwort gewünscht? */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={wantsReply} onChange={e => setWantsReply(e.target.checked)}
                  style={{ width: '20px', height: '20px', flexShrink: 0, accentColor: accent, cursor: 'pointer' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: text }}>
                  {locale === 'de' ? 'Ich möchte eine Antwort erhalten' : 'I would like to receive a reply'}
                </span>
              </label>
            </div>

            {/* Email — nur relevant wenn Antwort gewünscht */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '20px', marginBottom: '24px', opacity: wantsReply ? 1 : 0.5 }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: text, display: 'block', marginBottom: '8px' }}>
                {locale === 'de' ? 'Email für Antwort' : 'Email for reply'} {wantsReply && '*'}
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="deine@email.com" disabled={!wantsReply}
                style={{ width: '100%', background: isDark ? '#161616' : '#F7F4EC', border: `1.5px solid ${border}`, borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: text, outline: 'none', fontFamily: "'Poppins', 'Inter', sans-serif", boxSizing: 'border-box' as const, transition: 'border-color 0.2s', cursor: wantsReply ? 'text' : 'not-allowed' }}
                onFocus={e => e.target.style.borderColor = accent}
                onBlur={e => e.target.style.borderColor = border}
              />
              <p style={{ fontSize: '11px', color: muted, marginTop: '6px' }}>
                {locale === 'de' ? 'Wir antworten von: support.kiwardrobe@gmail.com' : 'We reply from: support.kiwardrobe@gmail.com'}
              </p>
            </div>

            <button onClick={handleSubmit} disabled={loading || !message.trim()}
              style={{ width: '100%', background: !message.trim() ? (isDark ? '#1D1D20' : '#EDE7D8') : navyGradient, border: !message.trim() ? `1px solid ${border}` : 'none', borderRadius: '12px', padding: '15px', fontSize: '15px', fontWeight: 600, color: !message.trim() ? muted : '#fff', cursor: !message.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
              {loading ? '...' : locale === 'de' ? 'Feedback senden ✦' : 'Send feedback ✦'}
            </button>
          </>
        )}
      </main>
    </div>
  )
}