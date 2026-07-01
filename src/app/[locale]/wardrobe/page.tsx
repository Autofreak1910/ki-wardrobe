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
  const [isPremium, setIsPremium] = useState(false)
  const [dna, setDna] = useState<any>(null)
  const [dnaLoading, setDnaLoading] = useState(false)
  const [showDna, setShowDna] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const multiFileInputRef = useRef<HTMLInputElement>(null)
  const [multiMode, setMultiMode] = useState(false)
  const [multiAnalyzing, setMultiAnalyzing] = useState(false)
  const [multiOriginalImage, setMultiOriginalImage] = useState<string | null>(null)
  const [detectedItems, setDetectedItems] = useState<Array<{
    x: number; y: number; width: number; height: number
    category: string; color: string; name: string; brand?: string
    croppedImage: string; included: boolean; uploading?: boolean
  }>>([])
  const [multiSaving, setMultiSaving] = useState(false)
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
const { data: stillPremium } = await supabase.rpc('check_and_expire_premium', { p_user_id: session.user.id })
    setIsPremium(stillPremium ?? false)
  }
async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

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
      const { data: { publicUrl: originalUrl } } = supabase.storage.from('clothing').getPublicUrl(fileName)

      setAnalyzeStep(locale === 'de' ? 'Hintergrund wird entfernt...' : 'Removing background...')
      setProgress(35)
      let publicUrl = originalUrl
 try {
        const bgRes = await fetch('/api/remove-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: originalUrl }),
        })
        const bgData = await bgRes.json()
        console.log('BG removal response:', bgData)
        if (bgData.success && bgData.imageUrl) {
          const cleanImgRes = await fetch(bgData.imageUrl)
          if (!cleanImgRes.ok) {
            console.error('Failed to fetch clean image, status:', cleanImgRes.status)
            throw new Error('fetch clean failed')
          }
          const cleanBlob = await cleanImgRes.blob()
          console.log('Clean blob size:', cleanBlob.size)
          const cleanFileName = `${user.id}/${Date.now()}-clean.png`
          const { error: cleanUploadErr } = await supabase.storage.from('clothing').upload(cleanFileName, cleanBlob, { contentType: 'image/png' })
          if (cleanUploadErr) {
            console.error('Clean upload error:', cleanUploadErr)
          } else {
            const { data: { publicUrl: cleanUrl } } = supabase.storage.from('clothing').getPublicUrl(cleanFileName)
            console.log('Clean URL saved:', cleanUrl)
            publicUrl = cleanUrl
          }
        } else {
          console.error('BG removal did not return success/imageUrl')
        }
      } catch (bgErr) {
        console.error('Background removal failed, using original:', bgErr)
      }
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
        layer_type: analysis.layer_type ?? null,
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

async function handleMultiUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const LIMIT = isPremium ? Infinity : 20
    if (items.length >= LIMIT) {
      setLimitMsg(locale === 'de'
        ? 'Max. 20 Kleidungsstücke im Free Plan. Upgrade für unbegrenzt!'
        : 'Max. 20 items in Free Plan. Upgrade for unlimited!')
      setTimeout(() => setLimitMsg(null), 4000)
      if (multiFileInputRef.current) multiFileInputRef.current.value = ''
      return
    }

    const { data: { session: checkSession } } = await supabase.auth.getSession()
    if (checkSession?.user) {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: weeklyCount } = await supabase
        .from('multi_scan_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', checkSession.user.id)
        .gte('created_at', weekAgo.toISOString())

      if ((weeklyCount ?? 0) >= 3) {
        setLimitMsg(locale === 'de'
          ? 'Max. 3 Schrank-Scans pro Woche erreicht. Nächste Woche wieder!'
          : 'Max. 3 closet scans per week reached. Try again next week!')
        setTimeout(() => setLimitMsg(null), 4000)
        if (multiFileInputRef.current) multiFileInputRef.current.value = ''
        return
      }
await supabase.from('multi_scan_generations').insert({ user_id: checkSession.user.id })
    }

    const convertedFile = await convertToJpeg(file)
    setMultiAnalyzing(true)
    setDetectedItems([])

    try {
      const base64 = await fileToBase64(convertedFile)
      const dataUrl = `data:${convertedFile.type};base64,${base64}`
      setMultiOriginalImage(dataUrl)

      // Schritt 1: GPT-4o erkennt alle Teile mit Boxen
      const res = await fetch('/api/analyze-multi-clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': locale },
        body: JSON.stringify({ imageBase64: base64, mimeType: convertedFile.type || 'image/jpeg' }),
      })
      const result = await res.json()
      if (!result.success || !result.items?.length) {
        setMultiAnalyzing(false)
        setMultiMode(false)
        setLimitMsg(locale === 'de' ? 'Keine Kleidung erkannt. Versuch ein anderes Foto.' : 'No clothing detected. Try another photo.')
        setTimeout(() => setLimitMsg(null), 4000)
        return
      }

      // Schritt 2: Alle Teile aus Originalbild ausschneiden (mit 15% Puffer)
      const img = new Image()
      img.src = dataUrl
      await new Promise(resolve => { img.onload = resolve })

      const { data: { session: uploadSession } } = await supabase.auth.getSession()
      if (!uploadSession?.user) throw new Error('No session')

      // Schritt 3: Alle rembg-Calls PARALLEL laufen lassen
      const processedItems = await Promise.all(result.items.map(async (it: any) => {
        try {
          // Crop mit Puffer ausschneiden
          const padX = (it.width / 100) * img.naturalWidth * 0.15
          const padY = (it.height / 100) * img.naturalHeight * 0.15
          const cropX = Math.max(0, (it.x / 100) * img.naturalWidth - padX)
          const cropY = Math.max(0, (it.y / 100) * img.naturalHeight - padY)
          const cropW = Math.min(img.naturalWidth - cropX, (it.width / 100) * img.naturalWidth + padX * 2)
          const cropH = Math.min(img.naturalHeight - cropY, (it.height / 100) * img.naturalHeight + padY * 2)

          const cropCanvas = document.createElement('canvas')
          cropCanvas.width = cropW
          cropCanvas.height = cropH
          cropCanvas.getContext('2d')!.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
          const cropBlob = await new Promise<Blob>(resolve => cropCanvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9))

          // Crop temporär in Supabase hochladen für rembg
          const tempFileName = `${uploadSession.user.id}/multi-temp-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
          const { error: tempErr } = await supabase.storage.from('clothing').upload(tempFileName, cropBlob, { contentType: 'image/jpeg' })
          if (tempErr) throw tempErr
          const { data: { publicUrl: tempUrl } } = supabase.storage.from('clothing').getPublicUrl(tempFileName)

          // rembg Hintergrund entfernen
          const bgRes = await fetch('/api/remove-background', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: tempUrl }),
          })
          const bgData = await bgRes.json()

 let finalImage = cropCanvas.toDataURL('image/jpeg', 0.9)
          if (bgData.success && bgData.imageUrl) {
            try {
              // rembg-Ergebnis in Supabase speichern (statt direkt als Data-URL)
              const cleanRes = await fetch(bgData.imageUrl)
              if (cleanRes.ok) {
                const cleanBlob = await cleanRes.blob()
                const cleanFileName = `${uploadSession.user.id}/multi-clean-${Date.now()}-${Math.random().toString(36).slice(2)}.png`
                const { error: cleanErr } = await supabase.storage.from('clothing').upload(cleanFileName, cleanBlob, { contentType: 'image/png' })
                if (!cleanErr) {
                  const { data: { publicUrl: cleanUrl } } = supabase.storage.from('clothing').getPublicUrl(cleanFileName)
                  finalImage = cleanUrl
                }
              }
            } catch (cleanErr) {
              console.error('Clean image save failed, using crop:', cleanErr)
            }
          }

          // Temp-Datei aufräumen (fire and forget)
          supabase.storage.from('clothing').remove([tempFileName]).catch(() => {})

          return {
            x: it.x, y: it.y, width: it.width, height: it.height,
            category: it.category ?? 'tops',
            color: it.color ?? 'Unbekannt',
            name: it.name ?? 'Kleidungsstück',
            brand: it.brand ?? undefined,
            croppedImage: finalImage,
            included: true,
          }
        } catch (err) {
          console.error('Failed to process item:', err)
          // Fallback: einfacher Crop ohne Hintergrundentfernung
          const padX = (it.width / 100) * img.naturalWidth * 0.1
          const padY = (it.height / 100) * img.naturalHeight * 0.1
          const cropX = Math.max(0, (it.x / 100) * img.naturalWidth - padX)
          const cropY = Math.max(0, (it.y / 100) * img.naturalHeight - padY)
          const cropW = Math.min(img.naturalWidth - cropX, (it.width / 100) * img.naturalWidth + padX * 2)
          const cropH = Math.min(img.naturalHeight - cropY, (it.height / 100) * img.naturalHeight + padY * 2)
          const fallbackCanvas = document.createElement('canvas')
          fallbackCanvas.width = cropW
          fallbackCanvas.height = cropH
          fallbackCanvas.getContext('2d')!.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
          return {
            x: it.x, y: it.y, width: it.width, height: it.height,
            category: it.category ?? 'tops',
            color: it.color ?? 'Unbekannt',
            name: it.name ?? 'Kleidungsstück',
            brand: it.brand ?? undefined,
            croppedImage: fallbackCanvas.toDataURL('image/jpeg', 0.9),
            included: true,
          }
        }
      }))

      setDetectedItems(processedItems)
      setMultiAnalyzing(false)
      setMultiMode(true)
    } catch (err) {
      console.error('Multi-upload failed:', err)
      setMultiAnalyzing(false)
      setLimitMsg(locale === 'de' ? 'Fehler beim Analysieren' : 'Error analyzing')
      setTimeout(() => setLimitMsg(null), 4000)
    } finally {
      if (multiFileInputRef.current) multiFileInputRef.current.value = ''
    }
  }

  function toggleDetectedItem(index: number) {
    setDetectedItems(prev => prev.map((it, i) => i === index ? { ...it, included: !it.included } : it))
  }

  function updateDetectedItem(index: number, field: 'name' | 'color' | 'brand' | 'category', value: string) {
    setDetectedItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it))
  }

  async function saveMultiItems() {
    const toSave = detectedItems.filter(it => it.included)
    if (toSave.length === 0) return
    setMultiSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setMultiSaving(false); return }
    const user = session.user

    for (let i = 0; i < toSave.length; i++) {
      const item = toSave[i]
      try {
        const blob = await (await fetch(item.croppedImage)).blob()
        const fileName = `${user.id}/${Date.now()}-${i}.jpg`
        const { error: uploadError } = await supabase.storage.from('clothing').upload(fileName, blob, { contentType: 'image/jpeg' })
        if (uploadError) throw uploadError
        const { data: { publicUrl: originalUrl } } = supabase.storage.from('clothing').getPublicUrl(fileName)

        let publicUrl = originalUrl
        try {
          const bgRes = await fetch('/api/remove-background', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: originalUrl }),
          })
          const bgData = await bgRes.json()
          if (bgData.success && bgData.imageUrl) {
            const cleanBlob = await (await fetch(bgData.imageUrl)).blob()
            const cleanFileName = `${user.id}/${Date.now()}-${i}-clean.png`
            const { error: cleanErr } = await supabase.storage.from('clothing').upload(cleanFileName, cleanBlob, { contentType: 'image/png' })
            if (!cleanErr) {
              const { data: { publicUrl: cleanUrl } } = supabase.storage.from('clothing').getPublicUrl(cleanFileName)
              publicUrl = cleanUrl
            }
          }
        } catch {}

        await supabase.from('clothing_items').insert({
          user_id: user.id, image_url: publicUrl,
          category: item.category, color: item.color, name: item.name,
          brand: item.brand || null, style_tags: [], season: [],
        })
      } catch (err) {
        console.error('Failed to save item', i, err)
      }
    }

    setMultiSaving(false)
    setMultiMode(false)
    setDetectedItems([])
    setMultiOriginalImage(null)
    loadItems()
  }

  async function handleDelete(id: string) {
    await supabase.from('clothing_items').delete().eq('id', id)
    setSelectedItem(null); loadItems()
  }
  async function generateStyleDna() {
    if (!isPremium) { router.push('/' + locale + '/profile?upgrade=true'); return }
    setDnaLoading(true)
    setShowDna(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const res = await fetch('/api/style-dna', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-locale': locale },
      body: JSON.stringify({ items }),
    })
    const data = await res.json()
    if (data.success) setDna(data.dna)
    setDnaLoading(false)
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
      const MAX_DIM = 1600
      let { width, height } = img
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height / width) * MAX_DIM)
          width = MAX_DIM
        } else {
          width = Math.round((width / height) * MAX_DIM)
          height = MAX_DIM
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        resolve(new File([blob!], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.85)
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
              {items.length}{!isPremium ? ' / 20' : ''} {t('wardrobe.pieces')}{totalValue > 0 && ` · ~€${totalValue.toFixed(0)}`}
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
    onClick={generateStyleDna}
    whileTap={{ scale: 0.98 }}
    style={{
      background: `linear-gradient(135deg, ${accent}15, #6b9fff10)`,
      border: `1px solid ${border}`,
      borderRadius: '14px', padding: '14px 16px',
      marginBottom: '16px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
    <span style={{ fontSize: '24px' }}>{isPremium ? '🧬' : '🔒'}</span>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: text, marginBottom: '2px' }}>
        {locale === 'de' ? 'Style DNA entdecken' : 'Discover your Style DNA'}
      </p>
      <p style={{ fontSize: '11px', color: muted }}>
        {isPremium
          ? (locale === 'de' ? `KI analysiert deine ${items.length} Kleidungsstücke` : `AI analyzes your ${items.length} items`)
          : (locale === 'de' ? 'Nur für Pro · €4,99' : 'Pro only · €4.99')}
      </p>
    </div>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
  </motion.div>
)}

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
  <motion.div
    whileTap={{ scale: 0.99 }}
    onClick={() => !uploading && fileInputRef.current?.click()}
    style={{ border: `2px dashed ${uploading ? accent : border}`, borderRadius: '16px', padding: '18px 12px', textAlign: 'center' as const, cursor: uploading ? 'default' : 'pointer', transition: 'all 0.2s', background: uploading ? accentDim : card }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: accentDim, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </div>
    <p style={{ fontWeight: 600, color: text, marginBottom: '2px', fontSize: '13px', letterSpacing: '-0.01em' }}>{t('wardrobe.upload')}</p>
    <p style={{ fontSize: '11px', color: muted }}>{locale === 'de' ? 'Ein Teil' : 'One item'}</p>
  </motion.div>

<motion.div
    whileTap={{ scale: 0.99 }}
    onClick={() => {
      if (!isPremium) { router.push('/' + locale + '/profile?upgrade=true'); return }
      if (!multiAnalyzing) multiFileInputRef.current?.click()
    }}
    style={{ border: `2px dashed ${multiAnalyzing ? accent : border}`, borderRadius: '16px', padding: '18px 12px', textAlign: 'center' as const, cursor: multiAnalyzing ? 'default' : 'pointer', transition: 'all 0.2s', background: multiAnalyzing ? accentDim : card, position: 'relative' as const, opacity: !isPremium ? 0.85 : 1 }}>
    {!isPremium && (
      <span style={{ position: 'absolute' as const, top: '8px', right: '8px', fontSize: '9px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '5px', padding: '2px 6px' }}>PRO</span>
    )}
    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(168,85,247,0.1)', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
      {multiAnalyzing ? (
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'block', width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: '#a855f7' }} />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="16" rx="2"/><circle cx="12" cy="14" r="3"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
      )}
    </div>
    <p style={{ fontWeight: 600, color: text, marginBottom: '2px', fontSize: '13px', letterSpacing: '-0.01em' }}>
      {multiAnalyzing ? (locale === 'de' ? 'Erkenne...' : 'Detecting...') : (locale === 'de' ? 'Mehrere Teile' : 'Multiple items')}
    </p>
    <p style={{ fontSize: '11px', color: muted }}>{locale === 'de' ? 'Ganzer Schrank' : 'Whole closet'}</p>
  </motion.div>
</div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} style={{ display: 'none' }} />
    <input ref={multiFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMultiUpload} style={{ display: 'none' }} />

        <AnimatePresence>
          {multiAnalyzing && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'block', width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: '#a855f7', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: text }}>
                  {locale === 'de' ? 'KI scannt deinen Schrank...' : 'AI scanning your closet...'}
                </span>
              </div>
              <div style={{ height: '3px', background: border, borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '90%' }}
                  transition={{ duration: 12, ease: 'easeInOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #6b9fff)', borderRadius: '2px' }} />
              </div>
              <p style={{ fontSize: '11px', color: muted, marginTop: '8px' }}>
                {locale === 'de' ? 'Erkennung + Hintergrundentfernung läuft parallel...' : 'Detection + background removal running in parallel...'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

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

      {/* Style DNA Modal */}
      <AnimatePresence>
        {showDna && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDna(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '420px', background: card, border: `1px solid ${border}`, borderRadius: '28px', padding: '28px 24px 32px', maxHeight: '85vh', overflowY: 'auto' as const }}>
              {dnaLoading ? (
                <div style={{ textAlign: 'center' as const, padding: '40px 0' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: accent, margin: '0 auto 16px' }} />
                  <p style={{ fontSize: '14px', color: muted }}>{locale === 'de' ? 'KI analysiert deinen Stil...' : 'AI analyzing your style...'}</p>
                </div>
              ) : dna ? (
                <>
                  <div style={{ textAlign: 'center' as const, marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>{dna.styleEmoji}</div>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: text, letterSpacing: '-0.03em', marginBottom: '8px' }}>{dna.styleType}</h2>
                    <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>{dna.description}</p>
                  </div>
                  <div style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>{locale === 'de' ? 'Deine Farben' : 'Your Colors'}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {dna.dominantColors?.map((color: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: card, border: `1px solid ${border}`, borderRadius: '100px', padding: '5px 12px' }}>
                          <span style={{ fontSize: '14px' }}>{dna.colorEmojis?.[i] ?? '🎨'}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: text }}>{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '12px' }}>Style Mix</p>
                    {dna.stylePercentages?.map((s: { style: string; percent: number }, i: number) => (
                      <div key={i} style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: text }}>{s.style}</span>
                          <span style={{ fontSize: '12px', color: muted }}>{s.percent}%</span>
                        </div>
                        <div style={{ height: '6px', background: border, borderRadius: '3px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.percent}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
                            style={{ height: '100%', background: `linear-gradient(90deg, ${accent}, #6b9fff)`, borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '14px', padding: '12px 14px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: accent, marginBottom: '8px', textTransform: 'uppercase' as const }}>{locale === 'de' ? 'Stärken' : 'Strengths'}</p>
                      {dna.strengths?.map((s: string, i: number) => <p key={i} style={{ fontSize: '12px', color: text, marginBottom: '4px' }}>✓ {s}</p>)}
                    </div>
                    <div style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '14px', padding: '12px 14px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: accent, marginBottom: '8px', textTransform: 'uppercase' as const }}>{locale === 'de' ? 'Dir fehlt' : 'Missing'}</p>
                      {dna.missing?.map((s: string, i: number) => <p key={i} style={{ fontSize: '12px', color: text, marginBottom: '4px' }}>+ {s}</p>)}
                    </div>
                  </div>
                  {dna.tip && (
                    <div style={{ background: `linear-gradient(135deg, ${accent}15, #6b9fff10)`, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: accent, marginBottom: '6px', textTransform: 'uppercase' as const }}>{locale === 'de' ? '✦ Style Tipp' : '✦ Style Tip'}</p>
                      <p style={{ fontSize: '13px', color: text, lineHeight: 1.6 }}>{dna.tip}</p>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ textAlign: 'center' as const, color: muted, fontSize: '14px', padding: '20px 0' }}>{locale === 'de' ? 'Fehler beim Laden' : 'Error loading'}</p>
              )}
            </motion.div>
          </motion.div>
        )}
</AnimatePresence>

      {/* Multi-Item Review Modal */}
      <AnimatePresence>
        {multiMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: bg, zIndex: 2000, overflowY: 'auto' as const }}>
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px 16px 100px' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: text, letterSpacing: '-0.03em' }}>
                    {locale === 'de' ? 'Erkannte Teile' : 'Detected items'}
                  </h2>
                  <p style={{ fontSize: '13px', color: muted }}>
                    {detectedItems.filter(it => it.included).length} {locale === 'de' ? 'von' : 'of'} {detectedItems.length} {locale === 'de' ? 'ausgewählt' : 'selected'}
                  </p>
                </div>
                <button onClick={() => { setMultiMode(false); setDetectedItems([]); setMultiOriginalImage(null) }}
                  style={{ background: card, border: `1px solid ${border}`, borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px', color: muted }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '24px' }}>
                {detectedItems.map((item, i) => (
                  <div key={i} style={{ background: card, border: `1px solid ${item.included ? accent : border}`, borderRadius: '14px', overflow: 'hidden', opacity: item.included ? 1 : 0.45, transition: 'all 0.2s' }}>
                    <div style={{ position: 'relative' as const }}>
                      <div style={{ aspectRatio: '3/4', overflow: 'hidden', background: secondary }}>
                        <img src={item.croppedImage} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      <button onClick={() => toggleDetectedItem(i)}
                        style={{ position: 'absolute' as const, top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: item.included ? accent : 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.included ? '✓' : '+'}
                      </button>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <input value={item.name} onChange={e => updateDetectedItem(i, 'name', e.target.value)}
                        style={{ width: '100%', fontSize: '12px', fontWeight: 700, color: text, border: 'none', background: 'transparent', outline: 'none', marginBottom: '4px', fontFamily: "'DM Sans', sans-serif", padding: 0 }} />
                      <input value={item.color} onChange={e => updateDetectedItem(i, 'color', e.target.value)}
                        style={{ width: '100%', fontSize: '11px', color: muted, border: 'none', background: 'transparent', outline: 'none', marginBottom: '4px', fontFamily: "'DM Sans', sans-serif", padding: 0 }} />
                      <input value={item.brand ?? ''} onChange={e => updateDetectedItem(i, 'brand', e.target.value)}
                        placeholder={locale === 'de' ? 'Marke (optional)' : 'Brand (optional)'}
                        style={{ width: '100%', fontSize: '11px', color: accent, border: 'none', background: 'transparent', outline: 'none', fontFamily: "'DM Sans', sans-serif", padding: 0 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ position: 'fixed' as const, bottom: 0, left: 0, right: 0, padding: '16px', background: bg, borderTop: `1px solid ${border}` }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={saveMultiItems}
                    disabled={multiSaving || detectedItems.filter(it => it.included).length === 0}
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: multiSaving ? border : `linear-gradient(135deg, ${accent}, #6b9fff)`, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: multiSaving ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: multiSaving ? 'none' : `0 6px 24px ${accent}40` }}>
                    {multiSaving
                      ? (locale === 'de' ? 'Speichere...' : 'Saving...')
                      : `${locale === 'de' ? 'Speichern' : 'Save'} (${detectedItems.filter(it => it.included).length})`}
                  </motion.button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}