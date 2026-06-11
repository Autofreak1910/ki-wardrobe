'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

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
  const { theme } = useTheme()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isDark = theme === 'dark'

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
    const convertedFile = await convertToJpeg(file)
    setUploading(true)
    setAnalyzing(true)
    setAnalyzeResult('')
    setProgress(0)
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
    const map: Record<string, string> = { hosen: 'pants', jacken: 'jackets', schuhe: 'shoes', acc: 'accessories', tops: 'tops' }
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
  <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' as const, background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
    <Navbar activePage="wardrobe" />

    <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '900px', width: '100%', margin: '0 auto',  padding: '84px 16px 100px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', fontWeight: 400, color: 'var(--text)', marginBottom: '4px' }}>
              {t('wardrobe.title')}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {items.length} {t('wardrobe.pieces')}
              {totalValue > 0 && ` · ~€${totalValue.toFixed(0)}`}
            </p>
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', color: 'var(--text)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", outline: 'none' }}>
            <option value="newest">{t('wardrobe.newestFirst')}</option>
            <option value="oldest">{t('wardrobe.oldestFirst')}</option>
            <option value="name">{t('wardrobe.nameAZ')}</option>
            <option value="price">{t('wardrobe.priceDesc')}</option>
          </select>
        </div>

        <div onClick={() => !uploading && fileInputRef.current?.click()}
          style={{ border: `2px dashed ${uploading ? '#0ea472' : 'var(--border)'}`, borderRadius: '14px', padding: '24px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', marginBottom: '16px', transition: 'all 0.2s', background: uploading ? (isDark ? 'rgba(14,164,114,0.05)' : '#f0fdf8') : 'var(--bg-secondary)' }}>
          <div style={{ fontSize: '24px', marginBottom: '6px' }}>☁️</div>
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

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' as const, paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: filter === cat ? 'none' : '1px solid var(--border)', background: filter === cat ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-secondary)', color: filter === cat ? '#fff' : 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {filtered.map(item => (
              <div key={item.id} onClick={() => openItem(item)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s' }}>
                <div style={{ aspectRatio: '3/4', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                  <img src={item.image_url} alt={item.name ?? item.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.name ?? item.category}</p>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '500px', border: '1px solid var(--border)' }}>
            <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <img src={selectedItem.image_url} alt={selectedItem.name} style={{ width: '100px', height: '130px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', fontWeight: 400, color: 'var(--text)', marginBottom: '4px' }}>{selectedItem.name}</h2>
                {selectedItem.brand && <p style={{ fontSize: '13px', color: '#0ea472', fontWeight: 500, marginBottom: '6px' }}>{selectedItem.brand}</p>}
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '3px' }}>🎨 {selectedItem.color}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📦 {getCategoryDisplayName(selectedItem.category)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
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
                style={{ flex: 1, padding: '13px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '12px', fontSize: '14px', color: '#ef4444', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                🗑 {t('wardrobe.delete')}
              </button>
              <button onClick={handleSaveDetails} disabled={saving}
                style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '12px', fontSize: '14px', color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                {saving ? t('wardrobe.saving') : t('wardrobe.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}