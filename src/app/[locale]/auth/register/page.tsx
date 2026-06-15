'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'

const countries = [
  { code: 'de', flag: '🇩🇪', name: 'Deutschland', lang: 'de' },
  { code: 'at', flag: '🇦🇹', name: 'Österreich', lang: 'de' },
  { code: 'ch', flag: '🇨🇭', name: 'Schweiz', lang: 'de' },
  { code: 'us', flag: '🇺🇸', name: 'United States', lang: 'en' },
  { code: 'gb', flag: '🇬🇧', name: 'United Kingdom', lang: 'en' },
  { code: 'au', flag: '🇦🇺', name: 'Australia', lang: 'en' },
  { code: 'ca', flag: '🇨🇦', name: 'Canada', lang: 'en' },
  { code: 'fr', flag: '🇫🇷', name: 'France', lang: 'en' },
  { code: 'it', flag: '🇮🇹', name: 'Italy', lang: 'en' },
  { code: 'es', flag: '🇪🇸', name: 'Spain', lang: 'en' },
  { code: 'nl', flag: '🇳🇱', name: 'Netherlands', lang: 'en' },
  { code: 'other', flag: '🌍', name: 'Other', lang: 'en' },
]

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [age, setAge] = useState('')
  const [country, setCountry] = useState('')
  const [gender, setGender] = useState('')
  const [stylePrefs, setStylePrefs] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggle } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'

  const bg        = isDark ? '#080c18' : '#f0f4ff'
  const card      = isDark ? '#0d1225' : '#ffffff'
  const border    = isDark ? '#1a2540' : '#dde3f5'
  const text      = isDark ? '#e8eeff' : '#0a1628'
  const muted     = isDark ? '#4d6080' : '#6b7fa8'
  const accent    = isDark ? '#4d7eff' : '#3b6bff'
  const secondary = isDark ? '#0d1225' : '#f0f4ff'

  const selectedCountry = countries.find(c => c.code === country)

  async function handleRegister() {
    setLoading(true)
    setError('')
    const lang = selectedCountry?.lang ?? 'de'
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { username, age: parseInt(age), country, language: lang },
        emailRedirectTo: window.location.origin + '/' + lang + '/auth/callback?locale=' + lang,
      },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').update({
        username, age: parseInt(age), country, language: lang,
        gender, style_preferences: stylePrefs, budget_range: budgetRange
      }).eq('id', data.user.id)
    }
    setLoading(false)
    router.push('/' + lang + '/dresser')
  }

  const inputStyle = {
    width: '100%', background: isDark ? '#080c18' : '#f8faff',
    border: `1.5px solid ${border}`, borderRadius: '12px',
    padding: '13px 16px', fontSize: '14px', color: text,
    outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s',
  }

  const totalSteps = 4

  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px', position: 'relative', overflow: 'hidden' }}>

      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: isDark ? 'rgba(77,126,255,0.08)' : 'rgba(59,107,255,0.1)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: isDark ? 'rgba(77,126,255,0.05)' : 'rgba(59,107,255,0.07)', filter: 'blur(80px)' }} />
        {!isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.9" fill="#3b6bff" opacity="0.2" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        )}
      </div>

      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <button onClick={toggle} style={{ background: card, border: `1px solid ${border}`, borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '15px' }}>
          {isDark ? '○' : '●'}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '68px', height: '68px', borderRadius: '20px', overflow: 'hidden', margin: '0 auto 14px', boxShadow: `0 8px 32px ${accent}40` }}>
          <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: text, marginBottom: '14px', letterSpacing: '-0.02em' }}>
          Ki<em style={{ color: accent }}>Wardrobe</em>
        </h1>

        {step <= totalSteps && (
          <>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '6px' }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <motion.div key={i}
                  animate={{ width: i + 1 === step ? '28px' : '8px', background: i + 1 <= step ? accent : border }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{ height: '4px', borderRadius: '2px' }} />
              ))}
            </div>
            <p style={{ fontSize: '11px', color: muted, fontWeight: 500 }}>
              {locale === 'de' ? `Schritt ${step} von ${totalSteps}` : `Step ${step} of ${totalSteps}`}
            </p>
          </>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '400px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '32px', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : `0 8px 40px ${accent}12`, position: 'relative', zIndex: 1 }}>

        <AnimatePresence mode="wait">

          {/* Step 1 */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                {locale === 'de' ? 'Konto erstellen' : 'Create account'}
              </h2>
              <p style={{ color: muted, fontSize: '14px', marginBottom: '24px' }}>
                {locale === 'de' ? 'Bereits ein Konto?' : 'Already have an account?'}{' '}
                <Link href={'/' + locale + '/auth/login'} style={{ color: accent, fontWeight: 600, textDecoration: 'none' }}>
                  {locale === 'de' ? 'Einloggen' : 'Log in'}
                </Link>
              </p>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}

              {[
                { label: locale === 'de' ? 'Benutzername' : 'Username', type: 'text', value: username, set: setUsername, placeholder: 'dein_name' },
                { label: 'E-Mail', type: 'email', value: email, set: setEmail, placeholder: 'deine@email.com' },
                { label: locale === 'de' ? 'Passwort' : 'Password', type: 'password', value: password, set: setPassword, placeholder: '••••••••' },
              ].map((field, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? '12px' : '24px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '7px', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{field.label}</label>
                  <input type={field.type} value={field.value} onChange={e => field.set(e.target.value)} placeholder={field.placeholder} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = accent}
                    onBlur={e => e.target.style.borderColor = border} />
                </div>
              ))}

              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => { if (username && email && password.length >= 8) { setError(''); setStep(2) } else setError(locale === 'de' ? 'Bitte alle Felder ausfüllen (mind. 8 Zeichen)' : 'Fill all fields (min. 8 chars)') }}
                style={{ width: '100%', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em', boxShadow: `0 4px 20px ${accent}40` }}>
                {locale === 'de' ? 'Weiter' : 'Next'} →
              </motion.button>
            </motion.div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                {locale === 'de' ? 'Wie alt bist du?' : 'How old are you?'}
              </h2>
              <p style={{ color: muted, fontSize: '14px', marginBottom: '24px' }}>
                {locale === 'de' ? 'Für bessere Outfit-Vorschläge' : 'For better outfit suggestions'}
              </p>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
                {['13-15', '16-18', '19-22', '23-27', '28-35', '35+'].map(range => (
                  <motion.button key={range} whileTap={{ scale: 0.95 }} onClick={() => { setAge(range); setError('') }}
                    style={{ padding: '14px 8px', borderRadius: '12px', border: `1.5px solid ${age === range ? accent : border}`, background: age === range ? `rgba(${isDark ? '77,126,255' : '59,107,255'},0.1)` : secondary, color: age === range ? accent : text, fontSize: '14px', fontWeight: age === range ? 700 : 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
                    {range}
                  </motion.button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={{ width: '48px', flexShrink: 0, padding: '14px', background: secondary, border: `1px solid ${border}`, borderRadius: '12px', fontSize: '16px', color: muted, cursor: 'pointer' }}>←</button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { if (age) { setError(''); setStep(3) } else setError(locale === 'de' ? 'Bitte Alter wählen' : 'Please select age') }}
                  style={{ flex: 1, background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em', boxShadow: `0 4px 20px ${accent}40` }}>
                  {locale === 'de' ? 'Weiter' : 'Next'} →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                {locale === 'de' ? 'Woher kommst du?' : 'Where are you from?'}
              </h2>
              <p style={{ color: muted, fontSize: '14px', marginBottom: '20px' }}>
                {locale === 'de' ? 'Sprache wird automatisch eingestellt' : 'Language set automatically'}
              </p>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '7px', marginBottom: '20px', maxHeight: '260px', overflowY: 'auto' as const }}>
                {countries.map(c => (
                  <motion.button key={c.code} whileTap={{ scale: 0.95 }} onClick={() => { setCountry(c.code); setError('') }}
                    style={{ padding: '10px 12px', borderRadius: '10px', border: `1.5px solid ${country === c.code ? accent : border}`, background: country === c.code ? `rgba(${isDark ? '77,126,255' : '59,107,255'},0.1)` : secondary, color: country === c.code ? accent : text, fontSize: '13px', fontWeight: country === c.code ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.12s' }}>
                    <span style={{ fontSize: '18px' }}>{c.flag}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</span>
                  </motion.button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(2)} style={{ width: '48px', flexShrink: 0, padding: '14px', background: secondary, border: `1px solid ${border}`, borderRadius: '12px', fontSize: '16px', color: muted, cursor: 'pointer' }}>←</button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { if (country) { setError(''); setStep(4) } else setError(locale === 'de' ? 'Bitte Land wählen' : 'Please select country') }}
                  style={{ flex: 1, background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em', boxShadow: `0 4px 20px ${accent}40` }}>
                  {locale === 'de' ? 'Weiter' : 'Next'} →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 4 - Style */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                {locale === 'de' ? 'Dein Style' : 'Your Style'}
              </h2>
              <p style={{ color: muted, fontSize: '14px', marginBottom: '20px' }}>
                {locale === 'de' ? 'Für personalisierte Outfits' : 'For personalized outfits'}
              </p>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}

              {/* Geschlecht */}
              <p style={{ fontSize: '11px', fontWeight: 600, color: muted, letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
                {locale === 'de' ? 'Geschlecht' : 'Gender'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[
                  { value: 'male', labelDe: '♂ Mann', labelEn: '♂ Male' },
                  { value: 'female', labelDe: '♀ Frau', labelEn: '♀ Female' },
                  { value: 'diverse', labelDe: '⚧ Divers', labelEn: '⚧ Other' },
                ].map(g => (
                  <motion.button key={g.value} whileTap={{ scale: 0.95 }} onClick={() => setGender(g.value)}
                    style={{ padding: '12px 8px', borderRadius: '12px', border: `1.5px solid ${gender === g.value ? accent : border}`, background: gender === g.value ? `rgba(${isDark ? '77,126,255' : '59,107,255'},0.1)` : secondary, color: gender === g.value ? accent : text, fontSize: '13px', fontWeight: gender === g.value ? 700 : 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
                    {locale === 'de' ? g.labelDe : g.labelEn}
                  </motion.button>
                ))}
              </div>

              {/* Style */}
              <p style={{ fontSize: '11px', fontWeight: 600, color: muted, letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
                {locale === 'de' ? 'Style (mehrere möglich)' : 'Style (multiple)'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[
                  { value: 'casual', label: '👕 Casual' },
                  { value: 'streetwear', label: '🧢 Streetwear' },
                  { value: 'formal', label: '👔 Formal' },
                  { value: 'sporty', label: '🏃 Sporty' },
                  { value: 'minimal', label: '⬜ Minimal' },
                  { value: 'vintage', label: '🎞 Vintage' },
                ].map(s => {
                  const isOn = stylePrefs.includes(s.value)
                  return (
                    <motion.button key={s.value} whileTap={{ scale: 0.95 }}
                      onClick={() => setStylePrefs(prev => isOn ? prev.filter(x => x !== s.value) : [...prev, s.value])}
                      style={{ padding: '10px 12px', borderRadius: '12px', border: `1.5px solid ${isOn ? accent : border}`, background: isOn ? `rgba(${isDark ? '77,126,255' : '59,107,255'},0.1)` : secondary, color: isOn ? accent : text, fontSize: '13px', fontWeight: isOn ? 700 : 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', textAlign: 'left' as const }}>
                      {s.label}
                    </motion.button>
                  )
                })}
              </div>

              {/* Budget */}
              <p style={{ fontSize: '11px', fontWeight: 600, color: muted, letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>
                {locale === 'de' ? 'Budget pro Kauf' : 'Budget per purchase'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
                {[
                  { value: 'low', label: '< €50' },
                  { value: 'mid', label: '€50–200' },
                  { value: 'high', label: '> €200' },
                ].map(b => (
                  <motion.button key={b.value} whileTap={{ scale: 0.95 }} onClick={() => setBudgetRange(b.value)}
                    style={{ padding: '12px 8px', borderRadius: '12px', border: `1.5px solid ${budgetRange === b.value ? accent : border}`, background: budgetRange === b.value ? `rgba(${isDark ? '77,126,255' : '59,107,255'},0.1)` : secondary, color: budgetRange === b.value ? accent : text, fontSize: '13px', fontWeight: budgetRange === b.value ? 700 : 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
                    {b.label}
                  </motion.button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(3)} style={{ width: '48px', flexShrink: 0, padding: '14px', background: secondary, border: `1px solid ${border}`, borderRadius: '12px', fontSize: '16px', color: muted, cursor: 'pointer' }}>←</button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleRegister}
                  disabled={loading}
                  style={{ flex: 1, background: loading ? secondary : `linear-gradient(135deg, ${accent}, #6b9fff)`, border: loading ? `1px solid ${border}` : 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 700, color: loading ? muted : '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em', boxShadow: loading ? 'none' : `0 4px 20px ${accent}40` }}>
                  {loading ? '...' : locale === 'de' ? 'Konto erstellen 🎉' : 'Create account 🎉'}
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      <p style={{ marginTop: '20px', fontSize: '11px', color: muted, position: 'relative', zIndex: 1 }}>
        KiWardrobe · Made with ♥
      </p>
    </div>
  )
}
