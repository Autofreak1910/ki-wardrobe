'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'

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
const [birthdate, setBirthdate] = useState('')
const [agbAccepted, setAgbAccepted] = useState(false)
  const [showLegalModal, setShowLegalModal] = useState<'agb' | 'datenschutz' | null>(null)
  const [country, setCountry] = useState('')
  const [gender, setGender] = useState('')
  const [stylePrefs, setStylePrefs] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState('')
const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')
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
function parseGermanDate(dateStr: string): Date | null {
    const parts = dateStr.split('.')
    if (parts.length !== 3) return null
    const [day, month, year] = parts.map(p => parseInt(p))
    if (!day || !month || !year || year < 1900) return null
    const date = new Date(year, month - 1, day)
    if (date.getDate() !== day || date.getMonth() !== month - 1) return null
    return date
  }

  function calculateAge(birthdateStr: string): number {
    const birth = parseGermanDate(birthdateStr)
    if (!birth) return 0
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  async function handleRegister() {
    setLoading(true)
    setError('')
    const lang = selectedCountry?.lang ?? 'de'
 const computedAge = calculateAge(birthdate)
    const parsedBirth = parseGermanDate(birthdate)
    const isoBirthdate = parsedBirth ? parsedBirth.toISOString().split('T')[0] : null
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { username, age: computedAge, birthdate: isoBirthdate, country, language: lang },
        emailRedirectTo: window.location.origin + '/' + lang + '/auth/callback?locale=' + lang,
      },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
if (data.user) {
      // Profil wird automatisch vom Trigger erstellt
      // Nur gender und style_preferences nachträglich updaten (eigene Session ist jetzt aktiv)
      await new Promise(resolve => setTimeout(resolve, 500))
      await supabase.from('profiles').update({
        gender, style_preferences: stylePrefs, budget_range: budgetRange
      }).eq('id', data.user.id)

if (refCode && data.user) {
        try {
          await new Promise(resolve => setTimeout(resolve, 800))
          const res = await fetch('/api/apply-referral-server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: data.user.id, referralCode: refCode }),
          })
          const result = await res.json()
          console.log('Referral result:', result)
          if (result.success) {
            localStorage.setItem('kw_pro_welcome_pending', 'true')
          }
        } catch (err) {
          console.error('Referral failed:', err)
        }
      }
    }
localStorage.removeItem('kw_onboarding_seen')
    localStorage.setItem('kw_force_onboarding', 'true')
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
                { label: locale === 'de' ? 'Benutzername' : 'Username', type: 'text', value: username, set: setUsername, placeholder: 'dein_name', hint: '' },
                { label: 'E-Mail', type: 'email', value: email, set: setEmail, placeholder: 'deine@email.com', hint: '' },
                { label: locale === 'de' ? 'Passwort' : 'Password', type: 'password', value: password, set: setPassword, placeholder: '••••••••', hint: locale === 'de' ? 'Mind. 8 Zeichen, Buchstaben & Zahlen' : 'Min. 8 characters, letters & numbers' },
              ].map((field, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? '12px' : '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '7px', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{field.label}</label>
                  <input type={field.type} value={field.value} onChange={e => field.set(e.target.value)} placeholder={field.placeholder} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = accent}
                    onBlur={e => e.target.style.borderColor = border} />
                  {field.hint && <p style={{ fontSize: '11px', color: muted, marginTop: '5px' }}>{field.hint}</p>}
                </div>
              ))}
              <div style={{ marginBottom: '16px' }} />

           <motion.button whileTap={{ scale: 0.97 }} disabled={checkingEmail}
                onClick={async () => {
                  if (!username || !email || password.length < 8) {
                    setError(locale === 'de' ? 'Bitte alle Felder ausfüllen (mind. 8 Zeichen)' : 'Fill all fields (min. 8 chars)')
                    return
                  }
                  setCheckingEmail(true)
                  setError('')
                  try {
                    const res = await fetch('/api/check-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email }),
                    })
                    const data = await res.json()
                    if (data.exists) {
                      setError(locale === 'de' ? 'Diese E-Mail wird bereits verwendet. Bitte logge dich ein.' : 'This email is already in use. Please log in instead.')
                      setCheckingEmail(false)
                      return
                    }
                    setCheckingEmail(false)
                    setStep(2)
                  } catch {
                    setCheckingEmail(false)
                    setStep(2)
                  }
                }}
                style={{ width: '100%', background: checkingEmail ? (isDark ? '#0d1225' : '#e8eeff') : `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '14px', padding: '15px', fontSize: '15px', fontWeight: 700, color: checkingEmail ? muted : '#fff', cursor: checkingEmail ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em', boxShadow: checkingEmail ? 'none' : `0 4px 20px ${accent}40` }}>
                {checkingEmail ? (locale === 'de' ? 'Prüfe...' : 'Checking...') : (locale === 'de' ? 'Weiter' : 'Next') + ' →'}
              </motion.button>
            </motion.div>
          )}

 {/* Step 2 */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                {locale === 'de' ? 'Wann hast du Geburtstag?' : 'When were you born?'}
              </h2>
              <p style={{ color: muted, fontSize: '14px', marginBottom: '24px' }}>
                {locale === 'de' ? 'Du musst mindestens 16 Jahre alt sein' : 'You must be at least 16 years old'}
              </p>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '7px', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>
                  {locale === 'de' ? 'Geburtsdatum' : 'Date of birth'}
                </label>
            <input type="text" inputMode="numeric" value={birthdate} placeholder="TT.MM.JJJJ"
                  onChange={e => {
                    let v = e.target.value.replace(/[^\d]/g, '')
                    if (v.length > 2) v = v.slice(0, 2) + '.' + v.slice(2)
                    if (v.length > 5) v = v.slice(0, 5) + '.' + v.slice(5)
                    if (v.length > 10) v = v.slice(0, 10)
                    const parts = v.split('.')
                    if (parts[0] && parseInt(parts[0]) > 31) parts[0] = '31'
                    if (parts[1] && parseInt(parts[1]) > 12) parts[1] = '12'
                    v = parts.join('.')
                    setBirthdate(v)
                    setError('')
                  }}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = accent}
                  onBlur={e => e.target.style.borderColor = border} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={{ width: '48px', flexShrink: 0, padding: '14px', background: secondary, border: `1px solid ${border}`, borderRadius: '12px', fontSize: '16px', color: muted, cursor: 'pointer' }}>←</button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!birthdate) { setError(locale === 'de' ? 'Bitte Geburtsdatum eingeben' : 'Please enter your date of birth'); return }
                    const computedAge = calculateAge(birthdate)
                    if (computedAge < 16) { setError(locale === 'de' ? 'Du musst mindestens 16 Jahre alt sein, um KiWardrobe zu nutzen' : 'You must be at least 16 years old to use KiWardrobe'); return }
                    setError(''); setStep(3)
                  }}
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
<div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
                <div onClick={() => setAgbAccepted(!agbAccepted)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '6px', marginTop: '1px',
                    border: `1.5px solid ${agbAccepted ? accent : border}`,
                    background: agbAccepted ? accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {agbAccepted && <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: muted, lineHeight: 1.5 }}>
                  <span onClick={() => setAgbAccepted(!agbAccepted)} style={{ cursor: 'pointer' }}>
                    {locale === 'de' ? 'Ich akzeptiere die ' : 'I accept the '}
                  </span>
                  <span onClick={() => setShowLegalModal('agb')} style={{ color: accent, fontWeight: 600, cursor: 'pointer' }}>
                    {locale === 'de' ? 'AGB' : 'Terms of Service'}
                  </span>
                  <span onClick={() => setAgbAccepted(!agbAccepted)} style={{ cursor: 'pointer' }}>
                    {locale === 'de' ? ' und die ' : ' and '}
                  </span>
                  <span onClick={() => setShowLegalModal('datenschutz')} style={{ color: accent, fontWeight: 600, cursor: 'pointer' }}>
                    {locale === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy'}
                  </span>
                  <span onClick={() => setAgbAccepted(!agbAccepted)} style={{ cursor: 'pointer' }}>.</span>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(3)} style={{ width: '48px', flexShrink: 0, padding: '14px', background: secondary, border: `1px solid ${border}`, borderRadius: '12px', fontSize: '16px', color: muted, cursor: 'pointer' }}>←</button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!agbAccepted) { setError(locale === 'de' ? 'Bitte AGB und Datenschutz akzeptieren' : 'Please accept the Terms and Privacy Policy'); return }
                    handleRegister()
                  }}
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

      {/* Legal Modal */}
      <AnimatePresence>
        {showLegalModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowLegalModal(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' as const, background: bg, borderRadius: '24px 24px 0 0', padding: '24px 20px 32px', border: `1px solid ${border}`, borderBottom: 'none' }}>

              <div style={{ width: '36px', height: '4px', background: border, borderRadius: '2px', margin: '0 auto 16px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', fontWeight: 400, color: text }}>
                  {showLegalModal === 'agb' ? 'AGB' : (locale === 'de' ? 'Datenschutz' : 'Privacy Policy')}
                </h2>
                <button onClick={() => setShowLegalModal(null)} style={{ background: card, border: `1px solid ${border}`, borderRadius: '10px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: muted }}>✕</button>
              </div>

      {showLegalModal === 'agb' ? (
                <>
                  {[
                    { title: '1. Geltungsbereich', content: 'Diese AGB gelten für die Nutzung der App KiWardrobe, betrieben von Luca Darvas, Bernd-Rosemeyer-Straße 14, 85551 Kirchheim bei München ("Anbieter"). Mit der Registrierung erkennst du diese AGB an.' },
                    { title: '2. Leistungsbeschreibung', content: 'KiWardrobe bietet eine KI-gestützte Anwendung zur Verwaltung des persönlichen Kleiderschranks, zur Erstellung von Outfit-Vorschlägen sowie zur virtuellen Anprobe von Kleidung (Virtual Try-On). Ein Teil der Funktionen ist kostenlos nutzbar (KiWardrobe Free), erweiterte Funktionen sind im kostenpflichtigen Abonnement (KiWardrobe Pro) enthalten.' },
                    { title: '3. Vertragsschluss', content: 'Der Vertrag über die Free-Nutzung kommt durch erfolgreiche Registrierung zustande. Der Vertrag über ein Pro-Abonnement kommt durch Abschluss des Bezahlvorgangs über unseren Zahlungsdienstleister Stripe zustande.' },
                    { title: '4. Preise und Zahlung', content: 'Der aktuelle Preis für KiWardrobe Pro wird vor Vertragsschluss in der App angezeigt (Stand: €4,99/Monat). Die Zahlung erfolgt monatlich im Voraus über Stripe. Preisänderungen werden mit angemessener Vorlaufzeit angekündigt.' },
                    { title: '5. Laufzeit und Kündigung', content: 'Das Pro-Abonnement verlängert sich automatisch um jeweils einen Monat, sofern es nicht rechtzeitig vor Ablauf des laufenden Abrechnungszeitraums gekündigt wird. Die Kündigung ist jederzeit über die Profileinstellungen in der App oder per E-Mail an support.kiwardrobe@gmail.com möglich. Bereits bezahlte Zeiträume werden bei einer Kündigung nicht anteilig zurückerstattet; der Zugang zu Pro-Funktionen bleibt bis zum Ende des bezahlten Zeitraums bestehen.' },
                    { title: '6. Widerrufsrecht', content: 'Verbrauchern steht grundsätzlich ein gesetzliches Widerrufsrecht von 14 Tagen nach Vertragsschluss zu. Da es sich bei KiWardrobe Pro um digitale Inhalte handelt, die sofort nach Zahlung bereitgestellt werden, erlischt das Widerrufsrecht vorzeitig, wenn du der sofortigen Ausführung ausdrücklich zustimmst und bestätigst, dass du dadurch dein Widerrufsrecht verlierst. Diese Zustimmung wird im Bestellprozess eingeholt.' },
                    { title: '7. Nutzungsrechte und Pflichten', content: 'Du erhältst ein einfaches, nicht übertragbares Nutzungsrecht an der App für die Dauer deines Accounts. Du verpflichtest dich, keine missbräuchlichen, rechtswidrigen oder die Rechte Dritter verletzenden Inhalte (z. B. Bilder) hochzuladen. Bei Verstößen kann der Account gesperrt oder gelöscht werden.' },
                    { title: '8. KI-generierte Inhalte', content: 'Outfit-Vorschläge und virtuelle Anprobe-Ergebnisse werden mithilfe von KI-Modellen Dritter (u. a. OpenAI, Replicate) erzeugt. Der Anbieter übernimmt keine Garantie für die optische Genauigkeit, Eignung oder Fehlerfreiheit der KI-generierten Ergebnisse.' },
                    { title: '9. Referral-Programm', content: 'Im Rahmen des Einladungsprogramms können Nutzer durch das Einladen neuer Nutzer zeitlich begrenzte kostenlose Pro-Zeiträume erhalten. Der Anbieter behält sich vor, das Programm jederzeit anzupassen, einzuschränken oder zu beenden sowie Belohnungen bei Missbrauch (z. B. Fake-Accounts) zu widerrufen.' },
                    { title: '10. Haftung', content: 'Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie nach den Vorschriften des Produkthaftungsgesetzes. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vorhersehbaren, vertragstypischen Schaden begrenzt. Im Übrigen ist die Haftung ausgeschlossen, soweit gesetzlich zulässig.' },
                    { title: '11. Verfügbarkeit', content: 'Der Anbieter bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit der App, übernimmt jedoch keine Garantie für eine bestimmte Verfügbarkeit, insbesondere bei Wartungsarbeiten oder Ausfällen von Drittanbietern (Hosting, KI-Dienste).' },
                    { title: '12. Änderung der AGB', content: 'Der Anbieter kann diese AGB mit Wirkung für die Zukunft ändern. Über wesentliche Änderungen wirst du rechtzeitig informiert. Widersprichst du nicht innerhalb von 30 Tagen, gelten die neuen AGB als akzeptiert.' },
                    { title: '13. Schlussbestimmungen', content: 'Es gilt deutsches Recht. Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.\n\nKontakt: support.kiwardrobe@gmail.com' },
                  ].map(section => (
                    <div key={section.title} style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '12px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '6px' }}>{section.title}</h3>
                      <p style={{ fontSize: '13px', color: text, lineHeight: 1.6, whiteSpace: 'pre-line' as const }}>{section.content}</p>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { title: 'Verantwortlicher', content: 'Luca Darvas\nBernd-Rosemeyer-Straße 14\n85551 Kirchheim bei München\nE-Mail: support.kiwardrobe@gmail.com' },
                    { title: 'Welche Daten wir speichern', content: '• E-Mail-Adresse und Passwort (verschlüsselt)\n• Benutzername, Geburtsdatum, Land\n• Hochgeladene Kleidungsbilder\n• Selfie-/Körperfotos für die Virtual-Try-On-Funktion\n• Generierte Outfits und Avatar-Bilder\n• Standortdaten für die Wetteranzeige und tägliche Outfit-Vorschläge\n• Push-Notification-Anmeldedaten (falls aktiviert)\n• Zahlungsbezogene Daten bei Abschluss eines Pro-Abonnements (über Stripe)\n• Referral-Code und Einladungsstatistiken\n• Nutzungsstatistiken der App' },
                    { title: 'Wofür wir Daten nutzen', content: '• Bereitstellung der App-Funktionen\n• KI-basierte Outfit-Generierung und virtuelle Anprobe (Virtual Try-On)\n• Tagesaktuelle, wetterbasierte Outfit-Vorschläge\n• Versand von Push-Benachrichtigungen (nur mit deiner Zustimmung)\n• Abwicklung von Pro-Abonnements\n• Personalisierung der Nutzererfahrung\n• Verbesserung des Services' },
                    { title: 'Standortdaten', content: 'Mit deiner Erlaubnis erfassen wir deinen ungefähren Standort (GPS-Koordinaten), um dir aktuelle Wetterdaten und passende Outfit-Vorschläge anzuzeigen. Du kannst die Standortfreigabe jederzeit über die Berechtigungen deines Geräts/Browsers widerrufen.' },
                    { title: 'Push-Benachrichtigungen', content: 'Wenn du Push-Benachrichtigungen aktivierst, speichern wir ein technisches Abonnement deines Geräts, um dir tägliche Outfit-Erinnerungen zu schicken. Du kannst dies jederzeit in deinem Profil deaktivieren.' },
                    { title: 'Zahlungen', content: 'Bei Abschluss eines KiWardrobe Pro-Abonnements werden Zahlungsdaten ausschließlich von unserem Zahlungsdienstleister Stripe verarbeitet. Wir selbst speichern keine vollständigen Kreditkartendaten.' },
                    { title: 'Freunde einladen (Referral-Programm)', content: 'Wenn du Freunde über deinen persönlichen Einladungslink einlädst, wird gespeichert, welcher Account über welchen Code registriert wurde, um die vereinbarten Prämien zu vergeben.' },
                    { title: 'Drittanbieter', content: '• Supabase (Datenspeicherung, EU-Server Frankfurt)\n• OpenAI (KI-Analyse für Outfit-Vorschläge und Stilanalyse)\n• Replicate (KI-Bildverarbeitung für Virtual Try-On/Avatar-Generierung und Hintergrundentfernung)\n• Stripe (Zahlungsabwicklung für Pro-Abonnements)\n• Vercel (Hosting, inkl. Server in den USA)\n• Open-Meteo / OpenStreetMap (Wetter- und Standortdaten)' },
                    { title: 'Deine Rechte', content: '• Auskunft über gespeicherte Daten\n• Berichtigung falscher Daten\n• Löschung deiner Daten\n• Datenportabilität\n• Widerspruch gegen die Verarbeitung\n\nKontakt: support.kiwardrobe@gmail.com' },
                    { title: 'Datenlöschung', content: 'Du kannst dein Konto inklusive aller gespeicherten Daten jederzeit selbst über die App löschen (Profil → Account löschen). Diese Löschung ist sofort wirksam und unwiderruflich.' },
                    { title: 'Speicherdauer', content: 'Deine Daten werden gespeichert, solange dein Account aktiv ist. Nach Löschung werden alle personenbezogenen Daten unverzüglich entfernt, mit Ausnahme gesetzlich vorgeschriebener Aufbewahrungsfristen für Rechnungsdaten.' },
                    { title: 'Cookies', content: 'Wir verwenden nur technisch notwendige Cookies für die Authentifizierung. Keine Werbe-Cookies, kein Tracking durch Dritte zu Werbezwecken.' },
                  ].map(section => (
                    <div key={section.title} style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '12px', fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '6px' }}>{section.title}</h3>
                      <p style={{ fontSize: '13px', color: text, lineHeight: 1.6, whiteSpace: 'pre-line' as const }}>{section.content}</p>
                    </div>
                  ))}
                </>
              )}

              <button onClick={() => setShowLegalModal(null)}
                style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: '8px' }}>
                {locale === 'de' ? 'Verstanden' : 'Got it'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}