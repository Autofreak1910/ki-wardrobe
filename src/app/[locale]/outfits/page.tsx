'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { ShareIcon } from '@/components/ShareIcon'
import { useRouter } from 'next/navigation'
import UpgradeModal from '@/components/UpgradeModal'
import { motion, AnimatePresence } from 'framer-motion'

type Outfit = { id: string; name: string; occasion: string; item_ids: string[]; is_favorite: boolean; created_at: string }
type ClothingItem = { id: string; image_url: string; name?: string; color: string; category: string }

// Modul-Level-Cache -- ueberlebt einen Seitenwechsel (Komponente wird neu gemounted,
// aber dieses Objekt bleibt im Speicher). Beim zweiten Besuch sofort Daten da,
// kein Skeleton-Flackern mehr, waehrend im Hintergrund still nachgeladen wird.
let outfitsCache: { outfits: Outfit[]; items: ClothingItem[] } | null = null

// -------- Share-Bild bauen (Canvas) --------

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function buildOutfitShareImage(
  outfitItems: { image_url: string }[],
  outfitName: string,
  occasionLabel: string,
  locale: string
): Promise<string> {
  const W = 1080, H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Hintergrund
  ctx.fillStyle = '#161616'
  ctx.fillRect(0, 0, W, H)

  // Header
  ctx.fillStyle = '#F1B951'
  ctx.font = 'bold 44px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('KiWardrobe', W / 2, 100)

  if (occasionLabel) {
    ctx.fillStyle = '#9a978f'
    ctx.font = '28px sans-serif'
    ctx.fillText(occasionLabel, W / 2, 145)
  }

  // Grid für die Kleidungsstücke
  const imgs = await Promise.all(outfitItems.slice(0, 4).map(i => loadImg(i.image_url)))
  const cols = imgs.length >= 3 ? 2 : Math.max(imgs.length, 1)
  const rows = Math.max(Math.ceil(imgs.length / cols), 1)
  const gridTop = 190, gridBottom = H - 220
  const gridH = gridBottom - gridTop
  const cellW = W / cols, cellH = gridH / rows
  const pad = 6

  imgs.forEach((img, i) => {
    const col = i % cols, row = Math.floor(i / cols)
    const x = col * cellW + pad, y = gridTop + row * cellH + pad
    const w = cellW - pad * 2, h = cellH - pad * 2

    // cover-fit zeichnen
    const scale = Math.max(w / img.width, h / img.height)
    const sw = w / scale, sh = h / scale
    const sx = (img.width - sw) / 2, sy = (img.height - sh) / 2
    ctx.fillStyle = '#221c14'
    ctx.fillRect(x, y, w, h)
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
  })

  // Footer
  ctx.fillStyle = '#F5F3EE'
  ctx.font = 'bold 34px sans-serif'
  ctx.fillText(outfitName, W / 2, H - 150)

  ctx.fillStyle = '#c9c5bb'
  ctx.font = '26px sans-serif'
  ctx.fillText(
    locale === 'de' ? 'KI sagt mir jeden Morgen was ich anziehen soll ✦' : 'AI tells me what to wear every morning ✦',
    W / 2, H - 100
  )

  ctx.fillStyle = '#F1B951'
  ctx.font = 'bold 30px sans-serif'
  ctx.fillText('kiwardrobe-app.vercel.app', W / 2, H - 55)

  return canvas.toDataURL('image/jpeg', 0.92)
}

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>(outfitsCache?.outfits ?? [])
  const [items, setItems] = useState<ClothingItem[]>(outfitsCache?.items ?? [])
  const [loading, setLoading] = useState(!outfitsCache)
const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [occasionFilter, setOccasionFilter] = useState<string>('all')
  const { theme } = useTheme()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [sharingId, setSharingId] = useState<string | null>(null)
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
    outfitsCache = { outfits: outfitsRes.data ?? [], items: itemsRes.data ?? [] }

    const { data: stillPremium } = await supabase.rpc('check_and_expire_premium', { p_user_id: session.user.id })
    setIsPremium(stillPremium ?? false)

    setLoading(false)
  }

  async function toggleFavorite(outfit: Outfit) {
    await supabase.from('outfits').update({ is_favorite: !outfit.is_favorite }).eq('id', outfit.id)
    setOutfits(prev => {
      const next = prev.map(o => o.id === outfit.id ? { ...o, is_favorite: !o.is_favorite } : o)
      if (outfitsCache) outfitsCache = { ...outfitsCache, outfits: next }
      return next
    })
  }

  async function deleteOutfit(id: string) {
    await supabase.from('outfits').delete().eq('id', id)
    setOutfits(prev => {
      const next = prev.filter(o => o.id !== id)
      if (outfitsCache) outfitsCache = { ...outfitsCache, outfits: next }
      return next
    })
  }

  function getItemsForOutfit(outfit: Outfit) {
    return outfit.item_ids?.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[]
  }

  async function shareOutfit(outfit: Outfit) {
    if (!isPremium) { setShowUpgrade(true); return }
    if (sharingId) return
    setSharingId(outfit.id)
    try {
      const outfitItems = getItemsForOutfit(outfit)
      const occLabel = occasionLabels[outfit.occasion] ?? outfit.occasion ?? ''
      const dataUrl = await buildOutfitShareImage(outfitItems, outfit.name, occLabel, locale)
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'kiwardrobe-outfit.jpg', { type: 'image/jpeg' })

      const shareText = locale === 'de'
        ? `Schau dir mein Outfit an ✦ Erstellt mit KiWardrobe, meinem KI-Stylisten. Der sagt mir jeden Morgen was ich anziehen soll 🤯 kiwardrobe-app.vercel.app`
        : `Check out my outfit ✦ Made with KiWardrobe, my AI stylist. It tells me what to wear every morning 🤯 kiwardrobe-app.vercel.app`

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        // Auf Mobile (z.B. WhatsApp) landen Bild + Text gemeinsam in der Nachricht
        await navigator.share({ files: [file], title: 'KiWardrobe', text: shareText })
      } else if (navigator.share) {
        // Fallback ohne Datei-Support: Text + Link teilen, Bild separat downloaden
        await navigator.share({ title: 'KiWardrobe', text: shareText })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'kiwardrobe-outfit.jpg'; a.click()
        URL.revokeObjectURL(url)
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'kiwardrobe-outfit.jpg'; a.click()
        URL.revokeObjectURL(url)
        await navigator.clipboard.writeText(shareText)
        alert(locale === 'de' ? 'Bild heruntergeladen, Text kopiert!' : 'Image downloaded, text copied!')
      }
    } catch (err) {
      console.error('Share outfit failed:', err)
    } finally {
      setSharingId(null)
    }
  }

const byFavorite = filter === 'favorites' ? outfits.filter(o => o.is_favorite) : outfits
  const displayed = occasionFilter === 'all' ? byFavorite : byFavorite.filter(o => o.occasion === occasionFilter)
  const favCount = outfits.filter(o => o.is_favorite).length
  const occasionLabels: Record<string, string> = locale === 'de'
    ? { casual: 'Casual', work: 'Arbeit', date: 'Date', party: 'Party' }
    : { casual: 'Casual', work: 'Work', date: 'Date', party: 'Party' }
  const presentOccasions = Array.from(new Set(outfits.map(o => o.occasion).filter(Boolean)))

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'Poppins', 'Inter', sans-serif", position: 'relative' as const, backgroundImage: isDark ? 'none' : 'radial-gradient(circle, rgba(29,29,32,0.07) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>

      {/* Background */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: isDark ? 'rgba(122,150,172,0.08)' : 'rgba(53,92,125,0.06)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '80px', left: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: isDark ? 'rgba(122,150,172,0.06)' : 'rgba(53,92,125,0.05)', filter: 'blur(90px)' }} />
      </div>


      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '800px', width: '100%', margin: '0 auto', padding: '68px 0 108px', position: 'relative', zIndex: 1 }}>

        {/* Hero Banner mit Outfit-Collage */}
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ position: 'relative' as const, height: '180px', overflow: 'hidden', marginBottom: '0', borderRadius: '0 0 28px 28px' }}>

    <img
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80&auto=format&fit=crop"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', inset: 0 }}
          />

          {/* Gradient Overlay */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 0%, transparent 50%, ${bg} 100%)`, maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)' }} />
          <div style={{ position: 'absolute', inset: '40% 0 0 0', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.25)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 100%)' }} />

          {/* Titel über Bild */}
          <div style={{ position: 'absolute' as const, bottom: '16px', left: '20px', zIndex: 2 }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.85)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
              {locale === 'de' ? 'Deine Looks' : 'Your Looks'}
            </p>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>Outfits</h1>
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

        {presentOccasions.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', margin: '0 20px 16px', overflowX: 'auto' as const, paddingBottom: '2px' }}>
            <button onClick={() => setOccasionFilter('all')}
              style={{ padding: '6px 14px', borderRadius: '100px', border: `1px solid ${occasionFilter === 'all' ? accent : border}`, background: occasionFilter === 'all' ? accentDim : card, color: occasionFilter === 'all' ? accent : muted, fontSize: '12px', fontWeight: occasionFilter === 'all' ? 700 : 400, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
              {locale === 'de' ? 'Alle Anlässe' : 'All occasions'}
            </button>
            {presentOccasions.map(occ => (
              <button key={occ} onClick={() => setOccasionFilter(occ)}
                style={{ padding: '6px 14px', borderRadius: '100px', border: `1px solid ${occasionFilter === occ ? accent : border}`, background: occasionFilter === occ ? accentDim : card, color: occasionFilter === occ ? accent : muted, fontSize: '12px', fontWeight: occasionFilter === occ ? 700 : 400, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
                {occasionLabels[occ] ?? occ}
              </button>
            ))}
          </div>
        )}

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
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.16) }}
                    style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden' }}>
                    {/* Images */}
                   <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: outfitItems.length >= 4 ? 'repeat(2, 1fr)' : `repeat(${Math.min(outfitItems.length || 1, 3)}, 1fr)`, background: isDark ? '#221c14' : '#F4EFE4' }}>
                      {outfitItems.map((item, j) => (
                        <div key={j} style={{ overflow: 'hidden', aspectRatio: '3/4' }}>
                          <img src={item.image_url} alt={item.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                      ))}
                      {outfitItems.length === 0 && (
                        <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ fontSize: '12px', color: muted }}>No items</p>
                        </div>
                      )}
           {outfit.occasion && (
                  <span style={{ position: 'absolute', top: '10px', left: '10px', background: card, border: `1px solid ${border}`, color: text, fontSize: '10px', fontWeight: 600, padding: '4px 9px', borderRadius: '100px' }}>
                    {occasionLabels[outfit.occasion] ?? outfit.occasion}
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
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => shareOutfit(outfit)}
  style={{
    background: isPremium ? goldDim : 'transparent',
    border: `1px solid ${isPremium ? goldAccent : border}`,
    borderRadius: '8px', padding: '6px 9px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: isPremium ? goldText : muted, transition: 'all 0.15s',
    opacity: sharingId === outfit.id ? 0.5 : 1,
    pointerEvents: sharingId === outfit.id ? 'none' : 'auto',
  }}
  title={isPremium ? (locale === 'de' ? 'Outfit teilen' : 'Share outfit') : (locale === 'de' ? 'Nur mit Premium' : 'Premium only')}>
  {sharingId === outfit.id ? (
    <span style={{ fontSize: '13px' }}>…</span>
  ) : isPremium ? (
    <ShareIcon size={14} color={goldText} />
  ) : (
    <span style={{ fontSize: '13px' }}>🔒</span>
  )}
</motion.button>
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

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  ) 
}