'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function notifyReferrerIfAny() {
    try {
      const params = new URLSearchParams(window.location.search)
      const refCode = params.get('ref')
      if (!refCode) return

      // Wer hat diesen Code? -- Referrer-Profil anhand des Codes finden.
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('referral_code', refCode)
        .single()

      if (!referrer?.id) return

      // Push an den Einlader schicken, ueber den bestehenden Send-Endpoint.
      await fetch('/api/send-push-to-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: referrer.id,
          title: '🎉 Neue Einladung!',
          body: username
            ? `${username} hat sich über deinen Link angemeldet!`
            : 'Jemand hat sich über deinen Link angemeldet!',
          url: '/de/dresser?referral_reward=true',
        }),
      })
    } catch (err) {
      // Push-Fehler duerfen die Registrierung selbst nie blockieren.
      console.error('Referrer push notification failed:', err)
    }
  }

  async function handleRegister() {
    setLoading(true)
    setError('')
    const params = new URLSearchParams(window.location.search)
    const refCode = params.get('ref')
    const redirectTo = window.location.origin + '/auth/callback'
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { username, ...(refCode ? { referral_code: refCode } : {}) },
        emailRedirectTo: redirectTo,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      await notifyReferrerIfAny()
      router.push('/dresser')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f0faf4',
      display: 'flex', fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={{
        width: '50%',
        background: 'linear-gradient(145deg, #0ea472 0%, #0891b2 100%)',
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center',
        padding: '48px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.3)' }}>👗</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '42px', color: '#fff', fontWeight: 400, lineHeight: 1.1, marginBottom: '16px' }}>
            Ki<em>Wardrobe</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', lineHeight: 1.6, maxWidth: '260px' }}>
            Erstelle deinen digitalen Kleiderschrank und lass die KI stylen.
          </p>
        </div>
      </div>

      <div style={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', fontWeight: 400, color: '#0a0a0a', marginBottom: '8px' }}>
            Konto erstellen
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '36px' }}>
            Bereits ein Konto?{' '}
            <Link href="/auth/login" style={{ color: '#0ea472', fontWeight: 500, textDecoration: 'none' }}>Einloggen</Link>
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>{error}</div>
          )}

          {[
            { label: 'Benutzername', type: 'text', value: username, set: setUsername, placeholder: 'dein_username' },
            { label: 'E-Mail', type: 'email', value: email, set: setEmail, placeholder: 'deine@email.com' },
            { label: 'Passwort', type: 'password', value: password, set: setPassword, placeholder: 'mind. 8 Zeichen' },
          ].map(({ label, type, value, set, placeholder }, i) => (
            <div key={label} style={{ marginBottom: i === 2 ? '28px' : '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>{label}</label>
              <input
                type={type}
                value={value}
                onChange={e => set(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                placeholder={placeholder}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '13px 16px', fontSize: '14px', color: '#0a0a0a', outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif", background: '#fafafa' }}
                onFocus={e => e.target.style.borderColor = '#0ea472'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          ))}

          <button
            onClick={handleRegister}
            disabled={loading}
            style={{ width: '100%', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #0ea472 0%, #0891b2 100%)', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            {loading ? 'Wird erstellt...' : 'Konto erstellen →'}
          </button>
        </div>
      </div>
    </div>
  )
}