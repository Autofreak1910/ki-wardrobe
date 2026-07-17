'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

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

  const bg        = isDark ? '#161616' : '#FDFCF9'
  const card      = isDark ? '#1D1D20' : '#ffffff'
  const border    = isDark ? '#2a2a2e' : '#EAE7E0'
  const text      = isDark ? '#F5F3EE' : '#1D1D20'
  const muted     = isDark ? '#9a978f' : '#8A8680'
  const accent    = isDark ? '#5C82A0' : '#355C7D'
  const accentDim = isDark ? 'rgba(92,130,160,0.12)' : 'rgba(53,92,125,0.07)'
  const goldAccent = '#F1B951'
  const goldDim   = isDark ? 'rgba(241,185,81,0.14)' : 'rgba(241,185,81,0.10)'
  const goldText  = isDark ? '#F1B951' : '#9C6B1F'
  const sageGradient = 'linear-gradient(135deg, #F1B951, #C98A3A)'
  const navyAccent   = isDark ? '#4A7099' : '#1F3B57'
  const navyGradient = 'linear-gradient(135deg, #2C4E72, #16283D)'

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
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'Poppins', 'Inter', sans-serif", position: 'relative' as const, backgroundImage: isDark ? 'none' : 'radial-gradient(circle, rgba(29,29,32,0.07) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>

      {/* Background */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: isDark ? 'rgba(122,150,172,0.08)' : 'rgba(53,92,125,0.06)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '80px', left: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: isDark ? 'rgba(122,150,172,0.06)' : 'rgba(53,92,125,0.05)', filter: 'blur(90px)' }} />
      </div>


      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '800px', width: '100%', margin: '0 auto', padding: '68px 0 108px', position: 'relative', zIndex: 1 }}>

        {/* Hero Banner mit Outfit-Collage */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ position: 'relative' as const, height: '180px', overflow: 'hidden', marginBottom: '0' }}>

          <img
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80&auto=format&fit=crop"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', inset: 0 }}
          />

          {/* Gradient Overlay */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(29,29,32,0.06) 0%, ${bg}cc 65%, ${bg} 100%)` }} />

          {/* Titel über Bild */}
          <div style={{ position: 'absolute' as const, bottom: '16px', left: '20px', zIndex: 2 }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: muted, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: accent, display: 'inline-block' }} />
              {locale === 'de' ? 'Deine Looks' : 'Your Looks'}
            </p>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: text, letterSpacing: '-0.04em', lineHeight: 1 }}>Outfits</h1>
          </div>

          {/* Favoriten-Badge oben rechts */}
          {favCount > 0 && (
            <div style={{ position: 'absolute', top: '14px', right: '20px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.9)', border: `1px solid ${border}`, borderRadius: '100px', padding: '5px 10px 5px 8px', backdropFilter: 'blur(6px)' }}>
              <span style={{ fontSize: '11px', color: goldAccent }}>★</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#1D1D20' }}>{favCount}</span>
            </div>
          )}

        </motion.div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px', margin: '14px 20px 16px', padding: 0 }}>
          {(['all', 'favorites'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '8px 18px', borderRadius: '100px', border: `1px solid ${filter === f ? navyAccent : border}`, background: filter === f ? navyGradient : card, color: filter === f ? '#fff' : muted, fontSize: '13px', fontWeight: filter === f ? 600 : 400, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", transition: 'all 0.15s', boxShadow: filter === f ? '0 3px 10px rgba(22,40,61,0.35)' : 'none' }}>
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
              style={{ background: navyGradient, border: 'none', borderRadius: '10px', padding: '11px 22px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: '0 4px 16px rgba(22,40,61,0.3)' }}>
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
                    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(${Math.min(outfitItems.length || 1, 4)}, 1fr)`, height: '180px', background: isDark ? '#221c14' : '#F4EFE4' }}>
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
                      {outfit.occasion && (
                        <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.92)', border: `1px solid ${border}`, color: text, fontSize: '10px', fontWeight: 600, padding: '4px 9px', borderRadius: '100px', textTransform: 'capitalize' as const }}>
                          {outfit.occasion}
                        </span>
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
                          style={{ background: outfit.is_favorite ? goldDim : 'transparent', border: `1px solid ${outfit.is_favorite ? goldAccent : border}`, borderRadius: '8px', padding: '6px 9px', cursor: 'pointer', fontSize: '13px', color: outfit.is_favorite ? goldAccent : muted, transition: 'all 0.15s' }}>
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