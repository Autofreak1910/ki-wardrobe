'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

function StarIcon({ size = 24, filled = false, color = 'currentColor' }: { size?: number; filled?: boolean; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
function ChatIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
    </svg>
  )
}
function SparkleIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>
    </svg>
  )
}
function BugIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="6" width="8" height="12" rx="4"/>
      <path d="M12 2v4M9 4l1.5 2M15 4l-1.5 2M4 10h4M16 10h4M4 14h4M16 14h4M6 20l2-2M18 20l-2-2"/>
    </svg>
  )
}
function NoteIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="13" y2="17"/>
    </svg>
  )
}
function CheckCircleIcon({ size = 56, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="8 12.5 11 15.5 16 9"/>
    </svg>
  )
}

export default function FeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState('feedback')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [wantsReply, setWantsReply] = useState(false)
  const [rating, setRating] = useState(0)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()
  const locale = useLocale()
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

  function handleClose() {
    onClose()
    // Reset nach kurzer Verzögerung (nach dem Zuklapp-Animation), damit man
    // beim naechsten Öffnen nicht mitten im "gesendet"-Zustand landet
    setTimeout(() => {
      setSent(false)
      setMessage('')
      setRating(0)
      setType('feedback')
      setWantsReply(false)
      setEmail('')
    }, 300)
  }

  async function handleSubmit() {
    if (!message.trim()) return
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const finalEmail = email || session?.user?.email
    await supabase.from('feedback').insert({
      user_id: session?.user?.id ?? null,
      type, message, email: finalEmail, wants_reply: wantsReply,
      rating: rating > 0 ? rating : null,
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
    { key: 'feedback', Icon: ChatIcon, label: locale === 'de' ? 'Feedback' : 'Feedback' },
    { key: 'feature', Icon: SparkleIcon, label: locale === 'de' ? 'Feature Idee' : 'Feature Idea' },
    { key: 'bug', Icon: BugIcon, label: locale === 'de' ? 'Bug melden' : 'Report Bug' },
    { key: 'other', Icon: NoteIcon, label: locale === 'de' ? 'Sonstiges' : 'Other' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', maxHeight: '88vh', overflowY: 'auto' as const, background: bg, border: `1px solid ${border}`, borderRadius: '28px', padding: '20px 20px 32px', fontFamily: "'Poppins', 'Inter', sans-serif" }}>

            <div style={{ width: '36px', height: '4px', background: border, borderRadius: '2px', margin: '0 auto 20px' }} />

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ textAlign: 'center', padding: '28px 8px' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', damping: 10, stiffness: 200 }}
                    style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                    <CheckCircleIcon size={52} color={accent} />
                  </motion.div>
                  <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 500, color: text, marginBottom: '8px' }}>
                    {locale === 'de' ? 'Danke!' : 'Thank you!'}
                  </h2>
                  <p style={{ fontSize: '14px', color: muted, marginBottom: '24px' }}>
                    {locale === 'de' ? 'Wir haben dein Feedback erhalten und melden uns bald!' : 'We received your feedback and will get back to you soon!'}
                  </p>
                  <button onClick={handleClose}
                    style={{ background: navyGradient, border: 'none', borderRadius: '12px', padding: '13px 28px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                    {locale === 'de' ? 'Schließen' : 'Close'}
                  </button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 500, color: text, marginBottom: '4px' }}>
                        {locale === 'de' ? 'Feedback' : 'Feedback'}
                      </h2>
                      <p style={{ fontSize: '13px', color: muted }}>
                        {locale === 'de' ? 'Deine Meinung hilft uns die App zu verbessern' : 'Your feedback helps us improve the app'}
                      </p>
                    </div>
                    <button onClick={handleClose} style={{ background: card, border: `1px solid ${border}`, borderRadius: '10px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: muted, flexShrink: 0 }}>✕</button>
                  </div>

                  {/* Sterne-Bewertung */}
                  <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '18px', marginBottom: '14px', textAlign: 'center' as const }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: text, marginBottom: '10px' }}>
                      {locale === 'de' ? 'Wie gefällt dir KiWardrobe bisher?' : 'How do you like KiWardrobe so far?'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <motion.button key={n} onClick={() => setRating(n)} whileTap={{ scale: 0.85 }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', lineHeight: 1, transform: n <= rating ? 'scale(1.08)' : 'scale(1)' }}>
                          <StarIcon size={26} filled={n <= rating} color={n <= rating ? gold : border} />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Type Selection */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>
                    {types.map(t => (
                      <button key={t.key} onClick={() => setType(t.key)}
                        style={{ padding: '12px', borderRadius: '14px', border: type === t.key ? 'none' : `1px solid ${border}`, background: type === t.key ? navyGradient : card, color: type === t.key ? '#fff' : text, fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.15s' }}>
                        <t.Icon size={16} color={type === t.key ? '#fff' : accent} />
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Message */}
                  <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: text, display: 'block', marginBottom: '8px' }}>
                      {locale === 'de' ? 'Deine Nachricht' : 'Your message'} *
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={locale === 'de' ? 'Was möchtest du uns mitteilen?' : 'What would you like to tell us?'}
                      rows={4}
                      style={{ width: '100%', background: isDark ? '#161616' : '#F7F4EC', border: `1.5px solid ${border}`, borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: text, outline: 'none', resize: 'none' as const, fontFamily: "'Poppins', 'Inter', sans-serif", boxSizing: 'border-box' as const }}
                    />
                  </div>

                  {/* Antwort gewünscht? */}
                  <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={wantsReply} onChange={e => setWantsReply(e.target.checked)}
                        style={{ width: '20px', height: '20px', flexShrink: 0, accentColor: accent, cursor: 'pointer' }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: text }}>
                        {locale === 'de' ? 'Ich möchte eine Antwort erhalten' : 'I would like to receive a reply'}
                      </span>
                    </label>
                  </div>

                  {/* Email */}
                  <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px', marginBottom: '20px', opacity: wantsReply ? 1 : 0.5 }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: text, display: 'block', marginBottom: '8px' }}>
                      {locale === 'de' ? 'Email für Antwort' : 'Email for reply'} {wantsReply && '*'}
                    </label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="deine@email.com" disabled={!wantsReply}
                      style={{ width: '100%', background: isDark ? '#161616' : '#F7F4EC', border: `1.5px solid ${border}`, borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: text, outline: 'none', fontFamily: "'Poppins', 'Inter', sans-serif", boxSizing: 'border-box' as const, cursor: wantsReply ? 'text' : 'not-allowed' }}
                    />
                    <p style={{ fontSize: '11px', color: muted, marginTop: '6px' }}>
                      {locale === 'de' ? 'Wir antworten von: support@kiwardrobe.com' : 'We reply from: support@kiwardrobe.com'}
                    </p>
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit} disabled={loading || !message.trim()}
                    style={{ width: '100%', background: !message.trim() ? (isDark ? '#1D1D20' : '#EDE7D8') : navyGradient, border: !message.trim() ? `1px solid ${border}` : 'none', borderRadius: '12px', padding: '15px', fontSize: '15px', fontWeight: 600, color: !message.trim() ? muted : '#fff', cursor: !message.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                    {loading ? '...' : locale === 'de' ? 'Feedback senden ✦' : 'Send feedback ✦'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}