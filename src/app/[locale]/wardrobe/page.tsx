'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import UpgradeModal from '@/components/UpgradeModal'
const categories = ['all', 'tops', 'hosen', 'kurze_hosen', 'roecke', 'kleider', 'jacken', 'schuhe', 'acc'] as const

function LockIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 018 0v4"/>
    </svg>
  )
}
function DnaIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3c0 4 4 6 6 9s6 5 6 9"/>
      <path d="M18 3c0 4-4 6-6 9s-6 5-6 9"/>
      <line x1="7.5" y1="7" x2="16.5" y2="7"/>
      <line x1="9" y1="10.5" x2="15" y2="10.5"/>
      <line x1="9" y1="13.5" x2="15" y2="13.5"/>
      <line x1="7.5" y1="17" x2="16.5" y2="17"/>
    </svg>
  )
}
function QuestionIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5"/>
      <line x1="12" y1="17" x2="12" y2="17.01"/>
    </svg>
  )
}

type ClothingItem = {
  id: string; image_url: string; category: string; color: string
  name?: string; brand?: string; style_tags: string[]
  season: string[]; purchase_date?: string; purchase_price?: number; created_at: string
}

function getTodayStartUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
}

// Modul-Level-Cache -- ueberlebt Seitenwechsel, kein leeres Grid mehr beim erneuten Besuch
let wardrobeCache: { items: ClothingItem[]; isPremium: boolean; multiScansThisWeek: number } | null = null

export default function WardrobePage() {
  const [items, setItems] = useState<ClothingItem[]>(wardrobeCache?.items ?? [])
  const [filter, setFilter] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const [sort, setSort] = useState('newest')
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [styleDnaUsedToday, setStyleDnaUsedToday] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState('')
  const [analyzeResult, setAnalyzeResult] = useState('')
  const [showNotClothingModal, setShowNotClothingModal] = useState(false)
const [notClothingReason, setNotClothingReason] = useState('')
  const [progress, setProgress] = useState(0)
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [saving, setSaving] = useState(false)
const [limitMsg, setLimitMsg] = useState<string | null>(null)
const [isPremium, setIsPremium] = useState(wardrobeCache?.isPremium ?? false)
  const [multiScansThisWeek, setMultiScansThisWeek] = useState(0)
const [showUpgrade, setShowUpgrade] = useState(false)
const [dna, setDna] = useState<any>(null)
  const [dnaLoading, setDnaLoading] = useState(false)
  const [showDna, setShowDna] = useState(false)
  const [showDnaUsedToday, setShowDnaUsedToday] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const multiFileInputRef = useRef<HTMLInputElement>(null)
  const [multiMode, setMultiMode] = useState(false)
  const [multiAnalyzing, setMultiAnalyzing] = useState(false)
  const [multiProgress, setMultiProgress] = useState(0)
const [detectedItems, setDetectedItems] = useState<Array<{
    category: string; color: string; name: string; brand?: string
    croppedImage: string; included: boolean; file: File
  }>>([])
  const [multiSaving, setMultiSaving] = useState(false)
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
  const accent    = isDark ? '#7A96AC' : '#4C677D'
  const accentDim = isDark ? 'rgba(122,150,172,0.12)' : 'rgba(76,103,125,0.08)'
  const secondary = isDark ? '#221c14' : '#FAF6EC'
  const goldAccent = '#F1B951'

  useEffect(() => { loadItems() }, [])

async function loadItems() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const { data } = await supabase.from('clothing_items').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    if (data) setItems(data)
const { data: stillPremium } = await supabase.rpc('check_and_expire_premium', { p_user_id: session.user.id })
    setIsPremium(stillPremium ?? false)
    const todayStart = getTodayStartUTC()
    const now = new Date()
    const day = now.getUTCDay()
    const diffToMonday = (day === 0 ? -6 : 1) - day
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday, 0, 0, 0, 0))
    const [dnaRes, multiScanRes] = await Promise.all([
      supabase.from('style_dna_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', todayStart.toISOString()),
      supabase.from('multi_scan_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', weekStart.toISOString()),
    ])
    setStyleDnaUsedToday((dnaRes.count ?? 0) >= 1)
    setMultiScansThisWeek(multiScanRes.count ?? 0)
    wardrobeCache = { items: data ?? [], isPremium: stillPremium ?? false, multiScansThisWeek: multiScanRes.count ?? 0 }
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

  if (result.notClothing) {
        setAnalyzing(false)
        setUploading(false)
        setProgress(0)
        setNotClothingReason(result.reason ?? '')
        setShowNotClothingModal(true)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

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
  const files = Array.from(e.target.files ?? [])
  if (!files.length) return
  if (multiFileInputRef.current) multiFileInputRef.current.value = ''

if (!isPremium) {
    setShowUpgrade(true)
    return
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

const now = new Date()
const day = now.getUTCDay()
const diffToMonday = (day === 0 ? -6 : 1) - day
const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday, 0, 0, 0, 0))
const { count: weeklyCount } = await supabase
  .from('multi_scan_generations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', session.user.id)
  .gte('created_at', weekStart.toISOString())

  if ((weeklyCount ?? 0) >= 3) {
    setLimitMsg(locale === 'de' ? 'Max. 3× Mehrfach-Upload pro Woche!' : 'Max. 3× multi-upload per week!')
    setTimeout(() => setLimitMsg(null), 4000)
    return
  }
  await supabase.from('multi_scan_generations').insert({ user_id: session.user.id })

  setMultiAnalyzing(true)
  setMultiProgress(0)
  setDetectedItems([])

const results: Array<{ category: string; color: string; name: string; brand?: string; croppedImage: string; included: boolean; file: File }> = []

  try {
    const converted = await Promise.all(files.slice(0, 10).map((f: File) => convertToJpeg(f)))

    for (let i = 0; i < converted.length; i++) {
      setMultiProgress(Math.round(((i + 0.5) / converted.length) * 100))
      const file = converted[i]
      const base64 = await fileToBase64(file)
      const dataUrl = `data:image/jpeg;base64,${base64}`

      try {
       const res = await fetch('/api/analyze-clothing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg', locale }),
        })
        const data = await res.json()
        const analysis = data.analysis ?? data
        results.push({
          category: analysis.category ?? 'tops',
          color: analysis.color ?? '',
          name: analysis.name ?? '',
          brand: analysis.brand ?? '',
          croppedImage: dataUrl,
          included: true,
          file,
        })
      } catch {
        results.push({
          category: 'tops', color: '', name: '', brand: '',
          croppedImage: dataUrl,
          included: true,
          file,
        })
      }
      setMultiProgress(Math.round(((i + 1) / converted.length) * 100))
    }

    setDetectedItems(results)
    setMultiAnalyzing(false)
    setMultiMode(true)
} catch (err) {
    console.error('Multi upload failed:', err)
    setMultiAnalyzing(false)
    setMultiMode(results.length > 0)
    if (results.length > 0) {
      setDetectedItems(results)
    } else {
      setLimitMsg(locale === 'de' ? 'Fehler beim Analysieren' : 'Error analyzing')
      setTimeout(() => setLimitMsg(null), 4000)
    }
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
    if (!toSave.length) return
    setMultiSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setMultiSaving(false); return }

await Promise.allSettled(toSave.map(async (item, i) => {
    try {
      const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error: upErr } = await supabase.storage.from('clothing').upload(fileName, item.file, { contentType: 'image/jpeg' })
      if (upErr) throw upErr
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
          const cleanBlob = await fetch(bgData.imageUrl).then(r => r.blob())
          const cleanFileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-clean.png`
          const { error: cleanErr } = await supabase.storage.from('clothing').upload(cleanFileName, cleanBlob, { contentType: 'image/png' })
          if (!cleanErr) {
            const { data: { publicUrl: cleanUrl } } = supabase.storage.from('clothing').getPublicUrl(cleanFileName)
            publicUrl = cleanUrl
          }
        }
      } catch {}

      await supabase.from('clothing_items').insert({
        user_id: session.user.id,
        image_url: publicUrl,
        category: item.category,
        color: item.color,
        name: item.name,
        brand: item.brand || null,
        style_tags: [], season: [],
      })
    } catch (err) {
      console.error('Failed to save item', i, err)
    }
  }))

  setMultiSaving(false)
  setMultiMode(false)
  setDetectedItems([])
  loadItems()
}

    async function handleDelete(id: string) {
    await supabase.from('clothing_items').delete().eq('id', id)
    setSelectedItem(null); loadItems()
  }
async function generateStyleDna() {
  if (!isPremium) { setShowUpgrade(true); return }
  if (items.length < 3) return
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  const todayStart = getTodayStartUTC()
  const { count } = await supabase.from('style_dna_generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .gte('created_at', todayStart.toISOString()) as any

  if ((count ?? 0) >= 1) {
    setShowDnaUsedToday(true)
    return
  }

  await supabase.from('style_dna_generations').insert({ user_id: session.user.id })
  setStyleDnaUsedToday(true)

  setDnaLoading(true)
  setShowDna(true)
const res = await fetch('/api/style-dna', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-locale': locale },
    body: JSON.stringify({ items }),
  })
  const data = await res.json()
  if (data.success) {
    setDna(data.dna)
    try { localStorage.setItem('kw_dna_cache', JSON.stringify({ dna: data.dna, date: getTodayStartUTC().toISOString() })) } catch {}
  }
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

const catLabels: Record<string, string> = locale === 'de'
   ? { tops: 'Oberteil', hosen: 'Hose', kurze_hosen: 'Kurze Hose', roecke: 'Rock', kleider: 'Kleid', jacken: 'Jacke', schuhe: 'Schuhe', acc: 'Acc' }
    : { tops: 'Top', hosen: 'Pants', kurze_hosen: 'Shorts', roecke: 'Skirt', kleider: 'Dress', jacken: 'Jacket', schuhe: 'Shoes', acc: 'Acc' }

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
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'Poppins', 'Inter', sans-serif", position: 'relative' as const }}>

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
              fontFamily: "'Poppins', 'Inter', sans-serif",
              boxShadow: `0 4px 20px ${accent}50`,
              maxWidth: '320px', textAlign: 'center' as const,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
            <LockIcon size={13} color="#fff" /> {limitMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '68px 0 108px', position: 'relative', zIndex: 1 }}>

        {/* Hero Banner — Walk-in Closet */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ position: 'relative' as const, marginBottom: '20px', borderRadius: '0 0 28px 28px', overflow: 'hidden', height: '200px', marginLeft: '-0px', marginRight: '-0px' }}>

<img
            src="/closet-hero.jpg.png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', inset: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 0%, transparent 50%, ${bg} 100%)`, maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)' }} />
          <div style={{ position: 'absolute', inset: '40% 0 0 0', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.25)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 100%)' }} />

          {/* Text über dem Bild */}
          <div style={{ position: 'absolute' as const, bottom: '20px', left: '20px', zIndex: 2 }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
              {locale === 'de' ? 'Dein' : 'Your'}
            </h1>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
              {locale === 'de' ? 'Kleiderschrank' : 'Wardrobe'}
            </h1>
          </div>

          {/* Teile-Badge oben rechts — Glas-Look wie das Wetter-Badge auf Stylist */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ position: 'absolute' as const, top: '16px', right: '18px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '16px', padding: '10px 14px', textAlign: 'center' as const, zIndex: 2, minWidth: '70px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {items.length}{!isPremium && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>/20</span>}
            </p>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: '2px' }}>{t('wardrobe.pieces')}</p>
          </motion.div>
        </motion.div>

        {/* Content mit Padding */}
        <div style={{ padding: '0 16px' }}>

        </div>

        <div style={{ padding: '0 16px' }}>
        {/* Upload */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {/* Einzelfoto */}
          <motion.div whileTap={{ scale: 0.97 }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{ background: uploading ? accentDim : card, border: `1.5px solid ${uploading ? accent : border}`, borderRadius: '18px', padding: '18px 14px', cursor: uploading ? 'default' : 'pointer', transition: 'all 0.2s', textAlign: 'center' as const }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              {uploading ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'block', width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: accent }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              )}
            </div>
            <p style={{ fontWeight: 700, color: text, fontSize: '13px', marginBottom: '3px', letterSpacing: '-0.01em' }}>
              {uploading ? (locale === 'de' ? 'Lädt hoch...' : 'Uploading...') : (locale === 'de' ? 'Foto hochladen' : 'Upload photo')}
            </p>
            <p style={{ fontSize: '11px', color: muted }}>{locale === 'de' ? 'Ein Kleidungsstück' : 'One item'}</p>
          </motion.div>

   {/* Mehrere Fotos — Pro */}
          <motion.div whileTap={{ scale: 0.97 }}
            onClick={() => { if (!isPremium) { setShowUpgrade(true); return } if (!multiAnalyzing) multiFileInputRef.current?.click() }}
            style={{
              background: isPremium ? card : 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08))',
              border: isPremium ? `1px solid ${border}` : '1px solid rgba(251,191,36,0.35)',
              borderRadius: '18px', padding: '20px 14px', cursor: 'pointer',
              textAlign: 'center' as const, position: 'relative' as const,
            }}>
            {!isPremium && (
              <span style={{ position: 'absolute' as const, top: '10px', right: '10px', fontSize: '9px', fontWeight: 700, color: '#fff', background: goldAccent, borderRadius: '5px', padding: '2px 7px', boxShadow: '0 2px 6px rgba(251,191,36,0.4)' }}>PRO</span>
            )}
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: isPremium ? accentDim : 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: isPremium ? `1px solid ${border}` : '1px solid rgba(251,191,36,0.3)' }}>
              {multiAnalyzing ? (
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'block', width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: accent }} />
              ) : isPremium ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="16" rx="2"/><circle cx="12" cy="14" r="3"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              ) : (
                <LockIcon size={20} color="#92610a" />
              )}
            </div>
         <p style={{ fontWeight: 700, color: isPremium ? text : '#92610a', fontSize: '13px', marginBottom: '3px', letterSpacing: '-0.02em' }}>
              {multiAnalyzing ? (locale === 'de' ? 'Analysiere...' : 'Analyzing...') : (locale === 'de' ? 'Mehrere Fotos' : 'Multiple photos')}
            </p>
            <p style={{ fontSize: '11px', color: isPremium ? muted : '#b07d20', fontWeight: 500, marginBottom: isPremium ? 0 : '6px' }}>
              {locale === 'de' ? 'Bis zu 10 auf einmal' : 'Up to 10 at once'}
            </p>
            {isPremium && (
              <p style={{ fontSize: '10px', color: multiScansThisWeek >= 3 ? '#ef4444' : muted, fontWeight: 600, marginTop: '4px' }}>
                {multiScansThisWeek}/3 {locale === 'de' ? 'diese Woche' : 'this week'}
              </p>
            )}
            {!isPremium && (
              <p style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>
                {locale === 'de' ? 'Jetzt freischalten →' : 'Unlock now →'}
              </p>
            )}
          </motion.div>
        </div>

{/* Style DNA Banner — Krass */}
{(() => {
 const needsMoreItems = isPremium && items.length < 3
const dnaLocked = !isPremium || styleDnaUsedToday || needsMoreItems
  return (
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    onClick={generateStyleDna}
    whileTap={{ scale: 0.98 }}
    style={{
      position: 'relative' as const,
      background: isPremium
        ? 'linear-gradient(135deg, #0f0c1a, #1a0f2e, #0f1a2e)'
        : 'linear-gradient(135deg, #0a1628, #0f1a2e)',
      borderRadius: '20px', padding: '20px 18px',
      marginBottom: '16px', cursor: 'pointer',
      overflow: 'hidden', minHeight: '120px',
      boxShadow: isPremium ? '0 8px 32px rgba(168,85,247,0.25)' : '0 4px 20px rgba(0,0,0,0.15)',
      opacity: dnaLocked ? 0.55 : 1,
    }}>
  {dnaLocked && (
      <div style={{ position: 'absolute', top: '14px', right: '16px', zIndex: 5, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LockIcon size={16} color="#fff" />
      </div>
    )}
    {/* Glow Effekte */}
    <div style={{ position: 'absolute', top: '-30px', right: '-20px', width: '160px', height: '160px', borderRadius: '50%', background: isPremium ? 'radial-gradient(circle, rgba(168,85,247,0.3), transparent 70%)' : 'radial-gradient(circle, rgba(14,164,114,0.2), transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: '-20px', left: '30%', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,159,255,0.2), transparent 70%)', filter: 'blur(15px)', pointerEvents: 'none' }} />

    {/* DNA Helix SVG als Dekoration */}
    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.15 }}>
      <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
        <path d="M10 5 Q30 20 50 35 Q30 50 10 65 Q30 50 50 35" stroke="white" strokeWidth="2" fill="none"/>
        <path d="M50 5 Q30 20 10 35 Q30 50 50 65" stroke="white" strokeWidth="2" fill="none"/>
        {[10,20,30,40,50,60,70].map(y => (
          <line key={y} x1="15" y1={y} x2="45" y2={y+2} stroke="white" strokeWidth="1" opacity="0.5"/>
        ))}
      </svg>
    </div>

    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>
          {isPremium
            ? (locale === 'de' ? 'Deine Style DNA' : 'Your Style DNA')
            : (locale === 'de' ? 'Style DNA entdecken' : 'Discover your Style DNA')}
        </p>
    {!isPremium ? (
  <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', background: goldAccent, borderRadius: '5px', padding: '2px 7px', boxShadow: '0 2px 8px rgba(251,191,36,0.4)' }}>PRO</span>
) : needsMoreItems ? (
  <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.2)', borderRadius: '5px', padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><LockIcon size={9} color="#fff" /> {items.length}/3</span>
) : styleDnaUsedToday ? (
  <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.2)', borderRadius: '5px', padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><LockIcon size={9} color="#fff" /> {locale === 'de' ? 'Heute genutzt' : 'Used today'}</span>
) : (
  <span style={{ fontSize: '9px', fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.2)', borderRadius: '5px', padding: '2px 7px', border: '1px solid rgba(168,85,247,0.3)' }}>✦ AKTIV</span>
)}
    </div>
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
        {locale === 'de' ? 'Was sagt dein Style über dich?' : 'What does your style say?'}
      </p>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
  {!isPremium
    ? (locale === 'de' ? 'Analysiere deinen Stil-Code mit KI.' : 'Analyze your style code with AI.')
    : needsMoreItems
      ? (locale === 'de' ? `Lade mind. 3 Kleidungsstücke hoch (${items.length}/3)` : `Upload at least 3 items (${items.length}/3)`)
      : styleDnaUsedToday
        ? (locale === 'de' ? 'Morgen wieder verfügbar' : 'Available again tomorrow')
        : (locale === 'de' ? `Analysiere deinen Stil-Code mit KI · ${items.length} Teile` : `Analyze your style code with AI · ${items.length} items`)}
</p>
      {!isPremium && (
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', fontStyle: 'italic' }}>
          *{locale === 'de' ? 'Nur für PRO Mitglieder' : 'Pro members only'}
        </p>
      )}
    </div>
  </motion.div>
  )
})()}

        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} style={{ display: 'none' }} />
    <input ref={multiFileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMultiUpload} multiple style={{ display: 'none' }} />

        <AnimatePresence>
          {multiAnalyzing && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'block', width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: '#a855f7', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: text }}>
                  {locale === 'de' ? 'KI scannt deinen Schrank...' : 'AI scanning your closet...'}
                </span>
              </div>
              <div style={{ height: '3px', background: border, borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${multiProgress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #a855f7, #6b9fff)', borderRadius: '2px' }} />
              </div>
              <p style={{ fontSize: '11px', color: muted, marginTop: '8px' }}>
                {locale === 'de' ? `KI analysiert... ${multiProgress}%` : `AI analyzing... ${multiProgress}%`}
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
                style={{ padding: '7px 14px', borderRadius: '100px', border: `1px solid ${isOn ? accent : border}`, background: isOn ? accent : card, color: isOn ? '#fff' : muted, fontSize: '12px', fontWeight: isOn ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' as const, fontFamily: "'Poppins', 'Inter', sans-serif", flexShrink: 0, transition: 'all 0.15s', boxShadow: isOn ? '0 2px 10px rgba(14,164,114,0.3)' : 'none' }}>
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
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {(showAll ? filtered : filtered.slice(0, 6)).map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.16), duration: 0.3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openItem(item)}
                  style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: secondary }}>
                    <img src={item.image_url} alt={item.name ?? item.category} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <div style={{ padding: '8px 8px 10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: text, marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{item.name ?? item.category}</p>
                    <p style={{ fontSize: '10px', color: muted }}>{item.color}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            {filtered.length > 6 && (
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => setShowAll(v => !v)}
                style={{ width: '100%', marginTop: '12px', padding: '12px', background: card, border: `1px solid ${border}`, borderRadius: '14px', fontSize: '13px', fontWeight: 600, color: accent, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {showAll
                  ? (locale === 'de' ? '▲ Weniger anzeigen' : '▲ Show less')
                  : `▼ ${locale === 'de' ? `Alle ${filtered.length} anzeigen` : `Show all ${filtered.length}`}`}
              </motion.button>
            )}
          </>
        )}
        </div>
      </main>

      {/* Item detail sheet */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ background: bg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '500px', border: `1px solid ${border}`, borderBottom: 'none', position: 'relative' as const }}>
              <button onClick={() => setSelectedItem(null)} aria-label={locale === 'de' ? 'Schließen' : 'Close'}
                style={{ position: 'absolute' as const, top: '16px', right: '16px', width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${border}`, background: card, color: muted, fontSize: '14px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                ✕
              </button>
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
           <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{t('wardrobe.purchaseDate')}</label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    style={{ width: '100%', background: card, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: text, outline: 'none', fontFamily: "'Poppins', 'Inter', sans-serif" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{t('wardrobe.purchasePrice')}</label>
                  <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="0.00"
                    style={{ width: '100%', background: card, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: text, outline: 'none', fontFamily: "'Poppins', 'Inter', sans-serif" }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleDelete(selectedItem.id)}
                  style={{ flex: 1, padding: '13px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', fontSize: '14px', color: '#ef4444', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {t('wardrobe.delete')}
                </button>
                <button onClick={handleSaveDetails} disabled={saving}
                  style={{ flex: 2, padding: '13px', background: `linear-gradient(135deg, ${accent}, #0891b2)`, border: 'none', borderRadius: '12px', fontSize: '14px', color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", fontWeight: 600, letterSpacing: '-0.01em', boxShadow: '0 2px 8px rgba(14,164,114,0.25)' }}>
                  {saving ? t('wardrobe.saving') : t('wardrobe.save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
</AnimatePresence>

     {/* Style DNA schon heute genutzt */}
      <AnimatePresence>
        {showDnaUsedToday && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDnaUsedToday(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'linear-gradient(135deg, #0f0c1a, #1a0f2e, #0f1a2e)', borderRadius: '28px', padding: '32px 24px', textAlign: 'center' as const, maxWidth: '340px', width: '100%', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 24px 64px rgba(168,85,247,0.2)', position: 'relative' as const, overflow: 'hidden' }}>

              <button onClick={() => setShowDnaUsedToday(false)} aria-label={locale === 'de' ? 'Schließen' : 'Close'}
                style={{ position: 'absolute' as const, top: '14px', right: '14px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                ✕
              </button>

              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.3), transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />

              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ marginBottom: '16px', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
                <DnaIcon size={52} color="#a855f7" />
              </motion.div>

              <p style={{ fontSize: '11px', fontWeight: 700, color: '#a855f7', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '10px', position: 'relative', zIndex: 1 }}>
                {locale === 'de' ? '✦ Schon erledigt' : '✦ Already done'}
              </p>

              <p style={{ fontSize: '19px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '10px', position: 'relative', zIndex: 1 }}>
                {locale === 'de' ? 'Deine Style DNA von heute wartet schon!' : 'Your Style DNA for today is ready!'}
              </p>

              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                {locale === 'de'
                  ? 'Eine neue Analyse gibt es morgen — schau dir bis dahin dein aktuelles Ergebnis nochmal an.'
                  : "A new analysis is available tomorrow — in the meantime, take another look at today's result."}
              </p>

            <motion.button whileTap={{ scale: 0.97 }}
       onClick={async () => {
  setShowDnaUsedToday(false)
  setShowDna(true)
  setDnaLoading(true)
  try {
    const res = await fetch('/api/style-dna')
    const data = await res.json()
    if (data.success) setDna(data.dna)
  } catch (err) {
    console.error('Failed to load today\'s DNA:', err)
  } finally {
    setDnaLoading(false)
  }
}}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #a855f7, #6b9fff)', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: '0 6px 24px rgba(168,85,247,0.4)', marginBottom: '8px', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <DnaIcon size={16} color="#fff" />
                {locale === 'de' ? 'Heutige DNA ansehen' : "View today's DNA"}
              </motion.button>

              <button onClick={() => setShowDnaUsedToday(false)}
                style={{ width: '100%', padding: '11px', background: 'transparent', border: 'none', fontSize: '13px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", position: 'relative', zIndex: 1 }}>
                {locale === 'de' ? 'Schließen' : 'Close'}
              </button>
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
              style={{ width: '100%', maxWidth: '420px', background: card, border: `1px solid ${border}`, borderRadius: '28px', padding: '28px 24px 32px', maxHeight: '85vh', overflowY: 'auto' as const, position: 'relative' as const }}>

              <button onClick={() => setShowDna(false)} aria-label={locale === 'de' ? 'Schließen' : 'Close'}
                style={{ position: 'absolute' as const, top: '16px', right: '16px', width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${border}`, background: secondary, color: muted, fontSize: '14px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                ✕
              </button>

              {dnaLoading ? (
                <div style={{ textAlign: 'center' as const, padding: '40px 0' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: accent, margin: '0 auto 16px' }} />
                  <p style={{ fontSize: '14px', color: muted }}>{locale === 'de' ? 'KI analysiert deinen Stil...' : 'AI analyzing your style...'}</p>
                </div>
              ) : dna ? (
                <>
                  <div style={{ textAlign: 'center' as const, marginBottom: '24px', paddingRight: '32px' }}>
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
                <button onClick={() => { setMultiMode(false); setDetectedItems([]) }}
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
                        style={{ width: '100%', fontSize: '12px', fontWeight: 700, color: text, border: 'none', background: 'transparent', outline: 'none', marginBottom: '4px', fontFamily: "'Poppins', 'Inter', sans-serif", padding: 0 }} />
                      <input value={item.color} onChange={e => updateDetectedItem(i, 'color', e.target.value)}
                        style={{ width: '100%', fontSize: '11px', color: muted, border: 'none', background: 'transparent', outline: 'none', marginBottom: '4px', fontFamily: "'Poppins', 'Inter', sans-serif", padding: 0 }} />
                      <input value={item.brand ?? ''} onChange={e => updateDetectedItem(i, 'brand', e.target.value)}
                        placeholder={locale === 'de' ? 'Marke (optional)' : 'Brand (optional)'}
                        style={{ width: '100%', fontSize: '11px', color: accent, border: 'none', background: 'transparent', outline: 'none', fontFamily: "'Poppins', 'Inter', sans-serif", padding: 0 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ position: 'fixed' as const, bottom: 0, left: 0, right: 0, padding: '16px', background: bg, borderTop: `1px solid ${border}` }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={saveMultiItems}
                    disabled={multiSaving || detectedItems.filter(it => it.included).length === 0}
                    style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: multiSaving ? border : `linear-gradient(135deg, ${accent}, #6b9fff)`, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: multiSaving ? 'wait' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: multiSaving ? 'none' : `0 6px 24px ${accent}40` }}>
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
{/* Kein Kleidungsstück erkannt */}
      <AnimatePresence>
        {showNotClothingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowNotClothingModal(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: card, borderRadius: '24px', padding: '32px 24px', textAlign: 'center' as const, maxWidth: '340px', width: '100%', border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>

              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <QuestionIcon size={44} color={muted} />
              </div>

              <p style={{ fontSize: '17px', fontWeight: 800, color: text, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                {locale === 'de' ? 'Kein Kleidungsstück erkannt' : 'No clothing item detected'}
              </p>

              <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6, marginBottom: notClothingReason ? '8px' : '24px' }}>
                {locale === 'de'
                  ? 'Auf diesem Foto konnte die KI kein Kleidungsstück, Schuh oder Accessoire erkennen.'
                  : 'The AI couldn\'t detect a clothing item, shoe, or accessory in this photo.'}
              </p>

              {notClothingReason && (
                <p style={{ fontSize: '12px', color: muted, fontStyle: 'italic', marginBottom: '24px' }}>
                  {locale === 'de' ? 'Erkannt: ' : 'Detected: '}{notClothingReason}
                </p>
              )}

              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => { setShowNotClothingModal(false); fileInputRef.current?.click() }}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: `linear-gradient(135deg, ${accent}, #0891b2)`, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", marginBottom: '8px' }}>
                {locale === 'de' ? 'Anderes Foto versuchen' : 'Try another photo'}
              </motion.button>

              <button onClick={() => setShowNotClothingModal(false)}
                style={{ width: '100%', padding: '11px', background: 'transparent', border: 'none', fontSize: '13px', color: muted, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                {locale === 'de' ? 'Schließen' : 'Close'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}