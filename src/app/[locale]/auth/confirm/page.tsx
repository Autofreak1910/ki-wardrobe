'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'
import { motion } from 'framer-motion'

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const supabase = createClient()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const bg     = isDark ? '#161616' : '#F2EFE7'
  const card   = isDark ? '#1D1D20' : '#ffffff'
  const border = isDark ? '#2a2a2e' : '#E7E2D5'
  const text   = isDark ? '#F5F3EE' : '#24211B'
  const muted  = isDark ? '#9a978f' : '#8C8776'
  const accent = isDark ? '#5C82A0' : '#355C7D'
  const sageGradient = 'linear-gradient(135deg, #7FA98E, #355C7D)'

  useEffect(() => {
    async function confirmEmail() {
      // Supabase leitet bei abgelaufenem/ungültigem Link direkt mit error-Parametern weiter
      const urlError = searchParams.get('error') || searchParams.get('error_code')
      if (urlError) {
        setErrorCode(searchParams.get('error_code') ?? urlError)
        setStatus('error')
        return
      }

      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Code exchange failed:', error)
          setErrorCode(error.message)
          setStatus('error')
          return
        }
        setStatus('success')
        return
      }

      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (error) { setErrorCode(error.message); setStatus('error'); return }
        setStatus('success')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) { setStatus('success') } else { setErrorCode('otp_expired'); setStatus('error') }
    }
    confirmEmail()
  }, [])

  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", padding: '24px' }}>

      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: isDark ? 'rgba(92,130,160,0.08)' : 'rgba(53,92,125,0.1)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: isDark ? 'rgba(201,150,60,0.06)' : 'rgba(201,150,60,0.08)', filter: 'blur(80px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '68px', height: '68px', borderRadius: '20px', overflow: 'hidden', margin: '0 auto 14px', boxShadow: `0 8px 32px ${accent}40` }}>
          <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 500, color: text, letterSpacing: '-0.02em' }}>
          Ki<em style={{ color: accent }}>Wardrobe</em>
        </h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }}
        style={{ width: '100%', maxWidth: '380px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '36px 28px', textAlign: 'center' as const, boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : `0 8px 40px ${accent}12`, position: 'relative', zIndex: 1 }}>

        {status === 'loading' && (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: accent, margin: '0 auto 20px' }} />
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 500, color: text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
              {locale === 'de' ? 'Wird bestätigt...' : 'Confirming...'}
            </h2>
            <p style={{ fontSize: '14px', color: muted }}>
              {locale === 'de' ? 'Einen Moment bitte' : 'Just a moment'}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: sageGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px', color: '#fff' }}>✓</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 500, color: text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
              {locale === 'de' ? 'E-Mail bestätigt! 🎉' : 'Email confirmed! 🎉'}
            </h2>
            <p style={{ fontSize: '14px', color: muted, marginBottom: '20px', lineHeight: 1.6 }}>
              {locale === 'de'
                ? 'Du kannst dieses Fenster jetzt schließen und zu deinem Registrierungs-Tab zurückgehen — dort geht es automatisch weiter.'
                : 'You can close this window now and go back to your registration tab — it will continue automatically.'}
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/' + locale + '/auth/register')}
              style={{ width: '100%', background: sageGradient, border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
              {locale === 'de' ? 'Hier weiter registrieren' : 'Continue registration here'}
            </motion.button>
          </>
        )}

        {status === 'error' && (
          <>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>❌</p>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 500, color: text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
              {locale === 'de' ? 'Link abgelaufen oder ungültig' : 'Link expired or invalid'}
            </h2>
            <p style={{ fontSize: '13px', color: muted, marginBottom: '6px', lineHeight: 1.6 }}>
              {locale === 'de'
                ? 'Dieser Bestätigungslink wurde bereits verwendet oder ist abgelaufen.'
                : 'This confirmation link was already used or has expired.'}
            </p>
            {errorCode && (
              <p style={{ fontSize: '11px', color: muted, opacity: 0.6, marginBottom: '20px', fontFamily: 'monospace' }}>
                {errorCode}
              </p>
            )}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => router.push('/' + locale + '/auth/register')}
              style={{ width: '100%', background: sageGradient, border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
              {locale === 'de' ? 'Neu registrieren' : 'Register again'}
            </motion.button>
          </>
        )}
      </motion.div>

      <p style={{ marginTop: '20px', fontSize: '11px', color: muted, position: 'relative', zIndex: 1 }}>
        KiWardrobe · Made with ♥
      </p>
    </div>
  )
}