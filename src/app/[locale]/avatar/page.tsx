'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'

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

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
      bgGrad.addColorStop(0, '#0a1628')
      bgGrad.addColorStop(1, '#1a2540')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      // Header
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 52px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('KiWardrobe', W / 2, 90)
      ctx.font = '28px sans-serif'
      ctx.fillStyle = '#4d7eff'
      ctx.fillText(locale === 'de' ? '✦ Virtual Try-On' : '✦ Virtual Try-On', W / 2, 130)

      // Image area
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

      // Labels
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(leftX, imgTop + imgHeight - 50, halfW, 50)
      ctx.fillRect(rightX, imgTop + imgHeight - 50, halfW, 50)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(locale === 'de' ? 'VORHER' : 'BEFORE', leftX + halfW / 2, imgTop + imgHeight - 16)
      ctx.fillText(locale === 'de' ? 'NACHHER' : 'AFTER', rightX + halfW / 2, imgTop + imgHeight - 16)

      // Arrow between
      ctx.fillStyle = '#4d7eff'
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText('→', W / 2, imgTop + imgHeight / 2 + 14)

      // Footer
      ctx.fillStyle = '#8aa0d0'
      ctx.font = '24px sans-serif'
      ctx.fillText(
        locale === 'de' ? 'Probier deine Klamotten virtuell an ✦' : 'Try on your clothes virtually ✦',
        W / 2, H - 90
      )
      ctx.fillStyle = '#4d7eff'
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
export default function AvatarPage() {
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<ClothingItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { theme } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isDark = theme === 'dark'

  const bg       = isDark ? '#080c18' : '#f0f4ff'
  const card     = isDark ? '#0d1225' : '#ffffff'
  const border   = isDark ? '#1a2540' : '#dde3f5'
  const text     = isDark ? '#e8eeff' : '#0a1628'
  const muted    = isDark ? '#4d6080' : '#6b7fa8'
  const accent   = isDark ? '#4d7eff' : '#3b6bff'
  const accentDim = isDark ? 'rgba(77,126,255,0.1)' : 'rgba(59,107,255,0.08)'

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const [profileRes, itemsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('clothing_items').select('*').eq('user_id', session.user.id)
    ])
  if (profileRes.data) {
      const { data: stillPremium } = await supabase.rpc('check_and_expire_premium', { p_user_id: session.user.id })
      setProfile({ ...profileRes.data, is_premium: stillPremium ?? false })
    }
    if (itemsRes.data) setItems(itemsRes.data)
    setPageLoading(false)
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
      if (data.error === 'limit_reached') {
        setError(locale === 'de' ? 'Du hast deine 3 kostenlosen Versuche aufgebraucht. Upgrade auf Pro!' : 'You used your 3 free tries. Upgrade to Pro!')
      } else if (data.error === 'daily_limit') {
        setError(locale === 'de' ? 'Du hast heute bereits 2 Avatare erstellt. Morgen wieder!' : 'You already created 2 avatars today. Come back tomorrow!')
      } else if (data.error === 'bad_selfie') {
        setError(locale === 'de' ? 'Dein Foto eignet sich nicht gut für Try-On. Bitte nutze ein Ganzkörperfoto mit klarer Pose, gutem Licht und einfachem Hintergrund.' : 'Your photo isn\'t well suited for try-on. Please use a full-body photo with a clear pose, good lighting, and a plain background.')
      } else if (data.success) {
        setResult(data.imageUrl)
        await loadData()
      } else {
        setError(locale === 'de' ? 'Fehler beim Generieren' : 'Error generating')
      }
    } catch {
      setError(locale === 'de' ? 'Fehler beim Generieren' : 'Error generating')
    }
    setLoading(false)
  }

  const isPremium = profile?.is_premium ?? false
  const triesLeft = profile?.avatar_tries_left ?? 0

  if (pageLoading) return (
    <div style={{ height: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar activePage="avatar" />
    </div>
  )

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' as const, background: bg, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif", position: 'relative' as const }}>

      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: isDark ? 'rgba(77,126,255,0.06)' : 'rgba(59,107,255,0.1)', filter: 'blur(90px)' }} />
      </div>

      <Navbar activePage="avatar" />

      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '68px 0 108px', position: 'relative', zIndex: 1 }}>

        {/* Hero Banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
   style={{ position: 'relative' as const, height: '140px', marginBottom: '0', overflow: 'hidden' }}>
          <img
           src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80&auto=format&fit=crop"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', position: 'absolute', inset: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(241,185,81,0.06) 0%, rgba(253,252,249,0.75) 70%, rgba(253,252,249,1) 100%)' }} />

          {/* PRO Badge */}
          {isPremium ? (
            <div style={{ position: 'absolute' as const, top: '16px', right: '18px', background: goldAccent, borderRadius: '10px', padding: '6px 14px', boxShadow: '0 4px 12px rgba(241,185,81,0.4)', zIndex: 2 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#1D1D20', letterSpacing: '0.04em' }}>✦ PRO</p>
            </div>
          ) : (
            <div style={{ position: 'absolute' as const, top: '16px', right: '18px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '10px', padding: '6px 14px', zIndex: 2 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{triesLeft}/3 {locale === 'de' ? 'übrig' : 'left'}</p>
            </div>
          )}
        </motion.div>

        {/* Title */}
      <div style={{ padding: '12px 20px 0', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: text, letterSpacing: '-0.04em', marginBottom: '2px' }}>
            Virtual Try-On
          </h1>
          <p style={{ fontSize: '12px', color: muted }}>
            {locale === 'de' ? 'Probiere Klamotten virtuell an deinem Foto an' : 'Try clothes on your photo virtually'}
          </p>
        </div>

        {/* Info Box — kompakt, direkt nach Titel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '14px', padding: '10px 16px', margin: '0 20px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: '11px' }}>💡</span>
            {[
              locale === 'de' ? 'Ganzkörper' : 'Full body',
              locale === 'de' ? 'Heller HG' : 'Light BG',
              locale === 'de' ? 'Ein Teil' : 'One item',
              locale === 'de' ? 'Gutes Licht' : 'Good light',
            ].map((tip, i) => (
              <span key={i} style={{ fontSize: '11px', color: muted, background: card, borderRadius: '100px', padding: '3px 8px', border: `1px solid ${border}` }}>{tip}</span>
            ))}
          </div>
        </motion.div>

        {/* No tries left — upgrade */}
        <div style={{ padding: '0 20px' }}>
        {!isPremium && triesLeft <= 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push('/' + locale + '/profile?upgrade=true')}
            style={{ background: `linear-gradient(135deg, ${accent}, #6b9fff)`, borderRadius: '20px', padding: '24px', marginBottom: '20px', cursor: 'pointer', textAlign: 'center' as const }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</p>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              {locale === 'de' ? 'Keine Versuche mehr' : 'No tries left'}
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            {locale === 'de' ? 'Upgrade auf Pro für 2 Avatare täglich' : 'Upgrade to Pro for 2 avatars daily'}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>✦ Pro für €4,99/Mo →</p>
            </div>
          </motion.div>
        )}

        </div>
        {(isPremium || triesLeft > 0) && (
          <>
            {/* Step 1 — Selfie */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'transparent', marginBottom: '12px', padding: '0 20px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: muted, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
                {locale === 'de' ? 'Schritt 1 · Dein Foto' : 'Step 1 · Your Photo'}
              </p>
             <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden' }}>
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
            <p style={{ fontSize: '10px', fontWeight: 700, color: muted, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
                {locale === 'de' ? 'Schritt 2 · Kleidung wählen' : 'Step 2 · Choose clothing'}
              </p>
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ padding: '16px' }}>
                {items.length === 0 ? (
                  <p style={{ fontSize: '13px', color: muted, textAlign: 'center' as const }}>
                    {locale === 'de' ? 'Keine Kleidung im Schrank' : 'No clothes in wardrobe'}
                  </p>
                ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {items.filter(item => item.category !== 'schuhe').map(item => (
                      <motion.div key={item.id} whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                        style={{ borderRadius: '12px', overflow: 'hidden', border: `2px solid ${selectedItem?.id === item.id ? accent : border}`, cursor: 'pointer', position: 'relative' as const }}>
                        <img src={item.image_url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                        {selectedItem?.id === item.id && (
                          <div style={{ position: 'absolute', top: '4px', right: '4px', background: accent, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff' }}>✓</div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            </motion.div>

            {/* Generate Button */}
            <div style={{ padding: '0 20px' }}>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={generateAvatar}
              disabled={loading || !selfie || !selectedItem}
              style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: 700, color: '#fff', cursor: loading ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: `0 4px 20px ${accent}40`, transition: 'all 0.2s', opacity: (!selfie || !selectedItem) ? 0.6 : 1 }}>
              {loading ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'block', width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: accent }} />
                  {locale === 'de' ? 'KI generiert (~20 Sek)...' : 'AI generating (~20 sec)...'}
                </>
              ) : (
                <>✦ {locale === 'de' ? 'Avatar generieren' : 'Generate avatar'}</>
              )}
            </motion.button>
            </div>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>{error}</p>
                {error.includes('Upgrade') && (
                  <button onClick={() => router.push('/' + locale + '/profile?upgrade=true')}
                    style={{ marginTop: '8px', background: accent, border: 'none', borderRadius: '8px', padding: '8px 16px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    ✦ Upgrade →
                  </button>
                )}
              </motion.div>
            )}

         {/* Result */}
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
              const response = await fetch(result)
              const blob = await response.blob()
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
          style={{ fontSize: '11px', fontWeight: 600, color: accent, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          {locale === 'de' ? '↓ Speichern' : '↓ Save'}
        </button>
      </div>
      <img
        src={result}
        style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'contain' }}
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
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={async () => {
            if (!selfie || !result) return
            setSharing(true)
            try {
              const cardDataUrl = await createShareCard(selfie, result, locale)
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
          style={{ width: '100%', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
          style={{ width: '100%', background: accentDim, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: 600, color: accent, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          🔗 {locale === 'de' ? 'In neuem Tab öffnen' : 'Open in new tab'}
        </button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
          </>
        )}

      </main>
    </div>
  )
}