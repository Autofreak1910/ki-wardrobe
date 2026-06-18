'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'

  const bg     = isDark ? '#080c18' : '#f0f4ff'
  const card   = isDark ? '#0d1225' : '#ffffff'
  const border = isDark ? '#1a2540' : '#dde3f5'
  const text   = isDark ? '#e8eeff' : '#0a1628'
  const muted  = isDark ? '#4d6080' : '#6b7fa8'
  const accent = isDark ? '#4d7eff' : '#3b6bff'

useEffect(() => {
    // Fallback: falls bereits eine Session existiert (z.B. Token schon verarbeitet bevor Listener lief)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })

    // Timeout-Fallback: nach 6 Sekunden ohne Event trotzdem Fehler zeigen statt ewig zu laden
    const timeout = setTimeout(() => {
      setReady(prev => {
        if (!prev) setLinkError(true)
        return prev
      })
    }, 6000)

    return () => { listener.subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function handleUpdate() {
    if (password.length < 6) { setError(locale === 'de' ? 'Mindestens 6 Zeichen' : 'At least 6 characters'); return }
    if (password !== confirmPassword) { setError(locale === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords don\'t match'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else {
      setSuccess(true)
      setTimeout(() => router.push('/' + locale + '/dresser'), 2000)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '18px', overflow: 'hidden', margin: '0 auto 14px', boxShadow: `0 8px 32px ${accent}40` }}>
          <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: text, letterSpacing: '-0.02em' }}>
          Ki<em style={{ color: accent }}>Wardrobe</em>
        </h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        style={{ width: '100%', maxWidth: '400px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '32px' }}>

       {linkError ? (
          <div style={{ textAlign: 'center' as const, padding: '20px 0' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', fontWeight: 400, color: text, marginBottom: '8px' }}>
              {locale === 'de' ? 'Link ungültig oder abgelaufen' : 'Link invalid or expired'}
            </h2>
            <p style={{ fontSize: '13px', color: muted, marginBottom: '20px', lineHeight: 1.6 }}>
              {locale === 'de' ? 'Bitte fordere einen neuen Link zum Zurücksetzen deines Passworts an.' : 'Please request a new password reset link.'}
            </p>
            <button onClick={() => router.push('/' + locale + '/auth/login')}
              style={{ width: '100%', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {locale === 'de' ? 'Zum Login' : 'Go to login'}
            </button>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: 'center' as const, padding: '20px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: accent, margin: '0 auto 16px' }} />
            <p style={{ fontSize: '13px', color: muted }}>{locale === 'de' ? 'Link wird überprüft...' : 'Verifying link...'}</p>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center' as const }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>✅</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', fontWeight: 400, color: text, marginBottom: '8px' }}>
              {locale === 'de' ? 'Passwort geändert!' : 'Password changed!'}
            </h2>
            <p style={{ fontSize: '14px', color: muted }}>
              {locale === 'de' ? 'Du wirst weitergeleitet...' : 'Redirecting you...'}
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              {locale === 'de' ? 'Neues Passwort' : 'New password'}
            </h2>
            <p style={{ color: muted, fontSize: '14px', marginBottom: '24px' }}>
              {locale === 'de' ? 'Wähle ein neues Passwort.' : 'Choose a new password.'}
            </p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: muted, display: 'block', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                {locale === 'de' ? 'Neues Passwort' : 'New password'}
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', background: isDark ? '#080c18' : '#f8faff', border: `1.5px solid ${border}`, borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: text, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: muted, display: 'block', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                {locale === 'de' ? 'Bestätigen' : 'Confirm'}
              </label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                placeholder="••••••••"
                style={{ width: '100%', background: isDark ? '#080c18' : '#f8faff', border: `1.5px solid ${border}`, borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: text, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            <motion.button whileTap={{ scale: 0.98 }} onClick={handleUpdate} disabled={loading}
              style={{ width: '100%', background: loading ? (isDark ? '#0d1225' : '#e8eeff') : `linear-gradient(135deg, ${accent} 0%, #6b9fff 100%)`, border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 700, color: loading ? muted : '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {loading ? (locale === 'de' ? 'Speichern...' : 'Saving...') : (locale === 'de' ? 'Passwort speichern' : 'Save password')}
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  )
}