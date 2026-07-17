'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()
  const { theme } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'

  const bg     = isDark ? '#161616' : '#F2EFE7'
  const card   = isDark ? '#1D1D20' : '#ffffff'
  const border = isDark ? '#2a2a2e' : '#E7E2D5'
  const text   = isDark ? '#F5F3EE' : '#24211B'
  const muted  = isDark ? '#9a978f' : '#8C8776'
  const accent = isDark ? '#5C82A0' : '#355C7D'
  const sageGradient = 'linear-gradient(135deg, #7FA98E, #355C7D)'

  async function handleReset() {
    if (!email) { setError(locale === 'de' ? 'Bitte Email eingeben' : 'Please enter your email'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
    })
    if (error) { setError(error.message) } else { setSent(true) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", padding: '24px' }}>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '18px', overflow: 'hidden', margin: '0 auto 14px', boxShadow: `0 8px 32px ${accent}40` }}>
          <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 500, color: text, letterSpacing: '-0.02em' }}>
          Ki<em style={{ color: accent }}>Wardrobe</em>
        </h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        style={{ width: '100%', maxWidth: '400px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '32px' }}>

        {sent ? (
          <>
            <div style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>📧</p>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 500, color: text, marginBottom: '10px' }}>
                {locale === 'de' ? 'Email gesendet!' : 'Email sent!'}
              </h2>
              <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6 }}>
                {locale === 'de'
                  ? `Wir haben einen Link zum Zurücksetzen an ${email} gesendet. Schau auch im Spam-Ordner nach.`
                  : `We sent a reset link to ${email}. Check your spam folder too.`}
              </p>
            </div>
            <Link href={'/' + locale + '/auth/login'} style={{ display: 'block', textAlign: 'center' as const, fontSize: '14px', color: accent, fontWeight: 600, textDecoration: 'none' }}>
              ← {locale === 'de' ? 'Zurück zum Login' : 'Back to login'}
            </Link>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 500, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              {locale === 'de' ? 'Passwort zurücksetzen' : 'Reset password'}
            </h2>
            <p style={{ color: muted, fontSize: '14px', marginBottom: '24px' }}>
              {locale === 'de'
                ? 'Gib deine Email ein, wir senden dir einen Link.'
                : 'Enter your email and we\'ll send you a link.'}
            </p>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: muted, display: 'block', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="deine@email.com"
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                style={{ width: '100%', background: isDark ? '#161616' : '#F7F4EC', border: `1.5px solid ${border}`, borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: text, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Poppins', 'Inter', sans-serif" }}
              />
            </div>

            <motion.button whileTap={{ scale: 0.98 }} onClick={handleReset} disabled={loading}
              style={{ width: '100%', background: loading ? (isDark ? '#1D1D20' : '#EDE7D8') : sageGradient, border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 700, color: loading ? muted : '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '16px' }}>
              {loading ? (locale === 'de' ? 'Sende...' : 'Sending...') : (locale === 'de' ? 'Link senden' : 'Send link')}
            </motion.button>

            <Link href={'/' + locale + '/auth/login'} style={{ display: 'block', textAlign: 'center' as const, fontSize: '14px', color: muted, textDecoration: 'none' }}>
              ← {locale === 'de' ? 'Zurück zum Login' : 'Back to login'}
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}