'use client'

import { useState, useEffect, RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocale } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

type Rect = { top: number; left: number; width: number; height: number }

const STEPS = [
  {
    refKey: 'statsRef' as const,
    titleDe: '📊 Deine Übersicht',
    titleEn: '📊 Your Overview',
    descDe: 'Auf einen Blick: wie viele Teile du hochgeladen hast, dein Tage-Streak, dein kostenloses Tages-Outfit und dein Pro-Status.',
    descEn: 'At a glance: how many items you\'ve uploaded, your day streak, your free daily outfit, and your Pro status.',
    tooltipPos: 'below' as const,
  },
  {
    refKey: 'occasionRef' as const,
    titleDe: '🎉 Anlass wählen',
    titleEn: '🎉 Choose the Occasion',
    descDe: 'Casual, Arbeit, Date oder Party — die KI stylt dein Outfit passend zum ausgewählten Anlass.',
    descEn: 'Casual, work, date, or party — the AI styles your outfit to match the selected occasion.',
    tooltipPos: 'below' as const,
  },
  {
    refKey: 'categoryRef' as const,
    titleDe: '👕 Kategorien wählen',
    titleEn: '👕 Choose Categories',
    descDe: 'Tippe an was du anziehen willst — Outfit wird genau daran angepasst.',
    descEn: 'Tap what you want to wear — outfit gets customized to your choice.',
    tooltipPos: 'below' as const,
  },
  {
    refKey: 'weatherToggleRef' as const,
    titleDe: '🌤️ Wetter berücksichtigen',
    titleEn: '🌤️ Factor in the Weather',
    descDe: 'Standardmäßig AN: die KI checkt automatisch das aktuelle Wetter an deinem Standort und stylt entsprechend — z. B. keine Jacke bei Sonne, wärmer bei Kälte. Ausschalten heißt: die KI ignoriert das Wetter komplett.',
    descEn: 'On by default: the AI automatically checks the current weather at your location and styles accordingly — e.g. no jacket in sunshine, warmer when it\'s cold. Turning it off means the AI ignores the weather entirely.',
    tooltipPos: 'above' as const,
  },
  {
    refKey: 'dressMeRef' as const,
    titleDe: '✦ Dress Me',
    titleEn: '✦ Dress Me',
    descDe: 'Drück diesen Button — deine KI erstellt sofort ein perfektes Outfit, passend zum Anlass!',
    descEn: 'Press this button — your AI instantly creates a perfect outfit!',
    tooltipPos: 'above' as const,
  },
]

interface Props {
  categoryRef: RefObject<HTMLDivElement | null>
  weatherToggleRef: RefObject<HTMLDivElement | null>
  statsRef: RefObject<HTMLDivElement | null>
  occasionRef: RefObject<HTMLDivElement | null>
  dressMeRef: RefObject<HTMLButtonElement | null>
  itemCount: number
  userId: string | null
  ready?: boolean
}

export default function WelcomeOverlay({ categoryRef, weatherToggleRef, statsRef, occasionRef, dressMeRef, itemCount, userId, ready = false }: Props) {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const { theme } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'

  const card   = isDark ? '#1D1D20' : '#ffffff'
  const border = isDark ? '#2a2a2e' : '#E7E2D5'
  const text   = isDark ? '#F5F3EE' : '#24211B'
  const muted  = isDark ? '#9a978f' : '#8C8776'
  const accent = isDark ? '#5C82A0' : '#355C7D'

const refs = { categoryRef, weatherToggleRef, statsRef, occasionRef, dressMeRef }

useEffect(() => {
  if (itemCount < 3 || !ready || !userId) return
  const seen = localStorage.getItem('kw_welcome_seen_' + userId)
  if (!seen) {
    setShow(true)
  }
}, [itemCount, ready, userId])

  useEffect(() => {
    if (!show) return
    setTimeout(() => measureStep(step), 300)
  }, [show, step])

  function measureStep(s: number) {
    const refKey = STEPS[s].refKey
    const el = refs[refKey]?.current
    if (!el) {
      // Fallback — zeige Tooltip in der Mitte
      setRect({
        top: window.innerHeight / 2,
        left: 16,
        width: window.innerWidth - 32,
        height: 56,
      })
      return
    }
    // Scroll zum Element
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }, 400)
  }

  function finish() {
    if (userId) localStorage.setItem('kw_welcome_seen_' + userId, 'true')
    setShow(false)
  }

  function next() {
    if (step < STEPS.length - 1) {
      setRect(null)
      setTimeout(() => setStep(s => s + 1), 200)
    } else {
      finish()
    }
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const PAD = 10

  function getTooltipStyle(): React.CSSProperties {
    if (!rect) return { display: 'none' }
    const TIP_W = Math.min(300, window.innerWidth - 32)
    let left = rect.left + rect.width / 2 - TIP_W / 2
    left = Math.max(16, Math.min(window.innerWidth - TIP_W - 16, left))
    if (current.tooltipPos === 'above') {
      return { position: 'fixed', top: Math.max(16, rect.top - 200), left, width: TIP_W, zIndex: 10001 }
    } else {
      return { position: 'fixed', top: Math.min(window.innerHeight - 220, rect.top + rect.height + 12), left, width: TIP_W, zIndex: 10001 }
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay mit Loch */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={next}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'pointer' }}
          >
            {rect && (
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <mask id="kw-hole">
                    <rect width="100%" height="100%" fill="white" />
                    <rect x={rect.left - PAD} y={rect.top - PAD} width={rect.width + PAD * 2} height={rect.height + PAD * 2} rx="16" fill="black" />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#kw-hole)" />
              </svg>
            )}
          </motion.div>

          {/* Spotlight Ring */}
          {rect && (
            <motion.div
              key={`spot-${step}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: rect.top - PAD, left: rect.left - PAD,
                width: rect.width + PAD * 2, height: rect.height + PAD * 2,
                borderRadius: '18px', border: `2px solid ${accent}`,
                boxShadow: `0 0 0 4px ${accent}20, 0 0 24px ${accent}60`,
                zIndex: 10000, pointerEvents: 'none',
              }}
            />
          )}

          {/* Puls */}
          {rect && (
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{
                position: 'fixed',
                top: rect.top - PAD, left: rect.left - PAD,
                width: rect.width + PAD * 2, height: rect.height + PAD * 2,
                borderRadius: '18px', border: `2px solid ${accent}`,
                zIndex: 10000, pointerEvents: 'none',
              }}
            />
          )}

          {/* Tooltip */}
          {rect && (
            <motion.div
              key={`tip-${step}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={getTooltipStyle()}
            >
              {current.tooltipPos === 'above' && (
                <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: `10px solid ${card}`, position: 'absolute', bottom: -9, left: '50%', transform: 'translateX(-50%)' }} />
              )}
              {current.tooltipPos === 'below' && (
                <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: `10px solid ${card}`, position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)' }} />
              )}

              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '18px 20px', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.8)' : `0 8px 40px ${accent}25` }}>

                {/* Progress */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                  {STEPS.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= step ? accent : border, transition: 'background 0.3s' }} />
                  ))}
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 800, color: text, marginBottom: '7px', letterSpacing: '-0.02em', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                  {locale === 'de' ? current.titleDe : current.titleEn}
                </h3>
                <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '16px', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                  {locale === 'de' ? current.descDe : current.descEn}
                </p>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={(e) => { e.stopPropagation(); finish() }}
                    style={{ fontSize: '12px', color: muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", padding: '4px 0', whiteSpace: 'nowrap' as const }}>
                    {locale === 'de' ? 'Überspringen' : 'Skip'}
                  </button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={(e) => { e.stopPropagation(); next() }}
                    style={{ flex: 1, background: `linear-gradient(135deg, #7FA98E, ${accent})`, border: 'none', borderRadius: '12px', padding: '11px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: `0 4px 16px ${accent}40`, letterSpacing: '-0.01em' }}>
                    {isLast ? (locale === 'de' ? "Los geht's 🚀" : "Let's go 🚀") : (locale === 'de' ? 'Weiter →' : 'Next →')}
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