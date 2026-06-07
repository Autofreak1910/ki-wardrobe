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
    const redirectTo = window.location.origin + '/' + lang + '/auth/callback'

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, age: parseInt(age), country, language: lang },
        emailRedirectTo: redirectTo,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').update({
        username,
        age: parseInt(age),
        country,
        language: lang,
      }).eq('id', data.user.id)
    }

    router.push('/' + lang + '/dresser')
  }

  const inputStyle = {
    width: '100%', border: '1.5px solid var(--border)', borderRadius: '10px',
    padding: '13px 16px', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100, display: 'flex', gap: '8px' }}>
        <button onClick={toggle} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '18px' }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Left Side */}
      <div style={{ width: '50%', background: isDark ? 'linear-gradient(145deg, #0a3d2b 0%, #0a2e3d 100%)' : 'linear-gradient(145deg, #0ea472 0%, #0891b2 100%)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.3)' }}>👗</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '42px', color: '#fff', fontWeight: 400, lineHeight: 1.1, marginBottom: '16px' }}>Ki<em>Wardrobe</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', lineHeight: 1.6, maxWidth: '260px' }}>
            Dein persönlicher KI-Stylist. Jeden Morgen das perfekte Outfit.
          </p>
          <div style={{ marginTop: '32px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ width: s === step ? '24px' : '8px', height: '8px', borderRadius: '4px', background: s === step ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }} />
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '12px' }}>
            Schritt {step} von 3
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div style={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/* Step 1 — Account */}
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>Konto erstellen</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
                Bereits ein Konto? <Link href={'/' + locale + '/auth/login'} style={{ color: '#0ea472', fontWeight: 500, textDecoration: 'none' }}>Einloggen</Link>
              </p>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>{error}</div>}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Benutzername</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="dein_username" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0ea472'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>E-Mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="deine@email.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0ea472'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ marginBottom: '28px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Passwort</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="mind. 8 Zeichen" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0ea472'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <button onClick={() => { if (username && email && password.length >= 8) { setError(''); setStep(2) } else setError('Bitte alle Felder ausfüllen (mind. 8 Zeichen Passwort)') }}
                style={{ width: '100%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Weiter →
              </button>
            </>
          )}

          {/* Step 2 — Alter */}
          {step === 2 && (
            <>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>Wie alt bist du?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>Die KI personalisiert deine Outfits basierend auf deinem Stil</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px' }}>
                {['13-15', '16-18', '19-22', '23-27', '28-35', '35+'].map(range => (
                  <button key={range} onClick={() => setAge(range)}
                    style={{ padding: '14px', borderRadius: '12px', border: age === range ? 'none' : '1px solid var(--border)', background: age === range ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-secondary)', color: age === range ? '#fff' : 'var(--text)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
                    {range}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', color: 'var(--text)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>← Zurück</button>
                <button onClick={() => { if (age) setStep(3); else setError('Bitte Alter wählen') }}
                  style={{ flex: 2, background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Weiter →
                </button>
              </div>
            </>
          )}

          {/* Step 3 — Land */}
          {step === 3 && (
            <>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>Woher kommst du?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Wir stellen die Sprache automatisch ein</p>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '24px', maxHeight: '320px', overflowY: 'auto' as const }}>
                {countries.map(c => (
                  <button key={c.code} onClick={() => setCountry(c.code)}
                    style={{ padding: '12px', borderRadius: '10px', border: country === c.code ? 'none' : '1px solid var(--border)', background: country === c.code ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-secondary)', color: country === c.code ? '#fff' : 'var(--text)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' }}>
                    <span style={{ fontSize: '20px' }}>{c.flag}</span>
                    {c.name}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', color: 'var(--text)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>← Zurück</button>
                <button onClick={() => { if (country) handleRegister(); else setError('Bitte Land wählen') }} disabled={loading}
                  style={{ flex: 2, background: loading ? '#9ca3af' : 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {loading ? 'Wird erstellt...' : 'Konto erstellen ✦'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}