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
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isDark = theme === 'dark'

  async function handleSubmit() {
    if (!message.trim()) return
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('feedback').insert({
      user_id: session?.user?.id ?? null,
      type, message, email: email || session?.user?.email,
    })
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
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' as const, background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '600px', width: '100%', margin: '0 auto', padding: '32px 16px 40px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif", padding: '0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← {locale === 'de' ? 'Zurück' : 'Back'}
          </button>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>
            {locale === 'de' ? 'Feedback' : 'Feedback'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {locale === 'de' ? 'Deine Meinung hilft uns die App zu verbessern' : 'Your feedback helps us improve the app'}
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>
              {locale === 'de' ? 'Danke!' : 'Thank you!'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {locale === 'de' ? 'Wir haben dein Feedback erhalten und melden uns bald!' : 'We received your feedback and will get back to you soon!'}
            </p>
            <button onClick={() => router.push('/' + locale + '/profile')}
              style={{ background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '12px', padding: '13px 28px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {locale === 'de' ? 'Zurück zum Profil' : 'Back to Profile'}
            </button>
          </div>
        ) : (
          <>
            {/* Type Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {types.map(t => (
                <button key={t.key} onClick={() => setType(t.key)}
                  style={{ padding: '14px', borderRadius: '14px', border: type === t.key ? 'none' : '1px solid var(--border)', background: type === t.key ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-card)', color: type === t.key ? '#fff' : 'var(--text)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '20px' }}>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Message */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
                {locale === 'de' ? 'Deine Nachricht' : 'Your message'} *
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={locale === 'de' ? 'Was möchtest du uns mitteilen?' : 'What would you like to tell us?'}
                rows={5}
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: 'var(--text)', outline: 'none', resize: 'none' as const, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const, transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#0ea472'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Email optional */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
                {locale === 'de' ? 'Email für Antwort (optional)' : 'Email for reply (optional)'}
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="deine@email.com"
                style={{ width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: 'var(--text)', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const, transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#0ea472'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                {locale === 'de' ? 'Wir antworten an: support.kiwardrobe@gmail.com' : 'We reply from: support.kiwardrobe@gmail.com'}
              </p>
            </div>

            <button onClick={handleSubmit} disabled={loading || !message.trim()}
              style={{ width: '100%', background: !message.trim() ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #0ea472, #0891b2)', border: !message.trim() ? '1px solid var(--border)' : 'none', borderRadius: '12px', padding: '15px', fontSize: '15px', fontWeight: 600, color: !message.trim() ? 'var(--text-secondary)' : '#fff', cursor: !message.trim() ? 'not-allowed' : 'pointer', fontFamily: "'DM Serif Display', serif" }}>
              {loading ? '...' : locale === 'de' ? 'Feedback senden ✦' : 'Send feedback ✦'}
            </button>
          </>
        )}
      </main>
    </div>
  )
}