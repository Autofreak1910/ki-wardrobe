'use client'
import WelcomeOverlay from '@/components/WelcomeOverlay'
import { useState, useEffect, useRef, RefObject } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'


function getGreeting(locale: string): string {
  const h = new Date().getHours()
  if (locale === 'de') {
    if (h < 5)  return 'Gute Nacht'
    if (h < 12) return 'Guten Morgen'
    if (h < 17) return 'Guten Tag'
    if (h < 22) return 'Guten Abend'
    return 'Gute Nacht'
  }
  if (h < 5)  return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 22) return 'Good evening'
  return 'Good night'
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
  { key: 'acc',    labelDe: 'Accessoires', labelEn: 'Accessories',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><path d="M9 12h6"/></svg> },
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
  const [activeCategories, setActiveCategories] = useState<string[]>(['tops', 'hosen', 'jacken', 'schuhe', 'acc'])
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [username, setUsername] = useState<string>('')
  const { theme } = useTheme()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isDark = theme === 'dark'
  const mainRef = useRef<HTMLElement>(null)
  const weatherRef = useRef<HTMLDivElement>(null)
const categoryRef = useRef<HTMLDivElement>(null)
const dressMeRef = useRef<HTMLButtonElement>(null)
const [showUnlock, setShowUnlock] = useState(false)
  const days = locale === 'de'
    ? ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const today = days[new Date().getDay()]
  const dateStr = new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long' })
useEffect(() => { loadWardrobe(); fetchWeather() }, [])

useEffect(() => {
  if (wardrobeItems.length >= 3) {
    const seen = localStorage.getItem('kw_welcome_seen')
    if (!seen) {
      setShowUnlock(true)
      setTimeout(() => setShowUnlock(false), 2800)
    }
  }
}, [wardrobeItems.length])

  async function loadWardrobe() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const { data } = await supabase.from('clothing_items').select('*').eq('user_id', session.user.id)
    if (data) { setWardrobeItems(data); setHasItems(data.length >= 3) }
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single()
    if (profile?.username) setUsername(profile.username)
  }

  async function fetchWeather() {
  setWeatherLoading(true)
  try {
    // Geolocation mit kurzem Timeout
    const pos = await Promise.race([
      new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 300000, // Cache 5 Min
          enableHighAccuracy: false,
        })
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      )
    ])

    const { latitude: lat, longitude: lon } = pos.coords

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

async function generateOutfit() {
  if (wardrobeItems.length < 3) return
  setLoading(true); setSaved(false); setOutfit(null)
  const filteredItems = wardrobeItems.filter(i => activeCategories.includes(i.category))
  const itemsToUse = filteredItems.length >= 2 ? filteredItems : wardrobeItems
  const weatherStr = weather ? `${weather.temp}°C, ${weather.condition}` : '18°C'
  try {
    const res = await fetch('/api/generate-outfit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-locale': locale },
      body: JSON.stringify({ items: itemsToUse, occasion: selected, weather: weatherStr, categories: activeCategories }),
    })
    const data = await res.json()
    if (data.success && data.outfits) {
      const mappedOutfits = data.outfits.map((o: { items: string[]; reasoning: string; vibe?: string }) => {
        const matchedItems = o.items.map((name: string) =>
          wardrobeItems.find(i => {
            const a = (i.name ?? '').toLowerCase().trim()
            const b = name.toLowerCase().trim()
            return a === b || a.includes(b) || b.includes(a) ||
              a.split(' ').some(w => w.length > 3 && b.includes(w)) ||
              b.split(' ').some(w => w.length > 3 && a.includes(w))
          })
        ).filter(Boolean)
        return { items: o.items, reasoning: o.reasoning, vibe: o.vibe, itemObjects: matchedItems }
      })
      setOutfit({ outfits: mappedOutfits, active: 0 })
      setTimeout(() => mainRef.current?.scrollTo({ top: mainRef.current.scrollHeight, behavior: 'smooth' }), 200)
    }
  } catch (err) { console.error(err) }
  finally { setLoading(false) }
}

async function saveOutfit() {
  if (!outfit) return
  const active = outfit.outfits[outfit.active]
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return
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
  dressMeRef={dressMeRef}
  itemCount={wardrobeItems.length}
/>

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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '28px' }}>

          {/* Left: Greeting */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: accent, marginBottom: '6px', opacity: 0.75 }}>
              {today} · {dateStr}
            </p>
            <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.04em', color: text, lineHeight: 1.15 }}>
              {getGreeting(locale)}{username ? ',' : ''}
            </h1>
            {username && (
              <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.15, background: `linear-gradient(135deg, ${accent}, #0891b2)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {username}.
              </motion.p>
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
                <div style={{ width: '30px', height: '1px', background: border, margin: '0 auto 6px' }} />
                <p style={{ fontSize: '11px', fontWeight: 600, color: muted, letterSpacing: '-0.01em' }}>
                  {wardrobeItems.length} {t('wardrobe.pieces')}
                </p>
              </>
            )}
          </motion.div>
        </motion.div>

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

            {/* ── Category Grid (große Kacheln wie Konkurrenz) ── */}
           <motion.div ref={categoryRef} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4 }} style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted }}>
                  {t('dresser.whatForOutfit')}
                </p>
                <motion.button whileTap={{ scale: 0.92 }}
                  onClick={() => { setActiveCategories(['tops','hosen','jacken','schuhe','acc']); setOutfit(null) }}
                  style={{ fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px', border: `1px solid ${activeCategories.length === 5 ? accent : border}`, background: activeCategories.length === 5 ? accentDim : 'transparent', color: activeCategories.length === 5 ? accent : muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {locale === 'de' ? 'Alle' : 'All'}
                </motion.button>
              </div>

              {/* 2×2 + 1 Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {categoryConfig.map((cat, i) => {
                  const isOn = activeCategories.includes(cat.key)
                  const exists = wardrobeItems.some(item => item.category === cat.key)
                  const isLast = i === categoryConfig.length - 1
                  const isOdd = categoryConfig.length % 2 !== 0

                  return (
                    <motion.button
                      key={cat.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCategory(cat.key)}
                      style={{
                        gridColumn: isLast && isOdd ? '1 / -1' : undefined,
                        display: 'flex', flexDirection: 'column' as const,
                        alignItems: 'center', justifyContent: 'center', gap: '10px',
         padding: isLast && isOdd ? '10px' : '12px 16px',
                        borderRadius: '18px',
                        border: `1.5px solid ${isOn ? accent : border}`,
                        background: isOn ? accentDim : card,
                        color: isOn ? accent : exists ? text : muted,
                        cursor: 'pointer', opacity: exists ? 1 : 0.35,
                        transition: 'all 0.15s',
                        WebkitTapHighlightColor: 'transparent',
                        fontFamily: "'DM Sans', sans-serif",
                        boxShadow: isOn ? `0 2px 16px rgba(14,164,114,0.2)` : isDark ? 'none' : '0 1px 4px rgba(10,46,30,0.05)',
                      }}>
                      <span style={{ color: isOn ? accent : muted, opacity: exists ? 1 : 0.5 }}>
                        {cat.icon}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                        {locale === 'de' ? cat.labelDe : cat.labelEn}
                      </span>
                    </motion.button>
                  )
                })}
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
             {t('dresser.button')} ✦
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

    <div style={{ padding: '0 18px 18px' }}>
      <motion.button whileTap={{ scale: 0.97 }} onClick={generateOutfit}
        style={{ width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: accentDim, border: `1px solid ${border}`, borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: accent, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
        ↻ {t('dresser.newOutfit')}
      </motion.button>
    </div>
</motion.div>
)}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  )
}