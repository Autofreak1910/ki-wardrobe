'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const supabase = createClient()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    async function confirmEmail() {
      const code = searchParams.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Code exchange failed:', error)
          setStatus('error')
          return
        }
        setStatus('success')
        return
      }

      // Kein code-Parameter -- evtl. schon eingeloggt (z.B. erneuter Aufruf der Seite)
      const { data: { session } } = await supabase.auth.getSession()
      setStatus(session ? 'success' : 'error')
    }
    confirmEmail()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>

      <div style={{ width: '72px', height: '72px', borderRadius: '20px', overflow: 'hidden', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(14,164,114,0.3)' }}>
        <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', fontWeight: 400, color: 'var(--text)', marginBottom: '32px' }}>
        Ki<em style={{ color: '#0ea472' }}>Wardrobe</em>
      </h1>

      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px 32px', textAlign: 'center', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08)' }}>

        {status === 'loading' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>
              {locale === 'de' ? 'Wird bestätigt...' : 'Confirming...'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {locale === 'de' ? 'Einen Moment bitte' : 'Just a moment'}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>✓</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>
              {locale === 'de' ? 'E-Mail bestätigt! 🎉' : 'Email confirmed! 🎉'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              {locale === 'de'
                ? 'Du kannst dieses Fenster jetzt schließen und zu deinem Registrierungs-Tab zurückgehen — dort geht es automatisch weiter.'
                : 'You can close this window now and go back to your registration tab — it will continue automatically.'}
            </p>
            <button onClick={() => router.push('/' + locale + '/auth/register')}
              style={{ width: '100%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Serif Display', serif" }}>
              {locale === 'de' ? 'Hier weiter registrieren' : 'Continue registration here'}
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>
              {locale === 'de' ? 'Link abgelaufen' : 'Link expired'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {locale === 'de' ? 'Bitte registriere dich erneut.' : 'Please register again.'}
            </p>
            <button onClick={() => router.push('/' + locale + '/auth/register')}
              style={{ width: '100%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Serif Display', serif" }}>
              {locale === 'de' ? 'Neu registrieren' : 'Register again'}
            </button>
          </>
        )}
      </div>

      <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        KiWardrobe · Made with ❤️
      </p>
    </div>
  )
}