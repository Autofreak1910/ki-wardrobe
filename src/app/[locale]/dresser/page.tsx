'use client'
import WelcomeOverlay from '@/components/WelcomeOverlay'
import { useState, useEffect, useRef, RefObject } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import UpgradeModal from '@/components/UpgradeModal'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const [showUpgrade, setShowUpgrade] = useState(false)
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
  const hoursSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60))
  return pool[hoursSinceEpoch % pool.length]
}

const occasions = ['casual', 'work', 'date', 'party'] as const

const categoryConfig = [
{ key: 'tops',   labelDe: 'Oberteil', labelEn: 'Top',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg> },
  { key: 'jacken', labelDe: 'Jacke',    labelEn: 'Jacket',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 2l4 4-2 2 2 14H4L6 8 4 6l4-4"/><path d="M12 2v7"/><path d="M8 2c0 2.5 1.5 4 4 4s4-1.5 4-4"/></svg> },
  { key: 'hosen',  labelDe: 'Hose',     labelEn: 'Pants',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v4l-4 14h-4l-1-8-1 8H7L3 7V3z"/></svg> },
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
function getNextWeekResetLabel(locale: string): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diffToNextMonday = day === 0 ? 1 : 8 - day
  const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToNextMonday, 0, 0, 0, 0))
  return nextMonday.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}
function getWeekStartUTC(): Date {
  const now = new Date()
  const day = now.getUTCDay() // 0 = So, 1 = Mo, ... 6 = Sa
  const diffToMonday = (day === 0 ? -6 : 1) - day
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday, 0, 0, 0, 0))
}
// Modul-Level-Cache -- ueberlebt Seitenwechsel, kein Skeleton-Flackern mehr bei erneutem Besuch
let stylistCache: {
  wardrobeItems: ClothingItem[]
  username: string
  isPremium: boolean
  premiumUntil: string | null
  dailyFreeOutfit: { id: string; reasoning: string; vibe?: string; itemObjects: ClothingItem[] } | null
  streak: number
} | null = null

export default function DresserPage() {
  const [selected, setSelected] = useState<string>('casual')
  const [loading, setLoading] = useState(false)
const [outfit, setOutfit] = useState<OutfitGroup | null>(null)
const [dailyFreeOutfit, setDailyFreeOutfit] = useState<{ id: string; reasoning: string; vibe?: string; itemObjects: ClothingItem[] } | null>(stylistCache?.dailyFreeOutfit ?? null)
const [dailyFreeOutfitLoading, setDailyFreeOutfitLoading] = useState(!stylistCache)
const [dailyFreeOutfitExpanded, setDailyFreeOutfitExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>(stylistCache?.wardrobeItems ?? [])
  const [hasItems, setHasItems] = useState(stylistCache ? stylistCache.wardrobeItems.length >= 3 : true)
 const [activeCategories, setActiveCategories] = useState<string[]>(['tops', 'hosen', 'jacken', 'schuhe'])
const [weatherAware, setWeatherAware] = useState(true)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherDisabled, setWeatherDisabled] = useState(false)
const [username, setUsername] = useState<string>(stylistCache?.username ?? '')
  const [isPremium, setIsPremium] = useState(stylistCache?.isPremium ?? false)
  const [premiumLoading, setPremiumLoading] = useState(!stylistCache)
  const [premiumUntil, setPremiumUntil] = useState<string | null>(stylistCache?.premiumUntil ?? null)
const [showProInfo, setShowProInfo] = useState(false)
const [showUpgrade, setShowUpgrade] = useState(false)
  const { theme } = useTheme()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [limitMsg, setLimitMsg] = useState<string | null>(null)
  const isDark = theme === 'dark'
  const mainRef = useRef<HTMLElement>(null)
  const checkingReferrerRef = useRef(false)
  const weatherRef = useRef<HTMLDivElement>(null)
const categoryRef = useRef<HTMLDivElement>(null)
const weatherToggleRef = useRef<HTMLDivElement>(null)
const statsRef = useRef<HTMLDivElement>(null)
const occasionRef = useRef<HTMLDivElement>(null)
const dressMeRef = useRef<HTMLButtonElement>(null)
const [showUnlock, setShowUnlock] = useState(false)
const [onboardingReady, setOnboardingReady] = useState(false)
const [showPushPrompt, setShowPushPrompt] = useState(false)
const [showProWelcome, setShowProWelcome] = useState(false)
  const [proWelcomeData, setProWelcomeData] = useState<{ days: number; until: string; fromInvite: boolean } | null>(null)
const [showReferralReward, setShowReferralReward] = useState(false)
const [showWelcomeInvited, setShowWelcomeInvited] = useState(false)
const [referrerName, setReferrerName] = useState('')
  const days = locale === 'de'
    ? ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
 const today = days[new Date().getDay()]
  const dateStr = new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long' })
const [greeting, setGreeting] = useState('')
const [streak, setStreak] = useState(stylistCache?.streak ?? 0)
  const [weekOutfitsUsed, setWeekOutfitsUsed] = useState(0)
  const [savedOutfitsCount, setSavedOutfitsCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [streakReward, setStreakReward] = useState<{ days: number; milestone: number } | null>(null)
  const [showStreakInfo, setShowStreakInfo] = useState(false)
useEffect(() => {
  setGreeting(getGreeting(locale))
}, [locale])
useEffect(() => {
  try {
    localStorage.removeItem('kw_current_outfit')
    localStorage.removeItem('kw_outfit_generating')
    localStorage.removeItem('kw_app_last_seen')
  } catch {}
  loadWardrobe()
  fetchWeather()
  loadDailyFreeOutfit()
  loadStreak()

  function onVisible() {
    if (document.visibilityState === 'visible') loadWardrobe()
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}, [])

async function loadDailyFreeOutfit() {
  try {
    const res = await fetch('/api/daily-outfit')
    const data = await res.json()
    setDailyFreeOutfit(data.outfit ?? null)
    stylistCache = { ...(stylistCache ?? { wardrobeItems: [], username: '', isPremium: false, premiumUntil: null, streak: 0 }), dailyFreeOutfit: data.outfit ?? null }
  } catch (err) {
    console.error('Daily free outfit load failed:', err)
  } finally {
    setDailyFreeOutfitLoading(false)
  }
}


useEffect(() => {
  if (wardrobeItems.length >= 3 && userId) {
    const seen = localStorage.getItem('kw_welcome_seen_' + userId)
    if (!seen) {
      setShowUnlock(true)
      setTimeout(() => {
        setShowUnlock(false)
        setTimeout(() => setOnboardingReady(true), 600)
      }, 2800)
    }
  }
}, [wardrobeItems.length, userId])

function checkProWelcomePending() {
  const pending = localStorage.getItem('kw_pro_welcome_pending')
  if (pending) {
    localStorage.removeItem('kw_pro_welcome_pending')
    try {
      const data = JSON.parse(pending)
      setProWelcomeData(data)
    } catch {
      setProWelcomeData({ days: 14, until: '', fromInvite: false })
    }
    setTimeout(() => setShowProWelcome(true), 600)
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

async function loadStreak() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const { data } = await supabase.from('profiles').select('current_streak, last_outfit_date').eq('id', session.user.id).single()
    if (data?.current_streak !== undefined) {
      setStreak(data.current_streak ?? 0)
      stylistCache = { ...(stylistCache ?? { wardrobeItems: [], username: '', isPremium: false, premiumUntil: null, dailyFreeOutfit: null }), streak: data.current_streak ?? 0 }
    }
  }

  async function loadWardrobe() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    setUserId(session.user.id)
    const welcomeSeenKey = 'kw_invited_welcome_seen_' + session.user.id
    if (!localStorage.getItem(welcomeSeenKey) && !checkingReferrerRef.current) {
      checkingReferrerRef.current = true
      try {
        const { data: refName, error: refErr } = await supabase.rpc('get_referrer_username', { p_user_id: session.user.id })
        if (refName) {
          setReferrerName(refName)
          const justFinished = localStorage.getItem('kw_onboarding_just_finished') === 'true'
          const delay = justFinished ? 500 : 1500
          if (justFinished) localStorage.removeItem('kw_onboarding_just_finished')
          setTimeout(() => {
            localStorage.setItem(welcomeSeenKey, 'true')
            setShowWelcomeInvited(true)
          }, delay)
          setTimeout(() => setShowWelcomeInvited(false), delay + 5500)
        } else if (!refErr) {
          // Nur als "gesehen" markieren wenn die Abfrage wirklich sauber durchlief
          // und es einfach keinen Referrer gab -- nicht bei einem Datenbank-Fehler,
          // sonst haengt sich das faelschlich fest und das Popup zeigt sich nie mehr.
          localStorage.setItem(welcomeSeenKey, 'true')
        } else {
          console.error('Referrer RPC failed, will retry next visit:', refErr)
        }
      } catch (err) {
        console.error('Referrer lookup failed:', err)
      } finally {
        checkingReferrerRef.current = false
      }
    }

    const { data } = await supabase.from('clothing_items').select('*').eq('user_id', session.user.id)
    if (data) { setWardrobeItems(data); setHasItems(data.length >= 3) }
const { data: profile } = await supabase.from('profiles').select('username, premium_until').eq('id', session.user.id).single()
    if (profile?.username) setUsername(profile.username)
    if (profile?.premium_until) {
      const until = new Date(profile.premium_until)
      if (until > new Date()) {
        setPremiumUntil(until.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
      }
    }
  const { data: stillPremium } = await supabase.rpc('check_and_expire_premium', { p_user_id: session.user.id })
    setIsPremium(stillPremium ?? false)
    setPremiumLoading(false)

    const weekStart = getWeekStartUTC()
    const [weekOutfitsRes, savedRes] = await Promise.all([
      supabase.from('outfit_generations').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).gte('created_at', weekStart.toISOString()),
      supabase.from('outfits').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
    ])
    setWeekOutfitsUsed(weekOutfitsRes.count ?? 0)
    setSavedOutfitsCount(savedRes.count ?? 0)

    stylistCache = {
      wardrobeItems: data ?? [],
      username: profile?.username ?? '',
      isPremium: stillPremium ?? false,
      premiumUntil: (profile?.premium_until && new Date(profile.premium_until) > new Date())
        ? new Date(profile.premium_until).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : null,
      dailyFreeOutfit: stylistCache?.dailyFreeOutfit ?? null,
      streak: stylistCache?.streak ?? 0,
    }
}

async function fetchWeather() {
  setWeatherLoading(true)
  if (localStorage.getItem('kw_weather_disabled') === 'true') {
    setWeather(null)
    setWeatherLoading(false)
    setWeatherDisabled(true)
    setWeatherAware(false)
    return
  }
  setWeatherDisabled(false)
  try {
    let lat: number, lon: number
    const cachedCoords = localStorage.getItem('kw_coords')
    if (cachedCoords) {
      const parsed = JSON.parse(cachedCoords)
      lat = parsed.lat
      lon = parsed.lon
    } else {
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
      try { localStorage.setItem('kw_coords', JSON.stringify({ lat, lon })) } catch {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').update({ last_lat: lat, last_lon: lon }).eq('id', session.user.id)
      }
    })

    const [weatherRes, geoRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,is_day&timezone=auto`),
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
    ])

    const [wd, gd] = await Promise.all([weatherRes.json(), geoRes.json()])

    const { icon, condition } = parseWeatherCode(wd.current.weathercode, wd.current.is_day === 1)
    const city = gd.address?.city || gd.address?.town || gd.address?.village || ''

    setWeather({ temp: Math.round(wd.current.temperature_2m), condition, icon, city })

  } catch (err: any) {
    try {
      const ipRes = await fetch('https://ipapi.co/json/')
      const ipData = await ipRes.json()
      const { latitude: lat, longitude: lon, city } = ipData

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,is_day&timezone=auto`)
      const wd = await weatherRes.json()
      const { icon, condition } = parseWeatherCode(wd.current.weathercode, wd.current.is_day === 1)

      setWeather({ temp: Math.round(wd.current.temperature_2m), condition, icon, city: city || '' })
    } catch {
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
    const stored = localStorage.getItem('kw_usage_window')
    const window: string[][] = stored ? JSON.parse(stored) : []
    window.push(ids)
    const trimmed = window.slice(-12)
    localStorage.setItem('kw_usage_window', JSON.stringify(trimmed))

    localStorage.setItem('kw_recent_outfit_history', JSON.stringify(trimmed.slice(-2)))
  } catch {}
}

async function generateOutfit() {
if (wardrobeItems.length < 3) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

const weekStart = getWeekStartUTC()
const { count: weekCount, error: countError } = await supabase
    .from('outfit_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .gte('created_at', weekStart.toISOString())
if (countError) console.error('Count error:', countError)

const WEEKLY_LIMIT = isPremium ? 14 : 3
if ((weekCount ?? 0) >= WEEKLY_LIMIT) {
  if (isPremium) {
    const resetLabel = getNextWeekResetLabel(locale)
    setLimitMsg(locale === 'de'
      ? `Wochenlimit erreicht — wird am ${resetLabel} zurückgesetzt`
      : `Weekly limit reached — resets on ${resetLabel}`)
  } else {
    setLimitMsg(locale === 'de'
      ? `Wochenlimit erreicht — ${WEEKLY_LIMIT}/${WEEKLY_LIMIT} Outfits`
      : `Weekly limit reached — ${WEEKLY_LIMIT}/${WEEKLY_LIMIT} outfits`)
  }
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
      try {
       const streakRes = await fetch('/api/update-streak', { 
          method: 'POST',
          credentials: 'include',
        })
        const streakData = await streakRes.json()
        if (streakData.streak) setStreak(streakData.streak)
        if (streakData.streakReward) setStreakReward(streakData.streakReward)
      } catch {}
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

  const bg        = isDark ? '#161616' : '#FDFCF9'
const card      = isDark ? '#1D1D20' : '#ffffff'
const border    = isDark ? '#2a2a2e' : '#EAE7E0'
const text      = isDark ? '#F5F3EE' : '#1D1D20'
const muted     = isDark ? '#9a978f' : '#8A8680'
const accent    = isDark ? '#5C82A0' : '#355C7D'
const accentDim = isDark ? 'rgba(92,130,160,0.12)' : 'rgba(53,92,125,0.07)'
const goldAccent = '#F1B951'
const sageGradient = 'linear-gradient(135deg, #7FA98E, #355C7D)'

return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'Poppins', 'Inter', sans-serif", position: 'relative' as const, backgroundImage: isDark ? 'none' : 'radial-gradient(circle, rgba(29,29,32,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

<WelcomeOverlay
  categoryRef={categoryRef}
  weatherToggleRef={weatherToggleRef}
  statsRef={statsRef}
  occasionRef={occasionRef}
  dressMeRef={dressMeRef}
  itemCount={wardrobeItems.length}
  userId={userId}
  ready={onboardingReady && !weatherLoading}
/>

<AnimatePresence>
  {limitMsg && (
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
onClick={() => {
  if (isPremium) { setLimitMsg(null) } else { setShowUpgrade(true) }
}}
 style={{
  position: 'fixed', top: '80px',
  left: '16px', right: '16px',
  margin: '0 auto',
  maxWidth: '340px',
  zIndex: 9997, background: card, border: `1px solid ${border}`,
  padding: '14px 18px', borderRadius: '18px',
  fontFamily: "'Poppins', 'Inter', sans-serif",
  boxShadow: `0 8px 32px rgba(0,0,0,0.25)`,
  cursor: 'pointer',
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
    <span style={{ fontSize: '20px' }}>🔒</span>
    <p style={{ fontSize: '13px', fontWeight: 700, color: text }}>{limitMsg}</p>
  </div>
<div style={{ background: sageGradient, borderRadius: '10px', padding: '10px', textAlign: 'center' as const }}>
  <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
    {isPremium
      ? (locale === 'de' ? '✦ Dein Gratis-Tagesoutfit ist aber noch da!' : '✦ Your free daily outfit is still there!')
      : (locale === 'de' ? '✦ Jetzt upgraden für €4,99/Mo' : '✦ Upgrade now for €4.99/mo')}
  </p>
</div>
</motion.div>
  )}
</AnimatePresence>
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
          style={{ width: '100%', padding: '13px', background: sageGradient, border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '8px' }}>
          {locale === 'de' ? '☀️ Ja, aktivieren' : '☀️ Yes, enable'}
        </motion.button>
<button
          onClick={() => { localStorage.setItem('kw_push_prompt_seen', 'true'); setShowPushPrompt(false) }}
          style={{ width: '100%', padding: '11px', background: 'transparent', border: 'none', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
          {locale === 'de' ? 'Vielleicht später' : 'Maybe later'}
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
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
        style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '12px', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
        {locale === 'de' ? '✦ Willkommen bei KiWardrobe ✦' : '✦ Welcome to KiWardrobe ✦'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.68, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '15px', fontWeight: 600, color: muted, fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '4px' }}>
        {locale === 'de' ? 'Du wurdest eingeladen von' : 'You were invited by'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 16, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.78, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '32px', fontWeight: 800, color: text, letterSpacing: '-0.04em', fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '14px' }}>
        <span style={{ background: 'linear-gradient(135deg, #a855f7, #6b9fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{referrerName}</span>
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.95, type: 'spring', damping: 14 }}
        style={{ background: goldAccent, borderRadius: '14px', padding: '10px 20px', marginBottom: '16px', boxShadow: '0 4px 20px rgba(251,191,36,0.4)' }}>
        <p style={{ fontSize: '17px', fontWeight: 800, color: '#fff', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
          {locale === 'de' ? '🎁 14 Tage Pro gratis!' : '🎁 14 days Pro free!'}
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
        style={{ fontSize: '14px', color: muted, fontFamily: "'Poppins', 'Inter', sans-serif", textAlign: 'center' as const, maxWidth: '280px', lineHeight: 1.6 }}>
        {locale === 'de' ? 'Lad deine Kleidung hoch und lass die KI dein perfektes Outfit zusammenstellen 🚀' : 'Upload your clothes and let the AI create your perfect outfit 🚀'}
      </motion.p>
    </motion.div>
  )}
</AnimatePresence>
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
        style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '12px', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
        {locale === 'de' ? '✦ Einladung erfolgreich ✦' : '✦ Invite successful ✦'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.68, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '15px', fontWeight: 600, color: muted, fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '4px' }}>
        {locale === 'de' ? 'Du hast' : 'You got'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 16, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.78, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '40px', fontWeight: 800, color: text, letterSpacing: '-0.04em', fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '14px' }}>
        +7 <span style={{ background: 'linear-gradient(135deg, #10b981, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{locale === 'de' ? 'Tage Pro' : 'days Pro'}</span>
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
        style={{ fontSize: '15px', color: muted, fontFamily: "'Poppins', 'Inter', sans-serif", textAlign: 'center' as const, maxWidth: '280px', lineHeight: 1.6 }}>
        {locale === 'de' ? 'Danke fürs Einladen! Lad weitere Freunde ein für noch mehr Gratis-Zeit 🚀' : 'Thanks for inviting! Invite more friends for even more free time 🚀'}
      </motion.p>
    </motion.div>
  )}
</AnimatePresence>

<AnimatePresence>
  {showProWelcome && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center',
        background: isDark ? 'rgba(8,12,24,0.97)' : 'rgba(240,244,255,0.97)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}>

      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.3), rgba(168,85,247,0.15), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {[...Array(24)].map((_, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: Math.cos(i * 15 * Math.PI / 180) * (160 + (i % 3) * 30), y: Math.sin(i * 15 * Math.PI / 180) * (160 + (i % 3) * 30), scale: [0, 1.4, 1, 0], rotate: [0, 180] }}
          transition={{ delay: 0.3 + i * 0.025, duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', width: i % 3 === 0 ? '10px' : '7px', height: i % 3 === 0 ? '10px' : '7px', borderRadius: i % 2 === 0 ? '50%' : '3px', background: i % 4 === 0 ? '#fbbf24' : i % 4 === 1 ? accent : i % 4 === 2 ? '#a855f7' : '#6b9fff' }}
        />
      ))}

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
        style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: '12px', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
        {locale === 'de' ? '✦ Willkommen im Club ✦' : '✦ Welcome to the club ✦'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.68, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '15px', fontWeight: 600, color: muted, letterSpacing: '-0.01em', fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '4px' }}>
        {locale === 'de' ? 'Du bist jetzt' : "You're now a"}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.78, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontSize: '38px', fontWeight: 800, color: text, letterSpacing: '-0.04em', fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '14px' }}>
        KiWardrobe <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pro</span>{locale === 'de' ? '' : ' User'}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        style={{ fontSize: '15px', color: muted, fontFamily: "'Poppins', 'Inter', sans-serif", textAlign: 'center' as const, maxWidth: '280px', lineHeight: 1.6, marginBottom: '12px' }}>
     {proWelcomeData?.fromInvite
  ? (locale === 'de' ? `Dein Freund hat dich eingeladen 🎁` : `Your friend invited you 🎁`)
  : (locale === 'de' ? '14 Outfits/Woche · Unbegrenzt Kleidung · Style DNA 🚀' : '14 outfits/week · Unlimited items · Style DNA 🚀')}
      </motion.p>

      {proWelcomeData?.until && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.15 }}
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '12px', padding: '10px 20px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', fontFamily: "'Poppins', 'Inter', sans-serif", textAlign: 'center' as const }}>
            {locale === 'de' ? `✦ Pro aktiv bis ${proWelcomeData.until}` : `✦ Pro active until ${proWelcomeData.until}`}
          </p>
        </motion.div>
      )}

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowProWelcome(false)}
        style={{ background: goldAccent, border: 'none', borderRadius: '14px', padding: '14px 32px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: '0 6px 24px rgba(251,191,36,0.4)' }}>
        {locale === 'de' ? "Los geht's! ✦" : "Let's go! ✦"}
      </motion.button>
    </motion.div>
  )}
</AnimatePresence>
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
      {[...Array(12)].map((_, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: (Math.cos(i * 30 * Math.PI / 180)) * 120, y: (Math.sin(i * 30 * Math.PI / 180)) * 120, scale: [0, 1.2, 1, 0] }}
          transition={{ delay: 0.4 + i * 0.04, duration: 1 }}
          style={{ position: 'absolute', width: '10px', height: '10px', borderRadius: '50%', background: i % 3 === 0 ? accent : i % 3 === 1 ? '#6b9fff' : '#a855f7' }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
        style={{
          width: '110px', height: '110px', borderRadius: '32px',
          background: sageGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 80px ${accent}70, 0 0 40px ${accent}40`,
          marginBottom: '14px',
        }}
      >
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
        style={{ fontSize: '26px', fontWeight: 800, color: text, letterSpacing: '-0.04em', fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '8px' }}
      >
        {locale === 'de' ? 'Entsperrt! 🎉' : 'Unlocked! 🎉'}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ fontSize: '15px', color: muted, fontFamily: "'Poppins', 'Inter', sans-serif", textAlign: 'center' as const, maxWidth: '260px', lineHeight: 1.5 }}
      >
        {locale === 'de' ? 'Dein Stylist ist bereit — lass uns loslegen!' : 'Your stylist is ready — let\'s go!'}
      </motion.p>
    </motion.div>
  )}
</AnimatePresence>

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


      <main ref={mainRef} style={{ flex: 1, overflowY: 'auto' as const, overflowX: 'hidden', maxWidth: '540px', width: '100%', margin: '0 auto', padding: '68px 0 112px', position: 'relative', zIndex: 1 }}>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ position: 'relative' as const, height: '220px', marginBottom: '0', overflow: 'hidden' }}>

          <img
            src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80&auto=format&fit=crop"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', inset: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(240,244,255,0.1) 0%, rgba(240,244,255,0.6) 60%, rgba(240,244,255,1) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(240,244,255,0.7) 0%, rgba(240,244,255,0) 60%)' }} />

          <div style={{ position: 'absolute' as const, bottom: '20px', left: '18px', zIndex: 2 }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: text, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '2px' }}>
  {locale === 'de' ? 'Willkommen' : 'Welcome'}{username ? `, ${username}.` : '.'}
</h1>
            <p style={{ fontSize: '11px', color: muted }}>{today}, {dateStr}</p>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            onClick={() => { if (weatherDisabled) router.push('/' + locale + '/profile?scrollTo=weather') }}
           style={{ position: 'absolute' as const, top: '16px', right: '18px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '16px', padding: '10px 14px', textAlign: 'center' as const, zIndex: 2, cursor: weatherDisabled ? 'pointer' : 'default', minWidth: '70px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            {weatherDisabled ? (
              <><div style={{ fontSize: '20px' }}>🔒</div><p style={{ fontSize: '9px', color: muted, marginTop: '2px' }}>Wetter aus</p></>
            ) : weatherLoading ? (
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: '40px', height: '10px', borderRadius: '4px', background: border, margin: '0 auto' }} />
            ) : (
              <>
                <div style={{ fontSize: '24px', lineHeight: 1, marginBottom: '2px' }}>{weather?.icon}</div>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{weather?.temp}°C</p>
                {weather?.city && <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', marginTop: '2px', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>📍 {weather.city}</p>}
              </>
            )}
          </motion.div>
        </motion.div>

        <div ref={statsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', margin: '12px 18px 14px', padding: 0 }}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            onClick={() => router.push('/' + locale + '/wardrobe')}
            style={{ background: card, border: `1px solid ${border}`, borderRadius: '18px', padding: '14px 6px', textAlign: 'center' as const, cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '86px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '6px' }}>
              <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
            </svg>
            <p style={{ fontSize: '17px', fontWeight: 800, color: text, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '3px' }}>{wardrobeItems.length}</p>
            <p style={{ fontSize: '9px', color: muted, fontWeight: 600, lineHeight: 1.2 }}>{locale === 'de' ? 'Teile' : 'Items'}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            onClick={() => setShowStreakInfo(true)}
            style={{ background: streak >= 7 ? 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.06))' : card, border: `1px solid ${streak >= 7 ? 'rgba(249,115,22,0.3)' : border}`, borderRadius: '18px', padding: '14px 6px', textAlign: 'center' as const, cursor: 'pointer', opacity: streak === 0 ? 0.5 : 1, filter: streak === 0 ? 'grayscale(0.6)' : 'none', transition: 'all 0.3s', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '86px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={streak >= 7 ? '#c2410c' : text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '6px' }}>
              <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
            </svg>
            <p style={{ fontSize: '17px', fontWeight: 800, color: streak >= 7 ? '#c2410c' : text, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '3px' }}>{streak}</p>
            <p style={{ fontSize: '9px', color: muted, fontWeight: 600, lineHeight: 1.2 }}>{locale === 'de' ? 'Tage Streak' : 'Day Streak'}</p>
          </motion.div>

          {dailyFreeOutfitLoading ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: '18px', padding: '14px 6px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '86px', gap: '6px' }}>
              <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.3, repeat: Infinity }}
                style={{ width: '20px', height: '20px', borderRadius: '6px', background: border }} />
              <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.3, repeat: Infinity, delay: 0.15 }}
                style={{ width: '38px', height: '8px', borderRadius: '4px', background: border }} />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              onClick={() => setDailyFreeOutfitExpanded(v => !v)}
              style={{ background: dailyFreeOutfit ? accentDim : card, border: `1px solid ${dailyFreeOutfit ? accent + '40' : border}`, borderRadius: '18px', padding: '14px 6px', textAlign: 'center' as const, cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '86px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dailyFreeOutfit ? accent : muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '6px' }}>
                <rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8V21"/><path d="M3 8h18"/><path d="M7.5 8a2.5 2.5 0 010-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 010 5"/>
              </svg>
              <p style={{ fontSize: '9px', color: dailyFreeOutfit ? accent : muted, fontWeight: 700, lineHeight: 1.2 }}>{locale === 'de' ? 'Tages-outfit' : 'Daily outfit'}</p>
            </motion.div>
          )}

          {premiumLoading ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: '18px', padding: '14px 4px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '86px', gap: '6px' }}>
              <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.3, repeat: Infinity }}
                style={{ width: '20px', height: '20px', borderRadius: '6px', background: border }} />
              <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.3, repeat: Infinity, delay: 0.15 }}
                style={{ width: '30px', height: '8px', borderRadius: '4px', background: border }} />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
              onClick={() => setShowProInfo(true)}
              style={{ background: isPremium ? 'linear-gradient(135deg, rgba(241,185,81,0.2), rgba(241,185,81,0.08))' : card, border: `1px solid ${isPremium ? 'rgba(241,185,81,0.4)' : border}`, borderRadius: '18px', padding: '14px 4px', textAlign: 'center' as const, cursor: 'pointer', boxShadow: isPremium ? '0 0 16px rgba(241,185,81,0.15)' : 'none', opacity: isPremium ? 1 : 0.6, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '86px' }}>
              <motion.div animate={isPremium ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 2, repeat: Infinity }}
                style={{ marginBottom: '6px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isPremium ? '#b8860b' : muted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/><path d="M12 3l-3 6 3 12 3-12z"/>
                </svg>
              </motion.div>
              <p style={{ fontSize: '9px', color: isPremium ? '#b8860b' : muted, fontWeight: 700, lineHeight: 1.2 }}>
                {isPremium ? (locale === 'de' ? 'PRO-MITGLIED' : 'PRO MEMBER') : 'PRO'}
              </p>
            </motion.div>
          )}
        </div>

        <div style={{ padding: '0 18px' }}>


        </div>

        <div style={{ padding: '0 18px' }}>
       {!dailyFreeOutfitLoading && dailyFreeOutfit && dailyFreeOutfitExpanded && (
  <motion.div
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    style={{ marginBottom: '18px', border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', background: card, boxShadow: isDark ? 'none' : '0 4px 24px rgba(10,46,30,0.08)' }}>

    <motion.div whileTap={{ scale: 0.99 }}
      onClick={() => setDailyFreeOutfitExpanded(v => !v)}
      style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', cursor: 'pointer', background: accentDim, WebkitTapHighlightColor: 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
       <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff', background: accent, borderRadius: '100px', padding: '3px 9px', letterSpacing: '0.02em', flexShrink: 0 }}>
          🎁 {locale === 'de' ? 'GRATIS' : 'FREE'}
        </span>
        <p style={{ fontSize: '13px', fontWeight: 700, color: text, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {locale === 'de' ? 'Dein Tagesoutfit ist da ✦' : 'Your daily outfit is ready ✦'}
        </p>
      </div>
      <motion.span animate={{ rotate: dailyFreeOutfitExpanded ? 180 : 0 }} style={{ color: muted, fontSize: '13px', flexShrink: 0 }}>▾</motion.span>
    </motion.div>

    <AnimatePresence>
      {dailyFreeOutfitExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ overflow: 'hidden' }}>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dailyFreeOutfit.itemObjects.length >= 3 ? 3 : 2}, 1fr)`, gap: '1px', background: border, borderTop: `1px solid ${border}` }}>
            {dailyFreeOutfit.itemObjects.map((item, i) => (
              <div key={i} style={{ background: card }}>
                <div style={{ aspectRatio: '1', overflow: 'hidden', background: isDark ? '#0a1510' : '#f0fdf8' }}>
                  <img src={item.image_url} alt={item.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '9px 11px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: '1px' }}>{item.name}</p>
                  <p style={{ fontSize: '10px', color: muted }}>{item.color}{item.brand ? ` · ${item.brand}` : ''}</p>
                </div>
              </div>
            ))}
          </div>

          {dailyFreeOutfit.reasoning && (
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${border}` }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#f59e0b', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b' }} />
                {t('dresser.kiStylist')}
              </p>
              <p style={{ fontSize: '13px', color: muted, lineHeight: 1.7 }}>{dailyFreeOutfit.reasoning}</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
)}

{!hasItems ? (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

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

    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push('/' + locale + '/wardrobe')}
      style={{
        width: '100%', padding: '18px',
        borderRadius: '100px', border: 'none',
        background: sageGradient,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px',
        cursor: 'pointer',
        boxShadow: `0 6px 28px ${accent}45`,
      }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
      <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
        {locale === 'de' ? 'Kleidung hochladen →' : 'Upload clothes →'}
      </span>
    </motion.div>

    <p style={{ textAlign: 'center' as const, fontSize: '12px', color: muted, marginTop: '12px' }}>
      {locale === 'de' ? 'Mind. 3 Teile für dein erstes Outfit' : 'Min. 3 items for your first outfit'}
    </p>

  </motion.div>
) : (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: '18px', padding: '14px 16px', marginBottom: '16px' }}>

              <div ref={occasionRef} style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto' as const, paddingBottom: '2px' }}>
                {occasions.map((occ) => {
                  const isOn = selected === occ
                  return (
                    <motion.button key={occ} whileTap={{ scale: 0.92 }}
                      onClick={() => { setSelected(occ); setOutfit(null); setSaved(false) }}
                      style={{ padding: '7px 14px', borderRadius: '100px', border: `1px solid ${isOn ? accent : border}`, background: isOn ? accent : 'transparent', color: isOn ? '#fff' : muted, fontSize: '13px', fontWeight: isOn ? 600 : 400, fontFamily: "'Poppins', 'Inter', sans-serif", cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
                      {t('dresser.occasions.' + occ)}
                    </motion.button>
                  )
                })}
              </div>

              <div style={{ height: '1px', background: border, marginBottom: '12px' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div ref={categoryRef} style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const, flex: 1 }}>
                  {categoryConfig.map((cat) => {
                    const isOn = activeCategories.includes(cat.key)
                    const exists = wardrobeItems.some(item => item.category === cat.key)
                    return (
                      <motion.button key={cat.key} whileTap={{ scale: 0.92 }}
                        onClick={() => toggleCategory(cat.key)}
                        style={{ padding: '5px 10px', borderRadius: '100px', border: `1px solid ${isOn ? accent : border}`, background: isOn ? accentDim : 'transparent', color: isOn ? accent : muted, fontSize: '11px', fontWeight: isOn ? 700 : 400, cursor: 'pointer', opacity: exists ? 1 : 0.35, WebkitTapHighlightColor: 'transparent', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                        {locale === 'de' ? cat.labelDe : cat.labelEn}
                      </motion.button>
                    )
                  })}
                </div>
                <motion.div ref={weatherToggleRef} whileTap={{ scale: 0.9 }}
                  onClick={() => { if (weatherDisabled) { router.push('/' + locale + '/profile?scrollTo=weather'); return } setWeatherAware(v => !v); setOutfit(null) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
                  <span style={{ fontSize: '16px' }}>{weatherDisabled ? '🔒' : weatherAware ? '🌤️' : '🌤️'}</span>
                  <div style={{ width: '36px', height: '20px', borderRadius: '10px', background: weatherAware && !weatherDisabled ? accent : border, position: 'relative' as const, transition: 'background 0.2s' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', transition: 'left 0.2s', left: weatherAware && !weatherDisabled ? '18px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.4 }} style={{ marginBottom: '28px' }}>
              <motion.button ref={dressMeRef} onClick={generateOutfit} disabled={loading} whileTap={!loading ? { scale: 0.97 } : {}}
                style={{ width: '100%', padding: '19px', borderRadius: '100px', border: 'none', background: loading ? (isDark ? '#0f1a14' : '#e6f7f0') : sageGradient, color: loading ? muted : '#fff', fontSize: '15px', fontWeight: 700, fontFamily: "'Poppins', 'Inter', sans-serif", cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 8px 24px rgba(53,92,125,0.3)' }}>
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

            <AnimatePresence mode="wait">
             {outfit && (
  <motion.div key="outfit"
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.97 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    style={{ border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', background: card, boxShadow: isDark ? 'none' : '0 4px 24px rgba(10,46,30,0.08)' }}>

    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${border}`, background: accentDim }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: accent, marginBottom: '2px' }}>{t('dresser.outfitFor')}</p>
          <p style={{ fontSize: '16px', fontWeight: 800, color: text, letterSpacing: '-0.03em' }}>{t('dresser.occasions.' + selected)}</p>
        </div>
        <motion.button whileTap={{ scale: 0.91 }} onClick={saveOutfit}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '100px', border: `1px solid ${saved ? accent : border}`, background: saved ? accent : 'transparent', color: saved ? '#fff' : text, fontSize: '12px', fontWeight: 600, fontFamily: "'Poppins', 'Inter', sans-serif", cursor: 'pointer', transition: 'all 0.15s' }}>
          {saved ? `✓ ${t('dresser.saved')}` : `♡ ${t('dresser.save')}`}
        </motion.button>
      </div>

</div>

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
</motion.div>
)}
            </AnimatePresence>
          </>
        )}

      <AnimatePresence>
        {streakReward && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setStreakReward(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 14 }}
              onClick={e => e.stopPropagation()}
              style={{ background: card, borderRadius: '28px', padding: '32px 24px', textAlign: 'center' as const, maxWidth: '320px', width: '100%', border: '1px solid rgba(249,115,22,0.3)', boxShadow: '0 24px 64px rgba(249,115,22,0.2)' }}>
              <motion.p animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }} transition={{ duration: 0.6 }}
                style={{ fontSize: '56px', marginBottom: '16px' }}>🔥</motion.p>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#f97316', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                {streakReward.milestone}{locale === 'de' ? '-Tage-Streak!' : '-Day Streak!'}
              </p>
              <p style={{ fontSize: '15px', color: text, fontWeight: 600, marginBottom: '6px' }}>
                {locale === 'de' ? `+${streakReward.days} Tag${streakReward.days > 1 ? 'e' : ''} Pro gratis! 🎁` : `+${streakReward.days} day${streakReward.days > 1 ? 's' : ''} Pro free! 🎁`}
              </p>
              <p style={{ fontSize: '13px', color: muted, marginBottom: '24px' }}>
                {locale === 'de' ? 'Weiter so — bleib dran! 💪' : 'Keep it up — stay consistent! 💪'}
              </p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStreakReward(null)}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #f97316, #ef4444)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: '0 6px 24px rgba(249,115,22,0.4)' }}>
                {locale === 'de' ? '🎉 Eingelöst!' : '🎉 Claimed!'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStreakInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowStreakInfo(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9997, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 90px' }}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: card, borderRadius: '28px', padding: '24px 20px', width: '100%', maxWidth: '400px', border: `1px solid ${border}`, maxHeight: '85vh', overflowY: 'auto' as const }}>

              <div style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
                <motion.p animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}
                  style={{ fontSize: '48px', marginBottom: '8px' }}>🔥</motion.p>
                <p style={{ fontSize: '28px', fontWeight: 800, color: streak >= 7 ? '#f97316' : text, letterSpacing: '-0.04em', marginBottom: '4px' }}>
                  {streak} {locale === 'de' ? 'Tage' : 'Days'}
                </p>
                <p style={{ fontSize: '14px', color: muted }}>
                  {locale === 'de' ? 'Generiere täglich ein Outfit um deinen Streak zu halten' : 'Generate an outfit daily to keep your streak'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '20px' }}>
                {[
                  { days: 7, reward: '+1 Tag Pro', emoji: '🏅', claimed: streak >= 7 },
                  { days: 14, reward: '+2 Tage Pro', emoji: '🥇', claimed: streak >= 14 },
                  { days: 30, reward: '+3 Tage Pro', emoji: '👑', claimed: streak >= 30 },
                ].map(m => (
                  <div key={m.days} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '14px', background: m.claimed ? 'rgba(249,115,22,0.08)' : accentDim, border: `1px solid ${m.claimed ? 'rgba(249,115,22,0.3)' : border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{m.emoji}</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: m.claimed ? '#f97316' : text }}>
                          {m.days} {locale === 'de' ? 'Tage' : 'days'} → {m.reward} {locale === 'de' ? 'gratis' : 'free'}
                        </p>
                        <p style={{ fontSize: '11px', color: muted }}>
                          {m.claimed ? (locale === 'de' ? '✓ Erreicht!' : '✓ Reached!') : `${locale === 'de' ? 'Noch' : 'Only'} ${Math.max(0, m.days - streak)} ${locale === 'de' ? 'Tage' : 'days'}`}
                        </p>
                      </div>
                    </div>
                    {m.claimed && <span style={{ fontSize: '18px' }}>✅</span>}
                  </div>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowStreakInfo(false)}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: streak >= 1 ? 'linear-gradient(135deg, #f97316, #ef4444)' : accent, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                {locale === 'de' ? 'Weiter so! 🔥' : 'Keep it up! 🔥'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowProInfo(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9997, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 90px' }}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: card, borderRadius: '28px', padding: '24px 20px', width: '100%', maxWidth: '400px', border: `1px solid ${isPremium ? 'rgba(251,191,36,0.3)' : border}`, maxHeight: '80vh', overflowY: 'auto' as const }}>

              <div style={{ textAlign: 'center' as const, marginBottom: '20px' }}>
                <motion.p animate={isPremium ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ fontSize: '40px', marginBottom: '8px' }}>{isPremium ? '💎' : '⭐'}</motion.p>
                <p style={{ fontSize: '20px', fontWeight: 800, color: isPremium ? '#f59e0b' : text, letterSpacing: '-0.03em', marginBottom: '4px' }}>
                  KiWardrobe {isPremium ? 'Pro' : (locale === 'de' ? 'Free' : 'Free')}
                </p>
                {isPremium && premiumUntil && (
                  <p style={{ fontSize: '12px', color: muted }}>
                    {locale === 'de' ? `Aktiv bis ${premiumUntil}` : `Active until ${premiumUntil}`}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '20px' }}>
                {[
                { label: locale === 'de' ? 'Outfits/Woche' : 'Outfits/week', free: '3', pro: '14' },
{ label: locale === 'de' ? 'Kleidungsstücke' : 'Clothing items', free: 'Max. 20', pro: '∞' },
{ label: locale === 'de' ? 'Outfits speichern' : 'Save outfits', free: 'Max. 5', pro: '∞' },
{ label: 'Virtual Try-On', free: locale === 'de' ? '2/Monat' : '2/month', pro: '6/' + (locale === 'de' ? 'Woche' : 'week') },
               { label: 'Style DNA', free: '✗', pro: '✓' },
                  { label: locale === 'de' ? 'Mehrfach-Upload' : 'Multi-upload', free: '✗', pro: '3×/' + (locale === 'de' ? 'Woche' : 'week') },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: isPremium ? 'rgba(251,191,36,0.06)' : accentDim, border: `1px solid ${border}` }}>
                    <p style={{ fontSize: '13px', color: text, fontWeight: 500 }}>{f.label}</p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <p style={{ fontSize: '12px', color: muted, minWidth: '50px', textAlign: 'center' as const }}>{f.free}</p>
                      <p style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700, minWidth: '50px', textAlign: 'center' as const }}>{f.pro}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '0 14px', marginBottom: '-4px' }}>
                <p style={{ fontSize: '10px', color: muted, fontWeight: 600, minWidth: '50px', textAlign: 'center' as const }}>Free</p>
                <p style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, minWidth: '50px', textAlign: 'center' as const }}>Pro</p>
              </div>

            {isPremium ? (
  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowProInfo(false)}
    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: goldAccent, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", marginTop: '8px' }}>
    {locale === 'de' ? '✦ Pro aktiv — weiter so!' : '✦ Pro active — keep it up!'}
  </motion.button>
) : (
  <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setShowProInfo(false); setShowUpgrade(true) }}
    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: goldAccent, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", marginTop: '8px', boxShadow: '0 6px 24px rgba(251,191,36,0.4)' }}>
    {locale === 'de' ? '✦ Jetzt upgraden — €4,99/Monat' : '✦ Upgrade now — €4.99/month'}
  </motion.button>
  
)}
</motion.div>
          </motion.div>
          
        )}
      </AnimatePresence>
        </div>
      </main>
   <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
        items: wardrobeItems.length, itemsMax: 20,
        savedOutfits: savedOutfitsCount, savedMax: 5,
        weekOutfits: weekOutfitsUsed, weekOutfitsMax: 3,
    </div>
  )
}