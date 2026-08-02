'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

function CheckCircleIcon({ size = 64, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="8 12.5 11 15.5 16 9"/>
    </svg>
  )
}

export default function WelcomeOfferPage() {
  const router = useRouter()
  const locale = useLocale()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const bg      = isDark ? '#161616' : '#F2EFE7'
  const card    = isDark ? '#1D1D20' : '#ffffff'
  const border  = isDark ? '#2a2a2e' : '#E7E2D5'
  const text    = isDark ? '#F5F3EE' : '#24211B'
  const muted   = isDark ? '#9a978f' : '#8C8776'
  const accent  = isDark ? '#5C82A0' : '#355C7D'
  const sageGradient = 'linear-gradient(135deg, #7FA98E, #355C7D)'

  function continueToApp() {
    router.push('/' + locale + '/dresser')
  }

  // Automatischer Weiterlauf nach kurzer Pause -- Nutzer kann aber auch selbst klicken
  useEffect(() => {
    const timer = setTimeout(continueToApp, 2600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", padding: '24px', position: 'relative', overflow: 'hidden' }}>

      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: isDark ? 'rgba(92,130,160,0.08)' : 'rgba(53,92,125,0.1)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: isDark ? 'rgba(201,150,60,0.06)' : 'rgba(201,150,60,0.08)', filter: 'blur(80px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '400px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '40px 32px', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : `0 8px 40px ${accent}12`, position: 'relative', zIndex: 1, textAlign: 'center' as const }}>

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', damping: 10, stiffness: 200 }}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: sageGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px ${accent}40` }}>
            <CheckCircleIcon size={40} color="#fff" />
          </div>
        </motion.div>

        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 500, color: text, marginBottom: '10px', letterSpacing: '-0.02em' }}>
          {locale === 'de' ? 'Willkommen bei KiWardrobe!' : 'Welcome to KiWardrobe!'}
        </h1>
        <p style={{ color: muted, fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
          {locale === 'de'
            ? 'Dein Konto ist fertig eingerichtet. Wir bringen dich jetzt zu deinem Kleiderschrank.'
            : 'Your account is all set up. Taking you to your wardrobe now.'}
        </p>

        <motion.button whileTap={{ scale: 0.97 }} onClick={continueToApp}
          style={{ width: '100%', background: sageGradient, border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", letterSpacing: '-0.01em', boxShadow: `0 4px 20px ${accent}40` }}>
          {locale === 'de' ? "Los geht's" : "Let's go"} →
        </motion.button>

        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: accent, margin: '20px auto 0' }} />
      </motion.div>
    </div>
  )
}