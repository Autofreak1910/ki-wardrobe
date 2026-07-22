'use client'

import { motion, AnimatePresence } from 'framer-motion'

type Theme = { card: string; border: string; text: string; muted: string; accent: string; sageGradient: string; isDark: boolean }

export default function AvatarPhotoGuide({
  open, onClose, locale, theme,
}: {
  open: boolean
  onClose: () => void
  locale: string
  theme: Theme
}) {
  const { card, border, text, muted, accent, sageGradient } = theme

 const points = locale === 'de'
    ? [
        { top: '6%', side: 'right' as const, label: 'Gesicht klar erkennbar' },
        { top: '38%', side: 'left' as const, label: 'Arme locker seitlich' },
        { top: '68%', side: 'right' as const, label: 'Ganzer Körper sichtbar' },
        { top: '96%', side: 'left' as const, label: 'Gerade stehen' },
      ]
    : [
        { top: '6%', side: 'right' as const, label: 'Face clearly visible' },
        { top: '38%', side: 'left' as const, label: 'Arms relaxed at sides' },
        { top: '68%', side: 'right' as const, label: 'Full body visible' },
        { top: '96%', side: 'left' as const, label: 'Stand up straight' },
      ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '420px', maxHeight: '92vh', overflowY: 'auto' as const, background: card, border: `1px solid ${border}`, borderRadius: '28px 28px 0 0', padding: '20px 20px 28px' }}>

            <div style={{ width: '36px', height: '4px', background: border, borderRadius: '2px', margin: '0 auto 16px' }} />

            <div style={{ textAlign: 'center' as const, marginBottom: '16px' }}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: text, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                📸 {locale === 'de' ? 'So klappt dein Avatar am besten' : 'How to get the best avatar'}
              </h2>
              <p style={{ fontSize: '13px', color: muted }}>
                {locale === 'de' ? 'Ein gutes Foto = ein realistisches Ergebnis' : 'A good photo = a realistic result'}
              </p>
            </div>

            {/* Bild mit Annotationen */}
          <div style={{ position: 'relative' as const, borderRadius: '18px', overflow: 'hidden', border: `1px solid ${border}`, marginBottom: '14px' }}>
              <img src="/avatar-example-pose.jpg" alt="Beispiel" style={{ width: '100%', display: 'block' }} />

              {points.map((p, i) => (
                <div key={i} style={{
                  position: 'absolute' as const, top: p.top,
                  [p.side]: '4%',
                  transform: 'translateY(-50%)',
                }}>
                  <div style={{
                    background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '10.5px', fontWeight: 700,
                    padding: '5px 10px', borderRadius: '100px', whiteSpace: 'nowrap' as const,
                    boxShadow: '0 3px 10px rgba(0,0,0,0.4)', border: `1.5px solid ${accent}`,
                  }}>
                    ✓ {p.label}
                  </div>
                </div>
              ))}

              <div style={{
                position: 'absolute' as const, top: '2%', left: '25%', width: '50%', height: '96%',
                border: `2.5px dashed ${accent}`, borderRadius: '10px', pointerEvents: 'none' as const,
              }} />
            </div>

            {/* Checklist */}
      <div style={{ background: `${accent}0d`, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '18px' }}>
              {(locale === 'de' ? [
                '📷 Lass dich von jemandem fotografieren, oder stell das Handy hin (Timer/Stativ) — kein Spiegel-Selfie, da wirkt alles seitenverkehrt und das Ergebnis wird schlechter',
                'Ganzkörper — Kopf bis Füße muss sichtbar sein',
                'Gerade und aufrecht stehen, kein Winkel von oben/unten',
                'Arme locker seitlich, nichts vor dem Körper halten',
                'Helles, gleichmäßiges Licht — keine Rückenbeleuchtung',
                'Einfacher, ruhiger Hintergrund ohne viel Durcheinander',
              ] : [
                '📷 Have someone take the photo, or prop your phone up (timer/tripod) — not a mirror selfie, it comes out flipped and lowers the result quality',
                'Full body — head to feet must be visible',
                'Stand straight, no angle from above or below',
                'Arms relaxed at your sides, nothing in front of your body',
                'Bright, even lighting — avoid backlighting',
                'Simple, uncluttered background',
              ]).map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: i < 5 ? '8px' : 0 }}>
                  <span style={{ color: accent, fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '12.5px', color: text, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>

            {/* Beispiel-Ergebnis: Foto rein -> Avatar raus */}
            <p style={{ fontSize: '11px', fontWeight: 800, color: accent, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '8px', textAlign: 'center' as const }}>
              {locale === 'de' ? 'Beispiel: Das kommt dabei raus' : 'Example: This is what you get'}
            </p>
            <div style={{ borderRadius: '18px', overflow: 'hidden', border: `1px solid ${border}`, marginBottom: '20px' }}>
              <img src="/avatar-example-result.jpg" alt="Beispiel-Ergebnis" style={{ width: '100%', display: 'block' }} />
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
              style={{ width: '100%', background: sageGradient, border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
              {locale === 'de' ? 'Verstanden, los geht\'s ✦' : 'Got it, let\'s go ✦'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}