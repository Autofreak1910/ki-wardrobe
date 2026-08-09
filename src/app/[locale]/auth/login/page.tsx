'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginPage() {
 const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { theme, toggle } = useTheme()
  const t = useTranslations('auth')
  const locale = useLocale()
  const isDark = theme === 'dark'
  const [showEmailCodeModal, setShowEmailCodeModal] = useState(false)
const [otpEmail, setOtpEmail] = useState('')
const [otpLoading, setOtpLoading] = useState(false)
const [otpError, setOtpError] = useState('')

  const bg     = isDark ? '#161616' : '#F2EFE7'
  const card   = isDark ? '#1D1D20' : '#ffffff'
  const border = isDark ? '#2a2a2e' : '#E7E2D5'
  const text   = isDark ? '#F5F3EE' : '#24211B'
  const muted  = isDark ? '#9a978f' : '#8C8776'
  const accent = isDark ? '#5C82A0' : '#355C7D'
  const sageGradient = 'linear-gradient(135deg, #7FA98E, #355C7D)'

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/' + locale + '/dresser') }
  }
async function sendOtpCode() {
  if (!otpEmail) { setOtpError(locale === 'de' ? 'Bitte Email eingeben' : 'Please enter your email'); return }
  setOtpLoading(true); setOtpError('')
  const { error } = await supabase.auth.signInWithOtp({ email: otpEmail, options: { shouldCreateUser: false } })
  if (error) { setOtpError(error.message); setOtpLoading(false) }
  else { router.push('/' + locale + '/auth/verify?email=' + encodeURIComponent(otpEmail)) }
}
async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?locale=${locale}`,
    },
  })
}
  function switchLocale(nl: string) {
    const s = pathname.split('/')
    s[1] = nl
    window.location.replace(s.join('/'))
  }
  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', background: bg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'flex-start', fontFamily: "'Poppins', 'Inter', sans-serif", padding: 'max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom))', position: 'relative', overflowY: 'auto' as const, overflowX: 'hidden' as const, overscrollBehavior: 'contain' as const, WebkitOverflowScrolling: 'touch' as any }}>

      {/* Background glows */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: isDark ? 'rgba(92,130,160,0.08)' : 'rgba(53,92,125,0.1)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: isDark ? 'rgba(201,150,60,0.06)' : 'rgba(201,150,60,0.08)', filter: 'blur(80px)' }} />
        {!isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.9" fill="#355C7D" opacity="0.2" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        )}
      </div>

      {/* Top buttons */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px', zIndex: 10 }}>
        <button onClick={() => switchLocale(locale === 'de' ? 'en' : 'de')}
          style={{ background: card, border: `1px solid ${border}`, borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: muted, fontFamily: "'Poppins', 'Inter', sans-serif" }}>
          {locale === 'de' ? 'EN' : 'DE'}
        </button>
        <button onClick={toggle}
          style={{ background: card, border: `1px solid ${border}`, borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '15px' }}>
          {isDark ? '○' : '●'}
        </button>
      </div>

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', marginBottom: '36px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '76px', height: '76px', borderRadius: '22px', overflow: 'hidden', margin: '0 auto 16px', boxShadow: `0 8px 32px ${accent}40` }}>
          <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '30px', fontWeight: 500, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Ki<em style={{ color: accent }}>Wardrobe</em>
        </h1>
        <p style={{ fontSize: '13px', color: muted }}>{t('tagline')}</p>
      </motion.div>
{/* Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '400px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '32px', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(53,92,125,0.08)', position: 'relative', zIndex: 1 }}>

        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 500, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
          {t('welcomeBack')}
        </h2>
        <p style={{ color: muted, fontSize: '14px', marginBottom: '28px' }}>
          {t('noAccount')}{' '}
          <Link href={'/' + locale + '/auth/register'} style={{ color: accent, fontWeight: 600, textDecoration: 'none' }}>
            {t('register')}
          </Link>
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: muted, display: 'block', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
            {t('email')}
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="deine@email.com"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', background: isDark ? '#161616' : '#F7F4EC', border: `1.5px solid ${border}`, borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: text, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Poppins', 'Inter', sans-serif", transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = accent}
            onBlur={e => e.target.style.borderColor = border}
          />
        </div>

  <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: muted, display: 'block', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
            {t('password')}
          </label>
          <div style={{ position: 'relative' as const }}>
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}   onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{ width: '100%', background: isDark ? '#161616' : '#F7F4EC', border: `1.5px solid ${border}`, borderRadius: '12px', padding: '13px 44px 13px 16px', fontSize: '14px', color: text, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Poppins', 'Inter', sans-serif", transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = border}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute' as const, right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: muted }}>
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

       <motion.button whileTap={{ scale: 0.98 }} onClick={handleLogin} disabled={loading}
          style={{ width: '100%', background: loading ? (isDark ? '#1D1D20' : '#EDE7D8') : sageGradient, border: loading ? `1px solid ${border}` : 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 700, color: loading ? muted : '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", transition: 'all 0.2s', letterSpacing: '-0.01em', boxShadow: loading ? 'none' : `0 4px 20px ${accent}40` }}>
          {loading ? t('loading') : t('loginButton')}
        </motion.button>

        <div style={{ textAlign: 'center' as const, marginTop: '12px' }}>
          <Link href={'/' + locale + '/auth/forgot-password'} style={{ fontSize: '13px', color: muted, textDecoration: 'none' }}>
            {locale === 'de' ? 'Passwort vergessen?' : 'Forgot password?'}
          </Link>
        </div>
{/* Divider */}
<div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
  <div style={{ flex: 1, height: '1px', background: border }} />
  <p style={{ fontSize: '11px', color: muted, fontWeight: 500 }}>{locale === 'de' ? 'oder' : 'or'}</p>
  <div style={{ flex: 1, height: '1px', background: border }} />
</div>

{/* Google Sign-In */}
<motion.button whileTap={{ scale: 0.98 }}
    onClick={signInWithGoogle}
    style={{ width: '100%', background: 'transparent', border: `1.5px solid ${border}`, borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: 600, color: text, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', marginBottom: '10px' }}>
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    {locale === 'de' ? 'Mit Google anmelden' : 'Sign in with Google'}
</motion.button>

<motion.button whileTap={{ scale: 0.98 }}
    onClick={() => { setOtpEmail(email); setOtpError(''); setShowEmailCodeModal(true) }}
    style={{ width: '100%', background: 'transparent', border: `1.5px solid ${border}`, borderRadius: '14px', padding: '14px', fontSize: '14px', fontWeight: 600, color: text, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', marginBottom: '12px' }}>
    ✉️ {locale === 'de' ? 'Code per Email senden' : 'Send code by email'}
</motion.button>

    {/* Feature pills */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '20px' }}>
          {[t('feature1'), t('feature2'), t('feature3')].map((feat, i) => (
            <div key={i} style={{ flex: 1, background: isDark ? `rgba(92,130,160,0.1)` : `rgba(53,92,125,0.06)`, borderRadius: '10px', padding: '8px 6px', fontSize: '10px', color: muted, textAlign: 'center' as const, border: `1px solid ${isDark ? 'rgba(92,130,160,0.2)' : 'rgba(53,92,125,0.12)'}`, lineHeight: 1.4 }}>
              {feat}
            </div>
          ))}
        </div>
      </motion.div>

      <p style={{ marginTop: '20px', fontSize: '11px', color: muted, position: 'relative', zIndex: 1 }}>
        <AnimatePresence>
  {showEmailCodeModal && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => { if (!otpLoading) setShowEmailCodeModal(false) }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '380px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '28px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 500, color: text }}>
            {locale === 'de' ? 'Code per Email' : 'Code by email'}
          </h2>
          <button onClick={() => setShowEmailCodeModal(false)}
            style={{ background: isDark ? '#161616' : '#F7F4EC', border: `1px solid ${border}`, borderRadius: '10px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: muted }}>✕</button>
        </div>
        <p style={{ fontSize: '13px', color: muted, marginBottom: '20px', lineHeight: 1.6 }}>
          {locale === 'de'
            ? 'Gib deine Email ein — wir schicken dir einen Anmeldecode.'
            : "Enter your email — we'll send you a login code."}
        </p>

        {otpError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px' }}>
            {otpError}
          </div>
        )}

        <label style={{ fontSize: '12px', fontWeight: 600, color: muted, display: 'block', marginBottom: '7px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          {t('email')}
        </label>
        <input type="email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)}
          placeholder="deine@email.com"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && sendOtpCode()}
          style={{ width: '100%', background: isDark ? '#161616' : '#F7F4EC', border: `1.5px solid ${border}`, borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: text, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '20px' }}
        />

        <motion.button whileTap={{ scale: 0.98 }} onClick={sendOtpCode} disabled={otpLoading}
          style={{ width: '100%', background: otpLoading ? (isDark ? '#1D1D20' : '#EDE7D8') : sageGradient, border: otpLoading ? `1px solid ${border}` : 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 700, color: otpLoading ? muted : '#fff', cursor: otpLoading ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
          {otpLoading ? t('loading') : (locale === 'de' ? 'Code senden' : 'Send code')}
        </motion.button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
        KiWardrobe · Made with ♥
      </p>
    </div>
  )
}