'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // System-Theme erkennen — gleiches wie das statische iOS-Bild nutzt!
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setDone(true)
            setTimeout(onDone, 500)
          }, 200)
          return 100
        }
        return prev + Math.random() * 20 + 10
      })
    }, 110)
    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: isDark
              ? 'linear-gradient(145deg, #0a3d2b 0%, #0a2e3d 100%)'
              : 'linear-gradient(145deg, #0ea472 0%, #0891b2 100%)',
            display: 'flex', flexDirection: 'column' as const,
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

          {/* Icon — steht still wie im statischen Bild, kein Cut sichtbar */}
          <div style={{
            width: '96px', height: '96px', borderRadius: '26px',
            overflow: 'hidden', marginBottom: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            position: 'relative', zIndex: 2,
          }}>
            <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: "'DM Serif Display', serif", fontSize: '40px', fontWeight: 400, color: '#fff', marginBottom: '6px', lineHeight: 1, position: 'relative', zIndex: 2 }}
          >
            Ki<em>Wardrobe</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', marginBottom: '44px', position: 'relative', zIndex: 2 }}
          >
            Your AI Stylist
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{ width: '180px', position: 'relative', zIndex: 2 }}
          >
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{
                height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: '2px',
                width: `${Math.min(progress, 100)}%`, transition: 'width 0.12s ease',
              }} />
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' as const, letterSpacing: '0.08em' }}>
              {progress < 40 ? 'Loading...' : progress < 80 ? 'Almost ready...' : 'Starting...'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}