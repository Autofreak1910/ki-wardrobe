'use client'

import { useState, useEffect, useRef, RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocale } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

type Rect = { top: number; left: number; width: number; height: number }

const STEPS = [
  {
    refKey: 'dressMeRef' as const,
    titleDe: '✦ Dress Me',
    titleEn: '✦ Dress Me',
    descDe: 'Drück diesen Button — deine KI erstellt sofort ein perfektes Outfit, passend zum Anlass und Wetter!',
    descEn: 'Press this button — your AI instantly creates a perfect outfit matching your occasion and weather!',
    tooltipPos: 'above' as const,
  },
  {
    refKey: 'weatherRef' as const,
    titleDe: '🌤 Echtes Wetter',
    titleEn: '🌤 Real Weather',
    descDe: 'Hier siehst du deine echte Temperatur — die KI wählt automatisch wetterpassende Outfits.',
    descEn: 'Your real temperature — AI automatically picks weather-appropriate outfits.',
    tooltipPos: 'below' as const,
  },
  {
    refKey: 'categoryRef' as const,
    titleDe: '👕 Kategorien',
    titleEn: '👕 Categories',
    descDe: 'Wähle was ins Outfit soll — nur Oberteil und Hose, oder alles. Du entscheidest!',
    descEn: 'Choose what goes in — just top and pants, or everything. You decide!',
    tooltipPos: 'below' as const,
  },
]

interface Props {
  weatherRef: RefObject<HTMLDivElement>
  categoryRef: RefObject<HTMLDivElement>
  dressMeRef: RefObject<HTMLButtonElement>
}

export default function WelcomeOverlay({ weatherRef, categoryRef, dressMeRef }: Props) {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const { theme } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'

  const card   = isDark ? '#0d1225' : '#ffffff'
  const border = isDark ? '#1a2540' : '#dde3f5'
  const text   = isDark ? '#e8eeff' : '#0a1628'
  const muted  = isDark ? '#4d6080' : '#6b7fa8'
  const accent = isDark ? '#4d7eff' : '#3b6bff'

  const refs = { weatherRef, categoryRef, dressMeRef }

  useEffect(() => {
    const seen = localStorage.getItem('kw_welcome_seen')
    if (!seen) setTimeout(() => setShow(true), 900)
  }, [])

  useEffect(() => {
    if (!show) return
    measureStep(step)
  }, [show, step])

  function measureStep(s: number) {
    const refKey = STEPS[s].refKey
    const el = refs[refKey]?.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }

  function finish() {
    localStorage.setItem('kw_welcome_seen', 'true')
    setShow(false)
  }

  function next() {
    if (step < STEPS.length - 1) {
      setRect(null)
      setTimeout(() => {
        setStep(s => s + 1)
      }, 150)
    } else {
      finish()
    }
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const PAD = 10

  // Tooltip position berechnen
  function getTooltipStyle(): React.CSSProperties {
    if (!rect) return { display: 'none' }

    const TIP_W = Math.min(300, window.innerWidth - 32)
    const TIP_H = 180

    let left = rect.left + rect.width / 2 - TIP_W / 2
    // Clamp horizontal
    left = Math.max(16, Math.min(window.innerWidth - TIP_W - 16, left))

    if (current.tooltipPos === 'above') {
      const top = rect.top - TIP_H - 16
      return {
        position: 'fixed',
        top: Math.max(16, top),
        left,
        width: TIP_W,
        zIndex: 10001,
      }
    } else {
      const top = rect.top + rect.height + 16
      return {
        position: 'fixed',
        top: Math.min(window.innerHeight - TIP_H - 16, top),
        left,
        width: TIP_W,
        zIndex: 10001,
      }
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Dark overlay with hole */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={next}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              cursor: 'pointer',
            }}
          >
            {rect && (
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <mask id="hole">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={rect.left - PAD}
                      y={rect.top - PAD}
                      width={rect.width + PAD * 2}
                      height={rect.height + PAD * 2}
                      rx="16"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%" height="100%"
                  fill="rgba(0,0,0,0.72)"
                  mask="url(#hole)"
                />
              </svg>
            )}
          </motion.div>

          {/* Spotlight border + pulse */}
          {rect && (
            <>
              <motion.div
                key={`spot-${step}`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: 'fixed',
                  top: rect.top - PAD,
                  left: rect.left - PAD,
                  width: rect.width + PAD * 2,
                  height: rect.height + PAD * 2,
                  borderRadius: '18px',
                  border: `2px solid ${accent}`,
                  zIndex: 10000,
                  pointerEvents: 'none',
                }}
              />
              {/* Pulse */}
              <motion.div
                animate={{ scale: [1, 1.03, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'fixed',
                  top: rect.top - PAD,
                  left: rect.left - PAD,
                  width: rect.width + PAD * 2,
                  height: rect.height + PAD * 2,
                  borderRadius: '18px',
                  border: `2px solid ${accent}`,
                  boxShadow: `0 0 20px ${accent}60`,
                  zIndex: 10000,
                  pointerEvents: 'none',
                }}
              />
            </>
          )}

          {/* Tooltip */}
          {rect && (
            <motion.div
              key={`tip-${step}`}
              initial={{ opacity: 0, y: current.tooltipPos === 'above' ? 8 : -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={getTooltipStyle()}
            >
              {/* Arrow */}
              {current.tooltipPos === 'above' && (
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: `10px solid ${card}`,
                  position: 'absolute', bottom: -10,
                  left: '50%', transform: 'translateX(-50%)',
                  filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.1))',
                }} />
              )}
              {current.tooltipPos === 'below' && (
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderBottom: `10px solid ${card}`,
                  position: 'absolute', top: -10,
                  left: '50%', transform: 'translateX(-50%)',
                }} />
              )}

              <div style={{
                background: card,
                border: `1px solid ${border}`,
                borderRadius: '20px',
                padding: '18px 20px',
                boxShadow: isDark
                  ? '0 8px 40px rgba(0,0,0,0.7)'
                  : `0 8px 40px ${accent}20`,
              }}>
                {/* Progress */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                  {STEPS.map((_, i) => (
                    <div key={i} style={{
                      flex: 1, height: '3px', borderRadius: '2px',
                      background: i <= step ? accent : border,
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>

                <h3 style={{
                  fontSize: '16px', fontWeight: 800,
                  color: text, marginBottom: '7px',
                  letterSpacing: '-0.02em',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {locale === 'de' ? current.titleDe : current.titleEn}
                </h3>
                <p style={{
                  fontSize: '13px', color: muted,
                  lineHeight: 1.6, marginBottom: '16px',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {locale === 'de' ? current.descDe : current.descEn}
                </p>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); finish() }}
                    style={{
                      fontSize: '12px', color: muted,
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      padding: '4px 0', whiteSpace: 'nowrap' as const,
                    }}>
                    {locale === 'de' ? 'Überspringen' : 'Skip'}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={(e) => { e.stopPropagation(); next() }}
                    style={{
                      flex: 1, background: `linear-gradient(135deg, ${accent}, #6b9fff)`,
                      border: 'none', borderRadius: '12px', padding: '11px',
                      fontSize: '14px', fontWeight: 700, color: '#fff',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      boxShadow: `0 4px 16px ${accent}40`,
                      letterSpacing: '-0.01em',
                    }}>
                    {isLast
                      ? (locale === 'de' ? "Los geht's 🚀" : "Let's go 🚀")
                      : (locale === 'de' ? 'Weiter →' : 'Next →')
                    }
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}