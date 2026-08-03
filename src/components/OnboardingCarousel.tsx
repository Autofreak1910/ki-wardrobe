'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'

// Kleine wiederverwendbare Komponente: zeigt zuerst eine Ja/Nein-Frage,
// und sobald der Nutzer antwortet (egal welche Antwort), erscheint darunter
// die passende Loesungs-Card mit einer sanften Reveal-Animation. Das erzeugt
// den "das kenn ich!"-Moment, bevor die Loesung gezeigt wird.
function QuestionReveal({
  question,
  imageUrl,
  options,
  answer,
  setAnswer,
  children,
  text,
  muted,
  accent,
  accentDim,
  border,
  isDark,
}: {
  question: string
  imageUrl: string
  options: string[]
  answer: string | null
  setAnswer: (v: string) => void
  children: React.ReactNode
  text: string
  muted: string
  accent: string
  accentDim: string
  border: string
  isDark: boolean
}) {
  return (
    <div style={{ width: '100%' }}>
      {/* Weisse, runde Frage-Card mit echtem Foto */}
      <div style={{
        background: '#ffffff', borderRadius: '28px', overflow: 'hidden',
        marginBottom: answer ? '18px' : '0',
        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(53,92,125,0.14)',
      }}>
        <div style={{ position: 'relative' as const, height: '160px', overflow: 'hidden' }}>
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)' }} />
        </div>
        <div style={{ padding: '20px 20px 24px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 500, color: '#24211B', marginBottom: '16px', letterSpacing: '-0.02em', textAlign: 'center' as const, lineHeight: 1.35 }}>
            {question}
          </h2>

          {!answer && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
              {options.map((opt) => (
                <motion.button key={opt} whileTap={{ scale: 0.95 }}
                  onClick={() => setAnswer(opt)}
                  style={{ padding: '11px 18px', borderRadius: '100px', border: `1.5px solid ${accent}`, background: accentDim, color: accent, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                  {opt}
                </motion.button>
              ))}
            </div>
          )}

          {answer && (
            <p style={{ fontSize: '12px', color: '#8C8776', textAlign: 'center' as const, fontWeight: 600 }}>
              {'"' + answer + '"'}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

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

  const [a1, setA1] = useState<string | null>(null)
  const [a2, setA2] = useState<string | null>(null)
  const [a3, setA3] = useState<string | null>(null)
  const [a4, setA4] = useState<string | null>(null)
  const [a5, setA5] = useState<string | null>(null)

  const answers = [null, a1, a2, a3, a4, a5, null, null, null]
  const totalSlides = 9
  const isLast = index === totalSlides - 1
  const needsAnswer = index >= 1 && index <= 5 && answers[index] === null

  function next() {
    if (isLast) { onDone(); return }
    if (needsAnswer) return
    setIndex(i => i + 1)
  }
  function back() {
    if (index > 0) setIndex(i => i - 1)
  }
  function handleDragEnd(_: any, info: { offset: { x: number } }) {
    if (needsAnswer) return
    if (info.offset.x < -60) next()
    else if (info.offset.x > 60) back()
  }

  const isDe = locale === 'de'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: bg, display: 'flex', flexDirection: 'column' as const, fontFamily: "'Poppins', 'Inter', sans-serif" }}>

      <button onClick={onDone} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, background: 'transparent', border: 'none', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", padding: '8px 12px' }}>
        {isDe ? 'Überspringen' : 'Skip'}
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '70px 0 20px' }}>
        <AnimatePresence mode="wait" initial={false}>

          {index === 0 && (
            <motion.div key={0} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <div style={{ background: '#ffffff', borderRadius: '28px', overflow: 'hidden', marginBottom: '24px', boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(53,92,125,0.14)' }}>
                <div style={{ position: 'relative' as const, height: '220px', overflow: 'hidden' }}>
                  <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&q=80&auto=format&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.4) 100%)' }} />
                  <motion.p
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', bottom: '14px', left: '18px', fontSize: '38px' }}
                  >
                    🪄
                  </motion.p>
                </div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '25px', fontWeight: 500, color: text, marginBottom: '14px', letterSpacing: '-0.03em', lineHeight: 1.25 }}>
                  {isDe
                    ? 'Bereit für einen Kleiderschrank, der für dich mitdenkt?'
                    : 'Ready for a wardrobe that thinks for you?'}
                </h2>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6 }}>
                  {isDe
                    ? 'Ein paar kurze Fragen — dann zeigen wir dir genau, wie KiWardrobe dir den Alltag abnimmt.'
                    : "A few quick questions — then we'll show you exactly how KiWardrobe makes your daily life easier."}
                </p>
              </div>
            </motion.div>
          )}

          {index === 1 && (
            <motion.div key={1} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <QuestionReveal
                question={isDe ? 'Stehst du morgens ratlos vor deinem Kleiderschrank? 🤯' : 'Do you stand in front of your closet clueless every morning? 🤯'}
                imageUrl="https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=80&auto=format&fit=crop"
                options={isDe ? ['Ja, ständig', 'Ab und zu', 'Nein'] : ['Yes, all the time', 'Sometimes', 'No']}
                answer={a1} setAnswer={setA1}
                text={text} muted={muted} accent={accent} accentDim={accentDim} border={border} isDark={isDark}
              >
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '18px', marginBottom: '20px', boxShadow: isDark ? 'none' : '0 8px 32px rgba(53,92,125,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{isDe ? 'Heutiges Outfit' : "Today's Outfit"}</p>
                    <span style={{ fontSize: '11px', color: muted }}>✦</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {['🧥', '👕', '👖'].map((e, i) => (
                      <div key={i} style={{ flex: 1, aspectRatio: '1', background: accentDim, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{e}</div>
                    ))}
                  </div>
                  <div style={{ background: accentDim, borderRadius: '10px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '11px', color: accent, fontWeight: 600 }}>✦ {isDe ? '"Perfekt für einen sonnigen Bürotag"' : '"Perfect for a sunny office day"'}</p>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6, textAlign: 'center' as const }}>
                  <strong style={{ color: text }}>{isDe ? 'Genau dafür ist KiWardrobe da.' : "That's exactly what KiWardrobe is for."}</strong><br />
                  {isDe
                    ? 'Jeden Morgen bekommst du ein fertiges Outfit vorgeschlagen — abgestimmt auf Wetter und Anlass. Kein Grübeln mehr.'
                    : 'Every morning you get a ready-made outfit suggestion — matched to weather and occasion. No more guessing.'}
                </p>
              </QuestionReveal>
            </motion.div>
          )}

          {index === 2 && (
            <motion.div key={2} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <QuestionReveal
                question={isDe ? 'Hast du Kleidung im Schrank, die du nie kombiniert bekommst? 👀' : 'Do you have clothes in your closet you never manage to combine? 👀'}
                imageUrl="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80&auto=format&fit=crop"
                options={isDe ? ['Ja, einiges', 'Nein'] : ['Yes, quite a bit', 'No']}
                answer={a2} setAnswer={setA2}
                text={text} muted={muted} accent={accent} accentDim={accentDim} border={border} isDark={isDark}
              >
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '20px', marginBottom: '20px', boxShadow: isDark ? 'none' : '0 8px 32px rgba(53,92,125,0.1)' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '10px' }}>{isDe ? 'Dein Schrank' : 'Your Wardrobe'}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {['👕', '👖', '🧥', '👟', '👔', '🩳'].map((e, i) => (
                      <div key={i} style={{ aspectRatio: '1', background: accentDim, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{e}</div>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6, textAlign: 'center' as const }}>
                  <strong style={{ color: text }}>{isDe ? 'KiWardrobe kennt deinen ganzen Schrank.' : 'KiWardrobe knows your entire wardrobe.'}</strong><br />
                  {isDe
                    ? 'Foto machen, fertig. Die KI erkennt Kategorie, Farbe und Marke automatisch und findet Kombinationen, an die du nie gedacht hättest.'
                    : "Snap a photo, done. AI detects category, color, and brand automatically, and finds combinations you'd never have thought of."}
                </p>
              </QuestionReveal>
            </motion.div>
          )}

          {index === 3 && (
            <motion.div key={3} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <QuestionReveal
                question={isDe ? 'Bist du dir manchmal unsicher, ob ein Outfit dir wirklich steht? 🤔' : 'Are you sometimes unsure if an outfit really suits you? 🤔'}
                imageUrl="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80&auto=format&fit=crop"
                options={isDe ? ['Ja', 'Nein'] : ['Yes', 'No']}
                answer={a3} setAnswer={setA3}
                text={text} muted={muted} accent={accent} accentDim={accentDim} border={border} isDark={isDark}
              >
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '18px', marginBottom: '20px', boxShadow: isDark ? 'none' : '0 8px 32px rgba(53,92,125,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center' }}>
                    <div style={{ aspectRatio: '3/4', background: accentDim, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🤳</div>
                    <span style={{ color: accent, fontSize: '20px', fontWeight: 700 }}>→</span>
                    <div style={{ aspectRatio: '3/4', background: `linear-gradient(135deg, #7FA98E, ${accent})`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🧍</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <p style={{ fontSize: '10px', color: muted, flex: 1, textAlign: 'center' as const }}>{isDe ? 'Selfie' : 'Selfie'}</p>
                    <p style={{ fontSize: '10px', color: accent, flex: 1, textAlign: 'center' as const, fontWeight: 600 }}>{isDe ? 'Avatar' : 'Avatar'}</p>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6, textAlign: 'center' as const }}>
                  <strong style={{ color: text }}>{isDe ? 'Mit Virtual Try-On siehst du es vorher.' : 'With Virtual Try-On, you see it beforehand.'}</strong><br />
                  {isDe
                    ? 'Lade ein Selfie hoch und probier deine Kleidung digital an dir selbst an — bevor du dich entscheidest.'
                    : 'Upload a selfie and try on your clothes digitally on yourself — before you decide.'}
                </p>
              </QuestionReveal>
            </motion.div>
          )}

          {index === 4 && (
            <motion.div key={4} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <QuestionReveal
                question={isDe ? 'Fragst du Freunde oft, ob ein Outfit gut aussieht? 💬' : 'Do you often ask friends if an outfit looks good? 💬'}
                imageUrl="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80&auto=format&fit=crop"
                options={isDe ? ['Ja, ständig', 'Manchmal', 'Nein'] : ['All the time', 'Sometimes', 'No']}
                answer={a4} setAnswer={setA4}
                text={text} muted={muted} accent={accent} accentDim={accentDim} border={border} isDark={isDark}
              >
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '20px', marginBottom: '20px', boxShadow: isDark ? 'none' : '0 8px 32px rgba(53,92,125,0.1)', textAlign: 'center' as const }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>🧍</div>
                    <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ fontSize: '20px', color: accent }}>→</motion.span>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `linear-gradient(135deg, #7FA98E, ${accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>💬</div>
                  </div>
                  <p style={{ fontSize: '11px', color: muted, marginTop: '10px' }}>{isDe ? 'Ein Link genügt' : 'Just one link'}</p>
                </div>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6, textAlign: 'center' as const }}>
                  <strong style={{ color: text }}>{isDe ? 'Teile deine Outfits mit einem Klick.' : 'Share your outfits with one tap.'}</strong><br />
                  {isDe
                    ? 'Schick deinen Freunden direkt einen Link zu deinem Look und hol dir sofort Feedback — ganz ohne Foto-Umwege im Chat.'
                    : 'Send friends a direct link to your look and get instant feedback — no more awkward photo screenshots in chats.'}
                </p>
              </QuestionReveal>
            </motion.div>
          )}

          {index === 5 && (
            <motion.div key={5} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <QuestionReveal
                question={isDe ? 'Weißt du eigentlich, was dein Kleidungsstil über dich sagt? 🧬' : 'Do you actually know what your style says about you? 🧬'}
                imageUrl="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80&auto=format&fit=crop"
                options={isDe ? ['Bin neugierig', 'Weiß ich schon'] : ["I'm curious", 'I already know']}
                answer={a5} setAnswer={setA5}
                text={text} muted={muted} accent={accent} accentDim={accentDim} border={border} isDark={isDark}
              >
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '18px', marginBottom: '20px', boxShadow: isDark ? 'none' : '0 8px 32px rgba(53,92,125,0.1)' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>Style DNA</p>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    {['#7FA98E', accent, '#C9963C', '#8C8776'].map((c, i) => (
                      <div key={i} style={{ flex: 1, height: '28px', borderRadius: '8px', background: c }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: text, fontWeight: 600 }}>Casual</span>
                    <span style={{ fontSize: '11px', color: muted }}>62%</span>
                  </div>
                  <div style={{ height: '6px', background: accentDim, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '62%', height: '100%', background: accent }} />
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6, textAlign: 'center' as const }}>
                  <strong style={{ color: text }}>{isDe ? 'Style DNA analysiert deinen Look.' : 'Style DNA analyzes your look.'}</strong><br />
                  {isDe
                    ? 'Die KI erstellt dir eine persönliche Stilanalyse — deine Lieblingsfarben, deinen Style-Mix und Tipps, was noch fehlt.'
                    : 'AI creates a personal style analysis for you — your favorite colors, your style mix, and tips on what to add.'}
                </p>
              </QuestionReveal>
            </motion.div>
          )}

          {index === 6 && (
            <motion.div key={6} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab', textAlign: 'center' as const }}>
              <motion.p
                animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '52px', marginBottom: '16px' }}
              >
                🔥
              </motion.p>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '23px', fontWeight: 500, color: text, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                {isDe ? 'Bleib dran, sammle Streaks' : 'Stay consistent, build streaks'}
              </h2>
              <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6, marginBottom: '16px' }}>
                {isDe
                  ? 'Je länger deine Tage-Streak, desto mehr Bonus-Outfits und gratis Pro-Zeit bekommst du geschenkt.'
                  : 'The longer your day streak, the more bonus outfits and free Pro time you unlock.'}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.06))', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '100px', padding: '8px 18px' }}>
                <span style={{ fontSize: '16px' }}>🏅</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#c2410c' }}>{isDe ? '7 Tage = Bonus-Outfit' : '7 days = bonus outfit'}</span>
              </div>
            </motion.div>
          )}

          {index === 7 && (
            <motion.div key={7} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 500, color: text, marginBottom: '6px', letterSpacing: '-0.02em', textAlign: 'center' as const }}>
                {isDe ? 'Free oder Pro' : 'Free or Pro'}
              </h2>
              <p style={{ fontSize: '13px', color: muted, textAlign: 'center' as const, marginBottom: '18px' }}>
                {isDe ? 'Free reicht schon für viel — Pro für alle die mehr wollen' : 'Free already covers a lot — Pro for those who want more'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '18px', padding: '16px 12px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: muted, letterSpacing: '0.08em', marginBottom: '10px' }}>FREE</p>
                  {[
                    isDe ? '3 Outfits pro Woche' : '3 outfits per week',
                    isDe ? 'Max. 20 Kleidungsstücke' : 'Max. 20 items',
                    isDe ? 'Max. 5 Outfits speichern' : 'Max. 5 saved outfits',
                    isDe ? '2 Virtual Try-Ons/Monat' : '2 virtual try-ons/month',
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
                    isDe ? '14 Outfits pro Woche' : '14 outfits per week',
                    isDe ? 'Unbegrenzt Kleidung' : 'Unlimited items',
                    isDe ? 'Unbegrenzt speichern' : 'Unlimited saved',
                    isDe ? '6× Virtual Try-On pro Woche' : '6× Virtual Try-On per week',
                    'Style DNA',
                    isDe ? 'Mehrfach-Upload' : 'Multi-upload',
                    isDe ? '🧊 Streak-Schutz' : '🧊 Streak Freeze',
                    isDe ? 'Outfits teilen' : 'Share outfits',
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

          {index === 8 && (
            <motion.div key={8} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} onDragEnd={handleDragEnd}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.3 }}
              style={{ width: '100%', maxWidth: '380px', padding: '0 24px', cursor: 'grab' }}>
              <div style={{ background: `linear-gradient(135deg, ${gold}, #C9963C)`, borderRadius: '24px', padding: '24px 20px', marginBottom: '28px', textAlign: 'center' as const, boxShadow: `0 8px 32px ${gold}40` }}>
                <p style={{ fontSize: '40px', marginBottom: '10px' }}>🎁</p>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                  {isDe ? '+7 Tage Pro gratis' : '+7 days Pro free'}
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                  {isDe ? 'für dich und deinen Freund' : 'for you and your friend'}
                </p>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '23px', fontWeight: 500, color: text, marginBottom: '10px', letterSpacing: '-0.02em' }}>
                  {isDe ? 'Freunde einladen' : 'Invite friends'}
                </h2>
                <p style={{ fontSize: '14px', color: muted, lineHeight: 1.6 }}>
                  {isDe
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
          <motion.button whileTap={!needsAnswer ? { scale: 0.97 } : {}} onClick={next}
            disabled={needsAnswer}
            style={{ flex: 1, padding: '16px', background: needsAnswer ? (isDark ? '#1D1D20' : '#EDE7D8') : `linear-gradient(135deg, #7FA98E, ${accent})`, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, color: needsAnswer ? muted : '#fff', cursor: needsAnswer ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: needsAnswer ? 'none' : `0 4px 20px ${accent}40`, transition: 'all 0.2s' }}>
            {needsAnswer
              ? (isDe ? '↑ Wähl eine Antwort' : '↑ Pick an answer')
              : isLast
                ? (isDe ? "Los geht's! 🎉" : "Let's go! 🎉")
                : (isDe ? 'Weiter' : 'Next')}
          </motion.button>
        </div>
      </div>
    </div>
  )
}