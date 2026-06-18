'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

export default function WelcomeAnimation({ username, onDone }: { username?: string; onDone: () => void }) {
  const [visible, setVisible] = useState(true)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const bg     = isDark ? '#080c18' : '#f0f4ff'
  const text   = isDark ? '#e8eeff' : '#0a1628'
  const muted  = isDark ? '#4d6080' : '#6b7fa8'
  const accent = isDark ? '#4d7eff' : '#3b6bff'

  const locale = typeof navigator !== 'undefined' && navigator.language.startsWith('de') ? 'de' : 'en'

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 500)
    }, 2600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: bg,
            display: 'flex', flexDirection: 'column' as const,
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif",
            overflow: 'hidden',
          }}
          onClick={() => { setVisible(false); setTimeout(onDone, 500) }}
        >
          {/* Glow background */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
              background: `radial-gradient(circle, ${accent}25, transparent 70%)`,
              filter: 'blur(40px)',
            }}
          />

          {/* Konfetti burst */}
          {[...Array(20)].map((_, i) => {
            const angle = (i * 18) * Math.PI / 180
            const distance = 140 + Math.random() * 100
            const colors = [accent, '#6b9fff', '#a855f7', '#0ea472', '#fbbf24']
            return (
              <motion.div key={i}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  scale: [0, 1.3, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{ delay: 0.3 + i * 0.025, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  width: i % 3 === 0 ? '10px' : '7px',
                  height: i % 3 === 0 ? '10px' : '7px',
                  borderRadius: i % 2 === 0 ? '50%' : '3px',
                  background: colors[i % colors.length],
                }}
              />
            )
          })}

          {/* Logo reveal */}
          <motion.div
            initial={{ scale: 0, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 11, stiffness: 180, delay: 0.15 }}
            style={{
              width: '96px', height: '96px', borderRadius: '28px',
              overflow: 'hidden', marginBottom: '24px',
              boxShadow: `0 0 60px ${accent}60, 0 12px 40px rgba(0,0,0,0.25)`,
              position: 'relative', zIndex: 2,
            }}
          >
            <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: '14px', fontWeight: 600, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '8px', position: 'relative', zIndex: 2 }}
          >
            {locale === 'de' ? 'Willkommen bei' : 'Welcome to'}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.62, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '38px', fontWeight: 400,
              color: text, letterSpacing: '-0.03em',
              marginBottom: '14px', position: 'relative', zIndex: 2,
              textAlign: 'center' as const,
            }}
          >
            Ki<em style={{ color: accent }}>Wardrobe</em>
          </motion.h1>

          {username && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              style={{ fontSize: '15px', color: muted, position: 'relative', zIndex: 2 }}
            >
              {locale === 'de' ? `Schön, dass du da bist, ${username}! ✨` : `So glad you're here, ${username}! ✨`}
            </motion.p>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
            style={{ fontSize: '11px', color: muted, opacity: 0.5, position: 'absolute', bottom: '40px' }}
          >
            {locale === 'de' ? 'Tippen, um fortzufahren' : 'Tap to continue'}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}