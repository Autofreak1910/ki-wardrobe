'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
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
        return prev + Math.random() * 22 + 12
      })
    }, 100)
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
            background: '#0ea472',
            display: 'flex', flexDirection: 'column' as const,
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Icon — KEINE Eingangsanimation, steht schon da wie im statischen Splash */}
          <div style={{
            width: '96px', height: '96px', borderRadius: '26px',
            overflow: 'hidden', marginBottom: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Name fadet sanft dazu */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: "'DM Serif Display', serif", fontSize: '38px', fontWeight: 400, color: '#fff', marginBottom: '6px', lineHeight: 1 }}
          >
            Ki<em>Wardrobe</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', marginBottom: '40px' }}
          >
            Your AI Stylist
          </motion.p>

          {/* Ladebalken */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{ width: '180px' }}
          >
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.25)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: '#fff',
                borderRadius: '2px',
                width: `${Math.min(progress, 100)}%`,
                transition: 'width 0.12s ease',
              }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}