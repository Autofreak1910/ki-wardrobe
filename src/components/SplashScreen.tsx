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

 // Gruener Hintergrund passend zum nativen iOS-Splash (#0ea472) — nahtloser Uebergang
  const bg = '#0ea472'
  const fg = '#ffffff'
  const sub = 'rgba(255,255,255,0.8)'
  const bar = 'rgba(255,255,255,0.25)'

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
        <div
            style={{
              width: '88px', height: '88px', borderRadius: '24px',
              overflow: 'hidden', marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
          >
            <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

 <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '28px', fontWeight: 400,
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