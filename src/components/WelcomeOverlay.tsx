'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocale } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

const steps = [
  {
    // Zeigt auf den Dress Me Button (unten mitte)
    spotlight: { bottom: 140, left: '50%', width: 280, height: 60, xOffset: -140 },
    arrow: 'up',
    tooltipPos: { bottom: 210, left: '50%', xOffset: -150 },
    titleDe: 'Dress Me ✦',
    titleEn: 'Dress Me ✦',
    descDe: 'Drück diesen Button — deine KI erstellt sofort ein perfektes Outfit!',
    descEn: 'Press this button — your AI creates a perfect outfit instantly!',
  },
  {
    // Zeigt auf Wetter Card (oben rechts)
    spotlight: { top: 80, right: 18, width: 120, height: 110, xOffset: 0 },
    arrow: 'down',
    tooltipPos: { top: 200, right: 18, xOffset: 0 },
    titleDe: 'Echtes Wetter 🌤',
    titleEn: 'Real Weather 🌤',
    descDe: 'Dein Standort, echte Temperatur — die KI wählt wetterpassende Outfits.',
    descEn: 'Your location, real temperature — AI picks weather-appropriate outfits.',
  },
  {
    // Zeigt auf Kategorie Grid
    spotlight: { top: 320, left: 18, right: 18, width: -1, height: 200, xOffset: 0 },
    arrow: 'down',
    tooltipPos: { top: 530, left: '50%', xOffset: -150 },
    titleDe: 'Kategorien wählen 👕',
    titleEn: 'Choose Categories 👕',
    descDe: 'Tippe an was du anziehen willst — Outfit wird daran angepasst.',
    descEn: 'Tap what you want to wear — outfit gets customized to your choice.',
  },
]

export default function WelcomeOverlay() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const { theme } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'

  const card   = isDark ? '#0d1225' : '#ffffff'
  const border = isDark ? '#1a2540' : '#dde3f5'
  const text   = isDark ? '#e8eeff' : '#0a1628'
  const muted  = isDark ? '#4d6080' : '#6b7fa8'
  const accent = isDark ? '#4d7eff' : '#3b6bff'

  useEffect(() => {
    const seen = localStorage.getItem('kw_welcome_seen')
    if (!seen) setTimeout(() => setShow(true), 800)
  }, [])

  function finish() {
    localStorage.setItem('kw_welcome_seen', 'true')
    setShow(false)
  }

  function next() {
    if (step < steps.length - 1) setStep(s => s + 1)
    else finish()
  }

  const current = steps[step]
  const isLast = step === steps.length - 1

  // Spotlight position berechnen
  const spotStyle: any = {
    position: 'fixed',
    borderRadius: '16px',
    border: `2px solid ${accent}`,
    boxShadow: `0 0 0 9999px rgba(0,0,0,0.65)`,
    zIndex: 10000,
    pointerEvents: 'none',
  }
  if (current.spotlight.top !== undefined) spotStyle.top = current.spotlight.top
  if (current.spotlight.bottom !== undefined) spotStyle.bottom = current.spotlight.bottom
  if (current.spotlight.left !== undefined) spotStyle.left = current.spotlight.left
  if (current.spotlight.right !== undefined) spotStyle.right = current.spotlight.right
  spotStyle.width = current.spotlight.width === -1 ? `calc(100% - 36px)` : current.spotlight.width
  spotStyle.height = current.spotlight.height

  // Tooltip position
  const tipStyle: any = {
    position: 'fixed',
    width: '300px',
    zIndex: 10001,
  }
  if (current.tooltipPos.top !== undefined) tipStyle.top = current.tooltipPos.top
  if (current.tooltipPos.bottom !== undefined) tipStyle.bottom = current.tooltipPos.bottom
  if (current.tooltipPos.left !== undefined) {
    tipStyle.left = current.tooltipPos.left
    tipStyle.transform = `translateX(${current.tooltipPos.xOffset}px)`
  }
  if (current.tooltipPos.right !== undefined) {
    tipStyle.right = current.tooltipPos.right
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Spotlight highlight */}
          <motion.div
            key={`spot-${step}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={spotStyle}
          />

          {/* Pulsing ring on spotlight */}
          <motion.div
            key={`ring-${step}`}
            animate={{ scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ ...spotStyle, border: `2px solid ${accent}`, boxShadow: 'none', background: 'transparent' }}
          />

          {/* Tap to dismiss full overlay */}
          <div
            onClick={next}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'pointer' }}
          />

          {/* Tooltip card */}
          <motion.div
            key={`tip-${step}`}
            initial={{ opacity: 0, y: current.arrow === 'up' ? 12 : -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={tipStyle}
          >
            {/* Arrow */}
            <div style={{
              width: 0, height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              ...(current.arrow === 'up'
                ? { borderBottom: `10px solid ${card}`, margin: '0 auto 0 24px' }
                : { borderTop: `10px solid ${card}`, margin: '0 auto 0 24px', order: 2 }),
            }} />

            <div style={{
              background: card,
              border: `1px solid ${border}`,
              borderRadius: '20px',
              padding: '18px 20px',
              boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.6)' : `0 8px 40px ${accent}20`,
            }}>
              {/* Progress */}
              <div style={{ display: 'flex', gap: '5px', marginBottom: '12px' }}>
                {steps.map((_, i) => (
                  <div key={i} style={{ height: '3px', flex: 1, borderRadius: '2px', background: i <= step ? accent : border, transition: 'background 0.3s' }} />
                ))}
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 800, color: text, marginBottom: '6px', letterSpacing: '-0.02em', fontFamily: "'DM Sans', sans-serif" }}>
                {locale === 'de' ? current.titleDe : current.titleEn}
              </h3>
              <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '16px', fontFamily: "'DM Sans', sans-serif" }}>
                {locale === 'de' ? current.descDe : current.descEn}
              </p>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={(e) => { e.stopPropagation(); finish() }}
                  style={{ fontSize: '12px', color: muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '4px 0' }}>
                  {locale === 'de' ? 'Überspringen' : 'Skip'}
                </button>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={(e) => { e.stopPropagation(); next() }}
                  style={{ flex: 1, background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '12px', padding: '11px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: `0 4px 16px ${accent}40` }}>
                  {isLast
                    ? (locale === 'de' ? "Los geht's 🚀" : "Let's go 🚀")
                    : (locale === 'de' ? 'Weiter →' : 'Next →')
                  }
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}