'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'

export default function VerifyPage() {
  const [otp, setOtp] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const e = params.get('email')
    if (e) setEmail(e)
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
        style={{ width: '100%', maxWidth: '380px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '32px', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : `0 8px 40px ${accent}12`, position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: isDark ? 'rgba(92,130,160,0.12)' : 'rgba(53,92,125,0.08)', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '24px' }}>
            📧
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 500, color: text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {locale === 'de' ? 'Code eingeben' : 'Enter code'}
          </h2>
          <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>
            {locale === 'de' ? 'Wir haben einen 6-stelligen Code an' : 'We sent a 6-digit code to'}
          </p>
          {email && <p style={{ fontSize: '13px', fontWeight: 700, color: accent, marginTop: '4px' }}>{email}</p>}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', textAlign: 'center' as const }}>
            {error}
          </div>
        )}

        <input
         type="number" 
placeholder="000000"
value={otp}
onChange={e => setOtp(e.target.value.slice(0, 6))}
          style={{ width: '100%', background: isDark ? '#161616' : '#F7F4EC', border: `1.5px solid ${otp.length === 6 ? accent : border}`, borderRadius: '14px', padding: '16px', fontSize: '32px', color: text, outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'Poppins', 'Inter', sans-serif", textAlign: 'center' as const, letterSpacing: '0.4em', marginBottom: '16px', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = accent}
          onBlur={e => e.target.style.borderColor = otp.length === 6 ? accent : border}
          autoFocus
        />

        <motion.button whileTap={{ scale: 0.97 }}
          onClick={async () => {
            if (otp.length !== 6 || !email) return
            setLoading(true); setError('')
          const { error } = await supabase.auth.signInWithOtp({ 
  email, 
  options: { 
    shouldCreateUser: false,
    data: { type: 'email' }
  } 
})
            if (error) { setError(locale === 'de' ? 'Ungültiger Code — bitte nochmal versuchen' : 'Invalid code — please try again'); setLoading(false) }
            else { router.push('/' + locale + '/dresser') }
          }}
          disabled={loading || otp.length !== 6}
          style={{ width: '100%', background: otp.length === 6 ? sageGradient : (isDark ? '#1D1D20' : '#EDE7D8'), border: 'none', borderRadius: '14px', padding: '16px', fontSize: '15px', fontWeight: 700, color: otp.length === 6 ? '#fff' : muted, cursor: otp.length === 6 ? 'pointer' : 'not-allowed', fontFamily: "'Poppins', 'Inter', sans-serif", transition: 'all 0.2s', boxShadow: otp.length === 6 ? `0 4px 20px ${accent}40` : 'none', marginBottom: '12px' }}>
          {loading ? '...' : locale === 'de' ? 'Einloggen →' : 'Login →'}
        </motion.button>

        <button onClick={() => router.push('/' + locale + '/auth/login')}
          style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '12px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", padding: '4px', textAlign: 'center' as const }}>
          {locale === 'de' ? '← Zurück zum Login' : '← Back to login'}
        </button>
      </motion.div>

      <p style={{ marginTop: '20px', fontSize: '11px', color: muted, position: 'relative', zIndex: 1 }}>
        KiWardrobe · Made with ♥
      </p>
    </div>
  )
}