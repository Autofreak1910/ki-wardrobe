'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTheme } from '@/context/ThemeContext'

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const router = useRouter()
  const locale = useLocale()
  const supabase = createClient()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setStatus('success')
        setTimeout(() => {
          router.push('/' + locale + '/dresser')
        }, 2500)
      } else {
        setStatus('error')
      }
    }
    checkSession()
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
            <div style={{ marginTop: '24px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', borderRadius: '2px', animation: 'loading 1.5s ease-in-out infinite' }} />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>✓</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>
              {locale === 'de' ? 'Email bestätigt! 🎉' : 'Email confirmed! 🎉'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {locale === 'de' ? 'Willkommen bei KiWardrobe! Du wirst weitergeleitet...' : 'Welcome to KiWardrobe! Redirecting you...'}
            </p>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', borderRadius: '2px', animation: 'progress 2.5s linear forwards' }} />
            </div>
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

      <style>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}