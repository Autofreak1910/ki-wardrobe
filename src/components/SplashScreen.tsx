'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onDone, isPremium = false }: { onDone: () => void; isPremium?: boolean }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)

const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => { setDone(true); setTimeout(onDone, 400) }, 400)
          return 100
        }
        return prev + Math.random() * 11 + 5
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // An die echten App-Hintergrundfarben angleichen (kein weisser Bruch zum iOS-Splash)
  const bg = isDark ? '#080c18' : '#f0f4ff'
  const fg = isDark ? '#e8eeff' : '#0a1628'
  const sub = isDark ? '#4d6080' : '#6b7fa8'
  const bar = isDark ? '#1a2540' : '#dde3f5'

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: bg,
            display: 'flex', flexDirection: 'column' as const,
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: '72px', height: '72px', borderRadius: '20px',
              overflow: 'hidden', marginBottom: '20px',
              boxShadow: isDark
                ? '0 0 0 1px #27272a, 0 8px 24px rgba(0,0,0,0.5)'
                : '0 0 0 1px #e4e4e7, 0 8px 24px rgba(0,0,0,0.08)',
            }}
          >
            <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '26px', fontWeight: 400,
              color: fg, marginBottom: '4px', letterSpacing: '-0.02em',
            }}
          >
            Ki<em>Wardrobe</em>
          </motion.p>

        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ fontSize: '13px', color: sub, marginBottom: isPremium ? '16px' : '40px', letterSpacing: '0.02em' }}
          >
            Your AI Stylist
          </motion.p>

          {isPremium && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: '32px' }}
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                borderRadius: '100px', padding: '6px 16px',
                boxShadow: '0 4px 16px rgba(251,191,36,0.4)',
              }}>
                <span style={{ fontSize: '12px' }}>✦</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>PRO MEMBER</span>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            style={{ width: '120px' }}
          >
            <div style={{
              height: '2px', background: bar,
              borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '2px',
                width: `${Math.min(progress, 100)}%`,
                transition: 'width 0.1s linear',
                background: isPremium ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : '#0ea472',
              }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}