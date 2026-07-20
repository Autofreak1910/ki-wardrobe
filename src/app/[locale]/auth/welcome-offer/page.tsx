'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'

export default function WelcomeOfferPage() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<{ is_founder: boolean; signup_number: number } | null>(null)
  const [initializing, setInitializing] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const locale = useLocale()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const bg        = isDark ? '#161616' : '#F2EFE7'
  const card       = isDark ? '#1D1D20' : '#ffffff'
  const border     = isDark ? '#2a2a2e' : '#E7E2D5'
  const text       = isDark ? '#F5F3EE' : '#24211B'
  const muted      = isDark ? '#9a978f' : '#8C8776'
  const accent     = isDark ? '#5C82A0' : '#355C7D'
  const secondary  = isDark ? '#221D12' : '#F7F4EC'
  const sageGradient = 'linear-gradient(135deg, #7FA98E, #355C7D)'

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/' + locale + '/dresser')
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('is_founder, signup_number')
      .eq('id', user.id)
      .single()

    setProfile(data as any)
    setInitializing(false)
  }

  async function handleClaim() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email, locale }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  function handleSkip() {
    router.push('/' + locale + '/dresser')
  }

  if (initializing) {
    return (
      <div style={{ minHeight: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: accent }} />
      </div>
    )
  }

  const isFounder = profile?.is_founder ?? false
  const signupNumber = profile?.signup_number

  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', 'Inter', sans-serif", padding: '24px' }}>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '400px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '32px', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : `0 8px 40px ${accent}12` }}>

        {isFounder ? (
          <>
            <div style={{ display: 'inline-block', background: sageGradient, borderRadius: '20px', padding: '6px 14px', marginBottom: '16px' }}>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>🏆 FOUNDER #{signupNumber}</span>
            </div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 500, color: text, marginBottom: '10px', letterSpacing: '-0.02em' }}>
              {locale === 'de' ? 'Willkommen, Founder!' : 'Welcome, Founder!'}
            </h1>
            <p style={{ color: muted, fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              {locale === 'de'
                ? `Du bist einer der ersten 75 bei KiWardrobe — als Dankeschön bekommst du:`
                : `You're one of the first 75 on KiWardrobe — as a thank you, you get:`}
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 500, color: text, marginBottom: '10px', letterSpacing: '-0.02em' }}>
              {locale === 'de' ? 'Willkommensangebot' : 'Welcome offer'}
            </h1>
            <p style={{ color: muted, fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              {locale === 'de'
                ? 'Teste KiWardrobe Pro 3 Tage kostenlos:'
                : 'Try KiWardrobe Pro free for 3 days:'}
            </p>
          </>
        )}

        {[
          isFounder
            ? (locale === 'de' ? '2 Monate Premium gratis' : '2 months Premium free')
            : (locale === 'de' ? '3 Tage kostenlos testen' : '3 days free trial'),
          locale === 'de' ? 'Unbegrenzt KI-Outfits' : 'Unlimited AI outfits',
          locale === 'de' ? 'Virtual Try-On & Avatar' : 'Virtual Try-On & Avatar',
          isFounder
            ? (locale === 'de' ? '20% Rabatt für immer danach' : '20% off forever after')
            : (locale === 'de' ? 'Danach nur 2,99€ im 1. Monat' : 'Then just €2.99 for month 1'),
        ].map((line, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: sageGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>✓</span>
            </div>
            <span style={{ fontSize: '13px', color: text, fontWeight: 500 }}>{line}</span>
          </div>
        ))}

        <div style={{ marginTop: '24px', marginBottom: '20px' }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleClaim} disabled={loading}
            style={{ width: '100%', background: loading ? secondary : sageGradient, border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 700, color: loading ? muted : '#fff', cursor: loading ? 'wait' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: loading ? 'none' : `0 4px 20px ${accent}40`, marginBottom: '12px' }}>
            {loading
              ? (locale === 'de' ? 'Einen Moment...' : 'One moment...')
              : (locale === 'de' ? 'Angebot sichern →' : 'Claim offer →')}
          </motion.button>

          <button onClick={handleSkip}
            style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", textDecoration: 'underline' }}>
            {locale === 'de' ? 'Später (Free-Version starten)' : 'Later (start free version)'}
          </button>
        </div>

        <p style={{ fontSize: '11px', color: muted, textAlign: 'center' as const }}>
          {locale === 'de' ? 'Jederzeit kündbar · Keine Verpflichtung' : 'Cancel anytime · No commitment'}
        </p>
      </motion.div>
    </div>
  )
}