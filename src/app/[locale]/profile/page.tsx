'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'
type Profile = { id: string; username: string; is_premium: boolean; age?: string; country?: string; created_at: string; email?: string; gender?: string; style_preferences?: string[]; budget_range?: string; referral_code?: string }

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function enablePush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    const registration = await navigator.serviceWorker.register('/sw-push.js')
    await navigator.serviceWorker.ready
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return false
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
    }
    const subJson = subscription.toJSON()
    await fetch('/api/save-push-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
    })
    return true
  } catch (err) {
    console.error('Enable push failed:', err)
    return false
  }
}

async function disablePush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw-push.js')
    const subscription = await registration?.pushManager.getSubscription()
    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      await fetch('/api/delete-push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
    }
    return true
  } catch (err) {
    console.error('Disable push failed:', err)
    return false
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [itemCount, setItemCount] = useState(0)
  const [outfitCount, setOutfitCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editUsername, setEditUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editEmail, setEditEmail] = useState('')
const [editAge, setEditAge] = useState('')
const [savedEmail, setSavedEmail] = useState(false)
const [savedAge, setSavedAge] = useState(false)
  const [dna, setDna] = useState<any>(null)
  const [dnaLoading, setDnaLoading] = useState(false)
  const [showDna, setShowDna] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
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
const [todayOutfits, setTodayOutfits] = useState(0)
const [pushEnabled, setPushEnabled] = useState(false)
const [pushLoading, setPushLoading] = useState(false)

  useEffect(() => { loadProfile() }, [])
  useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('upgrade') === 'true') setShowUpgrade(true)
}, [])

  async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const [profileRes, itemsRes, outfitsRes, todayOutfitsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('clothing_items').select('id').eq('user_id', session.user.id),
      supabase.from('outfits').select('id').eq('user_id', session.user.id),
      supabase.from('outfit_generations').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).gte('created_at', startOfDay.toISOString()),
    ])
  setTodayOutfits(todayOutfitsRes.count ?? 0)
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw-push.js')
        const subscription = await registration?.pushManager.getSubscription()
        setPushEnabled(!!subscription)
      } catch { setPushEnabled(false) }
    }
    if (profileRes.data) { setProfile({ ...profileRes.data, email: session.user.email }); setEditUsername(profileRes.data.username ?? '') }
    setEditEmail(session.user.email ?? '')
setEditAge(profileRes.data?.age ?? '')
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
  async function saveEmail() {
  setSaving(true)
  const { error } = await supabase.auth.updateUser({ email: editEmail })
  if (!error) { setSavedEmail(true); setTimeout(() => setSavedEmail(false), 2000) }
  setSaving(false)
}

async function saveAge() {
  if (!profile) return
  setSaving(true)
  await supabase.from('profiles').update({ age: editAge }).eq('id', profile.id)
  setProfile(prev => prev ? { ...prev, age: editAge } : null)
  setSavedAge(true); setTimeout(() => setSavedAge(false), 2000)
  setSaving(false)
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
    onClick={() => setShowUpgrade(true)}
    whileTap={{ scale: 0.98 }}
    style={{ background: accentDim, border: `1px solid ${accent}40`, borderRadius: '14px', padding: '12px 16px', marginBottom: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '16px' }}>✦</span>
      <div>
        <p style={{ fontSize: '13px', fontWeight: 700, color: accent, marginBottom: '1px' }}>KiWardrobe Pro</p>
        <p style={{ fontSize: '11px', color: muted }}>{locale === 'de' ? 'Mehr Outfits · Unbegrenzt · Style DNA' : 'More outfits · Unlimited · Style DNA'}</p>
      </div>
    </div>
    <div style={{ background: accent, borderRadius: '8px', padding: '5px 10px', flexShrink: 0 }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>€4,99</p>
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
{/* Invite Friends */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ background: `linear-gradient(135deg, ${accent}, #6b9fff)`, borderRadius: '16px', padding: '18px', marginBottom: '12px', position: 'relative' as const, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎁</div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                {locale === 'de' ? 'Freunde einladen' : 'Invite friends'}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                {locale === 'de'
                  ? 'Dein Freund bekommt 14 Tage Pro gratis, du 1 Woche pro Einladung!'
                  : 'Your friend gets 14 days Pro free, you get 1 week per invite!'}
              </p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={async () => {
              const inviteUrl = `https://kiwardrobe-app.vercel.app/${locale}/auth/register?ref=${profile?.referral_code ?? ''}`
              const shareText = locale === 'de'
                ? `Probier KiWardrobe aus — die KI zeigt dir was zu deinem Kleiderschrank passt, und du kannst Klamotten virtuell anprobieren! Mit meinem Link bekommst du 14 Tage Pro gratis: ${inviteUrl}`
                : `Check out KiWardrobe — AI styles your wardrobe and you can try on clothes virtually! Use my link for 14 days Pro free: ${inviteUrl}`
              if (navigator.share) {
                try { await navigator.share({ title: 'KiWardrobe', text: shareText, url: inviteUrl }) } catch {}
              } else {
                await navigator.clipboard.writeText(shareText)
                alert(locale === 'de' ? 'Link kopiert!' : 'Link copied!')
              }
            }}
            style={{ width: '100%', background: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, color: accent, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {locale === 'de' ? '📤 Einladungslink teilen' : '📤 Share invite link'}
          </motion.button>
        </motion.div>

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


 {/* Konto */}
<div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' }}>
  <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, background: accentDim }}>
    <p style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{locale === 'de' ? 'Konto' : 'Account'}</p>
  </div>

  {/* Username */}
  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
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

  {/* Email */}
  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
    <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Email</label>
    <div style={{ display: 'flex', gap: '8px' }}>
      <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
        style={{ flex: 1, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: text, outline: 'none', fontFamily: "'DM Sans', sans-serif", background: isDark ? '#080c18' : '#f8faff', minWidth: 0 }} />
      <motion.button whileTap={{ scale: 0.95 }} onClick={saveEmail}
        style={{ background: savedEmail ? accent : 'transparent', border: `1px solid ${savedEmail ? accent : border}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: savedEmail ? '#fff' : text, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.2s' }}>
        {savedEmail ? '✓' : locale === 'de' ? 'Speichern' : 'Save'}
      </motion.button>
    </div>
  </div>

  {/* Alter */}
  <div style={{ padding: '14px 16px' }}>
    <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{locale === 'de' ? 'Alter' : 'Age'}</label>
    <div style={{ display: 'flex', gap: '8px' }}>
      <input type="number" value={editAge} onChange={e => setEditAge(e.target.value)}
        placeholder="25" min="13" max="99"
        style={{ flex: 1, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: text, outline: 'none', fontFamily: "'DM Sans', sans-serif", background: isDark ? '#080c18' : '#f8faff', minWidth: 0 }} />
      <motion.button whileTap={{ scale: 0.95 }} onClick={saveAge}
        style={{ background: savedAge ? accent : 'transparent', border: `1px solid ${savedAge ? accent : border}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: savedAge ? '#fff' : text, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.2s' }}>
        {savedAge ? '✓' : locale === 'de' ? 'Speichern' : 'Save'}
      </motion.button>
    </div>
  </div>
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
              <div>
                <p style={{ fontSize: '14px', color: text, fontWeight: 500 }}>
                  {locale === 'de' ? '☀️ Outfit-Erinnerung' : '☀️ Outfit reminder'}
                </p>
                <p style={{ fontSize: '11px', color: muted, marginTop: '2px' }}>
                  {locale === 'de' ? 'Tägliche Push-Benachrichtigung' : 'Daily push notification'}
                </p>
              </div>
              <button
                disabled={pushLoading}
                onClick={async () => {
                  setPushLoading(true)
                  if (pushEnabled) {
                    const ok = await disablePush()
                    if (ok) setPushEnabled(false)
                  } else {
                    const ok = await enablePush()
                    if (ok) setPushEnabled(true)
                  }
                  setPushLoading(false)
                }}
                style={{ width: '44px', height: '26px', borderRadius: '13px', border: 'none', background: pushEnabled ? accent : border, cursor: pushLoading ? 'wait' : 'pointer', position: 'relative' as const, transition: 'background 0.2s', opacity: pushLoading ? 0.6 : 1, flexShrink: 0 }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'left 0.2s', left: pushEnabled ? '21px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
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

<AnimatePresence>
  {showUpgrade && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => setShowUpgrade(false)}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '480px', background: isDark ? '#080c18' : '#f0f4ff', border: `1px solid ${border}`, borderRadius: '28px', padding: '28px 20px 32px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: muted, letterSpacing: '0.12em', textTransform: 'uppercase' as const, textAlign: 'center' as const, marginBottom: '20px' }}>
          {locale === 'de' ? 'Wähle deinen Plan' : 'Choose your plan'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {/* Free */}
          <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${border}`, borderRadius: '18px', padding: '16px 14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: muted, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>FREE</p>
          <p style={{ fontSize: '32px', fontWeight: 800, color: text, letterSpacing: '-0.04em', marginBottom: '2px' }}>€0</p>
            <p style={{ fontSize: '11px', color: muted, marginBottom: '12px' }}>{locale === 'de' ? 'für immer kostenlos' : 'free forever'}</p>
            <div style={{ height: '1px', background: border, marginBottom: '12px' }} />
            {[
            { title: locale === 'de' ? '3 Outfits pro Tag' : '3 outfits per day', sub: '' },
{ title: locale === 'de' ? 'Max. 20 Kleidungsstücke' : 'Max. 20 items', sub: '' },
{ title: locale === 'de' ? 'Max. 5 Outfits speichern' : 'Max. 5 saved outfits', sub: '' },
{ title: locale === 'de' ? 'Basis KI-Styling' : 'Basic AI styling', sub: '' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: muted, flexShrink: 0, marginTop: '2px' }}>○</span>
                <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: text }}>{f.title}</p>
{f.sub && <p style={{ fontSize: '11px', color: muted }}>{f.sub}</p>}
                </div>
              </div>
            ))}
          </div>
          {/* Pro */}
          <motion.div whileTap={{ scale: 0.98 }}
            onClick={async (e) => {
              e.stopPropagation()
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
            style={{ background: `linear-gradient(160deg, ${accent}, #6b9fff)`, borderRadius: '18px', padding: '16px 14px', cursor: 'pointer', position: 'relative' as const, overflow: 'hidden', boxShadow: `0 8px 32px ${accent}50` }}>
            <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: '#fff', borderRadius: '0 0 8px 8px', padding: '2px 10px' }}>
              <p style={{ fontSize: '9px', fontWeight: 800, color: accent, letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
                {locale === 'de' ? 'Empfohlen' : 'Recommended'}
              </p>
            </div>
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>PRO</p>
           <p style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: '2px' }}>€4,99</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>{locale === 'de' ? 'pro Monat · kündbar' : 'per month'}</p>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', marginBottom: '12px' }} />
              {[
                { title: '15 Outfits', sub: locale === 'de' ? 'pro Tag · 5× mehr' : 'per day · 5× more' },
                { title: locale === 'de' ? 'Unbegrenzt Kleidung' : 'Unlimited items', sub: '' },
                { title: locale === 'de' ? 'Unbegrenzt speichern' : 'Unlimited saved', sub: '' },
                { title: 'Style DNA', sub: locale === 'de' ? 'KI Stil-Analyse' : 'AI style analysis' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#fff', flexShrink: 0, marginTop: '2px' }}>✦</span>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{f.title}</p>
                    {f.sub && <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{f.sub}</p>}
                  </div>
                </div>
              ))}
      </div>
          </motion.div>
        </div>

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
          style={{ width: '100%', padding: '15px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: `0 4px 20px ${accent}40`, marginBottom: '10px' }}>
          {locale === 'de' ? '✦ Für €4,99/Monat abonnieren' : '✦ Subscribe for €4.99/month'}
        </motion.button>

        <p style={{ textAlign: 'center' as const, fontSize: '11px', color: muted }}>
          {locale === 'de' ? 'Jederzeit kündbar · Keine versteckten Kosten' : 'Cancel anytime · No hidden fees'}
        </p>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
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
    </div>
  )
}