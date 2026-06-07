'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

const categories = ['all', 'tops', 'hosen', 'jacken', 'schuhe', 'acc'] as const

type ClothingItem = {
  id: string
  image_url: string
  category: string
  color: string
  name?: string
  brand?: string
  style_tags: string[]
  season: string[]
  purchase_date?: string
  purchase_price?: number
  created_at: string
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { theme, toggle } = useTheme()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const isDark = theme === 'dark'

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('clothing_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setItems(data)
  }
function translateColor(color: string): string {
  if (locale === 'en') return color
  const map: Record<string, string> = {
    'Black': 'Schwarz', 'White': 'Weiß', 'Grey': 'Grau', 'Gray': 'Grau',
    'Blue': 'Blau', 'Navy': 'Navy', 'Red': 'Rot', 'Green': 'Grün',
    'Beige': 'Beige', 'Brown': 'Braun', 'Pink': 'Rosa', 'Purple': 'Lila',
    'Orange': 'Orange', 'Yellow': 'Gelb', 'Cream': 'Creme',
    'light blue': 'Hellblau', 'dark blue': 'Dunkelblau',
  }
  return map[color] ?? color
}
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const convertedFile = await convertToJpeg(file)
    setUploading(true)
    setAnalyzing(true)
    setAnalyzeResult('')
    setProgress(0)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAnalyzeStep(locale === 'de' ? 'Bild wird hochgeladen...' : 'Uploading image...')
      setProgress(20)
      const fileName = `${user.id}/${Date.now()}-${convertedFile.name}`
      const { error: uploadError } = await supabase.storage.from('clothing').upload(fileName, convertedFile)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('clothing').getPublicUrl(fileName)
      setAnalyzeStep(locale === 'de' ? 'KI analysiert dein Kleidungsstück...' : 'AI is analyzing your item...')
      setProgress(50)
      const base64 = await fileToBase64(convertedFile)
    const res = await fetch('/api/analyze-clothing', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-locale': locale,
  },
  body: JSON.stringify({ imageBase64: base64, mimeType: convertedFile.type || 'image/jpeg' }),
  
})
      const result = await res.json()
      const analysis = result.analysis ?? {}
      setAnalyzeStep(locale === 'de' ? 'Wird gespeichert...' : 'Saving...')
      setProgress(80)
      const { error: dbError } = await supabase.from('clothing_items').insert({
        user_id: user.id,
        image_url: publicUrl,
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
      setAnalyzeResult(`✓ ${analysis.name} · ${analysis.color}${analysis.brand ? ' · ' + analysis.brand : ''}`)
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
    setSelectedItem(null)
    loadItems()
  }

  async function handleSaveDetails() {
    if (!selectedItem) return
    setSaving(true)
    await supabase.from('clothing_items').update({
      purchase_date: editDate || null,
      purchase_price: editPrice ? parseFloat(editPrice) : null,
    }).eq('id', selectedItem.id)
    setSaving(false)
    setSelectedItem(null)
    loadItems()
  }

  async function convertToJpeg(file: File): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
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

  function switchLanguage() {
    const newLocale = locale === 'de' ? 'en' : 'de'
    const segments = pathname.split('/')
    segments[1] = newLocale
    window.location.replace(segments.join('/'))
  }

  function openItem(item: ClothingItem) {
    setSelectedItem(item)
    setEditDate(item.purchase_date ?? '')
    setEditPrice(item.purchase_price?.toString() ?? '')
  }

  const filtered = (filter === 'all' ? items : items.filter(i => i.category === filter))
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'name') return (a.name ?? '').localeCompare(b.name ?? '')
      if (sort === 'price') return (b.purchase_price ?? 0) - (a.purchase_price ?? 0)
      return 0
    })

  const categoryEmoji: Record<string, string> = {
    tops: '👕', hosen: '👖', jacken: '🧥', schuhe: '👟', acc: '🧢'
  }

  const totalValue = items.reduce((sum, i) => sum + (i.purchase_price ?? 0), 0)

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      hosen: 'pants', jacken: 'jackets', schuhe: 'shoes', acc: 'accessories', tops: 'tops'
    }
    return t('wardrobe.' + (map[cat] ?? cat))
  }

  const getCategoryDisplayName = (cat: string) => {
    const map: Record<string, string> = {
      tops: 'Tops', hosen: t('wardrobe.pants'), jacken: t('wardrobe.jackets'),
      schuhe: t('wardrobe.shoes'), acc: t('wardrobe.accessories')
    }
    return map[cat] ?? cat
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', background: 'var(--bg)' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text)' }}>
          Ki<em style={{ color: '#0ea472' }}>Wardrobe</em>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['dresser', 'wardrobe', 'outfits', 'style'].map(page => (
            <button key={page} onClick={() => router.push('/' + locale + '/' + page)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif", background: page === 'wardrobe' ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'transparent', color: page === 'wardrobe' ? '#fff' : 'var(--text-secondary)' }}>
              {t('nav.' + page)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={switchLanguage} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
            {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
          </button>
          <button onClick={toggle} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', fontWeight: 400, color: 'var(--text)', marginBottom: '4px' }}>
              {t('wardrobe.title')}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {items.length} {t('wardrobe.pieces')}
              {totalValue > 0 && ` · ~€${totalValue.toFixed(0)} ${t('wardrobe.totalValue')}`}
            </p>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", outline: 'none' }}>
            <option value="newest">{t('wardrobe.newestFirst')}</option>
            <option value="oldest">{t('wardrobe.oldestFirst')}</option>
            <option value="name">{t('wardrobe.nameAZ')}</option>
            <option value="price">{t('wardrobe.priceDesc')}</option>
          </select>
        </div>

        <div onClick={() => !uploading && fileInputRef.current?.click()}
          style={{ border: `2px dashed ${uploading ? '#0ea472' : 'var(--border)'}`, borderRadius: '14px', padding: '28px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', marginBottom: '16px', transition: 'all 0.2s', background: uploading ? (isDark ? 'rgba(14,164,114,0.05)' : '#f0fdf8') : 'var(--bg-secondary)' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>☁️</div>
          <p style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '2px', fontSize: '14px' }}>{t('wardrobe.upload')}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('wardrobe.uploadSub')}</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} style={{ display: 'none' }} />

        {analyzing && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{analyzeStep}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{progress}%</span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(135deg, #0ea472, #0891b2)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
            </div>
            {analyzeResult && <p style={{ fontSize: '12px', color: '#0ea472', marginTop: '8px' }}>{analyzeResult}</p>}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto' as const }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: filter === cat ? 'none' : '1px solid var(--border)', background: filter === cat ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-secondary)', color: filter === cat ? '#fff' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: "'DM Sans', sans-serif" }}>
              {cat === 'all' ? `${t('wardrobe.all')} (${items.length})` : `${categoryEmoji[cat]} ${getCategoryLabel(cat)}`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👗</div>
            <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: 'var(--text)' }}>{t('wardrobe.nothingHere')}</p>
            <p style={{ fontSize: '14px' }}>{t('wardrobe.uploadFirst')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
            {filtered.map(item => (
              <div key={item.id} onClick={() => openItem(item)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                <div style={{ aspectRatio: '3/4', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                  <img src={item.image_url} alt={item.name ?? item.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.name ?? item.category}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.color}</p>
                    {item.purchase_price && <p style={{ fontSize: '11px', color: '#0ea472', fontWeight: 500 }}>€{item.purchase_price}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedItem && (
        <div onClick={() => setSelectedItem(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg)', borderRadius: '20px', padding: '28px', maxWidth: '460px', width: '100%', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
              <img src={selectedItem.image_url} alt={selectedItem.name} style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border)' }} />
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', fontWeight: 400, color: 'var(--text)', marginBottom: '4px' }}>{selectedItem.name}</h2>
                {selectedItem.brand && <p style={{ fontSize: '13px', color: '#0ea472', fontWeight: 500, marginBottom: '8px' }}>{selectedItem.brand}</p>}
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>🎨 {selectedItem.color}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>📦 {getCategoryDisplayName(selectedItem.category)}</p>
                {selectedItem.style_tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const, marginTop: '8px' }}>
                    {selectedItem.style_tags.map(tag => (
                      <span key={tag} style={{ fontSize: '11px', padding: '2px 8px', background: isDark ? 'rgba(14,164,114,0.15)' : '#f0fdf8', color: '#0ea472', borderRadius: '10px', border: '1px solid rgba(14,164,114,0.2)' }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{t('wardrobe.purchaseDate')}</label>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{t('wardrobe.purchasePrice')}</label>
                <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="0.00"
                  style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif" }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleDelete(selectedItem.id)}
                style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '10px', fontSize: '13px', color: '#ef4444', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                🗑 {t('wardrobe.delete')}
              </button>
              <button onClick={handleSaveDetails} disabled={saving}
                style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '10px', fontSize: '13px', color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                {saving ? t('wardrobe.saving') : t('wardrobe.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}