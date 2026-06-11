'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggle } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'

  const selectedCountry = countries.find(c => c.code === country)

  async function handleRegister() {
    setLoading(true)
    setError('')
    const lang = selectedCountry?.lang ?? 'de'
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { username, age: parseInt(age), country, language: lang },
        emailRedirectTo: window.location.origin + '/' + lang + '/auth/callback',
      },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').update({ username, age: parseInt(age), country, language: lang }).eq('id', data.user.id)
    }
    router.push('/' + lang + '/dresser')
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)',
    borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px', position: 'relative' }}>

      {/* Top buttons */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px' }}>
        <button onClick={toggle} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '18px' }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', overflow: 'hidden', margin: '0 auto 14px', boxShadow: '0 8px 32px rgba(14,164,114,0.3)' }}>
          <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', fontWeight: 400, color: 'var(--text)', marginBottom: '4px' }}>
          Ki<em style={{ color: '#0ea472' }}>Wardrobe</em>
        </h1>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ height: '4px', width: s === step ? '24px' : '8px', borderRadius: '2px', background: s <= step ? '#0ea472' : 'var(--border)', transition: 'all 0.3s' }} />
          ))}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          {locale === 'de' ? `Schritt ${step} von 3` : `Step ${step} of 3`}
        </p>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08)' }}>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>
              {locale === 'de' ? 'Konto erstellen' : 'Create account'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
              {locale === 'de' ? 'Bereits ein Konto?' : 'Already have an account?'}{' '}
              <Link href={'/' + locale + '/auth/login'} style={{ color: '#0ea472', fontWeight: 600, textDecoration: 'none' }}>
                {locale === 'de' ? 'Einloggen' : 'Log in'}
              </Link>
            </p>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>{error}</div>}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
                {locale === 'de' ? 'Benutzername' : 'Username'}
              </label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="dein_username" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0ea472'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>E-Mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="deine@email.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0ea472'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
                {locale === 'de' ? 'Passwort' : 'Password'}
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="mind. 8 Zeichen" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#0ea472'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <button onClick={() => { if (username && email && password.length >= 8) { setError(''); setStep(2) } else setError(locale === 'de' ? 'Bitte alle Felder ausfüllen (mind. 8 Zeichen)' : 'Please fill all fields (min. 8 chars)') }}
              style={{ width: '100%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Serif Display', serif" }}>
              {locale === 'de' ? 'Weiter →' : 'Next →'}
            </button>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>
              {locale === 'de' ? 'Wie alt bist du?' : 'How old are you?'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              {locale === 'de' ? 'Für personalisierte Outfit-Vorschläge' : 'For personalized outfit suggestions'}
            </p>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '24px' }}>
              {['13-15', '16-18', '19-22', '23-27', '28-35', '35+'].map(range => (
                <button key={range} onClick={() => { setAge(range); setError('') }}
                  style={{ padding: '14px', borderRadius: '12px', border: age === range ? 'none' : '1px solid var(--border)', background: age === range ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-secondary)', color: age === range ? '#fff' : 'var(--text)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
                  {range}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>←</button>
              <button onClick={() => { if (age) { setError(''); setStep(3) } else setError(locale === 'de' ? 'Bitte Alter wählen' : 'Please select age') }}
                style={{ flex: 3, background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Serif Display', serif" }}>
                {locale === 'de' ? 'Weiter →' : 'Next →'}
              </button>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>
              {locale === 'de' ? 'Woher kommst du?' : 'Where are you from?'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              {locale === 'de' ? 'Sprache wird automatisch eingestellt' : 'Language will be set automatically'}
            </p>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '20px', maxHeight: '280px', overflowY: 'auto' as const }}>
              {countries.map(c => (
                <button key={c.code} onClick={() => { setCountry(c.code); setError('') }}
                  style={{ padding: '10px 12px', borderRadius: '10px', border: country === c.code ? 'none' : '1px solid var(--border)', background: country === c.code ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-secondary)', color: country === c.code ? '#fff' : 'var(--text)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '18px' }}>{c.flag}</span>
                  {c.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '14px', color: 'var(--text)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>←</button>
              <button onClick={() => { if (country) handleRegister(); else setError(locale === 'de' ? 'Bitte Land wählen' : 'Please select country') }} disabled={loading}
                style={{ flex: 3, background: loading ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #0ea472, #0891b2)', border: loading ? '1px solid var(--border)' : 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, color: loading ? 'var(--text-secondary)' : '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Serif Display', serif" }}>
                {loading ? '...' : locale === 'de' ? 'Konto erstellen ✦' : 'Create account ✦'}
              </button>
            </div>
          </>
        )}
      </div>

      <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        KiWardrobe · Made with ❤️
      </p>
    </div>
  )
}