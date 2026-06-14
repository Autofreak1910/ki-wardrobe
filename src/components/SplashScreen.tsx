'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => { setDone(true); setTimeout(onDone, 400) }, 150)
          return 100
        }
        return prev + Math.random() * 18 + 8
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const bg = isDark ? '#0a0a0a' : '#fafafa'
  const fg = isDark ? '#fafafa' : '#09090b'
  const sub = isDark ? '#71717a' : '#71717a'
  const bar = isDark ? '#27272a' : '#e4e4e7'

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
            style={{ fontSize: '13px', color: sub, marginBottom: '40px', letterSpacing: '0.02em' }}
          >
            Your AI Stylist
          </motion.p>

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
                height: '100%', background: '#0ea472',
                borderRadius: '2px',
                width: `${Math.min(progress, 100)}%`,
                transition: 'width 0.1s linear',
              }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}