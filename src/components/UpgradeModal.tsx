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
            style={{ width: '100%', maxWidth: '480px', background: bg, border: `1px solid ${border}`, borderRadius: '28px', padding: '28px 20px 32px', position: 'relative' as const }}>

            <button onClick={onClose} aria-label={locale === 'de' ? 'Schließen' : 'Close'}
              style={{ position: 'absolute' as const, top: '16px', right: '16px', width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${border}`, background: card, color: muted, fontSize: '14px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontFamily: "'Poppins', 'Inter', sans-serif" }}>
              ✕
            </button>

            <p style={{ fontSize: '11px', fontWeight: 700, color: muted, letterSpacing: '0.12em', textTransform: 'uppercase' as const, textAlign: 'center' as const, marginBottom: '4px' }}>
              {locale === 'de' ? 'Wähle deinen Plan' : 'Choose your plan'}
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: text, textAlign: 'center' as const, marginBottom: '20px' }}>
              {locale === 'de' ? 'Weniger als ein Kaffee — 7× mehr Outfits' : 'Less than a coffee — 7× more outfits'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {/* Free */}
              <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${border}`, borderRadius: '18px', padding: '16px 14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: muted, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>FREE</p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: text, letterSpacing: '-0.04em', marginBottom: '2px' }}>€0</p>
                <p style={{ fontSize: '11px', color: muted, marginBottom: '12px' }}>{locale === 'de' ? 'für immer kostenlos' : 'free forever'}</p>
                <div style={{ height: '1px', background: border, marginBottom: '12px' }} />
           {[
                  { title: locale === 'de' ? '3 Outfits pro Woche' : '3 outfits per week', sub: '', missing: false },
                  { title: locale === 'de' ? 'Max. 20 Kleidungsstücke' : 'Max. 20 items', sub: '', missing: false },
                  { title: locale === 'de' ? 'Max. 5 Outfits speichern' : 'Max. 5 saved outfits', sub: '', missing: false },
                  { title: locale === 'de' ? '2 Virtual Try-Ons' : '2 virtual try-ons', sub: locale === 'de' ? 'pro Monat' : 'per month', missing: false },
                  { title: locale === 'de' ? 'Kein Style DNA' : 'No Style DNA', sub: '', missing: true },
                  { title: locale === 'de' ? 'Kein Mehrfach-Upload' : 'No multi-upload', sub: '', missing: true },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: f.missing ? '#ef4444' : muted, flexShrink: 0, marginTop: '2px' }}>{f.missing ? '✕' : '○'}</span>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: f.missing ? '#ef4444' : text }}>{f.title}</p>
                      {f.sub && <p style={{ fontSize: '11px', color: muted }}>{f.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pro */}
              <motion.div whileTap={{ scale: 0.98 }} onClick={startCheckout}
                style={{ background: `linear-gradient(160deg, ${gold}, #E8B45E)`, borderRadius: '18px', padding: '16px 14px', cursor: 'pointer', position: 'relative' as const, overflow: 'hidden', boxShadow: `0 8px 32px ${gold}50` }}>
                <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: '#fff', borderRadius: '0 0 8px 8px', padding: '2px 10px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 800, color: gold, letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
                    {locale === 'de' ? 'Empfohlen' : 'Recommended'}
                  </p>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(36,33,27,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>PRO</p>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: '#24211B', letterSpacing: '-0.04em', marginBottom: '2px' }}>€4,99</p>
                  <p style={{ fontSize: '11px', color: 'rgba(36,33,27,0.7)', marginBottom: '2px' }}>{locale === 'de' ? 'pro Monat' : 'per month'}</p>
                  <p style={{ fontSize: '10px', color: 'rgba(36,33,27,0.6)', fontStyle: 'italic', marginBottom: '12px' }}>
                    {locale === 'de' ? 'nur 16 Cent/Tag' : 'just 16¢/day'}
                  </p>
       <div style={{ height: '1px', background: 'rgba(36,33,27,0.2)', marginBottom: '12px' }} />
            {[
                    { title: '14 Outfits', sub: locale === 'de' ? 'pro Woche' : 'per week', isNew: false },
                    { title: locale === 'de' ? 'Unbegrenzt Kleidung' : 'Unlimited items', sub: '', isNew: false },
                    { title: locale === 'de' ? 'Unbegrenzt speichern' : 'Unlimited saved', sub: '', isNew: false },
                    { title: locale === 'de' ? '6× Virtual Try-On' : '6× Virtual Try-On', sub: locale === 'de' ? 'pro Woche' : 'per week', isNew: false },
                    { title: 'Style DNA', sub: locale === 'de' ? 'KI Stil-Analyse' : 'AI style analysis', isNew: true },
                    { title: locale === 'de' ? 'Mehrfach-Upload' : 'Multi-upload', sub: locale === 'de' ? 'Bis zu 10 Fotos · 3× pro Woche' : 'Up to 10 photos · 3× per week', isNew: true },
                    { title: locale === 'de' ? '🧊 Streak-Schutz' : '🧊 Streak Freeze', sub: locale === 'de' ? '1× kostenlose Wiederherstellung/Monat' : '1× free restore per month', isNew: true },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '8px', background: f.isNew ? 'rgba(36,33,27,0.08)' : 'transparent', borderRadius: '6px', padding: f.isNew ? '4px 6px' : '0', marginLeft: f.isNew ? '-6px' : '0', marginRight: f.isNew ? '-6px' : '0' }}>
                      <span style={{ fontSize: '11px', color: f.isNew ? '#24211B' : '#24211B', flexShrink: 0, marginTop: '2px' }}>{f.isNew ? '🆕' : '✦'}</span>
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#24211B' }}>{f.title}</p>
                        {f.sub && <p style={{ fontSize: '10px', color: 'rgba(36,33,27,0.7)' }}>{f.sub}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={withdrawalConsent} onChange={e => setWithdrawalConsent(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '1px', flexShrink: 0, accentColor: gold, cursor: 'pointer' }} />
              <span style={{ fontSize: '12px', color: muted, lineHeight: 1.5 }}>
                {locale === 'de'
                  ? 'Ich stimme zu, dass KiWardrobe Pro sofort nach Zahlung freigeschaltet wird, und bestätige, dass ich dadurch mein 14-tägiges Widerrufsrecht verliere.'
                  : 'I agree that KiWardrobe Pro will be activated immediately upon payment, and confirm that I thereby lose my 14-day right of withdrawal.'}
              </span>
            </label>

            <motion.button whileTap={withdrawalConsent ? { scale: 0.97 } : {}}
              disabled={!withdrawalConsent} onClick={startCheckout}
              style={{ width: '100%', padding: '15px', background: withdrawalConsent ? `linear-gradient(135deg, ${gold}, #E8B45E)` : (isDark ? '#1D1D20' : '#EDE7D8'), border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, color: withdrawalConsent ? '#24211B' : muted, cursor: withdrawalConsent ? 'pointer' : 'not-allowed', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: withdrawalConsent ? `0 4px 20px ${gold}40` : 'none', marginBottom: '10px', transition: 'all 0.2s' }}>
              {locale === 'de' ? '✦ Jetzt freischalten — €4,99/Monat' : '✦ Unlock now — €4.99/month'}
            </motion.button>

            <p style={{ textAlign: 'center' as const, fontSize: '11px', color: muted }}>
              {locale === 'de' ? 'Jederzeit kündbar · Sofort freigeschaltet' : 'Cancel anytime · Instant access'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}