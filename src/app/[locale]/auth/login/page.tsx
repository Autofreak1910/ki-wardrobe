'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100, display: 'flex', gap: '8px' }}>
        <button onClick={() => switchLocale(locale === 'de' ? 'en' : 'de')}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
          {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
        </button>
        <button onClick={toggle}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '18px' }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <div style={{
        width: '50%',
        background: isDark ? 'linear-gradient(145deg, #0a3d2b 0%, #0a2e3d 100%)' : 'linear-gradient(145deg, #0ea472 0%, #0891b2 100%)',
        display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
        padding: '48px', position: 'relative', overflow: 'hidden', transition: 'background 0.3s',
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: isDark ? 'rgba(14,164,114,0.2)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 24px', border: isDark ? '1px solid rgba(14,164,114,0.3)' : '1px solid rgba(255,255,255,0.3)' }}>👗</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '42px', color: '#fff', fontWeight: 400, lineHeight: 1.1, marginBottom: '16px' }}>Ki<em>Wardrobe</em></h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', lineHeight: 1.6, maxWidth: '260px' }}>{t('tagline')}</p>
          <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
            {[t('feature1'), t('feature2'), t('feature3')].map(feat => (
              <div key={feat} style={{ background: isDark ? 'rgba(14,164,114,0.1)' : 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#fff', textAlign: 'left', border: isDark ? '1px solid rgba(14,164,114,0.2)' : '1px solid rgba(255,255,255,0.15)' }}>✦ {feat}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', fontWeight: 400, color: 'var(--text)', marginBottom: '8px' }}>{t('welcomeBack')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '36px' }}>
            {t('noAccount')}{' '}
            <Link href={'/' + locale + '/auth/register'} style={{ color: '#0ea472', fontWeight: 500, textDecoration: 'none' }}>{t('register')}</Link>
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>{error}</div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>{t('email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="deine@email.com"
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '13px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif" }}
              onFocus={e => e.target.style.borderColor = '#0ea472'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>{t('password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••"
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '13px 16px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif" }}
              onFocus={e => e.target.style.borderColor = '#0ea472'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #0ea472 0%, #0891b2 100%)', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {loading ? t('loading') : t('loginButton')}
          </button>
        </div>
      </div>
    </div>
  )
}