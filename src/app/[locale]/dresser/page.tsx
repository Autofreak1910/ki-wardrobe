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
  { key: 'tops', label: 'Tops' },
  { key: 'hosen', label: 'Pants' },
  { key: 'jacken', label: 'Jacket' },
  { key: 'schuhe', label: 'Shoes' },
  { key: 'acc', label: 'Acc' },
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

  return (
   <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: 'var(--bg)', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar activePage="dresser" />

      <main ref={mainRef} style={{ flex: 1, overflowY: 'auto' as const, overflowX: 'hidden', maxWidth: '540px', width: '100%', margin: '0 auto', padding: '72px 20px 108px', WebkitOverflowScrolling: 'touch' as any }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: '40px' }}
        >
          <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            {today} · {dateStr}
          </p>
          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1.05, marginBottom: '16px' }}>
            {t('dresser.title')}
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>18°C</span>
            <span style={{ width: '1px', height: '12px', background: 'var(--border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{wardrobeItems.length} {t('wardrobe.pieces')}</span>
          </div>
        </motion.div>

        {!hasItems ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', padding: '48px 24px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--bg-card)' }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-secondary)', fontSize: '20px' }}>
              ↑
            </div>
            <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>{t('dresser.notEnough')}</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>{t('dresser.notEnoughSub')}</p>
            <button onClick={() => router.push('/' + locale + '/wardrobe')}
              style={{ padding: '12px 24px', background: 'var(--text)', color: 'var(--bg)', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {t('dresser.uploadNow')}
            </button>
          </motion.div>
        ) : (
          <>
            {/* Occasion Selector */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: '28px' }}
            >
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {locale === 'de' ? 'Anlass' : 'Occasion'}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {occasions.map((occ, i) => (
                  <motion.button
                    key={occ}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.03, duration: 0.3 }}
                    onClick={() => { setSelected(occ); setOutfit(null); setSaved(false) }}
                    whileTap={{ scale: 0.93 }}
                    style={{
                      padding: '8px 14px', borderRadius: '8px',
                      border: `1px solid ${selected === occ ? 'var(--text)' : 'var(--border)'}`,
                      background: selected === occ ? 'var(--text)' : 'transparent',
                      color: selected === occ ? 'var(--bg)' : 'var(--text-secondary)',
                      fontSize: '13px', fontWeight: 500,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: 'pointer', letterSpacing: '-0.01em',
                      transition: 'all 0.15s',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {t('dresser.occasions.' + occ)}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Category Filter */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: '28px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'var(--text-secondary)' }}>
                  {t('dresser.whatForOutfit')}
                </p>
                <button
                  onClick={() => { setActiveCategories(['tops','hosen','jacken','schuhe','acc']); setOutfit(null) }}
                  style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', border: `1px solid ${activeCategories.length === 5 ? 'var(--text)' : 'var(--border)'}`, background: activeCategories.length === 5 ? 'var(--text)' : 'transparent', color: activeCategories.length === 5 ? 'var(--bg)' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {locale === 'de' ? 'Alle' : 'All'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {categoryConfig.map(cat => {
                  const isOn = activeCategories.includes(cat.key)
                  const exists = wardrobeItems.some(i => i.category === cat.key)
                  return (
                    <motion.button
                      key={cat.key}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => toggleCategory(cat.key)}
                      style={{
                        padding: '7px 13px', borderRadius: '7px',
                        border: `1px solid ${isOn ? 'var(--text)' : 'var(--border)'}`,
                        background: isOn ? 'var(--text)' : 'var(--bg-card)',
                        color: isOn ? 'var(--bg)' : exists ? 'var(--text)' : 'var(--text-secondary)',
                        fontSize: '12px', fontWeight: 500,
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer', opacity: exists ? 1 : 0.35,
                        transition: 'all 0.12s',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {cat.label}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>

            {/* Generate Button */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: '28px' }}
            >
              <motion.button
                onClick={generateOutfit}
                disabled={loading}
                whileTap={!loading ? { scale: 0.97 } : {}}
                style={{
                  width: '100%', padding: '18px',
                  borderRadius: '14px', border: 'none',
                  background: loading ? 'var(--bg-secondary)' : 'var(--text)',
                  color: loading ? 'var(--text-secondary)' : 'var(--bg)',
                  fontSize: '15px', fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  letterSpacing: '-0.01em',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'block', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--text-secondary)', flexShrink: 0 }}
                    />
                    {t('dresser.generating')}
                  </>
                ) : t('dresser.button')}
              </motion.button>
            </motion.div>

            {/* Outfit Result */}
            <AnimatePresence mode="wait">
              {outfit && (
                <motion.div
                  key="outfit"
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-card)' }}
                >
                  {/* Card Header */}
                  <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                        {t('dresser.outfitFor')}
                      </p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                        {t('dresser.occasions.' + selected)}
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={saveOutfit}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '7px 13px', borderRadius: '8px',
                        border: `1px solid ${saved ? 'var(--text)' : 'var(--border)'}`,
                        background: saved ? 'var(--text)' : 'transparent',
                        color: saved ? 'var(--bg)' : 'var(--text)',
                        fontSize: '12px', fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {saved ? `✓ ${t('dresser.saved')}` : `○ ${t('dresser.save')}`}
                    </motion.button>
                  </div>

                  {/* Items Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${outfit.itemObjects.length >= 3 ? 3 : 2}, 1fr)`, gap: '8px', padding: '12px' }}>
                    {outfit.itemObjects.length > 0
                      ? outfit.itemObjects.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
                        >
                          <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                            <img src={item.image_url} alt={item.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <div style={{ padding: '7px 9px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: '1px' }}>{item.name}</p>
                            <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{item.color}{item.brand ? ` · ${item.brand}` : ''}</p>
                          </div>
                        </motion.div>
                      ))
                      : outfit.items.map((name, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.07 }}
                          style={{ borderRadius: '10px', padding: '16px 8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80px' }}
                        >
                          <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', textAlign: 'center' as const }}>{name}</p>
                        </motion.div>
                      ))
                    }
                  </div>

                  {/* AI Reasoning */}
                  {outfit.reasoning && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      style={{ margin: '0 12px 12px', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', background: 'var(--bg-secondary)' }}
                    >
                      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: 'var(--text-secondary)', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-secondary)', display: 'inline-block', flexShrink: 0 }} />
                        {t('dresser.kiStylist')}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{outfit.reasoning}</p>
                    </motion.div>
                  )}

                  {/* Regenerate */}
                  <div style={{ padding: '0 12px 12px' }}>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={generateOutfit}
                      style={{ width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
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