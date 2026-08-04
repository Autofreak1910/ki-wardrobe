'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import AvatarPhotoGuide from '@/components/AvatarPhotoGuide'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShareIcon } from '@/components/ShareIcon'
import { motion, AnimatePresence } from 'framer-motion'
const DRESSING_ROOM_BG_URL = '/dressing-room-bg.jpg'
import UpgradeModal from '@/components/UpgradeModal'

function LockIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 018 0v4"/>
    </svg>
  )
}
function ImageIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  )
}
function CameraIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
function UploadIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
function ScissorsIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  )
}
function SearchIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function ShirtIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
    </svg>
  )
}
function WandIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M15 9h.01M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/>
    </svg>
  )
}
function PaletteIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 100 20 3 3 0 003-3 2 2 0 012-2h1a3 3 0 003-3c0-6-4-12-9-12z"/>
      <circle cx="7.5" cy="10.5" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/><circle cx="17" cy="11.5" r="1"/>
    </svg>
  )
}
function LightbulbIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6"/><path d="M10 22h4"/>
      <path d="M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1V17h6v-2.2c0-.8.4-1.6 1-2.1A7 7 0 0012 2z"/>
    </svg>
  )
}
function HourglassIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h12M6 22h12M6 2c0 5 12 5 12 10s-12 5-12 10M18 2c0 5-12 5-12 10s12 5 12 10"/>
    </svg>
  )
}
function SelfieIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <circle cx="12" cy="10" r="3"/>
      <path d="M8 18c0-2.2 1.8-4 4-4s4 1.8 4 4"/>
    </svg>
  )
}
function LinkIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  )
}
function StepIcon({ name, size = 56, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  switch (name) {
    case 'upload': return <UploadIcon size={size} color={color} />
    case 'scissors': return <ScissorsIcon size={size} color={color} />
    case 'search': return <SearchIcon size={size} color={color} />
    case 'shirt': return <ShirtIcon size={size} color={color} />
    case 'wand': return <WandIcon size={size} color={color} />
    case 'palette': return <PaletteIcon size={size} color={color} />
    case 'lightbulb': return <LightbulbIcon size={size} color={color} />
    case 'sparkle': return <span style={{ fontSize: size * 0.7, color, lineHeight: 1 }}>✦</span>
    case 'hourglass': return <HourglassIcon size={size} color={color} />
    default: return <UploadIcon size={size} color={color} />
  }
}
type ClothingItem = { id: string; image_url: string; category: string; color: string; name?: string; brand?: string }
function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    tops: 'shirt',
    hosen: 'long pants',
    kurze_hosen: 'shorts',
    roecke: 'skirt, a single flowing garment worn around the waist and hips with no separate leg openings',
    kleider: 'dress, a one-piece garment that covers the torso and continues down over the legs as a single connected piece',
    jacken: 'jacket',
    schuhe: 'shoes',
    acc: 'accessory',
  }
  return map[category] ?? category
}
function getCategoryTabLabel(category: string, locale: string): string {
  const de: Record<string, string> = { all: 'Alle', tops: 'Oberteil', hosen: 'Hose', kurze_hosen: 'Kurze Hose', jacken: 'Jacke', acc: 'Acc' }
  const en: Record<string, string> = { all: 'All', tops: 'Top', hosen: 'Pants', kurze_hosen: 'Shorts', jacken: 'Jacket', acc: 'Acc' }
  const map = locale === 'de' ? de : en
  return map[category] ?? category
}
function getMonthStartUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
}
function getWeekStartUTC(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const diffToMonday = (day === 0 ? -6 : 1) - day
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday, 0, 0, 0, 0))
}

function getNextWeekResetLabel(locale: string): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diffToNextMonday = day === 0 ? 1 : 8 - day
  const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToNextMonday, 0, 0, 0, 0))
  return nextMonday.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function createWatermarkedImage(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const w = canvas.width
      const h = canvas.height
      const fontSize = Math.max(20, Math.round(w * 0.09))
      ctx.font = `700 ${fontSize}px 'Poppins', sans-serif`
      ctx.fillStyle = 'rgba(0,0,0,0.10)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate(-18 * Math.PI / 180)
      ctx.fillText('✦ KiWardrobe', 0, 0)
      ctx.restore()

      resolve(canvas.toDataURL('image/jpeg', 0.94))
    }
    img.onerror = () => reject(new Error('watermark image load failed'))
    img.src = imageUrl
  })
}

async function cutoutPersonFromResult(imageUrl: string): Promise<string> {
  const res = await fetch('/api/remove-background', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  })
  const data = await res.json()
  if (data.success && data.imageUrl) return data.imageUrl
  throw new Error('cutout failed')
}

function compositeOnDressingRoom(avatarUrl: string, bgUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return reject(new Error('No canvas context'))

    const bg = new Image()
    bg.onload = () => {
      canvas.width = bg.width
      canvas.height = bg.height
      ctx.drawImage(bg, 0, 0)

      const avatarImg = new Image()
      avatarImg.crossOrigin = 'anonymous'
      avatarImg.onload = () => {
        const FLOOR_Y_FRACTION = 0.98
        const AVATAR_HEIGHT_FRACTION = 0.95
        const CENTER_X_FRACTION = 0.5

        const avatarHeight = canvas.height * AVATAR_HEIGHT_FRACTION
        const avatarWidth = avatarHeight * (avatarImg.width / avatarImg.height)
        const floorY = canvas.height * FLOOR_Y_FRACTION
        const drawX = canvas.width * CENTER_X_FRACTION - avatarWidth / 2
        const drawY = floorY - avatarHeight

        ctx.drawImage(avatarImg, drawX, drawY, avatarWidth, avatarHeight)
        resolve(canvas.toDataURL('image/jpeg', 0.92))
      }
      avatarImg.onerror = reject
      avatarImg.src = avatarUrl
    }
    bg.onerror = reject
    bg.src = bgUrl
  })
}
async function createShareCard(selfieUrl: string, resultUrl: string, locale: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const selfieImg = new Image()
    const resultImg = new Image()
    selfieImg.crossOrigin = 'anonymous'
    resultImg.crossOrigin = 'anonymous'

    let loaded = 0
    function onBothLoaded() {
      loaded++
      if (loaded < 2) return

      const W = 1080
      const H = 1350
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')!

      const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
      bgGrad.addColorStop(0, '#1D1D20')
      bgGrad.addColorStop(1, '#355C7D')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 52px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('KiWardrobe', W / 2, 90)
      ctx.font = '28px sans-serif'
      ctx.fillStyle = '#F1B951'
      ctx.fillText(locale === 'de' ? '✦ Virtual Try-On' : '✦ Virtual Try-On', W / 2, 130)

      const imgTop = 170
      const imgHeight = H - imgTop - 160
      const gap = 16
      const halfW = (W - gap - 80) / 2
      const leftX = 40
      const rightX = leftX + halfW + gap

      function drawCover(img: HTMLImageElement, x: number, y: number, w: number, h: number) {
        const imgRatio = img.width / img.height
        const boxRatio = w / h
        let sx = 0, sy = 0, sw = img.width, sh = img.height
        if (imgRatio > boxRatio) {
          sw = img.height * boxRatio
          sx = (img.width - sw) / 2
        } else {
          sh = img.width / boxRatio
          sy = (img.height - sh) / 2
        }
        ctx.save()
        const radius = 24
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.arcTo(x + w, y, x + w, y + h, radius)
        ctx.arcTo(x + w, y + h, x, y + h, radius)
        ctx.arcTo(x, y + h, x, y, radius)
        ctx.arcTo(x, y, x + w, y, radius)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
        ctx.restore()
      }

      drawCover(selfieImg, leftX, imgTop, halfW, imgHeight)
      drawCover(resultImg, rightX, imgTop, halfW, imgHeight)

      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(leftX, imgTop + imgHeight - 50, halfW, 50)
      ctx.fillRect(rightX, imgTop + imgHeight - 50, halfW, 50)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(locale === 'de' ? 'VORHER' : 'BEFORE', leftX + halfW / 2, imgTop + imgHeight - 16)
      ctx.fillText(locale === 'de' ? 'NACHHER' : 'AFTER', rightX + halfW / 2, imgTop + imgHeight - 16)

      ctx.fillStyle = '#F1B951'
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText('→', W / 2, imgTop + imgHeight / 2 + 14)

      ctx.fillStyle = '#c9c5bb'
      ctx.font = '24px sans-serif'
      ctx.fillText(
        locale === 'de' ? 'Probier deine Klamotten virtuell an ✦' : 'Try on your clothes virtually ✦',
        W / 2, H - 90
      )
      ctx.fillStyle = '#F1B951'
      ctx.font = 'bold 26px sans-serif'
      ctx.fillText('kiwardrobe-app.vercel.app', W / 2, H - 50)

      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    selfieImg.onload = onBothLoaded
    resultImg.onload = onBothLoaded
    selfieImg.onerror = () => reject(new Error('selfie load failed'))
    resultImg.onerror = () => reject(new Error('result load failed'))
    selfieImg.src = selfieUrl
    resultImg.src = resultUrl
  })
}

// Modul-Level-Cache -- ueberlebt Seitenwechsel, kein Blank-Screen mehr beim erneuten Besuch
let avatarCache: { profile: any; items: ClothingItem[]; savedSelfies: { id: string; image_url: string; leg_type?: string | null }[] } | null = null

export default function AvatarPage() {
  const [errorTips, setErrorTips] = useState<string[] | null>(null)
  const [profile, setProfile] = useState<any>(avatarCache?.profile ?? null)
  const [items, setItems] = useState<ClothingItem[]>(avatarCache?.items ?? [])
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [processedResult, setProcessedResult] = useState<string | null>(null)
  const [compositing, setCompositing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(!avatarCache)
  const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [genStep, setGenStep] = useState('')
  const [genProgress, setGenProgress] = useState(0)
  const [genIcon, setGenIcon] = useState('upload')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [galleryAvatars, setGalleryAvatars] = useState<{ id: string; image_url: string; created_at: string }[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [galleryFullscreen, setGalleryFullscreen] = useState<string | null>(null)
  const [showPhotoGuide, setShowPhotoGuide] = useState(false)
  const [savedSelfies, setSavedSelfies] = useState<{ id: string; image_url: string; leg_type?: string | null }[]>(avatarCache?.savedSelfies ?? [])
  const [savingSelfie, setSavingSelfie] = useState(false)
  const [justUploadedNew, setJustUploadedNew] = useState(false)
  const [activeTryOnCategory, setActiveTryOnCategory] = useState('all')
  const [showAllTryOnItems, setShowAllTryOnItems] = useState(false)
  const [lockedItemPopup, setLockedItemPopup] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { theme } = useTheme()
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
  const sageGradient = 'linear-gradient(135deg, #7FA98E, #355C7D)'

  useEffect(() => { loadData() }, [])

  async function loadSavedSelfies() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data } = await supabase
        .from('saved_selfies')
        .select('id, image_url, leg_type')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setSavedSelfies(data ?? [])
      avatarCache = { ...(avatarCache ?? { profile: null, items: [], savedSelfies: [] }), savedSelfies: data ?? [] }
    } catch (err) {
      console.error('Load saved selfies failed:', err)
    }
  }

  async function saveSelfieToGallery() {
    if (!selfie) return
    setSavingSelfie(true)
    try {
      const res = await fetch('/api/saved-selfies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selfie }),
      })
      const data = await res.json()
      console.log('Save selfie response:', res.status, data)
      if (data.success) {
        setJustUploadedNew(false)
        await loadSavedSelfies()
      } else {
        alert('Speichern fehlgeschlagen: ' + (data.error ?? 'unbekannter Fehler'))
      }
    } catch (err) {
      console.error('Save selfie failed:', err)
      alert('Speichern fehlgeschlagen: ' + String(err))
    }
    setSavingSelfie(false)
  }

  async function deleteSavedSelfie(id: string) {
    try {
      await fetch('/api/saved-selfies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setSavedSelfies(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Delete saved selfie failed:', err)
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('kw_avatar_guide_seen')) {
      const t = setTimeout(() => setShowPhotoGuide(true), 500)
      return () => clearTimeout(t)
    }
  }, [])

  function closePhotoGuide() {
    localStorage.setItem('kw_avatar_guide_seen', 'true')
    setShowPhotoGuide(false)
  }

  useEffect(() => {
    if (!result) { setProcessedResult(null); setCompositing(false); return }
    let cancelled = false
    setCompositing(true)
    ;(async () => {
      try {
        const cutout = await cutoutPersonFromResult(result)
        const composed = await compositeOnDressingRoom(cutout, DRESSING_ROOM_BG_URL)
        if (!cancelled) setProcessedResult(composed)
      } catch (err) {
        console.error('Dressing room composite failed, falling back to raw result:', err)
        if (!cancelled) setProcessedResult(null)
      } finally {
        if (!cancelled) setCompositing(false)
      }
    })()
    return () => { cancelled = true }
  }, [result])

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
      const [profileRes, itemsRes, selfiesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('clothing_items').select('*').eq('user_id', session.user.id),
        supabase.from('saved_selfies').select('id, image_url, leg_type').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      ])
      let freshProfile: any = null
      if (profileRes.data) {
        const { data: stillPremium } = await supabase.rpc('check_and_expire_premium', { p_user_id: session.user.id })
        const periodStart = stillPremium ? getWeekStartUTC() : getMonthStartUTC()
        const { count } = await supabase.from('avatar_results')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .gte('created_at', periodStart.toISOString()) as any
        const LIMIT = stillPremium ? 6 : 2
        freshProfile = { ...profileRes.data, is_premium: stillPremium ?? false, used_this_period: count ?? 0, period_limit: LIMIT }
        setProfile(freshProfile)
      }
      if (itemsRes.data) setItems(itemsRes.data)
      if (selfiesRes.data) setSavedSelfies(selfiesRes.data)
      avatarCache = { profile: freshProfile, items: itemsRes.data ?? [], savedSelfies: selfiesRes.data ?? [] }
    } catch (err) {
      console.error('loadData failed:', err)
    } finally {
      setPageLoading(false)
    }
  }

  async function openGallery() {
    if (!isPremium) { setShowUpgrade(true); return }
    setShowGallery(true)
    setGalleryLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setGalleryLoading(false); return }
    const { data } = await supabase
      .from('avatar_results')
      .select('id, image_url, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    setGalleryAvatars(data ?? [])
    setGalleryLoading(false)
  }

  function handleSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        setSelfie(canvas.toDataURL('image/jpeg', 0.9))
        setJustUploadedNew(true)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  function checkLegConflict(selfieLegType: string | null | undefined, itemCategory: string | undefined): string | null {
    const needsShortLegs = itemCategory === 'roecke' || itemCategory === 'kurze_hosen'
    if (needsShortLegs && selfieLegType === 'long_pants') {
      return locale === 'de'
        ? 'Dieses Foto zeigt eine lange Hose. Für Röcke/kurze Hosen brauchst du ein Foto ohne lange Hose.'
        : 'This photo shows long pants. For skirts/shorts you need a photo without long pants.'
    }
    return null
  }

  async function generateAvatar() {
    if (!selfie || !selectedItem) return
    setLoading(true)
    window.dispatchEvent(new CustomEvent('kw-generating', { detail: true }))
    setError(null)
    setResult(null)
    setErrorTips(null)
    setGenProgress(0)

    const steps = locale === 'de' ? [
      { at: 0,  label: 'Foto wird hochgeladen...', icon: 'upload' },
      { at: 12, label: 'Hintergrund wird entfernt...', icon: 'scissors' },
      { at: 25, label: 'Foto wird geprüft...', icon: 'search' },
      { at: 38, label: 'KI zieht dir das Outfit an...', icon: 'shirt' },
      { at: 52, label: 'Falten werden geglättet...', icon: 'wand' },
      { at: 64, label: 'Farben werden abgestimmt...', icon: 'palette' },
      { at: 76, label: 'Licht wird angepasst...', icon: 'lightbulb' },
      { at: 87, label: 'Letzte Details...', icon: 'sparkle' },
      { at: 94, label: 'Fast fertig...', icon: 'hourglass' },
    ] : [
      { at: 0,  label: 'Uploading photo...', icon: 'upload' },
      { at: 12, label: 'Removing background...', icon: 'scissors' },
      { at: 25, label: 'Checking photo quality...', icon: 'search' },
      { at: 38, label: 'AI is dressing you...', icon: 'shirt' },
      { at: 52, label: 'Smoothing out wrinkles...', icon: 'wand' },
      { at: 64, label: 'Matching the colors...', icon: 'palette' },
      { at: 76, label: 'Adjusting the lighting...', icon: 'lightbulb' },
      { at: 87, label: 'Final touches...', icon: 'sparkle' },
      { at: 94, label: 'Almost there...', icon: 'hourglass' },
    ]
    setGenStep(steps[0].label)
    setGenIcon(steps[0].icon)
    const interval = setInterval(() => {
      setGenProgress(p => {
        const next = Math.min(p + Math.random() * 1.2 + 0.4, 95)
        const current = [...steps].reverse().find(s => next >= s.at)
        if (current) { setGenStep(current.label); setGenIcon(current.icon) }
        return next
      })
    }, 1800)

    try {
      const res = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage: selfie,
          garmentImage: selectedItem.image_url,
          garmentDescription: `${selectedItem.color} ${getCategoryLabel(selectedItem.category)}`,
          category: selectedItem.category,
        })
      })
      const data = await res.json()

      if (data.error === 'monthly_limit') {
        clearInterval(interval)
        setError(locale === 'de' ? 'Du hast deine 2 kostenlosen Avatare diesen Monat aufgebraucht. Upgrade auf Pro!' : 'You used your 2 free avatars this month. Upgrade to Pro!')
        setLoading(false); setGenProgress(0)
        window.dispatchEvent(new CustomEvent('kw-generating', { detail: false }))
        return
      }
      if (data.error === 'weekly_limit') {
        clearInterval(interval)
        setError(locale === 'de' ? 'Du hast diese Woche bereits 6 Avatare erstellt. Nächste Woche wieder!' : 'You already created 6 avatars this week. Come back next week!')
        setLoading(false); setGenProgress(0)
        window.dispatchEvent(new CustomEvent('kw-generating', { detail: false }))
        return
      }
      if (data.error === 'long_pants_conflict') {
        clearInterval(interval)
        setError(locale === 'de'
          ? 'Für Röcke & kurze Hosen brauchst du ein Foto ohne lange Hose'
          : "For skirts & shorts you need a photo without long pants")
        setErrorTips(locale === 'de' ? [
          'Trag im Foto selbst schon eine kurze Hose, einen Rock oder zeig einfach nackte Beine',
          'So kann die KI die alte Hose nicht "durchscheinen" lassen',
          'Für lange Hosen/Tops/Jacken funktioniert dein bisheriges Foto weiterhin normal',
        ] : [
          'In the photo, already wear shorts, a skirt, or show bare legs',
          "This way the AI can't let the old pants show through",
          'Your current photo still works fine for long pants/tops/jackets',
        ])
        setLoading(false); setGenProgress(0)
        window.dispatchEvent(new CustomEvent('kw-generating', { detail: false }))
        return
      }
      if (data.error === 'bad_selfie') {
        clearInterval(interval)
        setError(locale === 'de' ? 'Dein Foto eignet sich nicht gut für Try-On' : "Your photo isn't well suited for try-on")
        setErrorTips(locale === 'de' ? [
          'Handy hinstellen (z.B. anlehnen) statt in der Hand halten',
          'Ein paar Schritte zurücktreten, ganzer Körper muss sichtbar sein',
          'Gerade und aufrecht stehen, kein Winkel von oben/unten',
          'Helles, gleichmäßiges Licht — keine Rückenbeleuchtung',
          'Einfacher, ruhiger Hintergrund ohne viel Durcheinander',
        ] : [
          'Prop your phone up instead of holding it',
          'Step back a few steps — your whole body needs to be visible',
          'Stand straight, no angle from above or below',
          'Bright, even lighting — avoid backlighting',
          'Simple, uncluttered background',
        ])
        setLoading(false); setGenProgress(0)
        window.dispatchEvent(new CustomEvent('kw-generating', { detail: false }))
        return
      }
      if (!data.pending || !data.requestId) {
        clearInterval(interval)
        setError(locale === 'de' ? 'Fehler beim Generieren' : 'Error generating')
        setLoading(false); setGenProgress(0)
        window.dispatchEvent(new CustomEvent('kw-generating', { detail: false }))
        return
      }

      const requestId = data.requestId
      const model = data.model
      let finalData: any = null

      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000))
        const statusRes = await fetch(`/api/generate-avatar/status?requestId=${encodeURIComponent(requestId)}&model=${encodeURIComponent(model)}`)
        const statusData = await statusRes.json()

        if (statusData.success) { finalData = statusData; break }
        if (statusData.error) throw new Error(statusData.error)
      }

      clearInterval(interval)
      setGenProgress(100)
      setGenStep(locale === 'de' ? 'Fertig!' : 'Done!')

      if (finalData?.success) {
        setResult(finalData.imageUrl)
        await loadData()
      } else {
        setError(locale === 'de' ? 'Generierung hat zu lange gedauert, bitte nochmal versuchen' : 'Generation took too long, please try again')
      }
    } catch {
      clearInterval(interval)
      setError(locale === 'de' ? 'Fehler beim Generieren' : 'Error generating')
    }
    setLoading(false)
    setGenProgress(0)
    window.dispatchEvent(new CustomEvent('kw-generating', { detail: false }))
  }
  const selectedSelfieLegType = selfie ? (savedSelfies.find(s => s.image_url === selfie)?.leg_type ?? null) : null
  const isPremium = profile?.is_premium ?? false
  const usedThisPeriod = profile?.used_this_period ?? 0
  const periodLimit = profile?.period_limit ?? (isPremium ? 6 : 2)
  const triesLeft = periodLimit - usedThisPeriod
  const canGenerate = triesLeft > 0

  if (pageLoading) return (
    <div style={{ height: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    </div>
  )

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'Poppins', 'Inter', sans-serif", position: 'relative' as const, backgroundImage: isDark ? 'none' : 'radial-gradient(circle, rgba(29,29,32,0.06) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>

      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: isDark ? 'rgba(92,130,160,0.08)' : 'rgba(53,92,125,0.06)', filter: 'blur(90px)' }} />
      </div>


      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '68px 0 170px', position: 'relative', zIndex: 1 }}>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ position: 'relative' as const, height: '220px', marginBottom: '0', overflow: 'hidden', borderRadius: '0 0 28px 28px' }}>
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80&auto=format&fit=crop"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', position: 'absolute', inset: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 0%, transparent 50%, ${bg} 100%)`, maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)' }} />
          <div style={{ position: 'absolute', inset: '40% 0 0 0', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.25)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 100%)' }} />

          <div style={{ position: 'absolute' as const, bottom: '20px', left: '20px', zIndex: 2 }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '4px', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
              Virtual Try-On
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
              {locale === 'de' ? 'Probiere Klamotten virtuell an deinem Foto an' : 'Try clothes on your photo virtually'}
            </p>
          </div>
        </motion.div>
        <div style={{ padding: '12px 20px 0', marginBottom: '14px', display: 'flex', gap: '8px', overflowX: 'auto' as const }}>
          {isPremium ? (
            <div style={{ flexShrink: 0, background: goldAccent, borderRadius: '100px', padding: '8px 14px', boxShadow: '0 4px 12px rgba(241,185,81,0.35)' }}>
              <p style={{ fontSize: '11.5px', fontWeight: 700, color: '#1D1D20', whiteSpace: 'nowrap' as const }}>✦ PRO · {usedThisPeriod}/{periodLimit} {locale === 'de' ? 'Woche' : 'week'}</p>
            </div>
          ) : (
            <div style={{ flexShrink: 0, background: card, border: `1px solid ${border}`, borderRadius: '100px', padding: '8px 14px' }}>
              <p style={{ fontSize: '11.5px', fontWeight: 700, color: text, whiteSpace: 'nowrap' as const }}>{usedThisPeriod}/{periodLimit} {locale === 'de' ? 'Monat' : 'month'}</p>
            </div>
          )}
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowPhotoGuide(true)}
            style={{ flexShrink: 0, background: card, border: `1px solid ${border}`, borderRadius: '100px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <CameraIcon size={13} color={text} />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: text, whiteSpace: 'nowrap' as const }}>
              {locale === 'de' ? 'Photo Guide' : 'Photo Guide'}
            </span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={openGallery}
            style={{ flexShrink: 0, background: card, border: `1px solid ${border}`, borderRadius: '100px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: isPremium ? 1 : 0.85 }}>
            {isPremium ? <ImageIcon size={13} color={text} /> : <LockIcon size={13} color={text} />}
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: text, whiteSpace: 'nowrap' as const }}>
              {locale === 'de' ? 'My Avatars' : 'My Avatars'}
            </span>
          </motion.button>
        </div>


        <div style={{ padding: '0 20px' }}>
          {!canGenerate && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => { if (!isPremium) setShowUpgrade(true) }}
              style={{ background: isPremium ? accentDim : sageGradient, borderRadius: '14px', padding: '12px 16px', marginBottom: '16px', cursor: isPremium ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LockIcon size={18} color={isPremium ? accent : '#fff'} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: isPremium ? accent : '#fff' }}>
                  {isPremium
                    ? (locale === 'de' ? 'Wochenlimit erreicht' : 'Weekly limit reached')
                    : (locale === 'de' ? 'Keine Versuche mehr — Jetzt freischalten →' : 'No tries left — Pro for €4.99/mo →')}
                </p>
                {isPremium && (
                  <p style={{ fontSize: '11px', color: muted }}>
                    {locale === 'de' ? `Wird am ${getNextWeekResetLabel(locale)} zurückgesetzt` : `Resets on ${getNextWeekResetLabel(locale)}`}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'transparent', marginBottom: '12px', padding: '0 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
            {locale === 'de' ? 'Schritt 1 · Dein Foto' : 'Step 1 · Your Photo'}
          </p>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: isDark ? 'none' : '0 2px 8px rgba(29,29,32,0.04)', position: 'relative' as const, opacity: canGenerate ? 1 : 0.5, pointerEvents: canGenerate ? 'auto' : 'none' as const }}>
            {!canGenerate && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(29,29,32,0.4)' : 'rgba(255,255,255,0.4)' }}>
                <LockIcon size={28} color={text} />
              </div>
            )}
            <div style={{ padding: '12px' }}>
              {!selfie ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    <AnimatePresence mode="popLayout">
                      {savedSelfies.map(s => (
                        <motion.div key={s.id} layout
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                          style={{ position: 'relative' as const, aspectRatio: '1', maxWidth: '90px' }}>
                          <motion.div whileTap={{ scale: 0.93 }} onClick={() => {
                              const conflict = checkLegConflict(s.leg_type, selectedItem?.category)
                              if (conflict) { setError(conflict); return }
                              setError(null)
                              setSelfie(s.image_url); setJustUploadedNew(false)
                            }}
                            style={{ width: '100%', height: '100%', borderRadius: '14px', overflow: 'hidden', border: `1.5px solid ${border}`, cursor: 'pointer', position: 'relative' as const }}>
                            <img src={s.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {s.leg_type === 'long_pants' && (
                              <div style={{ position: 'absolute', bottom: '2px', left: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '2px 4px' }}>
                                <p style={{ fontSize: '8px', color: '#fff', textAlign: 'center' as const, fontWeight: 600 }}>👖 {locale === 'de' ? 'lange Hose' : 'long pants'}</p>
                              </div>
                            )}
                          </motion.div>
                          <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); deleteSavedSelfie(s.id) }}
                            style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', color: '#fff', cursor: 'pointer', fontSize: '10px', lineHeight: 1 }}>
                            ×
                          </motion.button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <motion.div layout whileTap={{ scale: 0.93 }} onClick={() => fileRef.current?.click()}
                      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                      style={{ aspectRatio: '1', maxWidth: '90px', borderRadius: '14px', border: `1.5px dashed ${border}`, background: accentDim, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}>
                      <SelfieIcon size={20} color={accent} />
                      <span style={{ fontSize: '9px', fontWeight: 700, color: accent, textAlign: 'center' as const, lineHeight: 1.2, padding: '0 4px' }}>
                        {locale === 'de' ? 'Neu' : 'New'}
                      </span>
                    </motion.div>
                  </div>
                  <p style={{ fontSize: '11px', color: muted, textAlign: 'center' as const, marginTop: '8px' }}>
                    {savedSelfies.length > 0
                      ? (locale === 'de' ? 'Selfie antippen oder neues hochladen' : 'Tap a selfie or upload a new one')
                      : (locale === 'de' ? 'Ganzkörper Foto für beste Ergebnisse' : 'Full body photo for best results')}
                  </p>
                  <div style={{ background: accentDim, borderRadius: '10px', padding: '8px 10px', marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', flexShrink: 0 }}>💡</span>
                    <p style={{ fontSize: '10.5px', color: accent, lineHeight: 1.5, fontWeight: 600 }}>
                      {locale === 'de'
                        ? 'Für Rock & kurze Hose: Foto mit freien Beinen hochladen (Rock oder kurze Hose tragen). Für alles andere (lange Hose, Oberteil, Jacke) geht jedes Foto.'
                        : 'For skirts & shorts: upload a photo with bare legs (wearing a skirt or shorts). For everything else (long pants, tops, jackets), any photo works.'}
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative' as const, flexShrink: 0 }}>
                      <img src={selfie} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: `1.5px solid ${border}`, display: 'block' }} />
                      <button onClick={() => { setSelfie(null); setJustUploadedNew(false) }}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', color: '#fff', cursor: 'pointer', fontSize: '10px', lineHeight: 1 }}>
                        ×
                      </button>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: text, marginBottom: '2px' }}>
                        {locale === 'de' ? '✓ Foto ausgewählt' : '✓ Photo selected'}
                      </p>
                      <p style={{ fontSize: '11px', color: muted }}>
                        {locale === 'de' ? 'Weiter zu Schritt 2' : 'Continue to step 2'}
                      </p>
                    </div>
                  </div>
                  {justUploadedNew && savedSelfies.length < 3 && (
                    <button onClick={saveSelfieToGallery} disabled={savingSelfie}
                      style={{ width: '100%', marginTop: '10px', padding: '10px', background: accentDim, border: `1px solid ${border}`, borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, color: accent, cursor: savingSelfie ? 'wait' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                      {savingSelfie
                        ? (locale === 'de' ? 'Wird gespeichert...' : 'Saving...')
                        : (locale === 'de' ? `↓ Selfie merken (${savedSelfies.length}/3)` : `↓ Save selfie (${savedSelfies.length}/3)`)}
                    </button>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleSelfie} style={{ display: 'none' }} />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: 'transparent', marginBottom: '12px', padding: '0 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
            {locale === 'de' ? 'Schritt 2 · Kleidung wählen' : 'Step 2 · Choose clothing'}
          </p>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: isDark ? 'none' : '0 2px 8px rgba(29,29,32,0.04)', position: 'relative' as const, opacity: canGenerate ? 1 : 0.5, pointerEvents: canGenerate ? 'auto' : 'none' as const }}>
            {!canGenerate && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(29,29,32,0.4)' : 'rgba(255,255,255,0.4)' }}>
                <LockIcon size={28} color={text} />
              </div>
            )}
            <div style={{ padding: '16px' }}>
              {items.length === 0 ? (
                <p style={{ fontSize: '13px', color: muted, textAlign: 'center' as const }}>
                  {locale === 'de' ? 'Keine Kleidung im Schrank' : 'No clothes in wardrobe'}
                </p>
              ) : (
                <>
                  {(() => {
                    const tryOnItems = items.filter(item => item.category !== 'schuhe')
                    const availableCategories = Array.from(new Set(tryOnItems.map(i => i.category)))
                    const tabs = ['all', ...availableCategories]
                    return (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto' as const, paddingBottom: '2px' }}>
                        {tabs.map(cat => {
                          const isOn = activeTryOnCategory === cat
                          return (
                            <button key={cat} onClick={() => { setActiveTryOnCategory(cat); setShowAllTryOnItems(false) }}
                              style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '100px', border: `1px solid ${isOn ? accent : border}`, background: isOn ? accentDim : 'transparent', color: isOn ? accent : muted, fontSize: '12px', fontWeight: isOn ? 700 : 500, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", whiteSpace: 'nowrap' as const }}>
                              {getCategoryTabLabel(cat, locale)}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {(() => {
                    const filteredTryOnItems = items.filter(item => item.category !== 'schuhe' && (activeTryOnCategory === 'all' || item.category === activeTryOnCategory))
                    const visibleItems = showAllTryOnItems ? filteredTryOnItems : filteredTryOnItems.slice(0, 3)
                    return (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                          {visibleItems.map(item => {
                            const isLocked = (item.category === 'roecke' || item.category === 'kurze_hosen') && selectedSelfieLegType === 'long_pants'
                            return (
                            <motion.div key={item.id} whileTap={!isLocked ? { scale: 0.96 } : {}}
                              onClick={() => {
                                if (isLocked) {
                                  setLockedItemPopup(item.id)
                                  return
                                }
                                const newItem = selectedItem?.id === item.id ? null : item
                                setError(null)
                                setSelectedItem(newItem)
                              }}
                              style={{ background: card, borderRadius: '16px', overflow: 'hidden', border: `1.5px solid ${selectedItem?.id === item.id ? accent : border}`, cursor: isLocked ? 'not-allowed' : 'pointer', position: 'relative' as const, padding: '6px', boxShadow: selectedItem?.id === item.id ? `0 4px 16px ${accent}25` : 'none', opacity: isLocked ? 0.4 : 1 }}>
                              <div style={{ borderRadius: '10px', overflow: 'hidden' }}>
                                <img src={item.image_url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', filter: isLocked ? 'grayscale(1)' : 'none' }} />
                              </div>
                              {isLocked && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <LockIcon size={22} color="#fff" />
                                </div>
                              )}
                              <AnimatePresence>
                                {isLocked && lockedItemPopup === item.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', width: '210px', background: isDark ? '#1D1D20' : '#24211B', borderRadius: '12px', padding: '10px 12px', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
                                    <p style={{ fontSize: '11.5px', color: '#fff', lineHeight: 1.5, fontWeight: 600, marginBottom: '6px' }}>
                                      {locale === 'de'
                                        ? '👖 Du brauchst ein Foto, wo deine Beine zu sehen sind — also einen Rock oder eine kurze Hose tragen.'
                                        : "👖 You need a photo where your legs are visible — wearing a skirt or shorts."}
                                    </p>
                                    <button onClick={(e) => { e.stopPropagation(); setLockedItemPopup(null) }}
                                      style={{ fontSize: '10.5px', fontWeight: 700, color: '#F1B951', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                                      {locale === 'de' ? 'Verstanden' : 'Got it'}
                                    </button>
                                    <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `6px solid ${isDark ? '#1D1D20' : '#24211B'}` }} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              {!isLocked && selectedItem?.id === item.id && (
                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: accent, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>✓</div>
                              )}
                            </motion.div>
                            )
                          })}
                        </div>
                        {filteredTryOnItems.length > 3 && (
                          <button onClick={() => setShowAllTryOnItems(v => !v)}
                            style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'transparent', border: `1px solid ${border}`, borderRadius: '10px', fontSize: '12.5px', fontWeight: 600, color: accent, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                            {showAllTryOnItems
                              ? (locale === 'de' ? '▲ Weniger anzeigen' : '▲ Show less')
                              : (locale === 'de' ? `▼ Alle ${filteredTryOnItems.length} anzeigen` : `▼ Show all ${filteredTryOnItems.length}`)}
                          </button>
                        )}
                      </>
                    )
                  })()}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {error && (
          <div style={{ padding: '0 20px' }}>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : '#fecaca'}`, borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: errorTips ? '10px' : 0 }}>
                <CameraIcon size={18} color="#ef4444" />
                <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600, lineHeight: 1.5 }}>{error}</p>
              </div>

              {errorTips && (
                <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', borderRadius: '10px', padding: '12px 14px', marginTop: '4px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: text, marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LightbulbIcon size={12} color={text} /> {locale === 'de' ? "So klappt's besser" : 'Tips for better results'}
                  </p>
                  {errorTips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: i < errorTips.length - 1 ? '6px' : 0 }}>
                      <span style={{ color: accent, fontSize: '13px', fontWeight: 700 }}>✓</span>
                      <span style={{ fontSize: '12.5px', color: muted, lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
              {error.includes('Upgrade') && (
                <button onClick={() => setShowUpgrade(true)}
                  style={{ marginTop: '10px', background: accent, border: 'none', borderRadius: '8px', padding: '8px 16px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                  ✦ Jetzt freischalten →
                </button>
              )}
            </motion.div>
          </div>
        )}

        <div style={{ padding: '0 20px' }}>
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, background: accentDim, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                    ✦ {locale === 'de' ? 'Dein Avatar' : 'Your Avatar'}
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const watermarked = await createWatermarkedImage(processedResult ?? result)
                        const blob = await (await fetch(watermarked)).blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = 'kiwardrobe-avatar.jpg'
                        a.click()
                        URL.revokeObjectURL(url)
                      } catch {
                        window.open(result, '_blank')
                      }
                    }}
                    style={{ fontSize: '11px', fontWeight: 600, color: accent, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                    {locale === 'de' ? '↓ Speichern' : '↓ Save'}
                  </button>
                </div>

                <div style={{ position: 'relative' as const, borderRadius: '10px', overflow: 'hidden' }}>
                  {compositing ? (
                    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '360px', gap: '14px', background: isDark ? '#0f1a14' : '#f4f1ea' }}>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ display: 'block', width: '34px', height: '34px', borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: accent }} />
                      <p style={{ fontSize: '13px', color: muted, fontWeight: 600 }}>
                        {locale === 'de' ? 'Du wirst in die Umkleide gestellt...' : 'Placing you in the fitting room...'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <img
                        src={processedResult ?? result}
                        style={{ width: '100%', display: 'block', maxHeight: '480px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const div = document.createElement('div')
                          div.style.padding = '20px'
                          div.style.textAlign = 'center'
                          div.style.color = accent
                          div.innerHTML = `<a href="${result}" target="_blank" style="color:${accent};font-weight:600">${locale === 'de' ? 'Bild öffnen →' : 'Open image →'}</a>`
                          e.currentTarget.parentNode?.appendChild(div)
                        }}
                      />
                      <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-18deg)', fontSize: '22px', fontWeight: 700, color: 'rgba(0,0,0,0.10)', letterSpacing: '0.02em', whiteSpace: 'nowrap' as const, pointerEvents: 'none' as const }}>✦ KiWardrobe</p>
                    </>
                  )}
                </div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={async () => {
                      if (!selfie || !result) return
                      setSharing(true)
                      try {
                        const cardDataUrl = await createShareCard(selfie, processedResult ?? result, locale)
                        const blob = await (await fetch(cardDataUrl)).blob()
                        const file = new File([blob], 'kiwardrobe-vorher-nachher.jpg', { type: 'image/jpeg' })
                        if (navigator.share && navigator.canShare?.({ files: [file] })) {
                          await navigator.share({
                            files: [file],
                            title: 'KiWardrobe',
                            text: locale === 'de' ? 'Schau wie ich in diesem Outfit aussehe! ✦ KiWardrobe' : 'Check out how I look in this outfit! ✦ KiWardrobe',
                          })
                        } else {
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'kiwardrobe-vorher-nachher.jpg'
                          a.click()
                          URL.revokeObjectURL(url)
                        }
                      } catch (err) {
                        console.error('Share card failed:', err)
                      }
                      setSharing(false)
                    }}
                    style={{ width: '100%', background: sageGradient, border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {sharing ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          style={{ display: 'block', width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
                        {locale === 'de' ? 'Erstelle...' : 'Creating...'}
                      </>
                    ) : (
                      <><ShareIcon size={15} color="#fff" /> {locale === 'de' ? 'Vorher/Nachher teilen' : 'Share before/after'}</>
                    )}
                  </motion.button>
                  <button
                    onClick={() => window.open(result, '_blank')}
                    style={{ width: '100%', background: accentDim, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600, color: accent, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <LinkIcon size={13} color={accent} /> {locale === 'de' ? 'In neuem Tab öffnen' : 'Open in new tab'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>
      <div style={{ position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom))', left: 0, right: 0, zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px', pointerEvents: 'auto' }}>
          <div style={{ background: isDark ? 'rgba(22,22,22,0.96)' : 'rgba(253,252,249,0.96)', backdropFilter: 'blur(14px)', border: `1px solid ${border}`, borderRadius: '20px', padding: '10px', boxShadow: '0 8px 28px rgba(0,0,0,0.14)' }}>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={generateAvatar}
              disabled={loading || !selfie || !selectedItem || !canGenerate}
              style={{ width: '100%', padding: '16px', background: sageGradient, border: 'none', borderRadius: '100px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: loading ? 'wait' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: '0 8px 24px rgba(53,92,125,0.3)', transition: 'all 0.2s', opacity: (!selfie || !selectedItem || !canGenerate) ? 0.6 : 1 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'block', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
                  {locale === 'de' ? 'Wird generiert...' : 'Generating...'}
                </span>
              ) : !canGenerate ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <LockIcon size={15} color="#fff" /> {locale === 'de' ? 'Kein Kontingent mehr' : 'No quota left'}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  ✦ {locale === 'de' ? 'Avatar generieren' : 'Generate avatar'}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: isDark ? 'rgba(8,12,24,0.97)' : 'rgba(240,244,255,0.97)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '32px' }}>

            {selfie && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ width: '140px', height: '140px', borderRadius: '28px', overflow: 'hidden', marginBottom: '32px', boxShadow: `0 12px 40px ${accent}40`, border: `3px solid ${accent}` }}>
                <img src={selfie} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
            )}

            <motion.div key={genIcon} initial={{ scale: 0.5, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              style={{ marginBottom: '20px' }}>
              <StepIcon name={genIcon} size={56} color={accent} />
            </motion.div>

            <motion.p key={genStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: '19px', fontWeight: 800, color: text, textAlign: 'center' as const, letterSpacing: '-0.02em', marginBottom: '28px', maxWidth: '280px' }}>
              {genStep}
            </motion.p>

            <div style={{ width: '100%', maxWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: muted }}>
                  {locale === 'de' ? 'Fortschritt' : 'Progress'}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: accent }}>{Math.round(genProgress)}%</span>
              </div>
              <div style={{ height: '10px', background: accentDim, borderRadius: '6px', overflow: 'hidden' }}>
                <motion.div animate={{ width: `${genProgress}%` }} transition={{ duration: 0.4 }}
                  style={{ height: '100%', background: sageGradient, borderRadius: '6px' }} />
              </div>
            </div>

            <p style={{ fontSize: '12px', color: muted, marginTop: '24px', textAlign: 'center' as const }}>
              {locale === 'de' ? 'Das dauert meist 20-30 Sekunden ✦' : 'This usually takes 20-30 seconds ✦'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      <AnimatePresence>
        {showGallery && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowGallery(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' as const, background: bg, border: `1px solid ${border}`, borderRadius: '28px 28px 0 0', padding: '20px 20px 28px' }}>

              <div style={{ width: '36px', height: '4px', background: border, borderRadius: '2px', margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={16} color={text} /> {locale === 'de' ? 'Meine Avatare' : 'My Avatars'}
                </h2>
                <button onClick={() => setShowGallery(false)}
                  style={{ background: card, border: `1px solid ${border}`, borderRadius: '10px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: muted }}>✕</button>
              </div>

              {galleryLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: accent }} />
                </div>
              ) : galleryAvatars.length === 0 ? (
                <p style={{ fontSize: '13px', color: muted, textAlign: 'center' as const, padding: '30px 0' }}>
                  {locale === 'de' ? 'Noch keine Avatare erstellt.' : 'No avatars created yet.'}
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {galleryAvatars.map(a => (
                    <motion.div key={a.id} whileTap={{ scale: 0.96 }}
                      onClick={() => setGalleryFullscreen(a.image_url)}
                      style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: `1px solid ${border}`, aspectRatio: '3/4', position: 'relative' as const }}>
                      <img src={a.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {galleryFullscreen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setGalleryFullscreen(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
              <img src={galleryFullscreen} style={{ width: '100%', borderRadius: '16px', maxHeight: '70vh', objectFit: 'contain' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => window.open(galleryFullscreen, '_blank')}
                  style={{ flex: 1, background: sageGradient, border: 'none', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <LinkIcon size={13} color="#fff" /> {locale === 'de' ? 'Öffnen' : 'Open'}
                </button>
                <button onClick={() => setGalleryFullscreen(null)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                  {locale === 'de' ? 'Schließen' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AvatarPhotoGuide
        open={showPhotoGuide}
        onClose={closePhotoGuide}
        locale={locale}
        theme={{ card, border, text, muted, accent, sageGradient, isDark }}
      />
    </div>
  )
}