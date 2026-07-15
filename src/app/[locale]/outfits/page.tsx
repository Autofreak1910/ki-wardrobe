'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'

type Outfit = { id: string; name: string; occasion: string; item_ids: string[]; is_favorite: boolean; created_at: string }
type ClothingItem = { id: string; image_url: string; name?: string; color: string; category: string }

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const { theme } = useTheme()
  const t = useTranslations()
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

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const [outfitsRes, itemsRes] = await Promise.all([
      supabase.from('outfits').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('clothing_items').select('*').eq('user_id', session.user.id)
    ])
    if (outfitsRes.data) setOutfits(outfitsRes.data)
    if (itemsRes.data) setItems(itemsRes.data)
    setLoading(false)
  }

  async function toggleFavorite(outfit: Outfit) {
    await supabase.from('outfits').update({ is_favorite: !outfit.is_favorite }).eq('id', outfit.id)
    setOutfits(prev => prev.map(o => o.id === outfit.id ? { ...o, is_favorite: !o.is_favorite } : o))
  }

  async function deleteOutfit(id: string) {
    await supabase.from('outfits').delete().eq('id', id)
    setOutfits(prev => prev.filter(o => o.id !== id))
  }

  function getItemsForOutfit(outfit: Outfit) {
    return outfit.item_ids?.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[]
  }

  const displayed = filter === 'favorites' ? outfits.filter(o => o.is_favorite) : outfits
  const favCount = outfits.filter(o => o.is_favorite).length

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", position: 'relative' as const }}>

      {/* Background */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: isDark ? 'rgba(14,164,114,0.06)' : 'rgba(14,164,114,0.1)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: isDark ? 'rgba(8,145,178,0.04)' : 'rgba(8,145,178,0.07)', filter: 'blur(90px)' }} />
        {!isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="odots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.9" fill="#0ea472" opacity="0.25" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#odots)" />
          </svg>
        )}
      </div>

      <Navbar activePage="outfits" />

      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '800px', width: '100%', margin: '0 auto', padding: '68px 0 108px', position: 'relative', zIndex: 1 }}>

        {/* Hero Banner mit Outfit-Collage */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: 'relative' as const, height: '180px', overflow: 'hidden', marginBottom: '0' }}>

          {/* Collage aus gespeicherten Outfits oder Placeholder */}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2px' }}>
            {outfits.length > 0
              ? outfits.slice(0, 6).map((outfit, i) => {
                  const outfitItems = getItemsForOutfit(outfit)
                  const img = outfitItems[0]?.image_url
                  return (
                    <div key={i} style={{ overflow: 'hidden', background: isDark ? '#1a2840' : '#dde8f5' }}>
                      {img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                    </div>
                  )
                })
              : [1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ background: isDark ? `hsl(${210 + i*10}, 30%, ${15 + i*3}%)` : `hsl(${200 + i*15}, 30%, ${75 + i*3}%)` }} />
                ))
            }
          </div>

          {/* Gradient Overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(240,244,255,0.15) 0%, rgba(240,244,255,0.75) 65%, rgba(240,244,255,1) 100%)' }} />

          {/* Titel über Bild */}
          <div style={{ position: 'absolute' as const, bottom: '16px', left: '20px', zIndex: 2 }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: accent, marginBottom: '3px' }}>
              {locale === 'de' ? 'Deine Looks' : 'Your Looks'}
            </p>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: text, letterSpacing: '-0.04em', lineHeight: 1 }}>Outfits</h1>
          </div>

          {/* + Button oben rechts */}
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => router.push('/' + locale + '/dresser')}
            style={{ position: 'absolute' as const, bottom: '16px', right: '20px', width: '44px', height: '44px', borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, #0891b2)`, border: 'none', fontSize: '22px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(14,164,114,0.4)', zIndex: 2 }}>
            +
          </motion.button>
        </motion.div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px', margin: '14px 20px 16px', padding: 0 }}>
          {(['all', 'favorites'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 18px', borderRadius: '100px', border: `1px solid ${filter === f ? accent : border}`, background: filter === f ? accent : card, color: filter === f ? '#fff' : muted, fontSize: '13px', fontWeight: filter === f ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
              {f === 'all' ? (locale === 'de' ? 'Alle' : 'All') : (locale === 'de' ? 'Favoriten' : 'Favorites')}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: muted, alignSelf: 'center', paddingRight: '4px' }}>
            {outfits.length} {t('outfits.saved')}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', padding: '0 20px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: '200px', borderRadius: '16px', background: card, border: `1px solid ${border}`, animation: 'shimmer 1.5s infinite' }} />
            ))}
            <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', border: `1px solid ${border}`, borderRadius: '20px', background: card, margin: '0 20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: accentDim, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>{t('outfits.empty')}</p>
            <p style={{ fontSize: '13px', color: muted, marginBottom: '20px' }}>{t('outfits.emptySub')}</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push('/' + locale + '/dresser')}
              style={{ background: `linear-gradient(135deg, ${accent}, #0891b2)`, border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 16px rgba(14,164,114,0.35)' }}>
              {t('outfits.dressMe')}
            </motion.button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px', padding: '0 20px' }}>
            <AnimatePresence>
              {displayed.map((outfit, i) => {
                const outfitItems = getItemsForOutfit(outfit)
                return (
                  <motion.div key={outfit.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden' }}>
                    {/* Images */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(outfitItems.length || 1, 4)}, 1fr)`, height: '180px', background: isDark ? '#0a1510' : '#e6f7f0' }}>
                      {outfitItems.map((item, j) => (
                        <div key={j} style={{ overflow: 'hidden' }}>
                          <img src={item.image_url} alt={item.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                      ))}
                      {outfitItems.length === 0 && (
                        <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ fontSize: '12px', color: muted }}>No items</p>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, letterSpacing: '-0.02em' }}>{outfit.name}</p>
                        <p style={{ fontSize: '11px', color: muted }}>{outfitItems.length} {t('outfits.pieces')}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                        <motion.button whileTap={{ scale: 0.88 }} onClick={() => toggleFavorite(outfit)}
                          style={{ background: outfit.is_favorite ? accentDim : 'transparent', border: `1px solid ${outfit.is_favorite ? accent : border}`, borderRadius: '8px', padding: '6px 9px', cursor: 'pointer', fontSize: '13px', color: outfit.is_favorite ? accent : muted, transition: 'all 0.15s' }}>
                          {outfit.is_favorite ? '★' : '☆'}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.88 }} onClick={() => deleteOutfit(outfit.id)}
                          style={{ background: 'transparent', border: `1px solid ${border}`, borderRadius: '8px', padding: '6px 9px', cursor: 'pointer', fontSize: '13px', color: muted, transition: 'all 0.15s' }}>
                          ×
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}