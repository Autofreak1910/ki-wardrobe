'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme } = useTheme()
  const locale = useLocale()
  const supabase = createClient()
  const isDark = theme === 'dark'
  const [withdrawalConsent, setWithdrawalConsent] = useState(false)

  const bg     = isDark ? '#161616' : '#F2EFE7'
  const card   = isDark ? '#1D1D20' : '#ffffff'
  const border = isDark ? '#2a2a2e' : '#E7E2D5'
  const text   = isDark ? '#F5F3EE' : '#24211B'
  const muted  = isDark ? '#9a978f' : '#8C8776'
  const gold   = isDark ? '#E5B45B' : '#C9963C'

  async function startCheckout() {
    if (!withdrawalConsent) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, userEmail: session.user.email, locale }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', background: bg, border: `1px solid ${border}`, borderRadius: '28px', padding: '28px 20px 32px' }}>

            <p style={{ fontSize: '11px', fontWeight: 700, color: muted, letterSpacing: '0.12em', textTransform: 'uppercase' as const, textAlign: 'center' as const, marginBottom: '20px' }}>
              {locale === 'de' ? 'Wähle deinen Plan' : 'Choose your plan'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${border}`, borderRadius: '18px', padding: '16px 14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: muted, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>FREE</p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: text, letterSpacing: '-0.04em', marginBottom: '2px' }}>€0</p>
                <p style={{ fontSize: '11px', color: muted, marginBottom: '12px' }}>{locale === 'de' ? 'für immer kostenlos' : 'free forever'}</p>
                <div style={{ height: '1px', background: border, marginBottom: '12px' }} />
             {[
                  locale === 'de' ? '3 Outfits pro Woche' : '3 outfits per week',
                  locale === 'de' ? 'Max. 20 Kleidungsstücke' : 'Max. 20 items',
                  locale === 'de' ? 'Max. 5 gespeicherte Outfits' : 'Max. 5 saved outfits',
                  locale === 'de' ? '2 Virtual Try-Ons/Monat' : '2 virtual try-ons/month',
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: muted }}>○</span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: text }}>{t}</p>
                  </div>
                ))}
              </div>

              <motion.div whileTap={{ scale: 0.98 }} onClick={startCheckout}
                style={{ background: `linear-gradient(160deg, ${gold}, #E8B45E)`, borderRadius: '18px', padding: '16px 14px', cursor: 'pointer' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(36,33,27,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>PRO</p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#24211B', letterSpacing: '-0.04em', marginBottom: '2px' }}>€4,99</p>
                <p style={{ fontSize: '11px', color: 'rgba(36,33,27,0.7)', marginBottom: '12px' }}>{locale === 'de' ? 'pro Monat' : 'per month'}</p>
                <div style={{ height: '1px', background: 'rgba(36,33,27,0.2)', marginBottom: '12px' }} />
              {[
                  '14 Outfits/' + (locale === 'de' ? 'Woche' : 'week'),
                  locale === 'de' ? 'Unbegrenzt Kleidung' : 'Unlimited items',
                  locale === 'de' ? 'Unbegrenzt speichern' : 'Unlimited saves',
                  '6× Try-On/' + (locale === 'de' ? 'Woche' : 'week'),
                  'Style DNA',
                  locale === 'de' ? 'Mehrfach-Upload' : 'Multi-upload',
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#24211B' }}>✦</span>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#24211B' }}>{t}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={withdrawalConsent} onChange={e => setWithdrawalConsent(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '1px', flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ fontSize: '12px', color: muted, lineHeight: 1.5 }}>
                {locale === 'de'
                  ? 'Ich stimme zu, dass KiWardrobe Pro sofort nach Zahlung freigeschaltet wird, und verliere dadurch mein 14-tägiges Widerrufsrecht.'
                  : 'I agree that KiWardrobe Pro will be activated immediately upon payment, and lose my 14-day right of withdrawal.'}
              </span>
            </label>

            <motion.button whileTap={withdrawalConsent ? { scale: 0.97 } : {}}
              disabled={!withdrawalConsent} onClick={startCheckout}
              style={{ width: '100%', padding: '15px', background: withdrawalConsent ? `linear-gradient(135deg, ${gold}, #E8B45E)` : (isDark ? '#1D1D20' : '#EDE7D8'), border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, color: withdrawalConsent ? '#24211B' : muted, cursor: withdrawalConsent ? 'pointer' : 'not-allowed', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
              {locale === 'de' ? '✦ Für €4,99/Monat abonnieren' : '✦ Subscribe for €4.99/month'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}