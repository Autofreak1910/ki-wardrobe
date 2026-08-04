'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface RatingPopupProps {
  open: boolean
  onClose: () => void
  locale: string
  theme: {
    card: string
    border: string
    text: string
    muted: string
    accent: string
    isDark: boolean
  }
}

export default function RatingPopup({ open, onClose, locale, theme }: RatingPopupProps) {
  const { card, border, text, muted, accent, isDark } = theme
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [message, setMessage] = useState('')
const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const de = locale === 'de'

async function submit() {
    if (rating === 0) return
    setSending(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setError('Nicht eingeloggt'); setSending(false); return }

      const { error: dbError } = await supabase.from('feedback').insert({
        user_id: session.user.id,
        type: 'in_app_rating',
        rating,
        message: message?.trim() || '',
        email: session.user.email || null,
        wants_reply: false,
      })

      if (dbError) {
        setError('DB: ' + dbError.message)
        setSending(false)
        return
      }

      try {
        await fetch('/api/send-feedback-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'in_app_rating',
            message: `⭐ ${rating}/5${message?.trim() ? '\n\n' + message.trim() : ''}`,
            email: session.user.email || null,
            wantsReply: false,
          }),
        })
      } catch {}

      setSent(true)
      localStorage.setItem('kw_rating_done_v3', 'true')
      setTimeout(() => {
        onClose()
        setTimeout(() => { setSent(false); setRating(0); setMessage(''); setError('') }, 300)
      }, 2000)
    } catch (err: any) {
      setError('Fehler: ' + (err?.message ?? String(err)))
    }
    setSending(false)
  }

  function later() {
  const inThreeDays = Date.now() + 3 * 24 * 60 * 60 * 1000
    localStorage.setItem('kw_rating_later_v3', String(inThreeDays))
    onClose()
  }

  function never() {
    localStorage.setItem('kw_rating_done_v3', 'true')
    onClose()
  }

  const ratingLabels = de
    ? ['', 'Schlecht', 'Geht so', 'Ganz ok', 'Gut', 'Mega!']
    : ['', 'Bad', 'Meh', 'Okay', 'Good', 'Awesome!']

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{ background: card, borderRadius: '24px', padding: '28px 24px', textAlign: 'center' as const, maxWidth: '340px', width: '100%', border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', position: 'relative' as const }}>

            {/* X-Button = Später */}
            <button onClick={later} aria-label="Close"
              style={{ position: 'absolute', top: '14px', right: '14px', width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.08)' : '#f5f5f5', color: muted, fontSize: '14px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
              ✕
            </button>

            {sent ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <p style={{ fontSize: '44px', marginBottom: '12px' }}>🎉</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: text, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  {de ? 'Danke!' : 'Thank you!'}
                </p>
                <p style={{ fontSize: '13px', color: muted }}>
                  {de ? 'Dein Feedback hilft uns sehr' : 'Your feedback helps us a lot'}
                </p>
              </motion.div>
            ) : (
              <>
                <p style={{ fontSize: '36px', marginBottom: '8px' }}>✨</p>

                <p style={{ fontSize: '18px', fontWeight: 800, color: text, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                  {de ? 'Wie findest du KiWardrobe?' : 'How do you like KiWardrobe?'}
                </p>
                <p style={{ fontSize: '13px', color: muted, marginBottom: '20px', lineHeight: 1.5 }}>
                  {de ? 'Deine ehrliche Meinung hilft uns' : 'Your honest opinion helps us'}
                </p>

                {/* Sterne */}
                <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#faf8f5', borderRadius: '14px', padding: '16px 12px', marginBottom: '16px', border: `1px solid ${border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map(star => {
                      const active = star <= (hovered || rating)
                      return (
                        <motion.button key={star}
                          whileTap={{ scale: 1.3 }}
                          onMouseEnter={() => setHovered(star)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.1s' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24"
                            fill={active ? '#F1B951' : 'none'}
                            stroke={active ? '#F1B951' : border}
                            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </motion.button>
                      )
                    })}
                  </div>
                  {rating > 0 && (
                    <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ fontSize: '13px', color: accent, fontWeight: 700, marginTop: '8px' }}>
                      {ratingLabels[rating]}
                    </motion.p>
                  )}
                </div>

                {/* Freitext — erscheint nach Sterne-Klick */}
                <AnimatePresence>
                  {rating > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={rating <= 2
                          ? (de ? 'Was können wir besser machen?' : 'What can we improve?')
                          : (de ? 'Was gefällt dir besonders? (optional)' : 'What do you like most? (optional)')}
                        rows={3}
                        style={{ width: '100%', boxSizing: 'border-box' as const, background: isDark ? 'rgba(255,255,255,0.04)' : '#fff', border: `1px solid ${border}`, borderRadius: '12px', padding: '12px', fontSize: '13px', color: text, outline: 'none', resize: 'none' as const, fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '16px' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

               {/* Error */}
                {error && (
                  <p style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginBottom: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '8px' }}>
                    {error}
                  </p>
                )}

                {/* Submit */}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={submit}
                  disabled={rating === 0 || sending}
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: rating === 0 ? border : `linear-gradient(135deg, ${accent}, #0891b2)`, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: rating === 0 ? 'default' : sending ? 'wait' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: rating > 0 ? `0 6px 24px ${accent}40` : 'none', opacity: rating === 0 ? 0.5 : 1, marginBottom: '12px', transition: 'all 0.2s' }}>
                  {sending
                    ? (de ? 'Wird gesendet...' : 'Sending...')
                    : (de ? 'Absenden' : 'Submit')}
                </motion.button>

                {/* Später / Nie */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <button onClick={later}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", fontWeight: 600 }}>
                    {de ? 'Später' : 'Later'}
                  </button>
                  <span style={{ color: border }}>·</span>
                  <button onClick={never}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", fontWeight: 600 }}>
                    {de ? 'Nicht mehr fragen' : "Don't ask again"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}