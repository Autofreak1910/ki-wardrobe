'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import UpgradeModal from '@/components/UpgradeModal'
type Profile = { id: string; username: string; is_premium: boolean; age?: string; country?: string; created_at: string; email?: string; gender?: string; style_preferences?: string[]; budget_range?: string; referral_code?: string; premium_until?: string; invites_this_month?: number; bonus_month_claimed_this_period?: boolean; avatar_tries_left?: number; streak_freeze_used_month?: string }

function getWeekStartUTC(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const diffToMonday = (day === 0 ? -6 : 1) - day
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday, 0, 0, 0, 0))
}
function getMonthStartUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
}

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

    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      await existing.unsubscribe()
    }

 const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return false
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

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

// Modul-Level-Cache -- bleibt beim Seitenwechsel im Speicher, kein Skeleton-Aufblitzen
// bei jedem erneuten Besuch. Wird nach jedem echten Laden aktualisiert.
let profileCache: { profile: Profile; itemCount: number; outfitCount: number } | null = null

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(profileCache?.profile ?? null)
  const [itemCount, setItemCount] = useState(profileCache?.itemCount ?? 0)
  const [outfitCount, setOutfitCount] = useState(profileCache?.outfitCount ?? 0)
  const [loading, setLoading] = useState(!profileCache)
  const [editUsername, setEditUsername] = useState(profileCache?.profile?.username ?? '')
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
const [showAccountSettings, setShowAccountSettings] = useState(false)
const [withdrawalConsent, setWithdrawalConsent] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)
  const { theme, toggle } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isDark = theme === 'dark'

  const bg        = isDark ? '#161616' : '#F2EFE7'
  const card      = isDark ? '#1D1D20' : '#ffffff'
  const border    = isDark ? '#2a2a2e' : '#E7E2D5'
  const text      = isDark ? '#F5F3EE' : '#24211B'
  const muted     = isDark ? '#9a978f' : '#8C8776'
  const accent    = isDark ? '#5C82A0' : '#355C7D'
  const accentDim = isDark ? 'rgba(92,130,160,0.12)' : 'rgba(53,92,125,0.07)'
  const gold      = isDark ? '#E5B45B' : '#C9963C'
  const goldDim   = isDark ? 'rgba(229,180,91,0.12)' : 'rgba(201,150,60,0.10)'
const [weekOutfits, setWeekOutfits] = useState(0)
const [weekAvatarCount, setWeekAvatarCount] = useState(0)
const [monthAvatarCount, setMonthAvatarCount] = useState(0)
const [multiScansThisWeek, setMultiScansThisWeek] = useState(0)
const [styleDnaToday, setStyleDnaToday] = useState(0)
const [totalInvitesSuccessful, setTotalInvitesSuccessful] = useState(0)
const [showInviteStats, setShowInviteStats] = useState(false)
const [pushEnabled, setPushEnabled] = useState(false)
const [pushLoading, setPushLoading] = useState(false)
const [weatherEnabled, setWeatherEnabled] = useState(true)
const [highlightWeather, setHighlightWeather] = useState(false)
const weatherSettingRef = useRef<HTMLDivElement>(null)

useEffect(() => { loadProfile() }, [])
  useEffect(() => {
    setWeatherEnabled(localStorage.getItem('kw_weather_disabled') !== 'true')
  }, [])

useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('scrollTo') === 'weather' && weatherSettingRef.current) {
    setTimeout(() => {
      weatherSettingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightWeather(true)
      setTimeout(() => setHighlightWeather(false), 2200)
    }, 400)
  }
}, [loading])
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('upgrade') === 'true') setShowUpgrade(true)
  if (params.get('success') === 'true') {
    localStorage.setItem('kw_pro_welcome_pending', 'true')
  }
}, [])

async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const weekStart = getWeekStartUTC()
    const monthStart = getMonthStartUTC()
    const todayStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), 0, 0, 0, 0))
  const [profileRes, itemsRes, outfitsRes, weekOutfitsRes, weekAvatarRes, monthAvatarRes, multiScanRes, styleDnaRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('clothing_items').select('id').eq('user_id', session.user.id),
      supabase.from('outfits').select('id').eq('user_id', session.user.id),
      supabase.from('outfit_generations').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).gte('created_at', weekStart.toISOString()),
      supabase.from('avatar_results').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).gte('created_at', weekStart.toISOString()),
      supabase.from('avatar_results').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).gte('created_at', monthStart.toISOString()),
      supabase.from('multi_scan_generations').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).gte('created_at', weekStart.toISOString()),
      supabase.from('style_dna_generations').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).gte('created_at', todayStart.toISOString()),
    ])
  setWeekOutfits(weekOutfitsRes.count ?? 0)
  setWeekAvatarCount(weekAvatarRes.count ?? 0)
  setMonthAvatarCount(monthAvatarRes.count ?? 0)
  setMultiScansThisWeek(multiScanRes.count ?? 0)
  setStyleDnaToday(styleDnaRes.count ?? 0)

if (profileRes.data?.referral_code) {
    const { data: refCount } = await supabase.rpc('count_successful_referrals', { p_referral_code: profileRes.data.referral_code })
    setTotalInvitesSuccessful(refCount ?? 0)
  }
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
    if (profileRes.data) {
      profileCache = {
        profile: { ...profileRes.data, email: session.user.email },
        itemCount: itemsRes.data?.length ?? 0,
        outfitCount: outfitsRes.data?.length ?? 0,
      }
    }
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
async function openBillingPortal() {
  setPortalLoading(true)
  try {
    const res = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setPortalLoading(false)
    }
  } catch {
    setPortalLoading(false)
  }
}
 async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        try { await supabase.auth.signOut({ scope: 'global' }) } catch {}
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase') || key.startsWith('kw_')) {
              localStorage.removeItem(key)
            }
          })
        } catch {}
        window.location.href = '/' + locale + '/auth/login'
      } else {
        alert(locale === 'de' ? 'Fehler beim Löschen: ' + data.error : 'Error deleting: ' + data.error)
        setDeleting(false)
      }
    } catch (err) {
      alert(locale === 'de' ? 'Fehler beim Löschen' : 'Error deleting')
      setDeleting(false)
    }
  }
async function generateStyleDna() {
  if (!profile?.is_premium) { setShowUpgrade(true); return }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
  const { data: items } = await supabase.from('clothing_items').select('*').eq('user_id', session.user.id)
  if (!items || items.length < 3) return

  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  const { count } = await supabase.from('style_dna_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .gte('created_at', todayStart.toISOString()) as any
  if ((count ?? 0) >= 1) {
    setDnaLoading(false)
    setShowDna(false)
    return
  }
  await supabase.from('style_dna_generations').insert({ user_id: session.user.id })
  setStyleDnaToday(prev => prev + 1)

  setDnaLoading(true)
  setShowDna(true)
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
  const daysLeft = profile?.premium_until
    ? Math.ceil((new Date(profile.premium_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
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
      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '84px 20px 108px' }}>
        {[180, 80, 140].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: '14px', background: card, border: `1px solid ${border}`, marginBottom: '10px', animation: 'shimmer 1.5s infinite' }} />
        ))}
      </main>
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  )

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'Poppins', 'Inter', sans-serif", position: 'relative' as const, backgroundImage: isDark ? 'none' : 'radial-gradient(circle, rgba(36,33,27,0.08) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>

      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: isDark ? 'rgba(229,180,91,0.08)' : 'rgba(201,150,60,0.10)', filter: 'blur(90px)' }} />
      </div>


      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '68px 0 108px', position: 'relative', zIndex: 1 }}>

        {/* Hero Banner */}
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: 'relative' as const, height: '160px', overflow: 'hidden', marginBottom: '0', borderRadius: '0 0 28px 28px' }}>
          <img
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80&auto=format&fit=crop"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', inset: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, ${bg}f2 100%)` }} />
        </motion.div>

        {/* Avatar + Name + Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ padding: '0 20px', marginBottom: '20px', marginTop: '-24px', position: 'relative' as const, zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: isPremium ? 'linear-gradient(135deg, #EFB43A, #C9963C)' : `linear-gradient(135deg, ${accent}, #7FA3C4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: isPremium ? '0 4px 20px rgba(201,150,60,0.5)' : `0 4px 20px ${accent}50`, border: `3px solid ${card}` }}>
              {initial}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: text, letterSpacing: '-0.03em' }}>{profile?.username ?? 'User'}</h1>
                {isPremium ? (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #EFB43A, #C9963C)', borderRadius: '6px', padding: '3px 8px', boxShadow: '0 2px 8px rgba(201,150,60,0.4)' }}>✦ PRO</span>
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: muted, background: accentDim, border: `1px solid ${border}`, borderRadius: '6px', padding: '3px 8px' }}>FREE</span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: muted }}>{locale === 'de' ? 'Dabei seit' : 'Member since'} {memberSince}</p>
            </div>
          </div>
        </motion.div>

        <div style={{ padding: '0 20px' }}>
{/* Mein Plan */}
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
  style={{ background: isPremium ? '#24211B' : card, border: `1px solid ${isPremium ? '#2a2a2e' : border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', boxShadow: isPremium ? '0 4px 24px rgba(201,150,60,0.15)' : 'none' }}>
  <div style={{ padding: '10px 16px', borderBottom: `1px solid ${isPremium ? 'rgba(229,180,91,0.2)' : border}`, background: isPremium ? 'rgba(229,180,91,0.1)' : accentDim }}>
    <p style={{ fontSize: '10px', fontWeight: 700, color: isPremium ? '#E5B45B' : accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
      {locale === 'de' ? 'Mein Plan' : 'My Plan'}
    </p>
  </div>
  <div style={{ padding: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>{isPremium ? '✦' : '○'}</span>
        <p style={{ fontSize: '16px', fontWeight: 800, color: isPremium ? '#F5F3EE' : text }}>
          {isPremium ? 'KiWardrobe Pro' : 'KiWardrobe Free'}
        </p>
      </div>
   {isPremium ? (
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#24211B', background: '#C9963C', borderRadius: '6px', padding: '3px 8px' }}>AKTIV</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#24211B', background: '#E5B45B', borderRadius: '6px', padding: '3px 8px' }}>✦ PRO</span>
        </div>
      ) : (
        <span style={{ fontSize: '10px', fontWeight: 700, color: muted, background: accentDim, border: `1px solid ${border}`, borderRadius: '6px', padding: '3px 8px' }}>FREE</span>
      )}
    </div>

    <p style={{ fontSize: '12px', color: isPremium ? '#9a978f' : muted, marginBottom: '14px' }}>
      {isPremium
        ? (profile?.premium_until
            ? (locale === 'de'
                ? `Aktiv bis ${new Date(profile.premium_until).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : `Active until ${new Date(profile.premium_until).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`)
            : (locale === 'de' ? 'Unbegrenzt aktiv' : 'Active, no end date'))
        : (locale === 'de' ? 'Kostenlos für immer' : 'Free forever')}
    </p>

    {(() => {
    const statItems = [
  { label: locale === 'de' ? 'Kleidung' : 'Items', value: itemCount, max: isPremium ? null : 20 },
  { label: locale === 'de' ? 'Outfits/Woche' : 'Outfits/week', value: weekOutfits, max: isPremium ? 14 : 3 },
  { label: locale === 'de' ? 'Gespeichert' : 'Saved', value: outfitCount, max: isPremium ? null : 5 },
  isPremium
    ? { label: 'Try-On', value: weekAvatarCount, max: 6 }
    : { label: 'Try-On', value: monthAvatarCount, max: 2 },
...(isPremium ? [
    { label: locale === 'de' ? 'Multi-Upload' : 'Multi-upload', value: multiScansThisWeek, max: 3 },
    { label: 'Style DNA', value: styleDnaToday, max: 1 },
    { label: locale === 'de' ? '🧊 Streak-Schutz' : '🧊 Streak Freeze', value: (profile?.streak_freeze_used_month === new Date().toISOString().slice(0,7)) ? 1 : 0, max: 1 },
  ] : []),
]
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: daysLeft !== null && daysLeft <= 3 ? '14px' : '0' }}>
          {statItems.map(stat => (
            <div key={stat.label} style={{ background: isPremium ? 'rgba(229,180,91,0.12)' : accentDim, borderRadius: '10px', padding: '8px 6px', textAlign: 'center' as const, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: stat.max && stat.value >= stat.max ? '#ef4444' : (isPremium ? '#F5F3EE' : text), letterSpacing: '-0.02em', marginBottom: '1px' }}>
                {stat.value}{stat.max ? `/${stat.max}` : ''}
              </p>
              <p style={{ fontSize: '9px', color: isPremium ? '#9a978f' : muted, fontWeight: 500, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' as const }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )
    })()}

    {isPremium && daysLeft !== null && daysLeft <= 3 && (
      <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, borderRadius: '12px', padding: '12px 14px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>
          ⏳ {locale === 'de'
            ? daysLeft <= 0 ? 'Läuft heute ab!' : `Läuft in ${daysLeft} Tag${daysLeft > 1 ? 'en' : ''} ab`
            : daysLeft <= 0 ? 'Expires today!' : `Expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={async () => {
              const inviteUrl = `https://kiwardrobe-app.vercel.app/${locale}/auth/register?ref=${profile?.referral_code ?? ''}`
             const shareText = locale === 'de'
                ? `Ich hab gerade meinen eigenen Avatar erstellt und KI sagt mir jeden Morgen was ich anziehen soll 🤯 KiWardrobe ist echt krass — probier's aus, mit meinem Link bekommst du 7 Tage Pro komplett gratis: ${inviteUrl}`
                : `I just made my own AI avatar and it tells me what to wear every morning 🤯 KiWardrobe is actually insane — try it, my link gets you 7 days Pro completely free: ${inviteUrl}`
              if (navigator.share) { try { await navigator.share({ title: 'KiWardrobe', text: shareText, url: inviteUrl }) } catch {} }
              else { await navigator.clipboard.writeText(shareText); alert(locale === 'de' ? 'Link kopiert!' : 'Link copied!') }
            }}
            style={{ flex: 1, background: card, border: `1px solid ${border}`, borderRadius: '8px', padding: '9px', fontSize: '11px', fontWeight: 700, color: gold, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
            🎁 {locale === 'de' ? 'Freunde einladen' : 'Invite friends'}
          </button>
          <button onClick={async () => {
              const { data: { session } } = await supabase.auth.getSession()
              if (!session?.user) return
              const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, userEmail: session.user.email, locale }),
              })
              const data = await res.json()
              if (data.url) window.location.href = data.url
            }}
            style={{ flex: 1, background: `linear-gradient(135deg, ${gold}, #E8B45E)`, border: 'none', borderRadius: '8px', padding: '9px', fontSize: '11px', fontWeight: 700, color: '#24211B', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
            ✦ {locale === 'de' ? 'Jetzt zahlen' : 'Pay now'}
          </button>
        </div>
      </div>
    )}
  </div>
</motion.div>
{isPremium && (
  <motion.button whileTap={{ scale: 0.97 }}
    onClick={openBillingPortal}
    disabled={portalLoading}
    style={{ width: '100%', marginTop: '14px', padding: '12px', background: 'transparent', border: `1.5px solid ${isDark ? '#5C82A0' : '#355C7D'}`, borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: isDark ? '#7A96AC' : '#355C7D', cursor: portalLoading ? 'wait' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
    {portalLoading
      ? (locale === 'de' ? 'Einen Moment...' : 'One moment...')
      : (locale === 'de' ? 'Abo verwalten / kündigen' : 'Manage / cancel subscription')}
  </motion.button>
)}
{/* Upgrade Banner */}
{!isPremium && (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
    onClick={() => setShowUpgrade(true)}
    whileTap={{ scale: 0.98 }}
    style={{ background: 'linear-gradient(135deg, rgba(201,150,60,0.14), rgba(229,180,91,0.06))', border: '1px solid rgba(201,150,60,0.35)', borderRadius: '16px', padding: '14px 16px', marginBottom: '12px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,150,60,0.12)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>✦</span>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 800, color: '#9C6B1F', marginBottom: '1px', letterSpacing: '-0.02em' }}>KiWardrobe Pro</p>
          <p style={{ fontSize: '11px', color: muted }}>{locale === 'de' ? 'Mehr Outfits · Unbegrenzt · Style DNA · Multi-Upload' : 'More outfits · Unlimited · Style DNA · Multi-upload'}</p>
        </div>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #EFB43A, #C9963C)', borderRadius: '10px', padding: '6px 12px', flexShrink: 0, boxShadow: '0 2px 8px rgba(201,150,60,0.4)' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>€4,99</p>
      </div>
    </div>
  </motion.div>
)}

{/* Invite Friends — kompakt */}
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
  style={{ background: 'linear-gradient(135deg, #7A8BA3, #566B85)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>

  {/* Kompakte Zeile — immer sichtbar, ausklappbar */}
  <motion.div whileTap={{ scale: 0.99 }} onClick={() => setShowInviteStats(v => !v)}
    style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', cursor: 'pointer' }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🎁</div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginBottom: '2px', letterSpacing: '-0.02em' }}>
        {locale === 'de' ? 'Freunde einladen' : 'Invite friends'}
      </p>
<p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
        {locale === 'de' ? 'Du +7 Tage · Freund +7 Tage Pro gratis' : 'You +7 days · Friend +7 days Pro free'}
      </p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '4px 10px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{totalInvitesSuccessful} ✓</p>
      </div>
      <motion.span animate={{ rotate: showInviteStats ? 180 : 0 }} style={{ color: '#fff', fontSize: '12px' }}>▾</motion.span>
    </div>
  </motion.div>

  {/* Ausgeklappt: Details */}
  <AnimatePresence>
    {showInviteStats && (
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25 }} style={{ overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>{locale === 'de' ? 'Erfolgreiche Einladungen' : 'Successful invites'}</p>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{totalInvitesSuccessful}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>{locale === 'de' ? 'Bonus-Tage verdient' : 'Bonus days earned'}</p>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>+{Math.min(totalInvitesSuccessful, 4) * 7} {locale === 'de' ? 'Tage' : 'days'}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>{locale === 'de' ? 'Diesen Monat' : 'This month'}</p>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{profile?.invites_this_month ?? 0}/4</p>
          </div>
          {!(profile?.bonus_month_claimed_this_period) && (
            <>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>🎁 {locale === 'de' ? 'Bonus-Monat' : 'Bonus month'}</p>
                <p style={{ fontSize: '11px', color: '#fff' }}>{profile?.invites_this_month ?? 0}/15</p>
              </div>
              <div style={{ height: '5px', background: 'rgba(255,255,255,0.25)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((profile?.invites_this_month ?? 0) / 15) * 100)}%` }}
                  transition={{ duration: 0.6 }} style={{ height: '100%', background: '#fff', borderRadius: '3px' }} />
              </div>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', marginTop: '5px' }}>
                {locale === 'de'
                  ? `Noch ${Math.max(0, 15 - (profile?.invites_this_month ?? 0))} bis +30 Bonus-Tage`
                  : `${Math.max(0, 15 - (profile?.invites_this_month ?? 0))} more until +30 bonus days`}
              </p>
            </>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  <motion.button whileTap={{ scale: 0.97 }}
    onClick={async () => {
      const inviteUrl = `https://kiwardrobe-app.vercel.app/${locale}/auth/register?ref=${profile?.referral_code ?? ''}`
      const shareText = locale === 'de'
        ? `Ich hab gerade meinen eigenen Avatar erstellt und KI sagt mir jeden Morgen was ich anziehen soll 🤯 KiWardrobe ist echt krass — probier's aus, mit meinem Link bekommst du 14 Tage Pro komplett gratis: ${inviteUrl}`
        : `I just made my own AI avatar and it tells me what to wear every morning 🤯 KiWardrobe is actually insane — try it, my link gets you 14 days Pro completely free: ${inviteUrl}`
      if (navigator.share) { try { await navigator.share({ title: 'KiWardrobe', text: shareText, url: inviteUrl }) } catch {} }
      else { await navigator.clipboard.writeText(shareText); alert(locale === 'de' ? 'Link kopiert!' : 'Link copied!') }
    }}
    style={{ width: '100%', background: 'linear-gradient(135deg, #EFB43A, #C9963C)', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 700, color: '#24211B', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
    {locale === 'de' ? '📤 Einladungslink teilen' : '📤 Share invite link'}
  </motion.button>
</motion.div>



{/* Konto - Button zum Öffnen */}
<button onClick={() => setShowAccountSettings(true)}
  style={{ width: '100%', background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={{ fontSize: '16px' }}>⚙️</span>
    <p style={{ fontSize: '14px', fontWeight: 600, color: text }}>{locale === 'de' ? 'Kontoeinstellungen' : 'Account settings'}</p>
  </div>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
</button>

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
  <div ref={weatherSettingRef} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '12px', background: highlightWeather ? accentDim : 'transparent', boxShadow: highlightWeather ? `0 0 0 2px ${accent}` : 'none', transition: 'background 0.3s, box-shadow 0.3s' }}>
              <div>
                <p style={{ fontSize: '14px', color: text, fontWeight: 500 }}>
                  {locale === 'de' ? '🌤️ Wetter & Standort' : '🌤️ Weather & location'}
                </p>
                <p style={{ fontSize: '11px', color: muted, marginTop: '2px' }}>
                  {locale === 'de' ? 'Outfit passend zum Wetter' : 'Outfit matched to weather'}
                </p>
              </div>
              <button
                onClick={() => {
                  const newVal = !weatherEnabled
                  setWeatherEnabled(newVal)
                  try {
                    if (newVal) localStorage.removeItem('kw_weather_disabled')
                    else localStorage.setItem('kw_weather_disabled', 'true')
                  } catch {}
                }}
                style={{ width: '44px', height: '26px', borderRadius: '13px', border: 'none', background: weatherEnabled ? accent : border, cursor: 'pointer', position: 'relative' as const, transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'left 0.2s', left: weatherEnabled ? '21px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
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
                style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: accent, fontFamily: "'Poppins', 'Inter', sans-serif" }}>
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
                style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', fontSize: '14px', color: text, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", fontWeight: 500, textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {item.label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          ))}
        </div>

      {/* Sign out */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '10px' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', fontSize: '14px', color: '#ef4444', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", fontWeight: 600, textAlign: 'left' as const }}>
            {locale === 'de' ? 'Abmelden' : 'Sign out'}
          </button>
        </div>

        {/* Delete account */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
          <button onClick={() => setShowDeleteModal(true)} style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", fontWeight: 500, textAlign: 'left' as const }}>
            {locale === 'de' ? 'Account löschen' : 'Delete account'}
          </button>
        </div>

        </div>

       <p style={{ textAlign: 'center' as const, fontSize: '11px', color: muted, letterSpacing: '0.04em' }}>KiWardrobe · v1.0</p>
      </main>

<UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
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
                      style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, #7FA3C4)`, borderRadius: '3px' }} />
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
              <div style={{ background: `linear-gradient(135deg, ${accent}15, #7FA3C410)`, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px' }}>
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

{/* Account Settings Modal */}
<AnimatePresence>
  {showAccountSettings && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => setShowAccountSettings(false)}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto' as const, background: bg, border: `1px solid ${border}`, borderRadius: '28px 28px 0 0', padding: '24px 20px 32px' }}>

        <div style={{ width: '36px', height: '4px', background: border, borderRadius: '2px', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 500, color: text }}>
            {locale === 'de' ? 'Kontoeinstellungen' : 'Account settings'}
          </h2>
          <button onClick={() => setShowAccountSettings(false)} style={{ background: card, border: `1px solid ${border}`, borderRadius: '10px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: muted }}>✕</button>
        </div>

        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden' }}>

          {/* Username */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
              {locale === 'de' ? 'Benutzername' : 'Username'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                style={{ flex: 1, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: text, outline: 'none', fontFamily: "'Poppins', 'Inter', sans-serif", background: isDark ? '#161616' : '#F7F4EC', minWidth: 0 }} />
              <motion.button whileTap={{ scale: 0.95 }} onClick={saveUsername} disabled={saving}
                style={{ background: saved ? accent : 'transparent', border: `1px solid ${saved ? accent : border}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: saved ? '#24211B' : text, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.2s' }}>
                {saved ? '✓' : saving ? '...' : locale === 'de' ? 'Speichern' : 'Save'}
              </motion.button>
            </div>
          </div>

          {/* Email */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}` }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Email</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                style={{ flex: 1, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: text, outline: 'none', fontFamily: "'Poppins', 'Inter', sans-serif", background: isDark ? '#161616' : '#F7F4EC', minWidth: 0 }} />
              <motion.button whileTap={{ scale: 0.95 }} onClick={saveEmail}
                style={{ background: savedEmail ? accent : 'transparent', border: `1px solid ${savedEmail ? accent : border}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: savedEmail ? '#24211B' : text, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.2s' }}>
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
                style={{ flex: 1, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '14px', color: text, outline: 'none', fontFamily: "'Poppins', 'Inter', sans-serif", background: isDark ? '#161616' : '#F7F4EC', minWidth: 0 }} />
             <motion.button whileTap={{ scale: 0.95 }} onClick={saveAge}
                style={{ background: savedAge ? accent : 'transparent', border: `1px solid ${savedAge ? accent : border}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: savedAge ? '#24211B' : text, cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'all 0.2s' }}>
                {savedAge ? '✓' : locale === 'de' ? 'Speichern' : 'Save'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{/* Delete Account Modal */}
<AnimatePresence>
  {showDeleteModal && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => { if (!deleting) { setShowDeleteModal(false); setDeleteConfirmText('') } }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '400px', background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '28px 24px' }}>

        <p style={{ fontSize: '36px', textAlign: 'center' as const, marginBottom: '12px' }}>⚠️</p>
        <h2 style={{ fontSize: '19px', fontWeight: 800, color: text, textAlign: 'center' as const, marginBottom: '10px', letterSpacing: '-0.02em' }}>
          {locale === 'de' ? 'Account wirklich löschen?' : 'Really delete account?'}
        </h2>
        <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, textAlign: 'center' as const, marginBottom: '20px' }}>
          {locale === 'de'
            ? 'Diese Aktion kann NICHT rückgängig gemacht werden. Alle deine Kleidung, Outfits, dein Avatar und dein Profil werden unwiderruflich gelöscht.'
            : 'This action CANNOT be undone. All your clothing, outfits, your avatar, and your profile will be permanently deleted.'}
        </p>

        <p style={{ fontSize: '12px', color: muted, marginBottom: '8px', fontWeight: 600 }}>
          {locale === 'de' ? `Tippe "LÖSCHEN" um zu bestätigen:` : `Type "DELETE" to confirm:`}
        </p>
        <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
          placeholder={locale === 'de' ? 'LÖSCHEN' : 'DELETE'}
          style={{ width: '100%', border: `1.5px solid ${border}`, borderRadius: '10px', padding: '12px 14px', fontSize: '14px', color: text, outline: 'none', fontFamily: "'Poppins', 'Inter', sans-serif", background: isDark ? '#161616' : '#F7F4EC', marginBottom: '16px', boxSizing: 'border-box' as const }}
        />

        <motion.button whileTap={{ scale: 0.97 }}
          disabled={deleteConfirmText !== (locale === 'de' ? 'LÖSCHEN' : 'DELETE') || deleting}
          onClick={handleDeleteAccount}
          style={{
            width: '100%', padding: '13px',
            background: deleteConfirmText === (locale === 'de' ? 'LÖSCHEN' : 'DELETE') && !deleting ? '#ef4444' : (isDark ? '#1D1D20' : '#EDE7D8'),
            border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
            color: deleteConfirmText === (locale === 'de' ? 'LÖSCHEN' : 'DELETE') && !deleting ? '#fff' : muted,
            cursor: deleteConfirmText === (locale === 'de' ? 'LÖSCHEN' : 'DELETE') && !deleting ? 'pointer' : 'not-allowed',
            fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '8px',
          }}>
          {deleting ? (locale === 'de' ? 'Lösche...' : 'Deleting...') : (locale === 'de' ? '🗑️ Endgültig löschen' : '🗑️ Delete permanently')}
        </motion.button>
        <button
          disabled={deleting}
          onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
          style={{ width: '100%', padding: '11px', background: 'transparent', border: 'none', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
          {locale === 'de' ? 'Abbrechen' : 'Cancel'}
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  )
}