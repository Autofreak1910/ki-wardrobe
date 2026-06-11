'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { theme, toggle } = useTheme()
  const t = useTranslations('auth')
  const locale = useLocale()
  const isDark = theme === 'dark'

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/' + locale + '/dresser')
    }
  }

  function switchLocale(newLocale: string) {
    const newPath = pathname.replace('/' + locale, '/' + newLocale)
    router.push(newPath)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px', position: 'relative' }}>

      {/* Top buttons */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '8px' }}>
        <button onClick={() => switchLocale(locale === 'de' ? 'en' : 'de')}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
          {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
        </button>
        <button onClick={toggle}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '18px' }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Logo + Icon */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '22px', overflow: 'hidden', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(14,164,114,0.3)' }}>
          <img src="/icon-512.png" alt="KiWardrobe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>
          Ki<em style={{ color: '#0ea472' }}>Wardrobe</em>
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('tagline')}</p>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.08)' }}>

        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '26px', fontWeight: 400, color: 'var(--text)', marginBottom: '6px' }}>
          {t('welcomeBack')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
          {t('noAccount')}{' '}
          <Link href={'/' + locale + '/auth/register'} style={{ color: '#0ea472', fontWeight: 600, textDecoration: 'none' }}>
            {t('register')}
          </Link>
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>{t('email')}</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="deine@email.com"
            style={{ width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#0ea472'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>{t('password')}</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            style={{ width: '100%', background: 'var(--bg-secondary)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#0ea472'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', background: loading ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #0ea472 0%, #0891b2 100%)', border: loading ? '1px solid var(--border)' : 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, color: loading ? 'var(--text-secondary)' : '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Serif Display', serif", transition: 'all 0.2s' }}>
          {loading ? t('loading') : t('loginButton')}
        </button>

        {/* Features */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'center' }}>
          {[t('feature1'), t('feature2'), t('feature3')].map((feat, i) => (
            <div key={i} style={{ flex: 1, background: isDark ? 'rgba(14,164,114,0.08)' : 'rgba(14,164,114,0.06)', borderRadius: '10px', padding: '8px 6px', fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center' as const, border: '1px solid rgba(14,164,114,0.12)', lineHeight: 1.4 }}>
              ✦ {feat}
            </div>
          ))}
        </div>
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        KiWardrobe · Made with ❤️
      </p>
    </div>
  )
}