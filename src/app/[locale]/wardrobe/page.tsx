'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'

const categories = ['all', 'tops', 'hosen', 'jacken', 'schuhe', 'acc'] as const

type ClothingItem = {
  id: string; image_url: string; category: string; color: string
  name?: string; brand?: string; style_tags: string[]
  season: string[]; purchase_date?: string; purchase_price?: number; created_at: string
}

export default function WardrobePage() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState('')
  const [analyzeResult, setAnalyzeResult] = useState('')
  const [progress, setProgress] = useState(0)
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [limitMsg, setLimitMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  const secondary = isDark ? '#0f1a14' : '#e6f7f0'

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const { data } = await supabase.from('clothing_items').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    if (data) setItems(data)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isPremium = false
    const LIMIT = isPremium ? Infinity : 20
    if (items.length >= LIMIT) {
      setLimitMsg(locale === 'de'
        ? 'Max. 20 Kleidungsstücke im Free Plan. Upgrade für unbegrenzt!'
        : 'Max. 20 items in Free Plan. Upgrade for unlimited!')
      setTimeout(() => setLimitMsg(null), 4000)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const convertedFile = await convertToJpeg(file)
    setUploading(true); setAnalyzing(true); setAnalyzeResult(''); setProgress(0)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const user = session.user
      setAnalyzeStep(locale === 'de' ? 'Bild wird hochgeladen...' : 'Uploading image...')
      setProgress(20)
      const fileName = `${user.id}/${Date.now()}-${convertedFile.name}`
      const { error: uploadError } = await supabase.storage.from('clothing').upload(fileName, convertedFile)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('clothing').getPublicUrl(fileName)
      setAnalyzeStep(locale === 'de' ? 'KI analysiert...' : 'AI analyzing...')
      setProgress(50)
      const base64 = await fileToBase64(convertedFile)
      const res = await fetch('/api/analyze-clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': locale },
        body: JSON.stringify({ imageBase64: base64, mimeType: convertedFile.type || 'image/jpeg' }),
      })
      const result = await res.json()
      const analysis = result.analysis ?? {}
      setAnalyzeStep(locale === 'de' ? 'Wird gespeichert...' : 'Saving...')
      setProgress(80)
      const { error: dbError } = await supabase.from('clothing_items').insert({
        user_id: user.id, image_url: publicUrl,
        category: analysis.category ?? 'tops',
        color: analysis.color ?? 'Unknown',
        name: analysis.name ?? file.name.replace(/\.[^/.]+$/, ''),
        brand: analysis.brand ?? null,
        style_tags: analysis.style_tags ?? [],
        season: analysis.season ?? [],
        ai_analysis: analysis,
      })
      if (dbError) throw dbError
      setProgress(100)
      setAnalyzeStep(locale === 'de' ? 'Fertig!' : 'Done!')
      setAnalyzeResult(`${analysis.name} · ${analysis.color}${analysis.brand ? ' · ' + analysis.brand : ''}`)
      const newCount = items.length + 1
      if (newCount === 3) {
        localStorage.removeItem('kw_welcome_seen')
      }
      setTimeout(() => { setAnalyzing(false); setProgress(0); loadItems() }, 2000)
    } catch (err) {
      console.error(err)
      setAnalyzeStep(locale === 'de' ? 'Fehler beim Upload' : 'Upload failed')
      setAnalyzing(false)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('clothing_items').delete().eq('id', id)
    setSelectedItem(null); loadItems()
  }

  async function handleSaveDetails() {
    if (!selectedItem) return
    setSaving(true)
    await supabase.from('clothing_items').update({
      purchase_date: editDate || null,
      purchase_price: editPrice ? parseFloat(editPrice) : null,
    }).eq('id', selectedItem.id)
    setSaving(false); setSelectedItem(null); loadItems()
  }

  async function convertToJpeg(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width; canvas.height = img.height
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url)
          resolve(new File([blob!], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' }))
        }, 'image/jpeg', 0.92)
      }
      img.src = url
    })
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function openItem(item: ClothingItem) {
    setSelectedItem(item)
    setEditDate(item.purchase_date ?? '')
    setEditPrice(item.purchase_price?.toString() ?? '')
  }

  const catLabels: Record<string, string> = { tops: 'Tops', hosen: 'Pants', jacken: 'Jacket', schuhe: 'Shoes', acc: 'Acc' }

  const filtered = (filter === 'all' ? items : items.filter(i => i.category === filter))
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'name') return (a.name ?? '').localeCompare(b.name ?? '')
      if (sort === 'price') return (b.purchase_price ?? 0) - (a.purchase_price ?? 0)
      return 0
    })

  const totalValue = items.reduce((sum, i) => sum + (i.purchase_price ?? 0), 0)

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", position: 'relative' as const }}>

      {/* Background */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: isDark ? 'rgba(14,164,114,0.06)' : 'rgba(14,164,114,0.1)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '100px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: isDark ? 'rgba(8,145,178,0.04)' : 'rgba(8,145,178,0.07)', filter: 'blur(90px)' }} />
        {!isDark && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="wdots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.9" fill="#0ea472" opacity="0.25" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#wdots)" />
          </svg>
        )}
      </div>

      <Navbar activePage="wardrobe" />

      {/* Limit Banner */}
      <AnimatePresence>
        {limitMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 9997, background: accent, color: '#fff',
              padding: '12px 20px', borderRadius: '14px',
              fontSize: '13px', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: `0 4px 20px ${accent}50`,
              maxWidth: '320px', textAlign: 'center' as const,
            }}>
            🔒 {limitMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '84px 16px 108px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: accent, marginBottom: '4px', opacity: 0.8 }}>
              {locale === 'de' ? 'Dein Kleiderschrank' : 'Your Wardrobe'}
            </p>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: text, letterSpacing: '-0.04em', marginBottom: '2px' }}>
              {t('wardrobe.title')}
            </h1>
            <p style={{ fontSize: '13px', color: muted }}>
              {items.length} / 20 {t('wardrobe.pieces')}{totalValue > 0 && ` · ~€${totalValue.toFixed(0)}`}
            </p>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ background: card, border: `1px solid ${border}`, borderRadius: '10px', padding: '9px 12px', fontSize: '12px', color: text, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", outline: 'none', marginTop: '4px' }}>
            <option value="newest">{t('wardrobe.newestFirst')}</option>
            <option value="oldest">{t('wardrobe.oldestFirst')}</option>
            <option value="name">{t('wardrobe.nameAZ')}</option>
            <option value="price">{t('wardrobe.priceDesc')}</option>
          </select>
        </div>

       {/* Style DNA Banner */}
{items.length >= 5 && (
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    onClick={() => router.push('/' + locale + '/profile')}
    whileTap={{ scale: 0.98 }}
    style={{ background: `linear-gradient(135deg, ${accent}15, #6b9fff10)`, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
    <span style={{ fontSize: '24px' }}>🧬</span>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: text, marginBottom: '2px' }}>{locale === 'de' ? 'Style DNA entdecken' : 'Discover your Style DNA'}</p>
      <p style={{ fontSize: '11px', color: muted }}>{locale === 'de' ? `KI analysiert deine ${items.length} Kleidungsstücke` : `AI analyzes your ${items.length} items`}</p>
    </div>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
  </motion.div>
)}

{/* Upload */}
<motion.div
  whileTap={{ scale: 0.99 }}
  onClick={() => !uploading && fileInputRef.current?.click()}
  style={{ border: `2px dashed ${uploading ? accent : border}`, borderRadius: '16px', padding: '22px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', marginBottom: '16px', transition: 'all 0.2s', background: uploading ? accentDim : card }}>
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    onClick={() => router.push('/' + locale + '/profile')}
    whileTap={{ scale: 0.98 }}
    style={{
      background: `linear-gradient(135deg, ${accent}15, #6b9fff10)`,
      border: `1px solid ${border}`,
      borderRadius: '14px', padding: '14px 16px',
      marginBottom: '16px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
    <span style={{ fontSize: '24px' }}>🧬</span>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: text, marginBottom: '2px' }}>
        {locale === 'de' ? 'Style DNA entdecken' : 'Discover your Style DNA'}
      </p>
      <p style={{ fontSize: '11px', color: muted }}>
        {locale === 'de' ? `KI analysiert deine ${items.length} Kleidungsstücke` : `AI analyzes your ${items.length} items`}
      </p>
    </div>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
  </motion.div>
)}
          whileTap={{ scale: 0.99 }}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{ border: `2px dashed ${uploading ? accent : border}`, borderRadius: '16px', padding: '22px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', marginBottom: '16px', transition: 'all 0.2s', background: uploading ? accentDim : card }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: accentDim, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p style={{ fontWeight: 600, color: text, marginBottom: '2px', fontSize: '14px', letterSpacing: '-0.01em' }}>{t('wardrobe.upload')}</p>
          <p style={{ fontSize: '12px', color: muted }}>{t('wardrobe.uploadSub')}</p>
        </motion.div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} style={{ display: 'none' }} />

        {/* Analyze progress */}
        <AnimatePresence>
          {analyzing && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: text, letterSpacing: '-0.01em' }}>{analyzeStep}</span>
                <span style={{ fontSize: '12px', color: accent, fontWeight: 600 }}>{progress}%</span>
              </div>
              <div style={{ height: '3px', background: border, borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, #0891b2)`, borderRadius: '2px' }} />
              </div>
              {analyzeResult && (
                <p style={{ fontSize: '12px', color: accent, fontWeight: 500 }}>✓ {analyzeResult}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto' as const, paddingBottom: '4px' }}>
          {categories.map(cat => {
            const isOn = filter === cat
            return (
              <button key={cat} onClick={() => setFilter(cat)}
                style={{ padding: '7px 14px', borderRadius: '100px', border: `1px solid ${isOn ? accent : border}`, background: isOn ? accent : card, color: isOn ? '#fff' : muted, fontSize: '12px', fontWeight: isOn ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: "'DM Sans', sans-serif", flexShrink: 0, transition: 'all 0.15s', boxShadow: isOn ? '0 2px 10px rgba(14,164,114,0.3)' : 'none' }}>
                {cat === 'all' ? `${t('wardrobe.all')} (${items.length})` : catLabels[cat]}
              </button>
            )
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', border: `1px solid ${border}`, borderRadius: '16px', background: card }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: accentDim, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: text, marginBottom: '6px', letterSpacing: '-0.02em' }}>{t('wardrobe.nothingHere')}</p>
            <p style={{ fontSize: '13px', color: muted }}>{t('wardrobe.uploadFirst')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: '10px' }}>
            {filtered.map((item, i) => (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openItem(item)}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: '14px', overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ aspectRatio: '3/4', overflow: 'hidden', background: secondary }}>
                  <img src={item.image_url} alt={item.name ?? item.category} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: text, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, letterSpacing: '-0.01em' }}>{item.name ?? item.category}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '11px', color: muted }}>{item.color}</p>
                    {item.purchase_price && <p style={{ fontSize: '11px', color: accent, fontWeight: 600 }}>€{item.purchase_price}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Item detail sheet */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ background: bg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '500px', border: `1px solid ${border}`, borderBottom: 'none' }}>
              <div style={{ width: '36px', height: '4px', background: border, borderRadius: '2px', margin: '0 auto 20px' }} />
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <img src={selectedItem.image_url} alt={selectedItem.name} style={{ width: '96px', height: '124px', objectFit: 'cover', borderRadius: '14px', border: `1px solid ${border}`, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', fontWeight: 400, color: text, marginBottom: '4px', letterSpacing: '-0.02em' }}>{selectedItem.name}</h2>
                  {selectedItem.brand && <p style={{ fontSize: '13px', color: accent, fontWeight: 600, marginBottom: '8px' }}>{selectedItem.brand}</p>}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: muted, background: accentDim, border: `1px solid ${border}`, borderRadius: '100px', padding: '3px 10px' }}>{selectedItem.color}</span>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: muted, background: accentDim, border: `1px solid ${border}`, borderRadius: '100px', padding: '3px 10px' }}>{catLabels[selectedItem.category] ?? selectedItem.category}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{t('wardrobe.purchaseDate')}</label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    style={{ width: '100%', background: card, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: text, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{t('wardrobe.purchasePrice')}</label>
                  <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="0.00"
                    style={{ width: '100%', background: card, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: text, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleDelete(selectedItem.id)}
                  style={{ flex: 1, padding: '13px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', fontSize: '14px', color: '#ef4444', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {t('wardrobe.delete')}
                </button>
                <button onClick={handleSaveDetails} disabled={saving}
                  style={{ flex: 2, padding: '13px', background: `linear-gradient(135deg, ${accent}, #0891b2)`, border: 'none', borderRadius: '12px', fontSize: '14px', color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: '-0.01em', boxShadow: '0 4px 16px rgba(14,164,114,0.35)' }}>
                  {saving ? t('wardrobe.saving') : t('wardrobe.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}