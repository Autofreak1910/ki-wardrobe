'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

type Profile = {
  id: string
  username: string
  avatar_url?: string
  is_premium: boolean
  age?: string
  country?: string
  language?: string
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [itemCount, setItemCount] = useState(0)
  const [outfitCount, setOutfitCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editUsername, setEditUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { theme, toggle } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const isDark = theme === 'dark'

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, itemsRes, outfitsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('clothing_items').select('id').eq('user_id', user.id),
      supabase.from('outfits').select('id').eq('user_id', user.id),
    ])

    if (profileRes.data) {
      setProfile(profileRes.data)
      setEditUsername(profileRes.data.username ?? '')
    }
    setItemCount(itemsRes.data?.length ?? 0)
    setOutfitCount(outfitsRes.data?.length ?? 0)
    setLoading(false)
  }

  async function saveUsername() {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ username: editUsername }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setProfile(prev => prev ? { ...prev, username: editUsername } : null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/' + locale + '/auth/login')
  }

  function switchLanguage() {
    const newLocale = locale === 'de' ? 'en' : 'de'
    const segments = pathname.split('/')
    segments[1] = newLocale
    window.location.replace(segments.join('/'))
  }

  const countryFlags: Record<string, string> = {
    de: '🇩🇪', at: '🇦🇹', ch: '🇨🇭', us: '🇺🇸', gb: '🇬🇧',
    au: '🇦🇺', ca: '🇨🇦', fr: '🇫🇷', it: '🇮🇹', es: '🇪🇸', nl: '🇳🇱', other: '🌍'
  }

  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' }) : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: 'var(--text-secondary)' }}>Laden...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text)' }}>
          Ki<em style={{ color: '#0ea472' }}>Wardrobe</em>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['dresser', 'wardrobe', 'outfits', 'style'].map(page => (
            <button key={page} onClick={() => router.push('/' + locale + '/' + page)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif", background: 'transparent', color: 'var(--text-secondary)' }}>
              {page === 'dresser' ? 'Dress Me' : page === 'wardrobe' ? (locale === 'de' ? 'Kleiderschrank' : 'Wardrobe') : page === 'outfits' ? 'Outfits' : 'Style DNA'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={switchLanguage} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
            {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
          </button>
          <button onClick={toggle} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Profile Header */}
        <div style={{ background: 'linear-gradient(135deg, #0ea472, #0891b2)', borderRadius: '20px', padding: '32px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {profile?.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', color: '#fff', fontWeight: 400 }}>
                  {profile?.username ?? 'User'}
                </h1>
                {profile?.is_premium && (
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                    ✦ PREMIUM
                  </span>
                )}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '4px' }}>
                {countryFlags[profile?.country ?? ''] ?? '🌍'} {profile?.age ? `${profile.age} Jahre` : ''}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                Dabei seit {memberSince}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '24px' }}>
            {[
              { label: locale === 'de' ? 'Kleidungsstücke' : 'Items', value: itemCount },
              { label: 'Outfits', value: outfitCount },
              { label: locale === 'de' ? 'Stil Score' : 'Style Score', value: '✦' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Banner */}
        {!profile?.is_premium && (
          <div style={{ background: isDark ? 'rgba(14,164,114,0.08)' : '#f0fdf8', border: '1px solid rgba(14,164,114,0.2)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>✦ KiWardrobe Premium</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {locale === 'de' ? 'Unbegrenzte Outfits · Style DNA · Reise-Assistent' : 'Unlimited Outfits · Style DNA · Travel Assistant'}
              </p>
            </div>
            <button style={{ background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' as const }}>
              €6,99/Monat
            </button>
          </div>
        )}

        {/* Settings */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              {locale === 'de' ? 'Profil bearbeiten' : 'Edit Profile'}
            </p>
          </div>
          <div style={{ padding: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
              {locale === 'de' ? 'Benutzername' : 'Username'}
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'var(--text)', outline: 'none', fontFamily: "'DM Sans', sans-serif' " }}
                onFocus={e => e.target.style.borderColor = '#0ea472'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              <button onClick={saveUsername} disabled={saving}
                style={{ background: saved ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 18px', fontSize: '13px', fontWeight: 500, color: saved ? '#fff' : 'var(--text)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' as const }}>
                {saved ? '✓' : saving ? '...' : locale === 'de' ? 'Speichern' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              {locale === 'de' ? 'App Einstellungen' : 'App Settings'}
            </p>
          </div>
          {[
            {
              label: locale === 'de' ? 'Dark Mode' : 'Dark Mode',
              sub: locale === 'de' ? 'Dunkles Design' : 'Dark theme',
              action: (
                <button onClick={toggle} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: isDark ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--border)', cursor: 'pointer', position: 'relative' as const, transition: 'all 0.2s' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'all 0.2s', left: isDark ? '23px' : '3px' }} />
                </button>
              )
            },
            {
              label: locale === 'de' ? 'Sprache' : 'Language',
              sub: locale === 'de' ? 'Deutsch' : 'English',
              action: (
                <button onClick={switchLanguage} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                  {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
                </button>
              )
            },
          ].map((item, i, arr) => (
            <div key={item.label} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{item.label}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.sub}</p>
              </div>
              {item.action}
            </div>
          ))}
        </div>

        {/* Account */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Account</p>
          </div>
          <div style={{ padding: '8px' }}>
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', borderRadius: '10px', fontSize: '14px', color: '#ef4444', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚪 {locale === 'de' ? 'Abmelden' : 'Sign out'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '24px' }}>
          KiWardrobe v1.0 · {locale === 'de' ? 'Made with ❤️' : 'Made with ❤️'}
        </p>
      </main>
    </div>
  )
}