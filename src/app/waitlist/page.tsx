'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FOUNDER_SPOTS = 75
const EARLY_SPOTS = 500

const content = {
  de: {
    badge: 'Bald verfügbar',
    headline: 'Nie wieder ratlos vorm Kleiderschrank',
    sub: 'Deine KI checkt Wetter und Kleiderschrank und stellt dir jeden Morgen ein Outfit zusammen.',
    placeholder: 'name@email.com',
    cta: 'Auf die Warteliste',
    ctaLoading: 'Wird eingetragen...',
    success: 'Du bist auf der Liste ✓',
    error: 'Gib eine gültige E-Mail ein',
    alreadyOn: 'Diese E-Mail ist schon dabei',
    founderTitle: '🏆 Erste 75: Founder-Status',
    founderPerk: '2 Monate Premium gratis + 20% Rabatt für immer',
    earlyTitle: '⚡ Platz 76–500: Early Bird',
    earlyPerk: '3 Tage gratis testen, dann nur 2,99€ im 1. Monat',
    noteAfter: 'Das Angebot gilt nur für Anmeldungen über diese Warteliste.',
    spotsLeft: (left: number) => left > 0 ? `Noch ${left} Founder-Plätze frei` : 'Founder-Plätze vergeben — jetzt Early Bird sichern',
    features: ['KI-Outfits', 'Wetter-Match', 'Virtual Try-On'],
    legalLink: 'Impressum & Datenschutz',
    legalTitle: 'Impressum & Datenschutz',
    legalIntro: 'Diese Warteliste wird betrieben von KiWardrobe.',
    legalDataTitle: 'Welche Daten werden gespeichert?',
    legalData: 'Wir speichern ausschließlich deine E-Mail-Adresse und den Zeitpunkt deiner Anmeldung.',
    legalPurposeTitle: 'Wofür werden die Daten genutzt?',
    legalPurpose: 'Wir nutzen deine E-Mail-Adresse, um dich zu benachrichtigen, sobald KiWardrobe verfügbar ist, und um dir dein Willkommensangebot zuzuordnen. Das Angebot gilt nur, wenn du dich mit derselben E-Mail-Adresse registrierst, mit der du dich hier angemeldet hast.',
    legalRightsTitle: 'Deine Rechte',
    legalRights: 'Du kannst jederzeit die Löschung deiner Daten verlangen, indem du uns kontaktierst. Deine Daten werden nicht an Dritte weitergegeben oder zu anderen Zwecken verwendet.',
    legalContactTitle: 'Kontakt',
    legalContact: 'business@kiwardrobe.com',
    legalClose: 'Schließen',
  },
  en: {
    badge: 'Coming soon',
    headline: 'Never stand confused in front of your closet again',
    sub: 'Your AI checks the weather and your wardrobe and puts together an outfit every morning.',
    placeholder: 'name@email.com',
    cta: 'Join the waitlist',
    ctaLoading: 'Joining...',
    success: "You're on the list ✓",
    error: 'Enter a valid email',
    alreadyOn: "That email's already on the list",
    founderTitle: '🏆 First 75: Founder status',
    founderPerk: '2 months Premium free + 20% off forever',
    earlyTitle: '⚡ Spot 76–500: Early Bird',
    earlyPerk: '3 days free trial, then just €2.99 for month 1',
    noteAfter: 'This offer only applies to signups via this waitlist.',
    spotsLeft: (left: number) => left > 0 ? `${left} Founder spots left` : 'Founder spots taken — grab Early Bird now',
    features: ['AI outfits', 'Weather match', 'Virtual try-on'],
    legalLink: 'Legal and privacy',
    legalTitle: 'Legal and privacy',
    legalIntro: 'This waitlist is operated by KiWardrobe.',
    legalDataTitle: 'What data do we store?',
    legalData: 'We only store your email address and the time you signed up.',
    legalPurposeTitle: 'What do we use it for?',
    legalPurpose: 'We use your email address to notify you when KiWardrobe launches and to match your welcome offer. The offer only applies if you register with the same email you used here.',
    legalRightsTitle: 'Your rights',
    legalRights: 'You can request deletion of your data at any time by contacting us. Your data is never shared with third parties or used for other purposes.',
    legalContactTitle: 'Contact',
    legalContact: 'business@kiwardrobe.com',
    legalClose: 'Close',
  },
}

export default function WaitlistPage() {
  const [lang, setLang] = useState<'de' | 'en'>('de')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'already'>('idle')
  const [count, setCount] = useState(0)
  const [showLegal, setShowLegal] = useState(false)
  const t = content[lang]

  useEffect(() => {
    fetch('/api/waitlist')
      .then(res => res.json())
      .then(data => setCount(data.count ?? 0))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) {
      setStatus('error')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.alreadyExists) {
          setStatus('already')
        } else {
          setStatus('success')
          setCount(c => c + 1)
        }
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  // Sage/Blau-Farbschema wie der Rest der App
  const bg          = '#F2EFE7'
  const card        = '#ffffff'
  const border      = '#E7E2D5'
  const text        = '#24211B'
  const muted       = '#8C8776'
  const accent      = '#355C7D'
  const secondary   = '#F7F4EC'
  const sageGradient = 'linear-gradient(135deg, #7FA98E, #355C7D)'
  const founderGold = 'linear-gradient(135deg, #C9963C, #B9852E)'

  const founderLeft = Math.max(0, FOUNDER_SPOTS - count)
  const totalLeft = Math.max(0, EARLY_SPOTS - count)
  const progressPct = Math.min(100, (count / EARLY_SPOTS) * 100)
  const isFounderPhase = count < FOUNDER_SPOTS

  return (
    <div style={{
      minHeight: '100dvh',
      background: bg,
      display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center' as const, padding: '40px 24px',
      fontFamily: "'Poppins', 'Inter', sans-serif",
      position: 'relative' as const, overflow: 'hidden',
    }}>

      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: '420px', height: '420px', borderRadius: '50%', background: 'rgba(53,92,125,0.1)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '60px', left: '-100px', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(127,169,142,0.14)', filter: 'blur(90px)' }} />
      </div>

      <button onClick={() => setLang(l => l === 'de' ? 'en' : 'de')}
        style={{ position: 'absolute', top: '20px', right: '20px', background: card, border: `1px solid ${border}`, borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: accent, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", zIndex: 2 }}>
        {lang === 'de' ? 'EN' : 'DE'}
      </button>

      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, type: 'spring', damping: 14 }}
        style={{ marginBottom: '20px', position: 'relative' as const, zIndex: 1 }}>
        <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '84px', height: '84px', borderRadius: '22px', boxShadow: `0 12px 40px ${accent}40` }} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        style={{ marginBottom: '20px', position: 'relative' as const, zIndex: 1 }}>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 500, color: text, letterSpacing: '-0.02em' }}>
          Ki<em style={{ color: accent }}>Wardrobe</em>
        </span>
      </motion.div>

      <motion.span initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        style={{ background: secondary, border: `1px solid ${border}`, color: accent, fontSize: '13px', fontWeight: 600, padding: '6px 14px', borderRadius: '100px', marginBottom: '22px', position: 'relative' as const, zIndex: 1 }}>
        {t.badge}
      </motion.span>

      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        style={{ fontFamily: "'Fraunces', serif", fontSize: '34px', fontWeight: 500, color: text, lineHeight: 1.2, maxWidth: '480px', marginBottom: '14px', letterSpacing: '-0.02em', position: 'relative' as const, zIndex: 1 }}>
        {t.headline}
      </motion.h1>

      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
        style={{ fontSize: '16px', color: muted, maxWidth: '420px', lineHeight: 1.6, marginBottom: '24px', position: 'relative' as const, zIndex: 1 }}>
        {t.sub}
      </motion.p>

      {/* Angebots-Karte mit Fortschrittsbalken */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.35 }}
        style={{ width: '100%', maxWidth: '380px', background: card, border: `1.5px solid ${border}`, borderRadius: '18px', padding: '18px 20px', marginBottom: '28px', boxShadow: `0 8px 30px ${accent}10`, position: 'relative' as const, zIndex: 1 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: text }}>
            {isFounderPhase ? t.founderTitle : t.earlyTitle}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: muted }}>{count}/{EARLY_SPOTS}</span>
        </div>

        <p style={{ fontSize: '13px', color: accent, fontWeight: 600, marginBottom: '12px', textAlign: 'left' as const }}>
          {isFounderPhase ? t.founderPerk : t.earlyPerk}
        </p>

        {/* Progress bar */}
        <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: secondary, overflow: 'hidden', marginBottom: '8px' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', borderRadius: '4px', background: isFounderPhase ? founderGold : sageGradient }}
          />
        </div>

        <p style={{ fontSize: '11px', color: muted, textAlign: 'left' as const }}>
          {isFounderPhase ? t.spotsLeft(founderLeft) : t.spotsLeft(0)}
        </p>
      </motion.div>

      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', width: '100%', maxWidth: '360px', marginBottom: '12px', position: 'relative' as const, zIndex: 1 }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t.placeholder}
          style={{ width: '100%', height: '50px', borderRadius: '12px', border: `1.5px solid ${border}`, padding: '0 16px', fontSize: '15px', background: card, color: text, boxSizing: 'border-box' as const, fontFamily: "'Poppins', 'Inter', sans-serif", outline: 'none' }}
        />
        <motion.button whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={status === 'loading'}
          style={{ width: '100%', height: '50px', borderRadius: '12px', border: 'none', background: status === 'loading' ? border : sageGradient, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: status === 'loading' ? 'wait' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: status === 'loading' ? 'none' : `0 6px 24px ${accent}35` }}>
          {status === 'loading' ? t.ctaLoading : t.cta}
        </motion.button>
      </motion.form>

      <div style={{ minHeight: '20px', marginBottom: '8px', position: 'relative' as const, zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {status !== 'idle' && status !== 'loading' && (
            <motion.p key={status} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ fontSize: '13px', color: status === 'error' ? '#ef4444' : status === 'already' ? muted : '#0ea472', fontWeight: 600 }}>
              {status === 'success' && t.success}
              {status === 'error' && t.error}
              {status === 'already' && t.alreadyOn}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <p style={{ fontSize: '11px', color: muted, maxWidth: '360px', marginBottom: '36px', position: 'relative' as const, zIndex: 1 }}>
        {t.noteAfter}
      </p>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
        style={{ display: 'flex', gap: '32px', marginBottom: '40px', position: 'relative' as const, zIndex: 1 }}>
        {t.features.map((label, i) => (
          <div key={i} style={{ textAlign: 'center' as const }}>
            <p style={{ fontSize: '22px', marginBottom: '8px' }}>{['✦', '☁️', '🧍'][i]}</p>
            <p style={{ fontSize: '12px', color: muted, fontWeight: 600 }}>{label}</p>
          </div>
        ))}
      </motion.div>

      <button onClick={() => setShowLegal(true)}
        style={{ fontSize: '12px', color: muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", textDecoration: 'underline', position: 'relative' as const, zIndex: 1 }}>
        {t.legalLink}
      </button>

      <AnimatePresence>
        {showLegal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowLegal(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: card, borderRadius: '24px', padding: '28px 24px', maxWidth: '440px', width: '100%', maxHeight: '80vh', overflowY: 'auto' as const, textAlign: 'left' as const }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '19px', fontWeight: 500, color: text, marginBottom: '16px', letterSpacing: '-0.02em' }}>{t.legalTitle}</h2>
              <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '16px' }}>{t.legalIntro}</p>

              <p style={{ fontSize: '12px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>{t.legalDataTitle}</p>
              <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '16px' }}>{t.legalData}</p>

              <p style={{ fontSize: '12px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>{t.legalPurposeTitle}</p>
              <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '16px' }}>{t.legalPurpose}</p>

              <p style={{ fontSize: '12px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>{t.legalRightsTitle}</p>
              <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '16px' }}>{t.legalRights}</p>

              <p style={{ fontSize: '12px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>{t.legalContactTitle}</p>
              <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '20px' }}>{t.legalContact}</p>

              <button onClick={() => setShowLegal(false)}
                style={{ width: '100%', padding: '12px', background: secondary, border: `1px solid ${border}`, borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: accent, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                {t.legalClose}
              </button>
            </motion.div>
          </motion.div> 
        )}
      </AnimatePresence>

    </div>
  )
}