'use client'

import { useState } from 'react'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

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
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #0F6E56, #085041)',
      display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center' as const, padding: '40px 24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', color: '#085041' }}>K</div>
        <span style={{ fontSize: '19px', fontWeight: 700, color: '#FFFFFF' }}>KiWardrobe</span>
      </div>

      <span style={{ background: '#FAEEDA', color: '#633806', fontSize: '13px', fontWeight: 600, padding: '6px 14px', borderRadius: '100px', marginBottom: '24px' }}>
        Bald verfügbar
      </span>

      <h1 style={{ fontSize: '34px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, maxWidth: '480px', marginBottom: '16px', letterSpacing: '-0.02em' }}>
        Nie wieder ratlos vorm Kleiderschrank
      </h1>

      <p style={{ fontSize: '16px', color: '#9FE1CB', maxWidth: '420px', lineHeight: 1.6, marginBottom: '40px' }}>
        Deine KI scannt das Wetter und deinen Kleiderschrank und stellt dir jeden Morgen das passende Outfit zusammen.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', width: '100%', maxWidth: '360px', marginBottom: '12px' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@email.com"
          style={{ width: '100%', height: '48px', borderRadius: '10px', border: 'none', padding: '0 16px', fontSize: '15px', background: '#FFFFFF', color: '#085041', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif" }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{ width: '100%', height: '48px', borderRadius: '10px', border: 'none', background: '#FAEEDA', color: '#633806', fontSize: '15px', fontWeight: 700, cursor: status === 'loading' ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          {status === 'loading' ? 'Wird eingetragen...' : 'Auf die Warteliste'}
        </button>
      </form>

      <p style={{ fontSize: '13px', color: status === 'error' ? '#F0997B' : '#9FE1CB', minHeight: '18px' }}>
        {status === 'success' && 'Du bist auf der Liste'}
        {status === 'error' && 'Gib eine gültige E-Mail ein'}
      </p>

      <div style={{ display: 'flex', gap: '32px', marginTop: '40px' }}>
        {['KI-Outfits', 'Wetter-Match', 'Virtual Try-On'].map((label, i) => (
          <div key={i} style={{ textAlign: 'center' as const }}>
            <p style={{ fontSize: '22px', marginBottom: '8px' }}>{['✦', '☁️', '🧍'][i]}</p>
            <p style={{ fontSize: '12px', color: '#9FE1CB' }}>{label}</p>
          </div>
        ))}
      </div>

    </div>
  )
}