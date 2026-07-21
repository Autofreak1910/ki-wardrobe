'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
const DRESSING_ROOM_BG_URL = '/dressing-room-bg.jpg'
import UpgradeModal from '@/components/UpgradeModal'

type ClothingItem = { id: string; image_url: string; category: string; color: string; name?: string; brand?: string }
function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    tops: 'shirt',
    hosen: 'pants',
    jacken: 'jacket',
    schuhe: 'shoes',
    acc: 'accessory',
  }
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
        const FLOOR_Y_FRACTION = 0.90
        const AVATAR_HEIGHT_FRACTION = 0.70
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
let avatarCache: { profile: any; items: ClothingItem[] } | null = null

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
  const [showUpgrade, setShowUpgrade] = useState(false)
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
      const [profileRes, itemsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('clothing_items').select('*').eq('user_id', session.user.id)
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
      avatarCache = { profile: freshProfile, items: itemsRes.data ?? [] }
    } catch (err) {
      console.error('loadData failed:', err)
    } finally {
      setPageLoading(false)
    }
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
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function generateAvatar() {
    if (!selfie || !selectedItem) return
    setLoading(true)
    setError(null)
    setResult(null)
    setErrorTips(null)
    setGenProgress(0)

    const steps = locale === 'de' ? [
      { at: 0,  label: 'Foto wird hochgeladen...' },
      { at: 12, label: 'Hintergrund wird entfernt...' },
      { at: 25, label: 'Foto wird geprüft...' },
      { at: 38, label: 'KI zieht dir das Outfit an...' },
      { at: 52, label: 'Falten werden geglättet...' },
      { at: 64, label: 'Farben werden abgestimmt...' },
      { at: 76, label: 'Licht wird angepasst...' },
      { at: 87, label: 'Letzte Details...' },
      { at: 94, label: 'Fast fertig...' },
    ] : [
      { at: 0,  label: 'Uploading photo...' },
      { at: 12, label: 'Removing background...' },
      { at: 25, label: 'Checking photo quality...' },
      { at: 38, label: 'AI is dressing you...' },
      { at: 52, label: 'Smoothing out wrinkles...' },
      { at: 64, label: 'Matching the colors...' },
      { at: 76, label: 'Adjusting the lighting...' },
      { at: 87, label: 'Final touches...' },
      { at: 94, label: 'Almost there...' },
    ]
    setGenStep(steps[0].label)
    const interval = setInterval(() => {
      setGenProgress(p => {
        const next = Math.min(p + Math.random() * 2.5 + 1, 95)
        const current = [...steps].reverse().find(s => next >= s.at)
        if (current) setGenStep(current.label)
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
      clearInterval(interval)
      setGenProgress(100)
      setGenStep(locale === 'de' ? 'Fertig!' : 'Done!')

      if (data.error === 'monthly_limit') {
        setError(locale === 'de' ? 'Du hast deine 2 kostenlosen Avatare diesen Monat aufgebraucht. Upgrade auf Pro!' : 'You used your 2 free avatars this month. Upgrade to Pro!')
      } else if (data.error === 'weekly_limit') {
        setError(locale === 'de' ? 'Du hast diese Woche bereits 6 Avatare erstellt. Nächste Woche wieder!' : 'You already created 6 avatars this week. Come back next week!')
      } else if (data.error === 'bad_selfie') {
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
      } else if (data.success) {
        setResult(data.imageUrl)
        await loadData()
      } else {
        setError(locale === 'de' ? 'Fehler beim Generieren' : 'Error generating')
      }
    } catch {
      clearInterval(interval)
      setError(locale === 'de' ? 'Fehler beim Generieren' : 'Error generating')
    }
    setLoading(false)
    setGenProgress(0)
  }
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

        {/* Hero Banner */}
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{ position: 'relative' as const, height: '220px', marginBottom: '0', overflow: 'hidden', borderRadius: '0 0 28px 28px' }}>
          <img
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80&auto=format&fit=crop"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', position: 'absolute', inset: 0 }}
          />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 0%, transparent 50%, ${bg} 100%)`, maskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 100%)' }} />
          <div style={{ position: 'absolute', inset: '40% 0 0 0', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.25)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%, black 100%)' }} />

          {/* PRO Badge */}
          {isPremium ? (
            <div style={{ position: 'absolute' as const, top: '16px', right: '18px', background: goldAccent, borderRadius: '10px', padding: '6px 14px', boxShadow: '0 4px 12px rgba(241,185,81,0.5)', zIndex: 2 }}>
           <p style={{ fontSize: '11px', fontWeight: 700, color: '#1D1D20', letterSpacing: '0.04em' }}>✦ PRO · {usedThisPeriod}/{periodLimit} {locale === 'de' ? 'diese Woche' : 'this week'}</p>
            </div>
          ) : (
            <div style={{ position: 'absolute' as const, top: '16px', right: '18px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '10px', padding: '6px 14px', zIndex: 2 }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{usedThisPeriod}/{periodLimit} {locale === 'de' ? 'diesen Monat' : 'this month'}</p>
            </div>
          )}

          <div style={{ position: 'absolute' as const, bottom: '20px', left: '20px', zIndex: 2 }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '4px', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
              Virtual Try-On
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
              {locale === 'de' ? 'Probiere Klamotten virtuell an deinem Foto an' : 'Try clothes on your photo virtually'}
            </p>
          </div>
        </motion.div>

        {/* Tips */}
        <div style={{ padding: '12px 20px 0', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: '12px' }}>💡</span>
            {[
              locale === 'de' ? 'Ganzkörper' : 'Full body',
              locale === 'de' ? 'Heller HG' : 'Light BG',
              locale === 'de' ? 'Ein Teil' : 'One item',
              locale === 'de' ? 'Gutes Licht' : 'Good light',
            ].map((tip, i) => (
              <span key={i} style={{ fontSize: '12px', fontWeight: 600, color: accent, background: accentDim, borderRadius: '100px', padding: '4px 10px', border: `1px solid ${accent}30` }}>{tip}</span>
            ))}
          </div>
        </div>

        {/* Limit info -- ersetzt die alte grosse Upgrade-Wand, blockiert nichts mehr */}
        <div style={{ padding: '0 20px' }}>
          {!canGenerate && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
             onClick={() => { if (!isPremium) setShowUpgrade(true) }}
              style={{ background: isPremium ? accentDim : sageGradient, borderRadius: '14px', padding: '12px 16px', marginBottom: '16px', cursor: isPremium ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>🔒</span>
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

        {/* Step 1 — Selfie */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'transparent', marginBottom: '12px', padding: '0 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
            {locale === 'de' ? 'Schritt 1 · Dein Foto' : 'Step 1 · Your Photo'}
          </p>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: isDark ? 'none' : '0 2px 8px rgba(29,29,32,0.04)', position: 'relative' as const, opacity: canGenerate ? 1 : 0.5, pointerEvents: canGenerate ? 'auto' : 'none' as const }}>
            {!canGenerate && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(29,29,32,0.4)' : 'rgba(255,255,255,0.4)' }}>
                <span style={{ fontSize: '28px' }}>🔒</span>
              </div>
            )}
            <div style={{ padding: '8px' }}>
              {!selfie ? (
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => fileRef.current?.click()}
                  style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>🤳</div>
                  <div style={{ textAlign: 'left' as const }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '2px', letterSpacing: '-0.02em' }}>
                      {locale === 'de' ? 'Selfie hochladen' : 'Upload selfie'}
                    </p>
                    <p style={{ fontSize: '12px', color: muted }}>
                      {locale === 'de' ? 'Ganzkörper Foto für beste Ergebnisse' : 'Full body photo for best results'}
                    </p>
                  </div>
                  <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </motion.div>
              ) : (
                <div style={{ position: 'relative' as const }}>
                  <img src={selfie} style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'cover' }} />
                  <button onClick={() => setSelfie(null)}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
                    ×
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleSelfie} style={{ display: 'none' }} />
            </div>
          </div>
        </motion.div>

        {/* Step 2 — Kleidung wählen */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: 'transparent', marginBottom: '12px', padding: '0 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
            {locale === 'de' ? 'Schritt 2 · Kleidung wählen' : 'Step 2 · Choose clothing'}
          </p>
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', boxShadow: isDark ? 'none' : '0 2px 8px rgba(29,29,32,0.04)', position: 'relative' as const, opacity: canGenerate ? 1 : 0.5, pointerEvents: canGenerate ? 'auto' : 'none' as const }}>
            {!canGenerate && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(29,29,32,0.4)' : 'rgba(255,255,255,0.4)' }}>
                <span style={{ fontSize: '28px' }}>🔒</span>
              </div>
            )}
            <div style={{ padding: '16px' }}>
              {items.length === 0 ? (
                <p style={{ fontSize: '13px', color: muted, textAlign: 'center' as const }}>
                  {locale === 'de' ? 'Keine Kleidung im Schrank' : 'No clothes in wardrobe'}
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {items.filter(item => item.category !== 'schuhe').map(item => (
                    <motion.div key={item.id} whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                      style={{ background: card, borderRadius: '16px', overflow: 'hidden', border: `1.5px solid ${selectedItem?.id === item.id ? accent : border}`, cursor: 'pointer', position: 'relative' as const, padding: '6px', boxShadow: selectedItem?.id === item.id ? `0 4px 16px ${accent}25` : 'none' }}>
                      <div style={{ borderRadius: '10px', overflow: 'hidden' }}>
                        <img src={item.image_url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                      </div>
                      {selectedItem?.id === item.id && (
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: accent, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>✓</div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

   {/* Error */}
        {error && (
          <div style={{ padding: '0 20px' }}>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : '#fecaca'}`, borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: errorTips ? '10px' : 0 }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>📸</span>
                <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600, lineHeight: 1.5 }}>{error}</p>
              </div>

              {errorTips && (
                <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', borderRadius: '10px', padding: '12px 14px', marginTop: '4px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: text, marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                    {locale === 'de' ? '💡 So klappt\'s besser' : '💡 Tips for better results'}
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

        {/* Result */}
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
                          div.innerHTML = `<a href="${result}" target="_blank" style="color:${accent};font-weight:600">🔗 ${locale === 'de' ? 'Bild öffnen →' : 'Open image →'}</a>`
                          e.currentTarget.parentNode?.appendChild(div)
                        }}
                      />
                      {/* Wasserzeichen mittig, damit es nicht einfach weggeschnitten werden kann */}
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
                      <>📤 {locale === 'de' ? 'Vorher/Nachher teilen' : 'Share before/after'}</>
                    )}
                  </motion.button>
                  <button
                    onClick={() => window.open(result, '_blank')}
                    style={{ width: '100%', background: accentDim, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600, color: accent, cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
                    🔗 {locale === 'de' ? 'In neuem Tab öffnen' : 'Open in new tab'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Sticky Generate Bar — immer sichtbar, egal ob Kontingent da ist */}
      <div style={{ position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom))', left: 0, right: 0, zIndex: 40, pointerEvents: 'none' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0 20px', pointerEvents: 'auto' }}>
          <div style={{ background: isDark ? 'rgba(22,22,22,0.96)' : 'rgba(253,252,249,0.96)', backdropFilter: 'blur(14px)', border: `1px solid ${border}`, borderRadius: '20px', padding: '10px', boxShadow: '0 8px 28px rgba(0,0,0,0.14)' }}>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={generateAvatar}
              disabled={loading || !selfie || !selectedItem || !canGenerate}
              style={{ width: '100%', padding: loading ? '10px 16px' : '16px', background: sageGradient, border: 'none', borderRadius: loading ? '18px' : '100px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: loading ? 'wait' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", boxShadow: '0 8px 24px rgba(53,92,125,0.3)', transition: 'all 0.2s', opacity: (!selfie || !selectedItem || !canGenerate) ? 0.6 : 1 }}>
              {loading ? (
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{genStep}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{Math.round(genProgress)}%</span>
                  </div>
                  <div style={{ height: '5px', background: 'rgba(255,255,255,0.25)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${genProgress}%` }} transition={{ duration: 0.4 }}
                      style={{ height: '100%', background: '#fff', borderRadius: '3px' }} />
                  </div>
                </div>
              ) : !canGenerate ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  🔒 {locale === 'de' ? 'Kein Kontingent mehr' : 'No quota left'}
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

     <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  )
}