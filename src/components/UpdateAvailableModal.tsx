'use client'

import { motion, AnimatePresence } from 'framer-motion'

export default function UpdateAvailableModal({
  open,
  onUpdate,
  locale,
  theme,
}: {
  open: boolean
  onUpdate: () => void
  locale: string
  theme: {
    card: string
    border: string
    text: string
    muted: string
    accent: string
    sageGradient: string
  }
}) {
  const { card, border, text, muted, sageGradient } = theme
  const isDe = locale === 'de'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          style={{
            position: 'fixed', top: '16px', left: '16px', right: '16px',
            margin: '0 auto', maxWidth: '380px', zIndex: 999999,
            background: card, border: `1px solid ${border}`,
            borderRadius: '18px', padding: '16px 18px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            fontFamily: "'Poppins', 'Inter', sans-serif",
            display: 'flex', alignItems: 'center', gap: '12px',
          }}
        >
          <div style={{ fontSize: '24px', flexShrink: 0 }}>✨</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: text, marginBottom: '2px' }}>
              {isDe ? 'Update verfügbar' : 'Update available'}
            </p>
            <p style={{ fontSize: '11.5px', color: muted, lineHeight: 1.4 }}>
              {isDe ? 'Neue Funktionen warten auf dich' : 'New features are waiting for you'}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onUpdate}
            style={{
              flexShrink: 0, padding: '9px 16px', borderRadius: '100px', border: 'none',
              background: sageGradient, color: '#fff', fontSize: '12.5px', fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif",
              whiteSpace: 'nowrap' as const,
            }}
          >
            {isDe ? 'Aktualisieren' : 'Update'}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}