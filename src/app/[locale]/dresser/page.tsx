'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'

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

export default function DresserPage() {
  const [selected, setSelected] = useState<string>('casual')
  const [loading, setLoading] = useState(false)
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [saved, setSaved] = useState(false)
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([])
  const [hasItems, setHasItems] = useState(true)
  const [activeCategories, setActiveCategories] = useState<string[]>(['tops', 'hosen', 'jacken', 'schuhe', 'acc'])
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

  useEffect(() => { loadWardrobe() }, [])

  async function loadWardrobe() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const { data } = await supabase.from('clothing_items').select('*').eq('user_id', session.user.id)
    if (data) { setWardrobeItems(data); setHasItems(data.length >= 3) }
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
    try {
      const res = await fetch('/api/generate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': locale },
        body: JSON.stringify({ items: itemsToUse, occasion: selected, weather: '18°C', categories: activeCategories }),
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

  const bg     = isDark ? '#0a0a0a' : '#f9f9f7'
  const card   = isDark ? '#141414' : '#ffffff'
  const border = isDark ? '#222'    : '#e8e8e6'
  const text   = isDark ? '#f0f0f0' : '#0a0a0a'
  const muted  = isDark ? '#555'    : '#999'

  // Accent orbs — subtile Farb-Blobs im Hintergrund
  const orb1 = isDark ? 'rgba(14,164,114,0.07)' : 'rgba(14,164,114,0.08)'
  const orb2 = isDark ? 'rgba(8,145,178,0.05)'  : 'rgba(8,145,178,0.06)'
  const orb3 = isDark ? 'rgba(14,164,114,0.04)' : 'rgba(14,164,114,0.05)'

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", position: 'relative' as const }}>

      {/* ── Background orbs ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {/* Top-right warm glow */}
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: orb1, filter: 'blur(80px)' }} />
        {/* Bottom-left cool glow */}
        <div style={{ position: 'absolute', bottom: '80px', left: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: orb2, filter: 'blur(80px)' }} />
        {/* Center soft accent */}
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '300px', borderRadius: '50%', background: orb3, filter: 'blur(100px)' }} />

        {/* Subtle grid lines — light mode only */}
        {!isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0ea472" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Fade edges */}
            <rect width="100%" height="100%" fill={`radial-gradient(ellipse at 50% 50%, transparent 30%, ${bg} 80%)`} />
          </svg>
        )}

        {/* Dark mode: subtle noise texture feel via lines */}
        {isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#0ea472" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        )}
      </div>

      <Navbar activePage="dresser" />

      <main ref={mainRef} style={{ flex: 1, overflowY: 'auto' as const, overflowX: 'hidden', maxWidth: '520px', width: '100%', margin: '0 auto', padding: '64px 20px 108px', WebkitOverflowScrolling: 'touch' as any, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: '44px' }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted, marginBottom: '10px' }}
          >
            {today} · {dateStr}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.05em', color: text, lineHeight: 1, marginBottom: '20px' }}
          >
            {t('dresser.title')}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: card, border: `1px solid ${border}`, borderRadius: '100px', padding: '6px 14px' }}
          >
            <span style={{ fontSize: '12px', color: muted, letterSpacing: '-0.01em' }}>☀️ 18°C</span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: border, display: 'inline-block' }} />
            <span style={{ fontSize: '12px', color: muted, letterSpacing: '-0.01em' }}>{wardrobeItems.length} {t('wardrobe.pieces')}</span>
          </motion.div>
        </motion.div>

        {!hasItems ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '56px 24px', border: `1px solid ${border}`, borderRadius: '20px', background: card }}
          >
            <p style={{ fontSize: '18px', fontWeight: 700, color: text, marginBottom: '10px', letterSpacing: '-0.03em' }}>{t('dresser.notEnough')}</p>
            <p style={{ fontSize: '13px', color: muted, lineHeight: 1.7, marginBottom: '24px' }}>{t('dresser.notEnoughSub')}</p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push('/' + locale + '/wardrobe')}
              style={{ padding: '13px 28px', background: text, color: bg, border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em' }}
            >
              {t('dresser.uploadNow')}
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Occasion */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: '28px' }}
            >
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted, marginBottom: '14px' }}>
                {locale === 'de' ? 'Anlass' : 'Occasion'}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {occasions.map((occ, i) => (
                  <motion.button
                    key={occ}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 + i * 0.04, duration: 0.35 }}
                    whileTap={{ scale: 0.91 }}
                    onClick={() => { setSelected(occ); setOutfit(null); setSaved(false) }}
                    style={{
                      padding: '9px 16px', borderRadius: '100px',
                      border: `1px solid ${selected === occ ? text : border}`,
                      background: selected === occ ? text : card,
                      color: selected === occ ? bg : muted,
                      fontSize: '13px', fontWeight: selected === occ ? 700 : 500,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: 'pointer', letterSpacing: '-0.01em',
                      transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                      WebkitTapHighlightColor: 'transparent',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {t('dresser.occasions.' + occ)}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: '28px', padding: '18px', borderRadius: '16px', border: `1px solid ${border}`, background: card, backdropFilter: 'blur(12px)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted }}>
                  {t('dresser.whatForOutfit')}
                </p>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => { setActiveCategories(['tops','hosen','jacken','schuhe','acc']); setOutfit(null) }}
                  style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '100px', border: `1px solid ${activeCategories.length === 5 ? text : border}`, background: activeCategories.length === 5 ? text : 'transparent', color: activeCategories.length === 5 ? bg : muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em' }}
                >
                  {locale === 'de' ? 'Alle' : 'All'}
                </motion.button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {categoryConfig.map(cat => {
                  const isOn = activeCategories.includes(cat.key)
                  const exists = wardrobeItems.some(i => i.category === cat.key)
                  return (
                    <motion.button
                      key={cat.key}
                      whileTap={{ scale: 0.91 }}
                      onClick={() => toggleCategory(cat.key)}
                      style={{
                        padding: '8px 14px', borderRadius: '100px',
                        border: `1px solid ${isOn ? text : border}`,
                        background: isOn ? text : 'transparent',
                        color: isOn ? bg : exists ? text : muted,
                        fontSize: '12px', fontWeight: isOn ? 700 : 500,
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer', opacity: exists ? 1 : 0.3,
                        transition: 'all 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
                        WebkitTapHighlightColor: 'transparent',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {cat.label}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: '32px' }}
            >
              <motion.button
                onClick={generateOutfit}
                disabled={loading}
                whileTap={!loading ? { scale: 0.97 } : {}}
                style={{
                  width: '100%', padding: '19px',
                  borderRadius: '16px', border: 'none',
                  background: loading ? (isDark ? '#1a1a1a' : '#ebebeb') : text,
                  color: loading ? muted : bg,
                  fontSize: '16px', fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  letterSpacing: '-0.02em',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.2s',
                  boxShadow: loading ? 'none' : isDark
                    ? '0 0 0 1px #333, 0 8px 32px rgba(0,0,0,0.5)'
                    : '0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)',
                }}
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'block', width: '17px', height: '17px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: muted, flexShrink: 0 }}
                    />
                    {t('dresser.generating')}
                  </>
                ) : t('dresser.button')}
              </motion.button>
            </motion.div>

            {/* Result */}
            <AnimatePresence mode="wait">
              {outfit && (
                <motion.div
                  key="outfit"
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.96 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  style={{ border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', background: card }}
                >
                  <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${border}` }}>
                    <div>
                      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted, marginBottom: '3px' }}>
                        {t('dresser.outfitFor')}
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: text, letterSpacing: '-0.03em' }}>
                        {t('dresser.occasions.' + selected)}
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.91 }}
                      onClick={saveOutfit}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '8px 14px', borderRadius: '100px',
                        border: `1px solid ${saved ? text : border}`,
                        background: saved ? text : 'transparent',
                        color: saved ? bg : text,
                        fontSize: '12px', fontWeight: 700,
                        fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.15s', letterSpacing: '-0.01em',
                      }}
                    >
                      {saved ? `✓ ${t('dresser.saved')}` : `♡ ${t('dresser.save')}`}
                    </motion.button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${outfit.itemObjects.length >= 3 ? 3 : 2}, 1fr)`, gap: '1px', background: border }}>
                    {outfit.itemObjects.length > 0
                      ? outfit.itemObjects.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          style={{ background: card }}
                        >
                          <div style={{ aspectRatio: '1', overflow: 'hidden', background: isDark ? '#111' : '#f5f5f3' }}>
                            <img src={item.image_url} alt={item.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <div style={{ padding: '10px 12px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: '2px', letterSpacing: '-0.01em' }}>{item.name}</p>
                            <p style={{ fontSize: '11px', color: muted }}>{item.color}{item.brand ? ` · ${item.brand}` : ''}</p>
                          </div>
                        </motion.div>
                      ))
                      : outfit.items.map((name, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.08 }}
                          style={{ background: card, padding: '20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80px' }}
                        >
                          <p style={{ fontSize: '12px', fontWeight: 600, color: text, textAlign: 'center' as const }}>{name}</p>
                        </motion.div>
                      ))
                    }
                  </div>

                  {outfit.reasoning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      style={{ padding: '16px 18px', borderTop: `1px solid ${border}` }}
                    >
                      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: muted, marginBottom: '8px' }}>
                        {t('dresser.kiStylist')}
                      </p>
                      <p style={{ fontSize: '13px', color: muted, lineHeight: 1.7, letterSpacing: '-0.01em' }}>{outfit.reasoning}</p>
                    </motion.div>
                  )}

                  <div style={{ padding: '0 18px 18px' }}>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={generateOutfit}
                      style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: muted, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', WebkitTapHighlightColor: 'transparent', letterSpacing: '-0.01em' }}
                    >
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