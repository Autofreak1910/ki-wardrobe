'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'

function WarningIcon({ size = 40, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
function CheckCircleIcon({ size = 40, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="8 12.5 11 15.5 16 9"/>
    </svg>
  )
}

type Step = 'confirm' | 'loading' | 'done' | 'error'

export default function CancelSubscriptionModal({
  open, onClose, onCancelled,
}: {
  open: boolean
  onClose: () => void
  onCancelled: (accessUntil: string) => void
}) {
  const [step, setStep] = useState<Step>('confirm')
  const [accessUntil, setAccessUntil] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const { theme } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'

  const bg     = isDark ? '#161616' : '#F2EFE7'
  const card   = isDark ? '#1D1D20' : '#ffffff'
  const border = isDark ? '#2a2a2e' : '#E7E2D5'
  const text   = isDark ? '#F5F3EE' : '#24211B'
  const muted  = isDark ? '#9a978f' : '#8C8776'
  const accent = isDark ? '#5C82A0' : '#355C7D'

  async function confirmCancel() {
    setStep('loading')
    try {
      const res = await fetch('/api/cancel-subscription', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setAccessUntil(data.accessUntil)
        setStep('done')
        onCancelled(data.accessUntil)
      } else {
        setErrorMsg(data.error ?? (locale === 'de' ? 'Unbekannter Fehler' : 'Unknown error'))
        setStep('error')
      }
    } catch (err) {
      setErrorMsg(String(err))
      setStep('error')
    }
  }

  function handleClose() {
    onClose()
    setTimeout(() => setStep('confirm'), 300)
  }

  const dateStr = accessUntil
    ? new Date(accessUntil).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={step === 'loading' ? undefined : handleClose}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '400px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '28px 24px', fontFamily: "'Poppins', 'Inter', sans-serif" }}>

            {step === 'confirm' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <WarningIcon size={40} color="#ef4444" />
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: text, textAlign: 'center' as const, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  {locale === 'de' ? 'Abo wirklich kündigen?' : 'Really cancel subscription?'}
                </h2>
                <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, textAlign: 'center' as const, marginBottom: '24px' }}>
                  {locale === 'de'
                    ? 'Dein Abo wird sofort so eingestellt, dass es NICHT mehr verlängert wird — es wird nie wieder etwas abgebucht. Du kannst KiWardrobe Pro aber weiterhin bis zum Ende der aktuellen Abrechnungsperiode nutzen. Eine anteilige Rückerstattung ist nicht möglich.'
                    : 'Your subscription will immediately be set to NOT renew — you will never be charged again. You can keep using KiWardrobe Pro until the end of your current billing period. No partial refund is possible.'}
                </p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={confirmCancel}
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '10px' }}>
                  {locale === 'de' ? 'Jetzt kündigen' : 'Cancel now'}
                </motion.button>
                <button onClick={handleClose}
                  style={{ width: '100%', padding: '11px', background: 'transparent', border: 'none', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                  {locale === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
              </>
            )}

            {step === 'loading' && (
              <div style={{ textAlign: 'center' as const, padding: '20px 0' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: accent, margin: '0 auto 16px' }} />
                <p style={{ fontSize: '14px', color: muted }}>{locale === 'de' ? 'Kündigung wird verarbeitet...' : 'Processing cancellation...'}</p>
              </div>
            )}

            {step === 'done' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <CheckCircleIcon size={40} color={accent} />
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, color: text, textAlign: 'center' as const, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  {locale === 'de' ? 'Abo gekündigt' : 'Subscription cancelled'}
                </h2>
                <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, textAlign: 'center' as const, marginBottom: '24px' }}>
                  {locale === 'de'
                    ? `Deine Kündigung ist bestätigt. Du kannst KiWardrobe Pro noch bis zum ${dateStr} nutzen, danach wird nichts mehr abgebucht.`
                    : `Your cancellation is confirmed. You can keep using KiWardrobe Pro until ${dateStr}, after which you won't be charged again.`}
                </p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                  style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: `linear-gradient(135deg, ${accent}, #7FA3C4)`, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                  {locale === 'de' ? 'Verstanden' : 'Got it'}
                </motion.button>
              </>
            )}

            {step === 'error' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <WarningIcon size={40} color="#ef4444" />
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: text, textAlign: 'center' as const, marginBottom: '10px' }}>
                  {locale === 'de' ? 'Kündigung fehlgeschlagen' : 'Cancellation failed'}
                </h2>
                <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, textAlign: 'center' as const, marginBottom: '20px' }}>
                  {errorMsg} — {locale === 'de' ? 'bitte versuch es erneut oder kontaktiere support@kiwardrobe.com' : 'please try again or contact support@kiwardrobe.com'}
                </p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={confirmCancel}
                  style={{ width: '100%', padding: '13px', borderRadius: '14px', border: 'none', background: `linear-gradient(135deg, ${accent}, #7FA3C4)`, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '8px' }}>
                  {locale === 'de' ? 'Erneut versuchen' : 'Try again'}
                </motion.button>
                <button onClick={handleClose}
                  style={{ width: '100%', padding: '11px', background: 'transparent', border: 'none', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                  {locale === 'de' ? 'Schließen' : 'Close'}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}