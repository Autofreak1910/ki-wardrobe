'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'

type Profile = { id: string; username: string; is_premium: boolean; age?: string; country?: string; created_at: string }

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

  const bg     = isDark ? '#080f0c' : '#f0fdf8'
  const card   = isDark ? '#0f1a14' : '#ffffff'
  const border = isDark ? '#1a3328' : '#d1f0e4'
  const text   = isDark ? '#e8f5ee' : '#0a2e1e'
  const muted  = isDark ? '#4d7a62' : '#6b9e87'
  const accent = '#0ea472'
  const accentDim = isDark ? 'rgba(14,164,114,0.1)' : 'rgba(14,164,114,0.1)'

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

  const initial = profile?.username?.charAt(0).toUpperCase() ?? '?'

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden' }}>
      <Navbar activePage="profile" />
      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '84px 20px 108px' }}>
        {[180, 80, 140].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: '14px', background: card, border: `1px solid ${border}`, marginBottom: '10px', animation: 'shimmer 1.5s infinite' }} />
        ))}
      </main>
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  )

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", position: 'relative' as const }}>

      {/* Background */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: isDark ? 'rgba(14,164,114,0.06)' : 'rgba(14,164,114,0.1)', filter: 'blur(90px)' }} />
        {!isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="pdots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.9" fill="#0ea472" opacity="0.25" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#pdots)" />
          </svg>
        )}
      </div>

      <Navbar activePage="profile" />

      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '84px 20px 108px', position: 'relative', zIndex: 1 }}>

        {/* Avatar + name */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${accent}, #0891b2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 4px 16px rgba(14,164,114,0.4)' }}>
              {initial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: text, letterSpacing: '-0.03em' }}>
                  {profile?.username ?? 'User'}
                </h1>
                {profile?.is_premium && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: accent, background: accentDim, border: `1px solid ${border}`, borderRadius: '6px', padding: '2px 7px', letterSpacing: '0.05em' }}>PRO</span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: muted }}>
                {locale === 'de' ? 'Dabei seit' : 'Member since'} {memberSince}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { label: locale === 'de' ? 'Teile' : 'Items', value: itemCount, icon: '👗' },
              { label: 'Outfits', value: outfitCount, icon: '✦' },
              { label: 'Plan', value: profile?.is_premium ? 'Pro' : 'Free', icon: '⚡' },
            ].map(stat => (
              <div key={stat.label} style={{ background: card, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 12px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: text, letterSpacing: '-0.03em', marginBottom: '2px' }}>{stat.value}</p>
                <p style={{ fontSize: '11px', color: muted, fontWeight: 500 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade banner */}
        {!profile?.is_premium && (
          <motion.div whileTap={{ scale: 0.99 }}
            style={{ background: `linear-gradient(135deg, rgba(14,164,114,0.12), rgba(8,145,178,0.08))`, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px 18px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '3px', letterSpacing: '-0.02em' }}>KiWardrobe Pro</p>
              <p style={{ fontSize: '12px', color: muted }}>
                {locale === 'de' ? '15 Outfits täglich · Style DNA · Kein Limit' : '15 outfits daily · Style DNA · No limits'}
              </p>
            </div>
            <button style={{ background: `linear-gradient(135deg, ${accent}, #0891b2)`, border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0, boxShadow: '0 2px 12px rgba(14,164,114,0.4)', letterSpacing: '-0.01em' }}>
              €4,99 / Mo
            </button>
          </motion.div>
        )}

        {/* Username */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, background: accentDim }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              {locale === 'de' ? 'Profil' : 'Profile'}
            </p>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              {locale === 'de' ? 'Benutzername' : 'Username'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                style={{ flex: 1, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: text, outline: 'none', fontFamily: "'DM Sans', sans-serif", background: isDark ? '#0a1510' : '#f0fdf8', minWidth: 0, letterSpacing: '-0.01em' }} />
              <motion.button whileTap={{ scale: 0.95 }} onClick={saveUsername} disabled={saving}
                style={{ background: saved ? accent : 'transparent', border: `1px solid ${saved ? accent : border}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: saved ? '#fff' : text, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.2s', boxShadow: saved ? '0 2px 10px rgba(14,164,114,0.35)' : 'none' }}>
                {saved ? '✓' : saving ? '...' : locale === 'de' ? 'Speichern' : 'Save'}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, background: accentDim }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
              {locale === 'de' ? 'Einstellungen' : 'Settings'}
            </p>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <p style={{ fontSize: '14px', color: text, fontWeight: 500, letterSpacing: '-0.01em' }}>Dark Mode</p>
              <button onClick={toggle}
                style={{ width: '44px', height: '26px', borderRadius: '13px', border: 'none', background: isDark ? accent : border, cursor: 'pointer', position: 'relative' as const, transition: 'background 0.2s', boxShadow: isDark ? '0 2px 8px rgba(14,164,114,0.4)' : 'none' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'left 0.2s', left: isDark ? '21px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
            <div style={{ height: '1px', background: border, margin: '0 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <p style={{ fontSize: '14px', color: text, fontWeight: 500, letterSpacing: '-0.01em' }}>{locale === 'de' ? 'Sprache' : 'Language'}</p>
              <button onClick={() => {
                const nl = locale === 'de' ? 'en' : 'de'
                const s = window.location.pathname.split('/')
                s[1] = nl; window.location.replace(s.join('/'))
              }} style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: accent, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em' }}>
                {locale === 'de' ? 'EN' : 'DE'}
              </button>
            </div>
          </div>
        </div>

        {/* Links */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' }}>
          {[
            { label: 'Feedback', path: '/feedback' },
            { label: locale === 'de' ? 'Impressum & Datenschutz' : 'Legal & Privacy', path: '/legal' },
          ].map((item, i) => (
            <div key={item.path}>
              {i > 0 && <div style={{ height: '1px', background: border, margin: '0 16px' }} />}
              <button onClick={() => router.push('/' + locale + item.path)}
                style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', fontSize: '14px', color: text, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between', alignItems: 'center', letterSpacing: '-0.01em' }}>
                {item.label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', fontSize: '14px', color: '#ef4444', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textAlign: 'left' as const, letterSpacing: '-0.01em' }}>
            {locale === 'de' ? 'Abmelden' : 'Sign out'}
          </button>
        </div>

        <p style={{ textAlign: 'center' as const, fontSize: '11px', color: muted, letterSpacing: '0.04em' }}>
          KiWardrobe · v1.0
        </p>
      </main>
    </div>
  )
}