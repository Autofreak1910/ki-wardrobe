'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

type Slide = { emoji: string; titleDe: string; titleEn: string; textDe: string; textEn: string }

const slides: Slide[] = [
  {
    emoji: '📸',
    titleDe: 'Kleiderschrank scannen',
    titleEn: 'Scan your wardrobe',
    textDe: 'Fotografier deine Kleidung — die KI erkennt automatisch Farbe, Kategorie und Stil.',
    textEn: 'Photograph your clothes — AI automatically detects color, category, and style.',
  },
  {
    emoji: '✨',
    titleDe: 'KI-Outfits jeden Tag',
    titleEn: 'AI outfits every day',
    textDe: 'Bekomm passende Outfit-Vorschläge basierend auf Wetter und Anlass — komplett kostenlos.',
    textEn: 'Get matching outfit suggestions based on weather and occasion — completely free.',
  },
  {
    emoji: '🤳',
    titleDe: 'Virtual Try-On',
    titleEn: 'Virtual Try-On',
    textDe: 'Probier deine Kleidung virtuell an deinem eigenen Avatar an, bevor du dich entscheidest.',
    textEn: 'Try on your clothes virtually on your own avatar before you decide.',
  },
  {
    emoji: '🎁',
    titleDe: 'Freunde einladen',
    titleEn: 'Invite friends',
    textDe: 'Lade Freunde ein und bekommt beide kostenlose Pro-Zeit dazu!',
    textEn: 'Invite friends and you both get free Pro time!',
  },
]

export default function OnboardingCarousel({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const bg     = isDark ? '#080c18' : '#f0f4ff'
  const card   = isDark ? '#0d1225' : '#ffffff'
  const border = isDark ? '#1a2540' : '#dde3f5'
  const text   = isDark ? '#e8eeff' : '#0a1628'
  const muted  = isDark ? '#4d6080' : '#6b7fa8'
  const accent = isDark ? '#4d7eff' : '#3b6bff'

  const locale = typeof navigator !== 'undefined' && navigator.language.startsWith('de') ? 'de' : 'en'
  const isLast = index === slides.length - 1

 function next() {
    console.log('Next clicked, isLast:', isLast, 'index:', index)
    if (isLast) {
      console.log('Calling onDone')
      onDone()
      return
    }
    setIndex(i => i + 1)
  }

  function handleDragEnd(_: any, info: { offset: { x: number } }) {
    if (info.offset.x < -60) next()
    else if (info.offset.x > 60 && index > 0) setIndex(i => i - 1)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: bg, display: 'flex', flexDirection: 'column' as const, fontFamily: "'DM Sans', sans-serif" }}>

      <button onClick={onDone} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, background: 'transparent', border: 'none', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '8px 12px' }}>
        {locale === 'de' ? 'Überspringen' : 'Skip'}
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={index}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', maxWidth: '380px', padding: '0 24px', textAlign: 'center' as const, cursor: 'grab' }}>

            <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', damping: 12 }}
              style={{ width: '110px', height: '110px', borderRadius: '32px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px', margin: '0 auto 28px', boxShadow: `0 12px 40px ${accent}40` }}>
              {slides[index].emoji}
            </motion.div>

            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: text, marginBottom: '12px', letterSpacing: '-0.02em' }}>
              {locale === 'de' ? slides[index].titleDe : slides[index].titleEn}
            </h2>
            <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6 }}>
              {locale === 'de' ? slides[index].textDe : slides[index].textEn}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ padding: '0 24px 40px' }}>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
          {slides.map((_, i) => (
            <motion.div key={i}
              animate={{ width: i === index ? '24px' : '7px', background: i === index ? accent : border }}
              transition={{ duration: 0.3 }}
              style={{ height: '7px', borderRadius: '4px' }} />
          ))}
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={next}
          style={{ width: '100%', maxWidth: '380px', margin: '0 auto', display: 'block', padding: '16px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: `0 4px 20px ${accent}40` }}>
          {isLast ? (locale === 'de' ? "Los geht's! 🎉" : "Let's go! 🎉") : (locale === 'de' ? 'Weiter' : 'Next')}
        </motion.button>
      </div>
    </div>
  )
}