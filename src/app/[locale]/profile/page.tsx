'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'

type Profile = { id: string; username: string; is_premium: boolean; age?: string; country?: string; created_at: string; email?: string; gender?: string; style_preferences?: string[]; budget_range?: string }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [itemCount, setItemCount] = useState(0)
  const [outfitCount, setOutfitCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editUsername, setEditUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [dna, setDna] = useState<any>(null)
  const [dnaLoading, setDnaLoading] = useState(false)
  const [showDna, setShowDna] = useState(false)
  const { theme, toggle } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isDark = theme === 'dark'

  const bg        = isDark ? '#080c18' : '#f0f4ff'
  const card      = isDark ? '#0d1225' : '#ffffff'
  const border    = isDark ? '#1a2540' : '#dde3f5'
  const text      = isDark ? '#e8eeff' : '#0a1628'
  const muted     = isDark ? '#4d6080' : '#6b7fa8'
  const accent    = isDark ? '#4d7eff' : '#3b6bff'
  const accentDim = isDark ? 'rgba(77,126,255,0.1)' : 'rgba(59,107,255,0.08)'

  const todayOutfits = (() => {
    const today = new Date().toDateString()
    const lastDate = localStorage.getItem('kw_outfit_date')
    return lastDate === today ? parseInt(localStorage.getItem('kw_outfit_count') ?? '0') : 0
  })()

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const [profileRes, itemsRes, outfitsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('clothing_items').select('id').eq('user_id', session.user.id),
      supabase.from('outfits').select('id').eq('user_id', session.user.id),
    ])
    if (profileRes.data) { setProfile({ ...profileRes.data, email: session.user.email }); setEditUsername(profileRes.data.username ?? '') }
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

  async function generateStyleDna() {
    setDnaLoading(true)
    setShowDna(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const { data: items } = await supabase.from('clothing_items').select('*').eq('user_id', session.user.id)
    if (!items || items.length < 3) { setDnaLoading(false); return }
    const res = await fetch('/api/style-dna', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-locale': locale },
      body: JSON.stringify({ items }),
    })
    const data = await res.json()
    if (data.success) setDna(data.dna)
    setDnaLoading(false)
  }

  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString(
    locale === 'de' ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' }
  ) : ''

  const initial = profile?.username?.charAt(0).toUpperCase() ?? '?'
  const isPremium = profile?.is_premium ?? false

  const genderLabel = (g?: string) => {
    if (!g) return '—'
    if (g === 'male') return locale === 'de' ? 'Mann' : 'Male'
    if (g === 'female') return locale === 'de' ? 'Frau' : 'Female'
    return locale === 'de' ? 'Divers' : 'Other'
  }

  const budgetLabel = (b?: string) => {
    if (!b) return '—'
    if (b === 'low') return '< €50'
    if (b === 'mid') return '€50–200'
    return '> €200'
  }

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

      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: isDark ? 'rgba(77,126,255,0.06)' : 'rgba(59,107,255,0.1)', filter: 'blur(90px)' }} />
        {!isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="pdots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.9" fill="#3b6bff" opacity="0.2" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#pdots)" />
          </svg>
        )}
      </div>

      <Navbar activePage="profile" />

      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '84px 20px 108px', position: 'relative', zIndex: 1 }}>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: `0 4px 20px ${accent}50` }}>
              {initial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: text, letterSpacing: '-0.03em' }}>{profile?.username ?? 'User'}</h1>
                {isPremium ? (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, borderRadius: '6px', padding: '3px 8px' }}>PRO ✦</span>
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: muted, background: accentDim, border: `1px solid ${border}`, borderRadius: '6px', padding: '3px 8px' }}>FREE</span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: muted }}>{locale === 'de' ? 'Dabei seit' : 'Member since'} {memberSince}</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { label: locale === 'de' ? 'Kleidung' : 'Items', value: itemCount, max: isPremium ? null : 20 },
              { label: locale === 'de' ? 'Outfits heute' : 'Today', value: todayOutfits, max: isPremium ? null : 3 },
              { label: locale === 'de' ? 'Gespeichert' : 'Saved', value: outfitCount, max: isPremium ? null : 5 },
            ].map(stat => (
              <div key={stat.label} style={{ background: card, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 12px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: stat.max && stat.value >= stat.max ? '#ef4444' : text, letterSpacing: '-0.03em', marginBottom: '2px' }}>
                  {stat.value}{stat.max ? `/${stat.max}` : ''}
                </p>
                <p style={{ fontSize: '10px', color: muted, fontWeight: 500 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upgrade Banner */}
        {!isPremium && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            onClick={() => setShowUpgrade(true)} whileTap={{ scale: 0.99 }}
            style={{ background: `linear-gradient(135deg, ${accent}, #6b9fff)`, borderRadius: '20px', padding: '20px', marginBottom: '12px', cursor: 'pointer', position: 'relative' as const, overflow: 'hidden', boxShadow: `0 8px 32px ${accent}40` }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Upgrade</p>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>KiWardrobe Pro ✦</h2>
                </div>
                <div style={{ textAlign: 'right' as const }}>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>€4,99</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{locale === 'de' ? '/ Monat' : '/ month'}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                {[
                  { free: '3', pro: '15', label: locale === 'de' ? 'Outfits/Tag' : 'Outfits/day' },
                  { free: '20', pro: '∞', label: locale === 'de' ? 'Kleidungsstücke' : 'Items' },
                  { free: '5', pro: '∞', label: locale === 'de' ? 'Outfits speichern' : 'Saved' },
                  { free: '—', pro: '✦', label: 'Style DNA' },
                ].map((f, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' }}>{f.free}</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{f.pro}</span>
                    </div>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{f.label}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{locale === 'de' ? 'Jetzt upgraden →' : 'Upgrade now →'}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{locale === 'de' ? 'Jederzeit kündbar' : 'Cancel anytime'}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Premium Badge */}
        {isPremium && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '16px', padding: '14px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>✦</div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '2px' }}>KiWardrobe Pro</p>
              <p style={{ fontSize: '12px', color: muted }}>{locale === 'de' ? 'Aktiv · 15 Outfits täglich · Unbegrenzt' : 'Active · 15 outfits daily · Unlimited'}</p>
            </div>
          </motion.div>
        )}

        {/* Style DNA Button */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={isPremium ? generateStyleDna : () => setShowUpgrade(true)}
          whileTap={{ scale: 0.98 }}
          style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px 18px', marginBottom: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{isPremium ? '🧬' : '🔒'}</div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '2px' }}>Style DNA</p>
              <p style={{ fontSize: '12px', color: muted }}>{isPremium ? (locale === 'de' ? 'KI analysiert deinen Stil' : 'AI analyzes your style') : (locale === 'de' ? 'Nur für Pro · €4,99' : 'Pro only · €4.99')}</p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </motion.div>

        {/* Profil */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, background: accentDim }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{locale === 'de' ? 'Profil' : 'Profile'}</p>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              {locale === 'de' ? 'Benutzername' : 'Username'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                style={{ flex: 1, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: text, outline: 'none', fontFamily: "'DM Sans', sans-serif", background: isDark ? '#080c18' : '#f8faff', minWidth: 0 }} />
              <motion.button whileTap={{ scale: 0.95 }} onClick={saveUsername} disabled={saving}
                style={{ background: saved ? accent : 'transparent', border: `1px solid ${saved ? accent : border}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: saved ? '#fff' : text, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.2s' }}>
                {saved ? '✓' : saving ? '...' : locale === 'de' ? 'Speichern' : 'Save'}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Konto */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, background: accentDim }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{locale === 'de' ? 'Konto' : 'Account'}</p>
          </div>
          {[
            { label: 'Email', value: profile?.email ?? '—' },
            { label: locale === 'de' ? 'Alter' : 'Age', value: profile?.age ?? '—' },
            { label: locale === 'de' ? 'Land' : 'Country', value: profile?.country ?? '—' },
            { label: locale === 'de' ? 'Geschlecht' : 'Gender', value: genderLabel(profile?.gender) },
            { label: 'Style', value: profile?.style_preferences?.join(', ') ?? '—' },
            { label: 'Budget', value: budgetLabel(profile?.budget_range) },
          ].map((item, i, arr) => (
            <div key={item.label}>
              {i > 0 && <div style={{ height: '1px', background: border, margin: '0 16px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px' }}>
                <p style={{ fontSize: '14px', color: text, fontWeight: 500 }}>{item.label}</p>
                <p style={{ fontSize: '12px', color: muted, maxWidth: '180px', textAlign: 'right' as const, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Einstellungen */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, background: accentDim }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{locale === 'de' ? 'Einstellungen' : 'Settings'}</p>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <p style={{ fontSize: '14px', color: text, fontWeight: 500 }}>Dark Mode</p>
              <button onClick={toggle} style={{ width: '44px', height: '26px', borderRadius: '13px', border: 'none', background: isDark ? accent : border, cursor: 'pointer', position: 'relative' as const, transition: 'background 0.2s' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'left 0.2s', left: isDark ? '21px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
            <div style={{ height: '1px', background: border, margin: '0 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <p style={{ fontSize: '14px', color: text, fontWeight: 500 }}>{locale === 'de' ? 'Sprache' : 'Language'}</p>
              <button onClick={() => { const nl = locale === 'de' ? 'en' : 'de'; const s = window.location.pathname.split('/'); s[1] = nl; window.location.replace(s.join('/')) }}
                style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: accent, fontFamily: "'DM Sans', sans-serif" }}>
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
                style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', fontSize: '14px', color: text, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {item.label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', fontSize: '14px', color: '#ef4444', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textAlign: 'left' as const }}>
            {locale === 'de' ? 'Abmelden' : 'Sign out'}
          </button>
        </div>

        <p style={{ textAlign: 'center' as const, fontSize: '11px', color: muted, letterSpacing: '0.04em' }}>KiWardrobe · v1.0</p>
      </main>

      {/* Style DNA Modal */}
      <AnimatePresence>
        {showDna && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDna(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '420px', background: card, border: `1px solid ${border}`, borderRadius: '28px', padding: '28px 24px 32px', maxHeight: '85vh', overflowY: 'auto' as const }}>
              {dnaLoading ? (
                <div style={{ textAlign: 'center' as const, padding: '40px 0' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: accent, margin: '0 auto 16px' }} />
                  <p style={{ fontSize: '14px', color: muted }}>{locale === 'de' ? 'KI analysiert deinen Stil...' : 'AI analyzing your style...'}</p>
                </div>
              ) : dna ? (
                <>
                  <div style={{ textAlign: 'center' as const, marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>{dna.styleEmoji}</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: text, letterSpacing: '-0.03em', marginBottom: '8px' }}>{dna.styleType}</h2>
                    <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{dna.description}</p>
                  </div>
                  <div style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>{locale === 'de' ? 'Deine Farben' : 'Your Colors'}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {dna.dominantColors?.map((color: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: card, border: `1px solid ${border}`, borderRadius: '100px', padding: '5px 12px' }}>
                          <span style={{ fontSize: '14px' }}>{dna.colorEmojis?.[i] ?? '🎨'}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: text }}>{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Style Mix</p>
                    {dna.stylePercentages?.map((s: { style: string; percent: number }, i: number) => (
                      <div key={i} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: text }}>{s.style}</span>
                          <span style={{ fontSize: '12px', color: muted }}>{s.percent}%</span>
                        </div>
                        <div style={{ height: '6px', background: border, borderRadius: '3px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.percent}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                            style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, #6b9fff)`, borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '14px', padding: '12px 14px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: accent, marginBottom: '8px', textTransform: 'uppercase' as const }}>{locale === 'de' ? 'Stärken' : 'Strengths'}</p>
                      {dna.strengths?.map((s: string, i: number) => <p key={i} style={{ fontSize: '12px', color: text, marginBottom: '4px' }}>✓ {s}</p>)}
                    </div>
                    <div style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '14px', padding: '12px 14px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: accent, marginBottom: '8px', textTransform: 'uppercase' as const }}>{locale === 'de' ? 'Dir fehlt' : 'Missing'}</p>
                      {dna.missing?.map((s: string, i: number) => <p key={i} style={{ fontSize: '12px', color: text, marginBottom: '4px' }}>+ {s}</p>)}
                    </div>
                  </div>
                  {dna.tip && (
                    <div style={{ background: `linear-gradient(135deg, ${accent}15, #6b9fff10)`, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: accent, marginBottom: '6px', textTransform: 'uppercase' as const }}>{locale === 'de' ? '✦ Style Tipp' : '✦ Style Tip'}</p>
                      <p style={{ fontSize: '13px', color: text, lineHeight: 1.6 }}>{dna.tip}</p>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ textAlign: 'center' as const, color: muted, fontSize: '14px', padding: '20px 0' }}>{locale === 'de' ? 'Fehler beim Laden' : 'Error loading'}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgrade && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowUpgrade(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '420px', background: card, border: `1px solid ${border}`, borderRadius: '28px', padding: '28px 24px 32px', boxShadow: isDark ? '0 -8px 60px rgba(0,0,0,0.7)' : `0 -8px 60px ${accent}20` }}>
              <div style={{ textAlign: 'center' as const, marginBottom: '24px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '24px', boxShadow: `0 8px 24px ${accent}50` }}>✦</div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: text, letterSpacing: '-0.03em', marginBottom: '6px' }}>KiWardrobe Pro</h2>
                <p style={{ fontSize: '13px', color: muted }}>{locale === 'de' ? 'Dein persönlicher KI-Stylist ohne Limits' : 'Your personal AI stylist without limits'}</p>
              </div>
              {[
                { icon: '👗', title: locale === 'de' ? '15 Outfits täglich' : '15 outfits daily', sub: locale === 'de' ? 'Statt 3 im Free Plan' : 'Instead of 3 in Free Plan' },
                { icon: '∞', title: locale === 'de' ? 'Unbegrenzt Kleidung' : 'Unlimited clothes', sub: locale === 'de' ? 'Statt max. 20 Teile' : 'Instead of max. 20 items' },
                { icon: '♡', title: locale === 'de' ? 'Unbegrenzt speichern' : 'Unlimited saved', sub: locale === 'de' ? 'Statt max. 5 Outfits' : 'Instead of max. 5 outfits' },
                { icon: '✦', title: 'Style DNA', sub: locale === 'de' ? 'KI analysiert deinen Stil' : 'AI analyzes your style' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? `1px solid ${border}` : 'none' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: accentDim, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '2px' }}>{f.title}</p>
                    <p style={{ fontSize: '12px', color: muted }}>{f.sub}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', color: accent, fontSize: '16px' }}>✓</div>
                </div>
              ))}
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession()
                  if (!session?.user) return
                  const res = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: session.user.id, userEmail: session.user.email }),
                  })
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                }}
                style={{ width: '100%', marginTop: '20px', padding: '16px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 24px ${accent}50` }}>
                {locale === 'de' ? 'Für €4,99/Monat upgraden →' : 'Upgrade for €4.99/month →'}
              </motion.button>
              <p style={{ textAlign: 'center' as const, fontSize: '11px', color: muted, marginTop: '10px' }}>
                {locale === 'de' ? 'Jederzeit kündbar · Keine versteckten Kosten' : 'Cancel anytime · No hidden fees'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}