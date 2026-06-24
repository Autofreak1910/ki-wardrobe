'use client'
import WelcomeOverlay from '@/components/WelcomeOverlay'
import { useState, useEffect, useRef, RefObject } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'

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

async function activatePushNotifications(): Promise<boolean> {
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
    console.error('Push activation failed:', err)
    return false
  }
}


function getGreeting(locale: string): string {
  const greetingsDe = ['Hey', 'Hi', 'Servus', 'Hallo', 'Na', 'Yo', 'Moin', 'Hey du', 'Was geht', 'Schön dich zu sehen', 'Da bist du ja', 'Let\'s go']
  const greetingsEn = ['Hey', 'Hi', 'Yo', 'Hello', 'Sup', 'What\'s up', 'Hey you', 'Good to see you', 'There you are', 'Let\'s go', 'Hiya', 'Welcome back']
  const pool = locale === 'de' ? greetingsDe : greetingsEn
  // Deterministisch: gleiche Stunde (seit Epoch) = gleiche Begruessung, kein Zufall
  const hoursSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60))
  return pool[hoursSinceEpoch % pool.length]
}

const occasions = ['casual', 'uni', 'work', 'date', 'sport', 'party', 'festival'] as const

const categoryConfig = [
  { key: 'tops',   labelDe: 'Oberteil', labelEn: 'Top',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg> },
  { key: 'hosen',  labelDe: 'Hose',     labelEn: 'Pants',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v4l-4 14h-4l-1-8-1 8H7L3 7V3z"/></svg> },
  { key: 'jacken', labelDe: 'Jacke',    labelEn: 'Jacket',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 2l4 4-2 2 2 14H4L6 8 4 6l4-4"/><path d="M12 2v7"/><path d="M8 2c0 2.5 1.5 4 4 4s4-1.5 4-4"/></svg> },
  { key: 'schuhe', labelDe: 'Schuhe',   labelEn: 'Shoes',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18h20v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z"/><path d="M2 18l4-9h3l2 4 3-7h4l2 12"/></svg> },
]
type ClothingItem = { id: string; image_url: string; category: string; color: string; name?: string; brand?: string }
type OutfitSingle = { items: string[]; reasoning: string; vibe?: string; itemObjects: ClothingItem[] }
type OutfitGroup = { outfits: OutfitSingle[]; active: number }
type Weather = { temp: number; condition: string; icon: string; city: string }

function parseWeatherCode(code: number, isDay: boolean): { icon: string; condition: string } {
  if (code === 0) return { icon: isDay ? '☀️' : '🌙', condition: isDay ? 'Sonnig' : 'Klar' }
  if (code <= 2)  return { icon: '⛅', condition: 'Leicht bewölkt' }
  if (code === 3) return { icon: '☁️', condition: 'Bewölkt' }
  if (code <= 49) return { icon: '🌫️', condition: 'Neblig' }
  if (code <= 59) return { icon: '🌦️', condition: 'Nieselregen' }
  if (code <= 69) return { icon: '🌧️', condition: 'Regen' }
  if (code <= 79) return { icon: '❄️', condition: 'Schnee' }
  if (code <= 82) return { icon: '🌧️', condition: 'Regenschauer' }
  if (code <= 86) return { icon: '🌨️', condition: 'Schneeschauer' }
  return { icon: '⛈️', condition: 'Gewitter' }
}

export default function DresserPage() {
  const [selected, setSelected] = useState<string>('casual')
  const [loading, setLoading] = useState(false)
const [outfit, setOutfit] = useState<OutfitGroup | null>(null)
  const [saved, setSaved] = useState(false)
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([])
  const [hasItems, setHasItems] = useState(true)
 const [activeCategories, setActiveCategories] = useState<string[]>(['tops', 'hosen', 'jacken', 'schuhe'])
 const [weatherAware, setWeatherAware] = useState(true)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
const [username, setUsername] = useState<string>('')
  const [isPremium, setIsPremium] = useState(false)
  const { theme } = useTheme()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [limitMsg, setLimitMsg] = useState<string | null>(null)
  const isDark = theme === 'dark'
  const mainRef = useRef<HTMLElement>(null)
  const weatherRef = useRef<HTMLDivElement>(null)
const categoryRef = useRef<HTMLDivElement>(null)
const weatherToggleRef = useRef<HTMLDivElement>(null)
const dressMeRef = useRef<HTMLButtonElement>(null)
const [showUnlock, setShowUnlock] = useState(false)
const [onboardingReady, setOnboardingReady] = useState(false)
const [showPushPrompt, setShowPushPrompt] = useState(false)
const [showProWelcome, setShowProWelcome] = useState(false)
const [showReferralReward, setShowReferralReward] = useState(false)
const [showWelcomeInvited, setShowWelcomeInvited] = useState(false)
const [referrerName, setReferrerName] = useState('')
  const days = locale === 'de'
    ? ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
 const today = days[new Date().getDay()]
  const dateStr = new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long' })
const [greeting, setGreeting] = useState('')
useEffect(() => {
  setGreeting(getGreeting(locale))
}, [locale])
useEffect(() => {
  // Altes gespeichertes Outfit + Flags einmalig entfernen (Persistenz wurde abgeschafft)
  try {
    localStorage.removeItem('kw_current_outfit')
    localStorage.removeItem('kw_outfit_generating')
    localStorage.removeItem('kw_app_last_seen')
  } catch {}
  loadWardrobe()
  fetchWeather()
}, [])


useEffect(() => {
  if (wardrobeItems.length >= 3) {
    const seen = localStorage.getItem('kw_welcome_seen')
    if (!seen) {
      setShowUnlock(true)
      // Schloss-Animation laeuft 2800ms — DANACH erst Tour freigeben
      setTimeout(() => {
        setShowUnlock(false)
        // Kurze Pause nach dem Ausblenden, dann Tour freigeben
        setTimeout(() => setOnboardingReady(true), 600)
      }, 2800)
    }
  }
}, [wardrobeItems.length])

function checkProWelcomePending() {
  const pending = localStorage.getItem('kw_pro_welcome_pending')
  if (pending === 'true') {
    localStorage.removeItem('kw_pro_welcome_pending')
    setTimeout(() => setShowProWelcome(true), 600)
    setTimeout(() => setShowProWelcome(false), 5500)
  }
  const params = new URLSearchParams(window.location.search)
  if (params.get('referral_reward') === 'true') {
    window.history.replaceState({}, '', window.location.pathname)
    setTimeout(() => setShowReferralReward(true), 600)
    setTimeout(() => setShowReferralReward(false), 5500)
  }
}

useEffect(() => {
  checkProWelcomePending()
  function onVisibilityChange() {
    if (document.visibilityState === 'visible') checkProWelcomePending()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  return () => document.removeEventListener('visibilitychange', onVisibilityChange)
}, [])

useEffect(() => {
  if (outfit && !localStorage.getItem('kw_push_prompt_seen')) {
    const timer = setTimeout(() => setShowPushPrompt(true), 1200)
    return () => clearTimeout(timer)
  }
}, [outfit])

async function loadWardrobe() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
// Pruefe ob eingeladener User die Begruessung noch nicht gesehen hat (pro User-ID, nicht pro Browser)
    const welcomeSeenKey = 'kw_invited_welcome_seen_' + session.user.id
    if (!localStorage.getItem(welcomeSeenKey)) {
      try {
        const { data: refName } = await supabase.rpc('get_referrer_username', { p_user_id: session.user.id })
        if (refName) {
          localStorage.setItem(welcomeSeenKey, 'true')
          setReferrerName(refName)
          const justFinished = localStorage.getItem('kw_onboarding_just_finished') === 'true'
          const delay = justFinished ? 500 : 1500
          if (justFinished) localStorage.removeItem('kw_onboarding_just_finished')
          setTimeout(() => setShowWelcomeInvited(true), delay)
          setTimeout(() => setShowWelcomeInvited(false), delay + 5500)
        } else {
          localStorage.setItem(welcomeSeenKey, 'true')
        }
      } catch (err) {
        console.error('Referrer lookup failed:', err)
      }
    }

    const { data } = await supabase.from('clothing_items').select('*').eq('user_id', session.user.id)
    if (data) { setWardrobeItems(data); setHasItems(data.length >= 3) }
 const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single()
    if (profile?.username) setUsername(profile.username)
    const { data: stillPremium } = await supabase.rpc('check_and_expire_premium', { p_user_id: session.user.id })
    setIsPremium(stillPremium ?? false)

}

 async function fetchWeather() {
  setWeatherLoading(true)
  // Wenn Wetter in Einstellungen deaktiviert: nichts tun
  if (localStorage.getItem('kw_weather_disabled') === 'true') {
    setWeather(null)
    setWeatherLoading(false)
    return
  }
  try {
    let lat: number, lon: number
    // Gecachte Koordinaten nutzen, falls vorhanden (kein erneutes Nachfragen)
    const cachedCoords = localStorage.getItem('kw_coords')
    if (cachedCoords) {
      const parsed = JSON.parse(cachedCoords)
      lat = parsed.lat
      lon = parsed.lon
    } else {
      // Nur beim allerersten Mal nach Standort fragen
      const pos = await Promise.race([
        new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 300000,
            enableHighAccuracy: false,
          })
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        )
      ])
      lat = pos.coords.latitude
      lon = pos.coords.longitude
      // Koordinaten cachen, damit wir nie wieder fragen muessen
      try { localStorage.setItem('kw_coords', JSON.stringify({ lat, lon })) } catch {}
    }

    // Standort für Cron-Job speichern (für tägliches Auto-Outfit)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').update({ last_lat: lat, last_lon: lon }).eq('id', session.user.id)
      }
    })

    // Parallel fetchen
    const [weatherRes, geoRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,is_day&timezone=auto`),
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
    ])

    const [wd, gd] = await Promise.all([weatherRes.json(), geoRes.json()])

    const { icon, condition } = parseWeatherCode(wd.current.weathercode, wd.current.is_day === 1)
    const city = gd.address?.city || gd.address?.town || gd.address?.village || ''

    setWeather({ temp: Math.round(wd.current.temperature_2m), condition, icon, city })

  } catch (err: any) {
    // Fallback: IP-basiertes Wetter ohne GPS
    try {
      const ipRes = await fetch('https://ipapi.co/json/')
      const ipData = await ipRes.json()
      const { latitude: lat, longitude: lon, city } = ipData

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,is_day&timezone=auto`)
      const wd = await weatherRes.json()
      const { icon, condition } = parseWeatherCode(wd.current.weathercode, wd.current.is_day === 1)

      setWeather({ temp: Math.round(wd.current.temperature_2m), condition, icon, city: city || '' })
    } catch {
      // Letzter Fallback
      setWeather({ temp: 18, condition: locale === 'de' ? 'Schönes Wetter' : 'Nice weather', icon: '🌤️', city: '' })
    }
  } finally {
    setWeatherLoading(false)
  }
}

  function toggleCategory(cat: string) {
    setActiveCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
    setOutfit(null)
  }
function getUsageCounts(): Record<string, { count: number; lastUsed: number }> {
  try {
    // Counts werden aus dem rollenden Fenster der letzten 12 Generierungen berechnet
    const stored = localStorage.getItem('kw_usage_window')
    const window: string[][] = stored ? JSON.parse(stored) : []
    const counts: Record<string, { count: number; lastUsed: number }> = {}
    window.forEach((gen, genIndex) => {
      for (const id of gen) {
        const prev = counts[id] ?? { count: 0, lastUsed: 0 }
        counts[id] = { count: prev.count + 1, lastUsed: genIndex }
      }
    })
    return counts
  } catch { return {} }
}

function getBlockedNames(): string[] {
  try {
    const stored = localStorage.getItem('kw_recent_outfit_history')
    const history: string[][] = stored ? JSON.parse(stored) : []
    return Array.from(new Set(history.flat()))
  } catch { return [] }
}

function pushToBlockedHistory(ids: string[]) {
  try {
    // Rollendes Fenster: speichere die letzten 12 Generierungen als Listen von Item-IDs
    const stored = localStorage.getItem('kw_usage_window')
    const window: string[][] = stored ? JSON.parse(stored) : []
    window.push(ids)
    const trimmed = window.slice(-12)
    localStorage.setItem('kw_usage_window', JSON.stringify(trimmed))

    // Auch die letzten 2 fuer die harte Blockierung
    localStorage.setItem('kw_recent_outfit_history', JSON.stringify(trimmed.slice(-2)))
  } catch {}
}

async function generateOutfit() {
if (wardrobeItems.length < 3) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  // Outfit Tageslimit check (DB-basiert, pro User)
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
const { count: todayCount, error: countError } = await supabase
    .from('outfit_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .gte('created_at', startOfDay.toISOString())
if (countError) console.error('Count error:', countError)
  console.log('Today count:', todayCount)

  const DAILY_LIMIT = isPremium ? 15 : 3
  if ((todayCount ?? 0) >= DAILY_LIMIT) {
    setLimitMsg(locale === 'de'
      ? `Tageslimit erreicht — ${DAILY_LIMIT}/${DAILY_LIMIT} Outfits`
      : `Daily limit reached — ${DAILY_LIMIT}/${DAILY_LIMIT} outfits`)
    setTimeout(() => setLimitMsg(null), 4000)
    return
  }

const { error: insertError } = await supabase.from('outfit_generations').insert({ user_id: session.user.id })
  if (insertError) console.error('Insert error:', insertError)

const blockedNames = getBlockedNames()
  const usageCounts = getUsageCounts()
  const recentCombos = (() => {
    try {
      const stored = localStorage.getItem('kw_recent_combo_keys')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })()
setLoading(true); setSaved(false); setOutfit(null)
  const filteredItems = wardrobeItems.filter(i => activeCategories.includes(i.category))
  const itemsToUse = filteredItems.length >= 2 ? filteredItems : wardrobeItems
  const weatherStr = weather ? `${weather.temp}°C, ${weather.condition}` : '18°C'
  try {
    // keepalive sorgt dafuer dass der Request auch bei Tab-Wechsel/Backgrounding weiterlaeuft
    const res = await fetch('/api/generate-outfit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-locale': locale },
      body: JSON.stringify({ items: itemsToUse, occasion: selected, weather: weatherStr, blockedNames, usageCounts, recentCombos, activeCategories, weatherAware }),
      keepalive: true,
    })
    const data = await res.json()
    if (data.success && data.outfits) {
  const mappedOutfits = data.outfits.map((o: { items: string[]; reasoning: string; vibe?: string }) => {
        const usedIds = new Set<string>()
        const matchedItems = o.items.map((name: string) => {
          const exactMatch = wardrobeItems.find(i => {
            const a = (i.name ?? '').toLowerCase().trim()
            const b = name.toLowerCase().trim()
            return a === b && !usedIds.has(i.id)
          })
          if (exactMatch) { usedIds.add(exactMatch.id); return exactMatch }
          // Fallback nur falls kein exaktes Match - dann nimm das beste Teil-Match das noch nicht verwendet wurde
          const fuzzyMatch = wardrobeItems.find(i => {
            if (usedIds.has(i.id)) return false
            const a = (i.name ?? '').toLowerCase().trim()
            const b = name.toLowerCase().trim()
            return a.includes(b) || b.includes(a)
          })
          if (fuzzyMatch) usedIds.add(fuzzyMatch.id)
          return fuzzyMatch
        }).filter(Boolean)
        return { items: o.items, reasoning: o.reasoning, vibe: o.vibe, itemObjects: matchedItems }
      })
setOutfit({ outfits: mappedOutfits, active: 0 })
   // Falls Tab nicht aktiv: lokale Benachrichtigung dass Outfit fertig ist
   try {
     if (document.visibilityState === 'hidden' && 'Notification' in window && Notification.permission === 'granted') {
       const reg = await navigator.serviceWorker.getRegistration('/sw-push.js')
       if (reg) {
         reg.showNotification(locale === 'de' ? '✨ Dein Outfit ist bereit!' : '✨ Your outfit is ready!', {
           body: locale === 'de' ? 'Tipp hier, um dein neues Outfit zu sehen.' : 'Tap here to see your new outfit.',
           icon: '/icon-512.png',
           badge: '/icon-512.png',
           tag: 'outfit-ready',
         })
       }
     }
   } catch {}
const allUsedIds = (mappedOutfits[0]?.itemObjects ?? []).map((item: ClothingItem) => (item.name ?? item.category) + '|' + item.color)
      pushToBlockedHistory(allUsedIds)
      try {
        const stored = localStorage.getItem('kw_recent_combo_keys')
        const prev: string[] = stored ? JSON.parse(stored) : []
        const newCombos = [...prev, ...(data.comboKeys ?? [])].slice(-10)
        localStorage.setItem('kw_recent_combo_keys', JSON.stringify(newCombos))
      } catch {}
      setTimeout(() => mainRef.current?.scrollTo({ top: mainRef.current.scrollHeight, behavior: 'smooth' }), 200)
    }
} catch (err) { console.error(err) }
  finally {
    setLoading(false)
  }
}

async function saveOutfit() {
  if (!outfit) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
const { count } = await supabase.from('outfits').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id) as any
  const SAVE_LIMIT = isPremium ? Infinity : 5
  if ((count ?? 0) >= SAVE_LIMIT) {
   setLimitMsg(locale === 'de'
  ? 'Limit erreicht — Max. 5 gespeichert'
  : 'Limit reached — Max. 5 saved')
    setTimeout(() => setLimitMsg(null), 4000)
    return
  }
  const active = outfit.outfits[outfit.active]
  await supabase.from('outfits').insert({
    user_id: session.user.id, occasion: selected,
    item_ids: active.itemObjects.map(i => i.id),
    name: `${t('dresser.occasions.' + selected)} Outfit`,
  })
  setSaved(true)
}

  const bg        = isDark ? '#080c18' : '#f0f4ff'
const card      = isDark ? '#0d1225' : '#ffffff'
const border    = isDark ? '#1a2540' : '#dde3f5'
const text      = isDark ? '#e8eeff' : '#0a1628'
const muted     = isDark ? '#4d6080' : '#6b7fa8'
const accent    = isDark ? '#4d7eff' : '#3b6bff'
const accentDim = isDark ? 'rgba(77,126,255,0.1)' : 'rgba(59,107,255,0.08)'

return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", position: 'relative' as const }}>

<WelcomeOverlay
  weatherRef={weatherRef}
  categoryRef={categoryRef}
  weatherToggleRef={weatherToggleRef}
  dressMeRef={dressMeRef}
  itemCount={wardrobeItems.length}
  ready={onboardingReady && !weatherLoading}
/>

<AnimatePresence>
  {limitMsg && (
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
onClick={() => router.push('/' + locale + '/profile?upgrade=true')}
 style={{
  position: 'fixed', top: '80px',
  left: '16px', right: '16px',
  margin: '0 auto',
  maxWidth: '340px',
  zIndex: 9997, background: card, border: `1px solid ${border}`,
  padding: '14px 18px', borderRadius: '18px',
  fontFamily: "'DM Sans', sans-serif",
  boxShadow: `0 8px 32px rgba(0,0,0,0.25)`,
  cursor: 'pointer',
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
    <span style={{ fontSize: '20px' }}>🔒</span>
    <p style={{ fontSize: '13px', fontWeight: 700, color: text }}>{limitMsg}</p>
  </div>
  <div style={{ background: `linear-gradient(135deg, ${accent}, #6b9fff)`, borderRadius: '10px', padding: '10px', textAlign: 'center' as const }}>
    <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
      {locale === 'de' ? '✦ Jetzt upgraden für €4,99/Mo' : '✦ Upgrade now for €4.99/mo'}
    </p>
  </div>
</motion.div>
  )}
</AnimatePresence>
{/* Push Notification Prompt */}
<AnimatePresence>
  {showPushPrompt && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9996, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        style={{ background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '28px 24px', maxWidth: '360px', textAlign: 'center' as const }}>
        <p style={{ fontSize: '40px', marginBottom: '12px' }}>☀️</p>
        <h2 style={{ fontSize: '19px', fontWeight: 800, color: text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          {locale === 'de' ? 'Outfit-Erinnerung aktivieren?' : 'Enable outfit reminders?'}
        </h2>
        <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: '20px' }}>
          {locale === 'de'
            ? 'Bekomm jeden Morgen dein passendes Outfit direkt vorgeschlagen — basierend auf dem Wetter. Kannst du jederzeit im Profil wieder ausschalten.'
            : 'Get your perfect outfit suggested every morning — based on the weather. You can turn this off anytime in your profile.'}
        </p>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={async () => {
            localStorage.setItem('kw_push_prompt_seen', 'true')
            await activatePushNotifications()
            setShowPushPrompt(false)
          }}
          style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: '8px' }}>
          {locale === 'de' ? '☀️ Ja, aktivieren' : '☀️ Yes, enable'}
        </motion.button>
<button
          onClick={() => { localStorage.setItem('kw_push_prompt_seen', 'true'); setShowPushPrompt(false) }}
          style={{ width: '100%', padding: '11px', background: 'transparent', border: 'none', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          {locale === 'de' ? 'Vielleicht später' : 'Maybe later'}
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
{/* Welcome Invited User Animation */}
<AnimatePresence>
  {showWelcomeInvited && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center',
        background: isDark ? 'rgba(8,12,24,0.97)' : 'rgba(240,244,255,0.97)',
        backdropFilter: 'blur(20px)', overflow: 'hidden',
      }}>

      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.3), rgba(59,107,255,0.15), transparent 70%)', filter: 'blur(60px)' }}
      />

      {[...Array(24)].map((_, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: Math.cos(i * 15 * Math.PI / 180) * (160 + (i % 3) * 30), y: Math.sin(i * 15 * Math.PI / 180) * (160 + (i % 3) * 30), scale: [0, 1.4, 1, 0], rotate: [0, 180] }}
          transition={{ delay: 0.3 + i * 0.025, duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', width: i % 3 === 0 ? '10px' : '7px', height: i % 3 === 0 ? '10px' : '7px', borderRadius: i % 2 === 0 ? '50%' : '3px', background: i % 4 === 0 ? '#a855f7' : i % 4 === 1 ? accent : i % 4 === 2 ? '#fbbf24' : '#6b9fff' }}
        />
      ))}

      <motion.div style={{ position: 'relative' as const, marginBottom: '28px' }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.5), transparent 70%)', filter: 'blur(20px)' }}
        />
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 180, delay: 0.2 }}
          style={{ width: '128px', height: '128px', borderRadius: '38px', background: 'linear-gradient(135deg, #a855f7, #6b9fff, #3b6bff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', position: 'relative' as const, boxShadow: '0 0 100px rgba(168,85,247,0.7), 0 20px 60px rgba(0,0,0,0.3)' }}>
          🎉
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }}
        style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '12px', fontFamily: "'DM Sans', sans-serif" }}>
        {locale === 'de' ? '✦ Willkommen bei KiWardrobe ✦' : '✦ Welcome to KiWardrobe ✦'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.68, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '15px', fontWeight: 600, color: muted, fontFamily: "'DM Sans', sans-serif", marginBottom: '4px' }}>
        {locale === 'de' ? 'Du wurdest eingeladen von' : 'You were invited by'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 16, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.78, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '32px', fontWeight: 800, color: text, letterSpacing: '-0.04em', fontFamily: "'DM Sans', sans-serif", marginBottom: '14px' }}>
        <span style={{ background: 'linear-gradient(135deg, #a855f7, #6b9fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{referrerName}</span>
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.95, type: 'spring', damping: 14 }}
        style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '14px', padding: '10px 20px', marginBottom: '16px', boxShadow: '0 4px 20px rgba(251,191,36,0.4)' }}>
        <p style={{ fontSize: '17px', fontWeight: 800, color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
          {locale === 'de' ? '🎁 14 Tage Pro gratis!' : '🎁 14 days Pro free!'}
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
        style={{ fontSize: '14px', color: muted, fontFamily: "'DM Sans', sans-serif", textAlign: 'center' as const, maxWidth: '280px', lineHeight: 1.6 }}>
        {locale === 'de' ? 'Lad deine Kleidung hoch und lass die KI dein perfektes Outfit zusammenstellen 🚀' : 'Upload your clothes and let the AI create your perfect outfit 🚀'}
      </motion.p>
    </motion.div>
  )}
</AnimatePresence>
{/* Referral Reward Animation */}
<AnimatePresence>
  {showReferralReward && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center',
        background: isDark ? 'rgba(8,12,24,0.97)' : 'rgba(240,244,255,0.97)',
        backdropFilter: 'blur(20px)', overflow: 'hidden',
      }}>

      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.3), rgba(59,107,255,0.15), transparent 70%)', filter: 'blur(60px)' }}
      />

      {[...Array(24)].map((_, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: Math.cos(i * 15 * Math.PI / 180) * (160 + (i % 3) * 30), y: Math.sin(i * 15 * Math.PI / 180) * (160 + (i % 3) * 30), scale: [0, 1.4, 1, 0], rotate: [0, 180] }}
          transition={{ delay: 0.3 + i * 0.025, duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', width: i % 3 === 0 ? '10px' : '7px', height: i % 3 === 0 ? '10px' : '7px', borderRadius: i % 2 === 0 ? '50%' : '3px', background: i % 4 === 0 ? '#10b981' : i % 4 === 1 ? accent : i % 4 === 2 ? '#fbbf24' : '#6b9fff' }}
        />
      ))}

      <motion.div style={{ position: 'relative' as const, marginBottom: '28px' }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: '-20px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.5), transparent 70%)', filter: 'blur(20px)' }}
        />
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 180, delay: 0.2 }}
          style={{ width: '128px', height: '128px', borderRadius: '38px', background: 'linear-gradient(135deg, #10b981, #0891b2, #3b6bff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', position: 'relative' as const, boxShadow: '0 0 100px rgba(16,185,129,0.7), 0 20px 60px rgba(0,0,0,0.3)' }}>
          🎁
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }}
        style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '12px', fontFamily: "'DM Sans', sans-serif" }}>
        {locale === 'de' ? '✦ Einladung erfolgreich ✦' : '✦ Invite successful ✦'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.68, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '15px', fontWeight: 600, color: muted, fontFamily: "'DM Sans', sans-serif", marginBottom: '4px' }}>
        {locale === 'de' ? 'Du hast' : 'You got'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 16, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.78, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '40px', fontWeight: 800, color: text, letterSpacing: '-0.04em', fontFamily: "'DM Sans', sans-serif", marginBottom: '14px' }}>
        +7 <span style={{ background: 'linear-gradient(135deg, #10b981, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{locale === 'de' ? 'Tage Pro' : 'days Pro'}</span>
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
        style={{ fontSize: '15px', color: muted, fontFamily: "'DM Sans', sans-serif", textAlign: 'center' as const, maxWidth: '280px', lineHeight: 1.6 }}>
        {locale === 'de' ? 'Danke fürs Einladen! Lad weitere Freunde ein für noch mehr Gratis-Zeit 🚀' : 'Thanks for inviting! Invite more friends for even more free time 🚀'}
      </motion.p>
    </motion.div>
  )}
</AnimatePresence>

{/* Pro Welcome Animation */}
<AnimatePresence>
  {showProWelcome && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center',
        background: isDark ? 'rgba(8,12,24,0.97)' : 'rgba(240,244,255,0.97)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}>

      {/* Animierter Farbverlauf-Glow im Hintergrund */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.3), rgba(168,85,247,0.15), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Sterne-Konfetti, mehr und länger */}
      {[...Array(24)].map((_, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: Math.cos(i * 15 * Math.PI / 180) * (160 + (i % 3) * 30), y: Math.sin(i * 15 * Math.PI / 180) * (160 + (i % 3) * 30), scale: [0, 1.4, 1, 0], rotate: [0, 180] }}
          transition={{ delay: 0.3 + i * 0.025, duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', width: i % 3 === 0 ? '10px' : '7px', height: i % 3 === 0 ? '10px' : '7px', borderRadius: i % 2 === 0 ? '50%' : '3px', background: i % 4 === 0 ? '#fbbf24' : i % 4 === 1 ? accent : i % 4 === 2 ? '#a855f7' : '#6b9fff' }}
        />
      ))}

      {/* PRO Badge mit Puls-Glow */}
      <motion.div style={{ position: 'relative' as const, marginBottom: '28px' }}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: '-20px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.5), transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 180, delay: 0.2 }}
          style={{
            width: '128px', height: '128px', borderRadius: '38px',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '60px', position: 'relative' as const,
            boxShadow: '0 0 100px rgba(251,191,36,0.7), 0 20px 60px rgba(0,0,0,0.3)',
          }}>
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >✦</motion.span>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '12px', fontFamily: "'DM Sans', sans-serif" }}>
        {locale === 'de' ? '✦ Willkommen im Club ✦' : '✦ Welcome to the club ✦'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.68, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '15px', fontWeight: 600, color: muted, letterSpacing: '-0.01em', fontFamily: "'DM Sans', sans-serif", marginBottom: '4px' }}>
        {locale === 'de' ? 'Du bist jetzt' : "You're now a"}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.78, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '38px', fontWeight: 800, color: text, letterSpacing: '-0.04em', fontFamily: "'DM Sans', sans-serif", marginBottom: '14px' }}>
        KiWardrobe <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pro</span>{locale === 'de' ? '' : ' User'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        style={{ fontSize: '15px', color: muted, fontFamily: "'DM Sans', sans-serif", textAlign: 'center' as const, maxWidth: '280px', lineHeight: 1.6 }}>
        {locale === 'de' ? '10 Outfits täglich · Unbegrenzt Kleidung · Style DNA 🚀' : '10 outfits daily · Unlimited items · Style DNA 🚀'}
      </motion.p>
    </motion.div>
  )}
</AnimatePresence>
{/* Unlock Animation */}
<AnimatePresence>
  {showUnlock && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center', gap: '0px',
        background: isDark ? 'rgba(8,12,24,0.96)' : 'rgba(240,244,255,0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Konfetti */}
      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: (Math.cos(i * 30 * Math.PI / 180)) * 120, y: (Math.sin(i * 30 * Math.PI / 180)) * 120, scale: [0, 1.2, 1, 0] }}
          transition={{ delay: 0.4 + i * 0.04, duration: 1 }}
          style={{ position: 'absolute', width: '10px', height: '10px', borderRadius: '50%', background: i % 3 === 0 ? accent : i % 3 === 1 ? '#6b9fff' : '#a855f7' }}
        />
      ))}

      {/* Lock Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
        style={{
          width: '110px', height: '110px', borderRadius: '32px',
          background: `linear-gradient(135deg, ${accent}, #6b9fff)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 80px ${accent}70, 0 0 40px ${accent}40`,
          marginBottom: '14px',
        }}
      >
        {/* Schloss öffnet sich nach oben */}
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            initial={{ d: "M7 11V7a5 5 0 0110 0v4" }}
            animate={{ d: "M7 11V5a3 3 0 016 0" }}
            transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        </svg>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{ fontSize: '26px', fontWeight: 800, color: text, letterSpacing: '-0.04em', fontFamily: "'DM Sans', sans-serif", marginBottom: '8px' }}
      >
        {locale === 'de' ? 'Entsperrt! 🎉' : 'Unlocked! 🎉'}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ fontSize: '15px', color: muted, fontFamily: "'DM Sans', sans-serif", textAlign: 'center' as const, maxWidth: '260px', lineHeight: 1.5 }}
      >
        {locale === 'de' ? 'Dein Stylist ist bereit — lass uns loslegen!' : 'Your stylist is ready — let\'s go!'}
      </motion.p>
    </motion.div>
  )}
</AnimatePresence>

      {/* Background glows */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: '420px', height: '420px', borderRadius: '50%', background: isDark ? 'rgba(14,164,114,0.06)' : 'rgba(14,164,114,0.12)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '60px', left: '-100px', width: '350px', height: '350px', borderRadius: '50%', background: isDark ? 'rgba(8,145,178,0.04)' : 'rgba(8,145,178,0.08)', filter: 'blur(90px)' }} />
        {!isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="dotgrid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.9" fill="#0ea472" opacity="0.25" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#dotgrid)" />
          </svg>
        )}
        {isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="linegrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0ea472" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#linegrid)" />
          </svg>
        )}
      </div>

      <Navbar activePage="dresser" />

      <main ref={mainRef} style={{ flex: 1, overflowY: 'auto' as const, overflowX: 'hidden', maxWidth: '540px', width: '100%', margin: '0 auto', padding: '68px 18px 112px', position: 'relative', zIndex: 1 }}>

        {/* ── Hero Header: Greeting + Weather Card side by side ── */}
        <div
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '28px' }}>

          {/* Left: Greeting */}
          <div style={{ flex: 1 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: accent, opacity: 0.75 }}>
                {today} · {dateStr}
              </p>
              {isPremium && (
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '4px', padding: '2px 6px', letterSpacing: '0.04em', boxShadow: '0 2px 6px rgba(251,191,36,0.4)' }}>✦ PRO</span>
              )}
            </div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.04em', color: text, lineHeight: 1.15 }}>
              {greeting}{username ? ',' : ''}
            </h1>
          {username && (
              <p style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.15, background: `linear-gradient(135deg, ${accent}, #0891b2)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {username}.
              </p>
            )}
            {wardrobeItems.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '10px', background: accentDim, border: `1px solid ${border}`, borderRadius: '100px', padding: '5px 12px 5px 10px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
                </svg>
                <span style={{ fontSize: '12px', fontWeight: 600, color: muted }}>
                  {locale === 'de' ? 'Kleiderschrank:' : 'Wardrobe:'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: accent }}>
                  {wardrobeItems.length} {locale === 'de' ? 'Teile' : 'items'}
                </span>
              </motion.div>
            )}
          </div>

          {/* Right: Weather Card */}
 <motion.div
  ref={weatherRef}
  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
  onClick={fetchWeather}
  style={{ flexShrink: 0, width: '120px', background: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '14px 12px', textAlign: 'center' as const, cursor: 'pointer', boxShadow: isDark ? 'none' : '0 2px 16px rgba(10,46,30,0.07)' }}>
{weatherLoading ? (
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: '60px', height: '14px', borderRadius: '6px', background: border, margin: '0 auto 8px' }} />
            ) : (
              <>
                <div style={{ fontSize: '28px', lineHeight: 1, marginBottom: '4px' }}>{weather?.icon}</div>
                <p style={{ fontSize: '22px', fontWeight: 800, color: text, letterSpacing: '-0.04em', marginBottom: '6px', lineHeight: 1 }}>
                  {weather?.temp}°C
                </p>
             {weather?.city && (
                  <>
                    <div style={{ width: '30px', height: '1px', background: border, margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '11px', fontWeight: 600, color: muted, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      📍 {weather.city}
                    </p>
                  </>
                )}
              </>
            )}
    </motion.div>
        </div>

{!hasItems ? (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

    {/* Occasion chips — ausgegraut */}
    <div style={{ marginBottom: '22px', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' as const, filter: 'blur(1.5px)' }}>
      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted, marginBottom: '10px' }}>
        {locale === 'de' ? 'Anlass' : 'Occasion'}
      </p>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
        {['Casual', 'Uni', 'Arbeit', 'Date', 'Sport', 'Party', 'Festival'].map((occ, i) => (
          <div key={i} style={{ padding: '8px 16px', borderRadius: '100px', border: `1px solid ${i === 0 ? accent : border}`, background: i === 0 ? accent : card, color: i === 0 ? '#fff' : muted, fontSize: '13px', fontWeight: i === 0 ? 600 : 400 }}>
            {occ}
          </div>
        ))}
      </div>
    </div>

    {/* Category grid — ausgegraut */}
    <div style={{ marginBottom: '22px', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' as const, filter: 'blur(1.5px)' }}>
      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted, marginBottom: '10px' }}>
        {locale === 'de' ? 'Was soll ins Outfit?' : 'What to include?'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {categoryConfig.map((cat, i) => (
          <div key={i} style={{
            gridColumn: i === categoryConfig.length - 1 && categoryConfig.length % 2 !== 0 ? '1 / -1' : undefined,
            display: 'flex', flexDirection: 'column' as const,
            alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '22px 16px', borderRadius: '18px',
            border: `1.5px solid ${border}`, background: card,
          }}>
            <span style={{ color: muted }}>{cat.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: muted }}>
              {locale === 'de' ? cat.labelDe : cat.labelEn}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Lock Banner statt Button */}
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push('/' + locale + '/wardrobe')}
      style={{
        width: '100%', padding: '18px',
        borderRadius: '100px', border: 'none',
        background: `linear-gradient(135deg, ${accent}, #6b9fff)`,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px',
        cursor: 'pointer',
        boxShadow: `0 6px 28px ${accent}45`,
      }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
      <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', fontFamily: "'DM Sans', sans-serif" }}>
        {locale === 'de' ? 'Kleidung hochladen →' : 'Upload clothes →'}
      </span>
    </motion.div>

    <p style={{ textAlign: 'center' as const, fontSize: '12px', color: muted, marginTop: '12px' }}>
      {locale === 'de' ? 'Mind. 3 Teile für dein erstes Outfit' : 'Min. 3 items for your first outfit'}
    </p>

  </motion.div>
) : (
          <>
            {/* ── Occasion chips ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }} style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted, marginBottom: '10px' }}>
                {locale === 'de' ? 'Anlass' : 'Occasion'}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {occasions.map((occ, i) => {
                  const isOn = selected === occ
                  return (
                    <motion.button key={occ}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14 + i * 0.03 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { setSelected(occ); setOutfit(null); setSaved(false) }}
                      style={{ padding: '8px 16px', borderRadius: '100px', border: `1px solid ${isOn ? accent : border}`, background: isOn ? accent : card, color: isOn ? '#fff' : muted, fontSize: '13px', fontWeight: isOn ? 600 : 400, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', letterSpacing: '-0.01em', transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent', boxShadow: isOn ? '0 2px 12px rgba(14,164,114,0.3)' : 'none' }}>
                      {t('dresser.occasions.' + occ)}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

      {/* ── Category Chips (kompakt) ── */}
           <motion.div ref={categoryRef} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4 }} style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted }}>
                  {t('dresser.whatForOutfit')}
                </p>
          <motion.button whileTap={{ scale: 0.92 }}
                  onClick={() => { setActiveCategories(['tops','hosen','jacken','schuhe']); setOutfit(null) }}
                  style={{ fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px', border: `1px solid ${activeCategories.length === 4 ? accent : border}`, background: activeCategories.length === 4 ? accentDim : 'transparent', color: activeCategories.length === 4 ? accent : muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {locale === 'de' ? 'Alle' : 'All'}
                </motion.button>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {categoryConfig.map((cat) => {
                  const isOn = activeCategories.includes(cat.key)
                  const exists = wardrobeItems.some(item => item.category === cat.key)

                  return (
                    <motion.button
                      key={cat.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCategory(cat.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '100px',
                        border: `1px solid ${isOn ? accent : border}`,
                        background: isOn ? accentDim : card,
                        color: isOn ? accent : exists ? text : muted,
                        cursor: 'pointer', opacity: exists ? 1 : 0.4,
                        transition: 'all 0.15s',
                        WebkitTapHighlightColor: 'transparent',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '13px', fontWeight: isOn ? 600 : 400,
                      }}>
                      <span style={{ display: 'flex', color: isOn ? accent : muted, opacity: exists ? 1 : 0.5, transform: 'scale(0.7)' }}>
                        {cat.icon}
                      </span>
                      {locale === 'de' ? cat.labelDe : cat.labelEn}
                    </motion.button>
                  )
                })}
              </div>
           </motion.div>

         {/* ── Wetter-Schalter ── */}
            <motion.div ref={weatherToggleRef} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21, duration: 0.4 }}
              onClick={() => { setWeatherAware(v => !v); setOutfit(null) }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '14px', border: `1px solid ${weatherAware ? accent + '40' : border}`, background: weatherAware ? accentDim : card, marginBottom: '18px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ fontSize: '17px' }}>{weatherAware ? '🌤️' : '🎨'}</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: text, letterSpacing: '-0.01em' }}>
                    {locale === 'de' ? 'Wetter berücksichtigen' : 'Consider weather'}
                  </p>
                  <p style={{ fontSize: '11px', color: muted, marginTop: '1px' }}>
                    {weatherAware
                      ? (locale === 'de' ? 'KI passt Outfit ans Wetter an' : 'AI matches outfit to weather')
                      : (locale === 'de' ? 'Nur deine Auswahl zählt' : 'Only your selection counts')}
                  </p>
                </div>
              </div>
              <div style={{ width: '44px', height: '26px', borderRadius: '13px', background: weatherAware ? accent : border, position: 'relative' as const, transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'left 0.2s', left: weatherAware ? '21px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </motion.div>

            {/* ── CTA Button ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.4 }} style={{ marginBottom: '28px' }}>
              <motion.button ref={dressMeRef} onClick={generateOutfit} disabled={loading} whileTap={!loading ? { scale: 0.97 } : {}}
                style={{ width: '100%', padding: '19px', borderRadius: '100px', border: 'none', background: loading ? (isDark ? '#0f1a14' : '#e6f7f0') : 'linear-gradient(135deg, #0ea472 0%, #0891b2 100%)', color: loading ? muted : '#fff', fontSize: '17px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', letterSpacing: '-0.02em', WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 6px 28px rgba(14,164,114,0.45)' }}>
                {loading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'block', width: '17px', height: '17px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: accent, flexShrink: 0 }} />
                    {t('dresser.generating')}
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm6 10l.75 2.25L21 15l-2.25.75L18 18l-.75-2.25L15 15l2.25-.75L18 12z"/>
                    </svg>
            {outfit ? '↻ ' + t('dresser.newOutfit') : t('dresser.button') + ' ✦'}
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* ── Outfit Result ── */}
            <AnimatePresence mode="wait">
             {outfit && (
  <motion.div key="outfit"
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.97 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    style={{ border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', background: card, boxShadow: isDark ? 'none' : '0 4px 24px rgba(10,46,30,0.08)' }}>

    {/* Header */}
    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${border}`, background: accentDim }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: accent, marginBottom: '2px' }}>{t('dresser.outfitFor')}</p>
          <p style={{ fontSize: '16px', fontWeight: 800, color: text, letterSpacing: '-0.03em' }}>{t('dresser.occasions.' + selected)}</p>
        </div>
        <motion.button whileTap={{ scale: 0.91 }} onClick={saveOutfit}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '100px', border: `1px solid ${saved ? accent : border}`, background: saved ? accent : 'transparent', color: saved ? '#fff' : text, fontSize: '12px', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', transition: 'all 0.15s' }}>
          {saved ? `✓ ${t('dresser.saved')}` : `♡ ${t('dresser.save')}`}
        </motion.button>
      </div>
{outfit.outfits.length < 3 && (
  <p style={{ fontSize: '11px', color: muted, marginBottom: '8px', textAlign: 'center' as const }}>
    {locale === 'de'
      ? `💡 Lade mehr Kleidung hoch für bis zu 3 Outfit-Vorschläge`
      : `💡 Upload more clothes for up to 3 outfit suggestions`}
  </p>
)}
      {/* 3 Vibe Tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {outfit.outfits.map((o, i) => (
          <motion.button key={i} whileTap={{ scale: 0.95 }}
  onClick={() => { setOutfit({ ...outfit, active: i }); setSaved(false) }}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: '10px',
              border: `1px solid ${outfit.active === i ? accent : border}`,
              background: outfit.active === i ? accent : 'transparent',
              color: outfit.active === i ? '#fff' : muted,
              fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
            }}>
            {o.vibe ?? `Outfit ${i + 1}`}
          </motion.button>
        ))}
      </div>
    </div>

    {/* Active Outfit */}
    <AnimatePresence mode="wait">
      <motion.div key={outfit.active}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${outfit.outfits[outfit.active].itemObjects.length >= 3 ? 3 : 2}, 1fr)`, gap: '1px', background: border }}>
          {outfit.outfits[outfit.active].itemObjects.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }} style={{ background: card }}>
              <div style={{ aspectRatio: '1', overflow: 'hidden', background: isDark ? '#0a1510' : '#f0fdf8' }}>
                <img src={item.image_url} alt={item.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ padding: '9px 11px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: '1px' }}>{item.name}</p>
                <p style={{ fontSize: '10px', color: muted }}>{item.color}{item.brand ? ` · ${item.brand}` : ''}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {outfit.outfits[outfit.active].reasoning && (
          <div style={{ padding: '14px 18px', borderTop: `1px solid ${border}` }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: accent, marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: accent }} />
              {t('dresser.kiStylist')}
            </p>
            <p style={{ fontSize: '13px', color: muted, lineHeight: 1.7 }}>{outfit.outfits[outfit.active].reasoning}</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
{outfit.outfits.length < 3 && (
  <motion.button
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => router.push('/' + locale + '/wardrobe')}
    style={{
      margin: '0 18px 12px',
      width: 'calc(100% - 36px)',
      padding: '12px 14px',
      borderRadius: '12px',
      background: accentDim,
      border: `1px solid ${accent}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
      WebkitTapHighlightColor: 'transparent',
    }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '16px' }}>👕</span>
      <p style={{ fontSize: '12px', color: accent, fontWeight: 600, textAlign: 'left' as const }}>
        {locale === 'de'
          ? `Tipp: Hier tippen, um mehr Klamotten für bis zu 3 Vorschläge hochzuladen!`
          : `Tip: Tap here to upload more clothes for up to 3 suggestions!`}
      </p>
    </div>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  </motion.button>
)}
</motion.div>
)}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  )
}