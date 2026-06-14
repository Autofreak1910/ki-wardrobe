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
  is_premium: boolean
  age?: string
  country?: string
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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const [profileRes, itemsRes, outfitsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('clothing_items').select('id').eq('user_id', session.user.id),
      supabase.from('outfits').select('id').eq('user_id', session.user.id),
    ])
    if (profileRes.data) { setProfile(profileRes.data); setEditUsername(profileRes.data.username ?? '') }
    setItemCount(itemsRes.data?.length ?? 0)
    setOutfitCount(outfitsRes.data?.length ?? 0)
    setLoading(false)
  }

  async function saveUsername() {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ username: editUsername }).eq('id', profile.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setProfile(prev => prev ? { ...prev, username: editUsername } : null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/' + locale + '/auth/login')
  }

  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString(
    locale === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' }
  ) : ''

  if (loading) return (
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' as const, background: 'var(--bg)', overflow: 'hidden' }}>
      <Navbar activePage="profile" />
      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '72px 20px 100px' }}>
        {[180, 80, 120].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: '12px', background: 'var(--bg-secondary)', marginBottom: '12px', animation: 'shimmer 1.5s infinite' }} />
        ))}
      </main>
      <style>{`@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' as const, background: 'var(--bg)', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar activePage="profile" />
      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '72px 20px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>
              {profile?.username?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  {profile?.username ?? 'User'}
                </h1>
                {profile?.is_premium && (
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 6px', letterSpacing: '0.05em' }}>PRO</span>
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {locale === 'de' ? 'Dabei seit' : 'Since'} {memberSince}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { label: locale === 'de' ? 'Teile' : 'Items', value: itemCount },
              { label: 'Outfits', value: outfitCount },
              { label: 'Plan', value: profile?.is_premium ? 'Pro' : 'Free' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 12px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '2px' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade */}
        {!profile?.is_premium && (
          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px', letterSpacing: '-0.01em' }}>KiWardrobe Pro</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {locale === 'de' ? '15 Outfits täglich · Style DNA' : '15 outfits daily · Style DNA'}
              </p>
            </div>
            <button style={{ background: 'var(--text)', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--bg)', cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
              €4,99
            </button>
          </div>
        )}

        {/* Edit Username */}
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
              {locale === 'de' ? 'Profil' : 'Profile'}
            </p>
          </div>
          <div style={{ padding: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              {locale === 'de' ? 'Benutzername' : 'Username'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', color: 'var(--text)', outline: 'none', fontFamily: "'DM Sans', sans-serif", background: 'var(--bg-secondary)', minWidth: 0 }} />
              <button onClick={saveUsername} disabled={saving}
                style={{ background: saved ? 'var(--text)' : 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 14px', fontSize: '13px', fontWeight: 500, color: saved ? 'var(--bg)' : 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                {saved ? '✓' : saving ? '...' : locale === 'de' ? 'Speichern' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
              {locale === 'de' ? 'Einstellungen' : 'Settings'}
            </p>
          </div>
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>Dark Mode</p>
              <button onClick={toggle} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', background: isDark ? 'var(--text)' : 'var(--border)', cursor: 'pointer', position: 'relative' as const, transition: 'background 0.2s' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: isDark ? 'var(--bg)' : '#fff', position: 'absolute', top: '3px', transition: 'left 0.2s', left: isDark ? '23px' : '3px' }} />
              </button>
            </div>
            <div style={{ height: '1px', background: 'var(--border)', margin: '0 14px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>{locale === 'de' ? 'Sprache' : 'Language'}</p>
              <button onClick={() => {
                const nl = locale === 'de' ? 'en' : 'de'
                const s = window.location.pathname.split('/')
                s[1] = nl
                window.location.replace(s.join('/'))
              }} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                {locale === 'de' ? 'EN' : 'DE'}
              </button>
            </div>
          </div>
        </div>

        {/* Links */}
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ padding: '4px 0' }}>
            {[
              { label: locale === 'de' ? 'Feedback' : 'Feedback', path: '/feedback' },
              { label: locale === 'de' ? 'Impressum & Datenschutz' : 'Legal & Privacy', path: '/legal' },
            ].map((item, i) => (
              <div key={item.path}>
                {i > 0 && <div style={{ height: '1px', background: 'var(--border)', margin: '0 14px' }} />}
                <button onClick={() => router.push('/' + locale + item.path)}
                  style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', fontSize: '14px', color: 'var(--text)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {item.label}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>›</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', fontSize: '14px', color: '#ef4444', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, textAlign: 'left' as const }}>
            {locale === 'de' ? 'Abmelden' : 'Sign out'}
          </button>
        </div>

        <p style={{ textAlign: 'center' as const, fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.03em' }}>
          KiWardrobe v1.0
        </p>
      </main>
    </div>
  )
}