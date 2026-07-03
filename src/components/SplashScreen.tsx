'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onDone, isPremium = false }: { onDone: () => void; isPremium?: boolean }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDone(true)
      setTimeout(onDone, 500)
    }, 2200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(160deg, #061712 0%, #0a2018 50%, #061712 100%)',
            display: 'flex', flexDirection: 'column' as const,
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: "'DM Sans', sans-serif",
          }}>

          {/* Glow Orbs */}
          <div style={{ position: 'absolute', top: '-80px', left: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,164,114,0.22), transparent 70%)', filter: 'blur(50px)', animation: 'float1 6s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '80px', right: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(8,80,65,0.28), transparent 70%)', filter: 'blur(50px)', animation: 'float2 8s ease-in-out infinite' }} />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            style={{ position: 'relative' as const, marginBottom: '32px' }}>
            <div style={{ position: 'absolute', inset: '-16px', borderRadius: '38px', background: 'radial-gradient(circle, rgba(14,164,114,0.35), transparent 70%)', filter: 'blur(20px)', animation: 'pulse 2.5s ease-in-out infinite' }} />
            <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100px', height: '100px', borderRadius: '26px', position: 'relative' as const, boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,164,114,0.25)' }} />
            {[
              { top: '-10px', left: '80%', delay: 0.7 },
              { top: '70%', left: '-12px', delay: 0.85 },
              { top: '85%', left: '75%', delay: 1.0 },
              { top: '5%', left: '-8px', delay: 0.9 },
            ].map((p, i) => (
              <motion.div key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0] }}
                transition={{ delay: p.delay, duration: 0.7 }}
                style={{ position: 'absolute' as const, width: '7px', height: '7px', borderRadius: '50%', background: '#0ea472', top: p.top, left: p.left, boxShadow: '0 0 8px #0ea472' }} />
            ))}
          </motion.div>

          {/* Brand */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: '34px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.04em', marginBottom: '8px' }}>
            Ki<span style={{ fontStyle: 'italic', color: '#0ea472' }}>Wardrobe</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            style={{ fontSize: '12px', color: 'rgba(159,225,203,0.6)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
            Your AI Stylist
          </motion.p>

          {isPremium && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.4, type: 'spring', damping: 12 }}
              style={{ marginTop: '16px', background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))', border: '1px solid rgba(251,191,36,0.4)', borderRadius: '100px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#fbbf24' }}>✦</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.08em' }}>PRO MEMBER</span>
            </motion.div>
          )}

          {/* Loading Dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
            style={{ position: 'absolute' as const, bottom: '70px', display: 'flex', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.7, 1, 0.7] }}
                transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0ea472' }} />
            ))}
          </motion.div>

          <style>{`
            @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(22px,16px)} }
            @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,14px)} }
            @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}