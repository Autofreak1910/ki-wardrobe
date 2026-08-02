'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'

export default function OnboardingCarousel({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const bg     = isDark ? '#161616' : '#F2EFE7'
  const card   = isDark ? '#1D1D20' : '#ffffff'
  const border = isDark ? '#2a2a2e' : '#E7E2D5'
  const text   = isDark ? '#F5F3EE' : '#24211B'
  const muted  = isDark ? '#9a978f' : '#8C8776'
  const accent = isDark ? '#5C82A0' : '#355C7D'
  const accentDim = isDark ? 'rgba(92,130,160,0.12)' : 'rgba(53,92,125,0.07)'
  const gold   = isDark ? '#E5B45B' : '#C9963C'

 const locale = useLocale()
  const totalSlides = 5
  const isLast = index === totalSlides - 1

function next() {
    if (isLast) { onDone(); return }
    setIndex(i => i + 1)
  }
  function back() {
    if (index > 0) setIndex(i => i - 1)
  }
  function handleDragEnd(_: any, info: { offset: { x: number } }) {
    if (info.offset.x < -60) next()
    else if (info.offset.x > 60) back()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: bg, display: 'flex', flexDirection: 'column' as const, fontFamily: "'Poppins', 'Inter', sans-serif" }}>

      <button onClick={onDone} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, background: 'transparent', border: 'none', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", padding: '8px 12px' }}>
        {locale === 'de' ? 'Überspringen' : 'Skip'}
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '70px 0 20px' }}>
        <AnimatePresence mode="wait" initial={false}>

          {index === 0 && (
            <motion.div key={0} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '20px', marginBottom: '28px', boxShadow: isDark ? 'none' : '0 8px 32px rgba(53,92,125,0.1)' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>{locale === 'de' ? 'Dein Schrank' : 'Your Wardrobe'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['👕', '👖', '🧥', '👟', '👔', '🩳'].map((e, i) => (
                    <div key={i} style={{ aspectRatio: '1', background: accentDim, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{e}</div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>📸</p>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '23px', fontWeight: 500, color: text, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  {locale === 'de' ? 'Schrank digitalisieren' : 'Digitize your wardrobe'}
                </h2>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6 }}>
                  {locale === 'de'
                    ? 'Foto machen, fertig. Die KI erkennt automatisch Kategorie, Farbe und Marke deiner Kleidung — keine manuelle Eingabe nötig.'
                    : "Snap a photo, done. AI automatically detects category, color, and brand of your clothes — no manual input needed."}
                </p>
              </div>
            </motion.div>
          )}

          {index === 1 && (
            <motion.div key={1} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '18px', marginBottom: '28px', boxShadow: isDark ? 'none' : '0 8px 32px rgba(53,92,125,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{locale === 'de' ? 'Heutiges Outfit' : "Today's Outfit"}</p>
                  <span style={{ fontSize: '11px', color: muted }}>✦</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {['🧥', '👕', '👖'].map((e, i) => (
                    <div key={i} style={{ flex: 1, aspectRatio: '1', background: accentDim, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{e}</div>
                  ))}
                </div>
                <div style={{ background: accentDim, borderRadius: '10px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '11px', color: accent, fontWeight: 600 }}>✦ {locale === 'de' ? '"Perfekt für einen sonnigen Bürotag"' : '"Perfect for a sunny office day"'}</p>
                </div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>✨</p>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '23px', fontWeight: 500, color: text, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  {locale === 'de' ? 'KI-Stylist, jeden Tag' : 'AI stylist, every day'}
                </h2>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6 }}>
                  {locale === 'de'
  ? 'Outfit-Vorschläge passend zu Wetter und Anlass — von Casual bis Date Night. 3 Vorschläge pro Woche komplett kostenlos.'
  : 'Outfit suggestions matched to weather and occasion — from casual to date night. 3 suggestions per week, completely free.'}
                </p>
              </div>
            </motion.div>
          )}

          {index === 2 && (
            <motion.div key={2} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '18px', marginBottom: '28px', boxShadow: isDark ? 'none' : '0 8px 32px rgba(53,92,125,0.1)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center' }}>
                  <div style={{ aspectRatio: '3/4', background: accentDim, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🤳</div>
                  <span style={{ color: accent, fontSize: '20px', fontWeight: 700 }}>→</span>
                  <div style={{ aspectRatio: '3/4', background: `linear-gradient(135deg, #7FA98E, ${accent})`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🧍</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <p style={{ fontSize: '10px', color: muted, flex: 1, textAlign: 'center' as const }}>{locale === 'de' ? 'Selfie' : 'Selfie'}</p>
                  <p style={{ fontSize: '10px', color: accent, flex: 1, textAlign: 'center' as const, fontWeight: 600 }}>{locale === 'de' ? 'Avatar' : 'Avatar'}</p>
                </div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>🪞</p>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '23px', fontWeight: 500, color: text, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  {locale === 'de' ? 'Virtual Try-On' : 'Virtual Try-On'}
                </h2>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6 }}>
                  {locale === 'de'
                    ? 'Lade ein Selfie hoch und probier deine Kleidung virtuell an — bevor du dich für ein Outfit entscheidest.'
                    : 'Upload a selfie and try on your clothes virtually — before deciding on an outfit.'}
                </p>
              </div>
            </motion.div>
          )}

          {index === 3 && (
            <motion.div key={3} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 500, color: text, marginBottom: '6px', letterSpacing: '-0.02em', textAlign: 'center' as const }}>
                {locale === 'de' ? 'Free oder Pro' : 'Free or Pro'}
              </h2>
              <p style={{ fontSize: '13px', color: muted, textAlign: 'center' as const, marginBottom: '18px' }}>
                {locale === 'de' ? 'Free reicht schon für viel — Pro für alle die mehr wollen' : 'Free already covers a lot — Pro for those who want more'}
              </p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '18px', padding: '16px 12px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: muted, letterSpacing: '0.08em', marginBottom: '10px' }}>FREE</p>
                  {[
                    locale === 'de' ? '3 Outfits pro Woche' : '3 outfits per week',
                    locale === 'de' ? 'Max. 20 Kleidungsstücke' : 'Max. 20 items',
                    locale === 'de' ? 'Max. 5 Outfits speichern' : 'Max. 5 saved outfits',
                    locale === 'de' ? '2 Virtual Try-Ons/Monat' : '2 virtual try-ons/month',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '7px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: muted }}>○</span>
                      <p style={{ fontSize: '12px', color: text }}>{f}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background: `linear-gradient(160deg, ${gold}, #C9963C)`, borderRadius: '18px', padding: '16px 12px', position: 'relative' as const }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em', marginBottom: '10px' }}>PRO ✦</p>
                  {[
                    locale === 'de' ? '14 Outfits pro Woche' : '14 outfits per week',
                    locale === 'de' ? 'Unbegrenzt Kleidung' : 'Unlimited items',
                    locale === 'de' ? 'Unbegrenzt speichern' : 'Unlimited saved',
                    locale === 'de' ? '6× Virtual Try-On pro Woche' : '6× Virtual Try-On per week',
                    'Style DNA',
                    locale === 'de' ? 'Mehrfach-Upload' : 'Multi-upload',
                    locale === 'de' ? '🧊 Streak-Schutz' : '🧊 Streak Freeze',
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '7px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: '#fff' }}>✦</span>
                      <p style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{f}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {index === 4 && (
            <motion.div key={4} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
         <div style={{ background: `linear-gradient(135deg, ${gold}, #C9963C)`, borderRadius: '24px', padding: '24px 20px', marginBottom: '28px', textAlign: 'center' as const, boxShadow: `0 8px 32px ${gold}40` }}>
                <p style={{ fontSize: '40px', marginBottom: '10px' }}>🎁</p>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                  {locale === 'de' ? '+7 Tage Pro gratis' : '+7 days Pro free'}
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                  {locale === 'de' ? 'für dich und deinen Freund' : 'for you and your friend'}
                </p>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '23px', fontWeight: 500, color: text, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  {locale === 'de' ? 'Freunde einladen' : 'Invite friends'}
                </h2>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6 }}>
                  {locale === 'de'
                    ? 'Du und dein eingeladener Freund bekommt ihr jeweils 7 Tage Pro gratis. Findest du jederzeit in deinem Profil.'
                    : 'You and your invited friend each get 7 days Pro free. Find it anytime in your profile.'}
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div style={{ padding: '0 24px 40px' }}>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <motion.div key={i}
              animate={{ width: i === index ? '24px' : '7px', background: i === index ? accent : border }}
              transition={{ duration: 0.3 }}
              style={{ height: '7px', borderRadius: '4px' }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', maxWidth: '380px', margin: '0 auto' }}>
          {index > 0 && (
            <button onClick={back} style={{ width: '48px', flexShrink: 0, padding: '14px', background: card, border: `1px solid ${border}`, borderRadius: '14px', fontSize: '16px', color: muted, cursor: 'pointer' }}>←</button>
          )}
          <motion.button whileTap={{ scale: 0.97 }} onClick={next}
            style={{ flex: 1, padding: '16px', background: `linear-gradient(135deg, #7FA98E, ${accent})`, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: `0 4px 20px ${accent}40` }}>
            {isLast ? (locale === 'de' ? "Los geht's! 🎉" : "Let's go! 🎉") : (locale === 'de' ? 'Weiter' : 'Next')}
          </motion.button>
        </div>
      </div>
    </div>
  )
}