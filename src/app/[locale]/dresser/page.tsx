'use client'

import { useState, useEffect, useRef } from 'react'
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
  } else {
    if (h < 5)  return 'Good night'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    if (h < 22) return 'Good evening'
    return 'Good night'
  }
}

const occasions = ['casual', 'uni', 'work', 'date', 'sport', 'party', 'festival'] as const
const categoryConfig = [
  { key: 'tops',   label: 'Tops' },
  { key: 'hosen',  label: 'Pants' },
  { key: 'jacken', label: 'Jacket' },
  { key: 'schuhe', label: 'Shoes' },
  { key: 'acc',    label: 'Acc' },
]

type ClothingItem = { id: string; image_url: string; category: string; color: string; name?: string; brand?: string }
type Outfit = { items: string[]; reasoning: string; itemObjects: ClothingItem[] }
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
  const [outfit, setOutfit] = useState<Outfit | null>(null)
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

  const days = locale === 'de'
    ? ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const today = days[new Date().getDay()]
  const dateStr = new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long' })

  useEffect(() => {
    loadWardrobe()
    fetchWeather()
  }, [])

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
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 })
      )
      const { latitude: lat, longitude: lon } = pos.coords
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,is_day&timezone=auto`
      )
      const weatherData = await weatherRes.json()
      const temp = Math.round(weatherData.current.temperature_2m)
      const code = weatherData.current.weathercode
      const isDay = weatherData.current.is_day === 1
      const { icon, condition } = parseWeatherCode(code, isDay)
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
      const geoData = await geoRes.json()
      const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || ''
      setWeather({ temp, condition, icon, city })
    } catch {
      setWeather({ temp: 18, condition: locale === 'de' ? 'Unbekannt' : 'Unknown', icon: '🌤️', city: '' })
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
      if (data.success) {
        const matchedItems = data.items.map((name: string) =>
          wardrobeItems.find(i => {
            const a = (i.name ?? '').toLowerCase().trim()
            const b = name.toLowerCase().trim()
            return a === b || a.includes(b) || b.includes(a) ||
              a.split(' ').some(w => w.length > 3 && b.includes(w)) ||
              b.split(' ').some(w => w.length > 3 && a.includes(w))
          })
        ).filter(Boolean)
        setOutfit({ items: data.items, reasoning: data.reasoning, itemObjects: matchedItems })
        setTimeout(() => mainRef.current?.scrollTo({ top: mainRef.current.scrollHeight, behavior: 'smooth' }), 200)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function saveOutfit() {
    if (!outfit) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    await supabase.from('outfits').insert({
      user_id: session.user.id, occasion: selected,
      item_ids: outfit.itemObjects.map(i => i.id),
      name: `${t('dresser.occasions.' + selected)} Outfit`,
    })
    setSaved(true)
  }

  const bg        = isDark ? '#080f0c' : '#f0fdf8'
  const card      = isDark ? '#0f1a14' : '#ffffff'
  const border    = isDark ? '#1a3328' : '#d1f0e4'
  const text      = isDark ? '#e8f5ee' : '#0a2e1e'
  const muted     = isDark ? '#4d7a62' : '#6b9e87'
  const accent    = '#0ea472'
  const accentDim = isDark ? 'rgba(14,164,114,0.1)' : 'rgba(14,164,114,0.1)'

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", position: 'relative' as const }}>

      {/* Background */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: '420px', height: '420px', borderRadius: '50%', background: isDark ? 'rgba(14,164,114,0.06)' : 'rgba(14,164,114,0.12)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '60px', left: '-100px', width: '350px', height: '350px', borderRadius: '50%', background: isDark ? 'rgba(8,145,178,0.04)' : 'rgba(8,145,178,0.08)', filter: 'blur(90px)' }} />
        {!isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }} xmlns="http://www.w3.org/2000/svg">
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

      <main ref={mainRef} style={{ flex: 1, overflowY: 'auto' as const, overflowX: 'hidden', maxWidth: '520px', width: '100%', margin: '0 auto', padding: '64px 20px 108px', WebkitOverflowScrolling: 'touch' as any, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: '40px' }}>

          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: accent, marginBottom: '10px', opacity: 0.7 }}>
            {today} · {dateStr}
          </p>

          {/* Begrüßung */}
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em', color: text, lineHeight: 1.1, marginBottom: username ? '4px' : '16px' }}>
            {getGreeting(locale)}{username ? ',' : ''}
          </h1>
          {username && (
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '16px', background: 'linear-gradient(135deg, #0ea472, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {username}.
            </motion.p>
          )}

          {/* Wetter Pill */}
          <AnimatePresence mode="wait">
            {weatherLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: accentDim, border: `1px solid ${border}`, borderRadius: '100px', padding: '7px 16px' }}>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ width: '70px', height: '12px', borderRadius: '6px', background: border }} />
              </motion.div>
            ) : (
              <motion.div key="weather" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                onClick={fetchWeather}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: accentDim, border: `1px solid ${border}`, borderRadius: '100px', padding: '7px 16px', cursor: 'pointer' }}>
                <span style={{ fontSize: '15px', lineHeight: 1 }}>{weather?.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: text, letterSpacing: '-0.02em' }}>{weather?.temp}°C</span>
                {weather?.condition && (
                  <><span style={{ width: '3px', height: '3px', borderRadius: '50%', background: border, display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', color: muted }}>{weather.condition}</span></>
                )}
                {weather?.city && (
                  <><span style={{ width: '3px', height: '3px', borderRadius: '50%', background: border, display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', color: muted }}>{weather.city}</span></>
                )}
                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: border, display: 'inline-block' }} />
                <span style={{ fontSize: '12px', color: muted }}>{wardrobeItems.length} {t('wardrobe.pieces')}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {!hasItems ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '56px 24px', border: `1px solid ${border}`, borderRadius: '20px', background: card }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: text, marginBottom: '10px', letterSpacing: '-0.03em' }}>{t('dresser.notEnough')}</p>
            <p style={{ fontSize: '13px', color: muted, lineHeight: 1.7, marginBottom: '24px' }}>{t('dresser.notEnoughSub')}</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push('/' + locale + '/wardrobe')}
              style={{ padding: '13px 28px', background: accent, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em', boxShadow: '0 4px 16px rgba(14,164,114,0.35)' }}>
              {t('dresser.uploadNow')}
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Occasion */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted, marginBottom: '12px' }}>
                {locale === 'de' ? 'Anlass' : 'Occasion'}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {occasions.map((occ, i) => {
                  const isOn = selected === occ
                  return (
                    <motion.button key={occ}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.03 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { setSelected(occ); setOutfit(null); setSaved(false) }}
                      style={{ padding: '8px 16px', borderRadius: '100px', border: `1px solid ${isOn ? accent : border}`, background: isOn ? accent : card, color: isOn ? '#fff' : muted, fontSize: '13px', fontWeight: isOn ? 600 : 400, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', letterSpacing: '-0.01em', transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent', boxShadow: isOn ? '0 2px 12px rgba(14,164,114,0.3)' : 'none' }}>
                      {t('dresser.occasions.' + occ)}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            {/* Categories */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: '24px', padding: '16px 18px', borderRadius: '16px', border: `1px solid ${border}`, background: card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted }}>
                  {t('dresser.whatForOutfit')}
                </p>
                <motion.button whileTap={{ scale: 0.92 }}
                  onClick={() => { setActiveCategories(['tops','hosen','jacken','schuhe','acc']); setOutfit(null) }}
                  style={{ fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px', border: `1px solid ${activeCategories.length === 5 ? accent : border}`, background: activeCategories.length === 5 ? accentDim : 'transparent', color: activeCategories.length === 5 ? accent : muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {locale === 'de' ? 'Alle' : 'All'}
                </motion.button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {categoryConfig.map(cat => {
                  const isOn = activeCategories.includes(cat.key)
                  const exists = wardrobeItems.some(i => i.category === cat.key)
                  return (
                    <motion.button key={cat.key} whileTap={{ scale: 0.92 }}
                      onClick={() => toggleCategory(cat.key)}
                      style={{ padding: '7px 14px', borderRadius: '100px', border: `1px solid ${isOn ? accent : border}`, background: isOn ? accentDim : 'transparent', color: isOn ? accent : exists ? text : muted, fontSize: '12px', fontWeight: isOn ? 600 : 400, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', opacity: exists ? 1 : 0.35, transition: 'all 0.12s', WebkitTapHighlightColor: 'transparent', letterSpacing: '-0.01em' }}>
                      {cat.label}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: '28px' }}>
              <motion.button onClick={generateOutfit} disabled={loading} whileTap={!loading ? { scale: 0.97 } : {}}
                style={{ width: '100%', padding: '18px', borderRadius: '14px', border: 'none', background: loading ? (isDark ? '#0f1a14' : '#e6f7f0') : 'linear-gradient(135deg, #0ea472 0%, #0891b2 100%)', color: loading ? muted : '#fff', fontSize: '16px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', letterSpacing: '-0.02em', WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 24px rgba(14,164,114,0.4), 0 1px 0 rgba(255,255,255,0.1) inset' }}>
                {loading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'block', width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: accent, flexShrink: 0 }} />
                    {t('dresser.generating')}
                  </>
                ) : t('dresser.button')}
              </motion.button>
            </motion.div>

            {/* Result */}
            <AnimatePresence mode="wait">
              {outfit && (
                <motion.div key="outfit"
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', background: card, boxShadow: isDark ? '0 0 0 1px #1a3328' : '0 4px 24px rgba(10,46,30,0.08)' }}>

                  <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${border}`, background: accentDim }}>
                    <div>
                      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: accent, marginBottom: '2px' }}>{t('dresser.outfitFor')}</p>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: text, letterSpacing: '-0.03em' }}>{t('dresser.occasions.' + selected)}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.91 }} onClick={saveOutfit}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '100px', border: `1px solid ${saved ? accent : border}`, background: saved ? accent : 'transparent', color: saved ? '#fff' : text, fontSize: '12px', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s', letterSpacing: '-0.01em', boxShadow: saved ? '0 2px 10px rgba(14,164,114,0.35)' : 'none' }}>
                      {saved ? `✓ ${t('dresser.saved')}` : `♡ ${t('dresser.save')}`}
                    </motion.button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${outfit.itemObjects.length >= 3 ? 3 : 2}, 1fr)`, gap: '1px', background: border }}>
                    {outfit.itemObjects.length > 0
                      ? outfit.itemObjects.map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 + i * 0.07 }} style={{ background: card }}>
                          <div style={{ aspectRatio: '1', overflow: 'hidden', background: isDark ? '#0a1510' : '#f0fdf8' }}>
                            <img src={item.image_url} alt={item.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <div style={{ padding: '9px 11px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: '1px', letterSpacing: '-0.01em' }}>{item.name}</p>
                            <p style={{ fontSize: '10px', color: muted }}>{item.color}{item.brand ? ` · ${item.brand}` : ''}</p>
                          </div>
                        </motion.div>
                      ))
                      : outfit.items.map((name, i) => (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}
                          style={{ background: card, padding: '20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80px' }}>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: text, textAlign: 'center' as const }}>{name}</p>
                        </motion.div>
                      ))
                    }
                  </div>

                  {outfit.reasoning && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                      style={{ padding: '14px 18px', borderTop: `1px solid ${border}` }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: accent, marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: accent }} />
                        {t('dresser.kiStylist')}
                      </p>
                      <p style={{ fontSize: '13px', color: muted, lineHeight: 1.7, letterSpacing: '-0.01em' }}>{outfit.reasoning}</p>
                    </motion.div>
                  )}

                  <div style={{ padding: '0 18px 18px' }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={generateOutfit}
                      style={{ width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: accentDim, border: `1px solid ${border}`, borderRadius: '10px', fontSize: '12px', fontWeight: 600, color: accent, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', WebkitTapHighlightColor: 'transparent', letterSpacing: '-0.01em' }}>
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