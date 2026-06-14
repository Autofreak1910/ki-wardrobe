'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocale } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

const steps = [
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
        <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z"/>
      </svg>
    ),
    titleDe: 'Dress Me',
    titleEn: 'Dress Me',
    descDe: 'Drück den großen Button — deine KI erstellt sofort ein Outfit aus deinem Kleiderschrank, passend zum Anlass und Wetter.',
    descEn: 'Hit the big button — your AI instantly creates an outfit from your wardrobe, matching the occasion and weather.',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
    titleDe: 'Kleiderschrank',
    titleEn: 'Wardrobe',
    descDe: 'Foto machen, KI analysiert automatisch Farbe, Kategorie und Style. Je mehr Teile, desto besser die Outfits.',
    descEn: 'Take a photo, AI automatically analyzes color, category and style. More items = better outfits.',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
    titleDe: 'Outfits speichern',
    titleEn: 'Save Outfits',
    descDe: 'Gefällt dir ein Outfit? Speicher es mit einem Tap und finde es später unter Outfits wieder.',
    descEn: 'Love an outfit? Save it with one tap and find it later under Outfits.',
  },
]

export default function WelcomeOverlay() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
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
    const seen = localStorage.getItem('kw_welcome_seen')
    if (!seen) {
      setTimeout(() => setShow(true), 600)
    }
  }, [])

  function finish() {
    localStorage.setItem('kw_welcome_seen', 'true')
    setShow(false)
  }

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={finish}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '420px', background: card, border: `1px solid ${border}`, borderRadius: '28px', padding: '32px 28px', boxShadow: isDark ? '0 -8px 60px rgba(0,0,0,0.6)' : '0 -8px 60px rgba(59,107,255,0.15)' }}
          >
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '28px' }}>
              {steps.map((_, i) => (
                <motion.div key={i}
                  animate={{ width: i === step ? '28px' : '8px', background: i <= step ? accent : border }}
                  transition={{ duration: 0.3 }}
                  style={{ height: '4px', borderRadius: '2px' }} />
              ))}
            </div>

            {/* Icon */}
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ duration: 0.25 }}
                style={{ textAlign: 'center' as const }}
              >
                <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: `rgba(${isDark ? '77,126,255' : '59,107,255'},0.1)`, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: accent }}>
                  {current.icon}
                </div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: text, marginBottom: '12px', letterSpacing: '-0.02em' }}>
                  {locale === 'de' ? current.titleDe : current.titleEn}
                </h3>
                <p style={{ fontSize: '15px', color: muted, lineHeight: 1.65, marginBottom: '28px' }}>
                  {locale === 'de' ? current.descDe : current.descEn}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={finish}
                style={{ padding: '13px 18px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '14px', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                {locale === 'de' ? 'Überspringen' : 'Skip'}
              </button>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => isLast ? finish() : setStep(s => s + 1)}
                style={{ flex: 1, background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '14px', padding: '13px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em', boxShadow: `0 4px 20px ${accent}40` }}>
                {isLast
                  ? (locale === 'de' ? 'Los geht\'s 🚀' : 'Let\'s go 🚀')
                  : (locale === 'de' ? 'Weiter' : 'Next') + ' →'
                }
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}