'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

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

  const countryFlags: Record<string, string> = {
    de: '🇩🇪', at: '🇦🇹', ch: '🇨🇭', us: '🇺🇸', gb: '🇬🇧',
    au: '🇦🇺', ca: '🇨🇦', fr: '🇫🇷', it: '🇮🇹', es: '🇪🇸', nl: '🇳🇱', other: '🌍'
  }

  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString(
    locale === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' }
  ) : ''

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Laden...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar activePage="profile" />

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px 100px 16px' }}>

        {/* Profile Header */}
        <div style={{ background: 'linear-gradient(135deg, #0ea472, #0891b2)', borderRadius: '20px', padding: '24px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              {profile?.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' as const }}>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#fff', fontWeight: 400 }}>
                  {profile?.username ?? 'User'}
                </h1>
                {profile?.is_premium && (
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>✦ PREMIUM</span>
                )}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '2px' }}>
                {countryFlags[profile?.country ?? ''] ?? '🌍'} {profile?.age ? `${profile.age}` : ''}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{locale === 'de' ? 'Dabei seit' : 'Member since'} {memberSince}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { label: locale === 'de' ? 'Teile' : 'Items', value: itemCount },
              { label: 'Outfits', value: outfitCount },
              { label: locale === 'de' ? 'Score' : 'Score', value: '✦' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Banner */}
        {!profile?.is_premium && (
          <div style={{ background: isDark ? 'rgba(14,164,114,0.08)' : '#f0fdf8', border: '1px solid rgba(14,164,114,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>✦ KiWardrobe Premium</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {locale === 'de' ? 'Unbegrenzte Outfits · Style DNA' : 'Unlimited Outfits · Style DNA'}
                </p>
              </div>
              <button style={{ background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                €6,99
              </button>
            </div>
          </div>
        )}

        {/* Edit Profile */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              {locale === 'de' ? 'Profil bearbeiten' : 'Edit Profile'}
            </p>
          </div>
          <div style={{ padding: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
              {locale === 'de' ? 'Benutzername' : 'Username'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'var(--text)', outline: 'none', fontFamily: "'DM Sans', sans-serif", background: 'var(--bg-secondary)', minWidth: 0 }}
                onFocus={e => e.target.style.borderColor = '#0ea472'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              <button onClick={saveUsername} disabled={saving}
                style={{ background: saved ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 16px', fontSize: '13px', fontWeight: 500, color: saved ? '#fff' : 'var(--text)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                {saved ? '✓' : saving ? '...' : locale === 'de' ? 'Speichern' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              {locale === 'de' ? 'Einstellungen' : 'Settings'}
            </p>
          </div>
          <div style={{ padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', margin: '0 8px' }}>
            <div style={{ padding: '12px 8px' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>Dark Mode</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{isDark ? (locale === 'de' ? 'Dunkel' : 'Dark') : (locale === 'de' ? 'Hell' : 'Light')}</p>
            </div>
            <button onClick={toggle} style={{ width: '48px', height: '26px', borderRadius: '13px', border: 'none', background: isDark ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--border)', cursor: 'pointer', position: 'relative' as const, transition: 'all 0.2s', flexShrink: 0 }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'all 0.2s', left: isDark ? '25px' : '3px' }} />
            </button>
          </div>
          <div style={{ padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 8px' }}>
            <div style={{ padding: '12px 8px' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{locale === 'de' ? 'Sprache' : 'Language'}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{locale === 'de' ? 'Deutsch' : 'English'}</p>
            </div>
            <button onClick={() => {
              const newLocale = locale === 'de' ? 'en' : 'de'
              const segments = window.location.pathname.split('/')
              segments[1] = newLocale
              window.location.replace(segments.join('/'))
            }} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
              {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
            </button>
          </div>
        </div>

        {/* Account */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ padding: '8px' }}>
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', borderRadius: '10px', fontSize: '15px', color: '#ef4444', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚪 {locale === 'de' ? 'Abmelden' : 'Sign out'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px', marginBottom: '8px' }}>
          KiWardrobe v1.0 · Made with ❤️
        </p>
      </main>
    </div>
  )
}