'use client'

import { motion, AnimatePresence } from 'framer-motion'

export default function ForceUpdateModal({
  open,
  version,
  notes,
  onUpdate,
  locale,
  theme,
}: {
  open: boolean
  version: string
  notes: string[]
  onUpdate: () => void
  locale: string
  theme: {
    bg: string
    card: string
    border: string
    text: string
    muted: string
    accent: string
    sageGradient: string
  }
}) {
  const { bg, card, border, text, muted, sageGradient } = theme
  const isDe = locale === 'de'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999999,
            background: bg,
            display: 'flex', flexDirection: 'column' as const,
            alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Poppins', 'Inter', sans-serif",
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            style={{
              width: '100%', maxWidth: '380px',
              background: card, border: `1px solid ${border}`,
              borderRadius: '28px', padding: '32px 26px',
              textAlign: 'center' as const,
              boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: '48px', marginBottom: '16px' }}
            >
              ✨
            </motion.div>

            <h2 style={{ fontSize: '21px', fontWeight: 800, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
              {isDe ? 'Neue Version verfügbar' : 'New version available'}
            </h2>
            <p style={{ fontSize: '12.5px', color: muted, marginBottom: '20px' }}>
              {isDe ? `Version ${version}` : `Version ${version}`}
            </p>

            {notes.length > 0 && (
              <div style={{ textAlign: 'left' as const, background: bg, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px 18px', marginBottom: '22px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: muted, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>
                  {isDe ? 'Was ist neu' : "What's new"}
                </p>
                {notes.map((note, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: i < notes.length - 1 ? '8px' : 0 }}>
                    <span style={{ color: '#7FA98E', fontSize: '13px', flexShrink: 0 }}>✓</span>
                    <p style={{ fontSize: '13px', color: text, lineHeight: 1.5 }}>{note}</p>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: '12px', color: muted, marginBottom: '18px', lineHeight: 1.5 }}>
              {isDe
                ? 'Du musst aktualisieren, um die App weiter zu nutzen.'
                : 'You need to update to keep using the app.'}
            </p>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onUpdate}
              style={{
                width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                background: sageGradient, color: '#fff', fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif",
                boxShadow: '0 6px 20px rgba(53,92,125,0.3)',
              }}
            >
              {isDe ? '✦ Jetzt aktualisieren' : '✦ Update now'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}