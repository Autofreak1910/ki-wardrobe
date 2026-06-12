'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<'logo' | 'loading' | 'done'>('logo')
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    // Phase 1: Logo erscheint
setTimeout(() => setPhase('loading'), 400)

    // Progress Bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setPhase('done')
            setTimeout(onDone, 600)
          }, 300)
          return 100
        }
        return prev + Math.random() * 20 + 10
      })
    }, 120)

    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
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
          {/* Background circles */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            style={{ textAlign: 'center', marginBottom: '48px' }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
              style={{
                width: '96px', height: '96px', borderRadius: '26px',
                overflow: 'hidden', margin: '0 auto 24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{ fontFamily: "'DM Serif Display', serif", fontSize: '42px', fontWeight: 400, color: '#fff', marginBottom: '8px', lineHeight: 1 }}
            >
              Ki<em>Wardrobe</em>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}
            >
              Your AI Stylist
            </motion.p>
          </motion.div>

          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: phase === 'loading' ? 1 : 0, y: phase === 'loading' ? 0 : 20 }}
            transition={{ duration: 0.4 }}
            style={{ width: '200px' }}
          >
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
              <motion.div
                style={{
                  height: '100%',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '2px',
                  width: `${Math.min(progress, 100)}%`,
                  transition: 'width 0.15s ease',
                }}
              />
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