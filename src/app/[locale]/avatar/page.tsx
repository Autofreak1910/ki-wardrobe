'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/Navbar'

type ClothingItem = { id: string; image_url: string; category: string; color: string; name?: string; brand?: string }

export default function AvatarPage() {
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<ClothingItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    if (profileRes.data) setProfile(profileRes.data)
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
          garmentDescription: `${selectedItem.color} ${selectedItem.name ?? selectedItem.category}`,
        })
      })
      const data = await res.json()
      if (data.error === 'limit_reached') {
        setError(locale === 'de' ? 'Du hast deine 3 kostenlosen Versuche aufgebraucht. Upgrade auf Pro!' : 'You used your 3 free tries. Upgrade to Pro!')
      } else if (data.error === 'daily_limit') {
        setError(locale === 'de' ? 'Du hast heute bereits einen Avatar erstellt. Morgen wieder!' : 'You already created an avatar today. Come back tomorrow!')
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

      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '560px', width: '100%', margin: '0 auto', padding: '84px 20px 108px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: text, letterSpacing: '-0.03em', marginBottom: '4px' }}>
                {locale === 'de' ? 'Virtual Try-On ✦' : 'Virtual Try-On ✦'}
              </h1>
              <p style={{ fontSize: '13px', color: muted }}>
                {locale === 'de' ? 'Probiere Klamotten virtuell an' : 'Try on clothes virtually'}
              </p>
            </div>
            {!isPremium && (
              <div style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '12px', padding: '8px 12px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '18px', fontWeight: 800, color: triesLeft > 0 ? accent : '#ef4444' }}>{triesLeft}</p>
                <p style={{ fontSize: '10px', color: muted }}>{locale === 'de' ? 'übrig' : 'left'}</p>
              </div>
            )}
            {isPremium && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, borderRadius: '6px', padding: '4px 10px' }}>PRO ✦</span>
            )}
          </div>
        </motion.div>

        {/* No tries left — upgrade */}
        {!isPremium && triesLeft <= 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push('/' + locale + '/profile?upgrade=true')}
            style={{ background: `linear-gradient(135deg, ${accent}, #6b9fff)`, borderRadius: '20px', padding: '24px', marginBottom: '20px', cursor: 'pointer', textAlign: 'center' as const }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</p>
            <p style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              {locale === 'de' ? 'Keine Versuche mehr' : 'No tries left'}
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
              {locale === 'de' ? 'Upgrade auf Pro für 1 Avatar täglich' : 'Upgrade to Pro for 1 avatar daily'}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>✦ Pro für €4,99/Mo →</p>
            </div>
          </motion.div>
        )}

        {(isPremium || triesLeft > 0) && (
          <>
            {/* Step 1 — Selfie */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, background: accentDim }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                  {locale === 'de' ? 'Schritt 1 · Dein Foto' : 'Step 1 · Your Photo'}
                </p>
              </div>
              <div style={{ padding: '16px' }}>
                {!selfie ? (
                  <motion.div whileTap={{ scale: 0.98 }} onClick={() => fileRef.current?.click()}
                    style={{ border: `2px dashed ${border}`, borderRadius: '14px', padding: '32px', textAlign: 'center' as const, cursor: 'pointer' }}>
                    <p style={{ fontSize: '32px', marginBottom: '8px' }}>🤳</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: text, marginBottom: '4px' }}>
                      {locale === 'de' ? 'Selfie hochladen' : 'Upload selfie'}
                    </p>
                    <p style={{ fontSize: '12px', color: muted }}>
                      {locale === 'de' ? 'Ganzkörper Foto für beste Ergebnisse' : 'Full body photo for best results'}
                    </p>
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
            </motion.div>

            {/* Step 2 — Kleidung wählen */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, background: accentDim }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                  {locale === 'de' ? 'Schritt 2 · Kleidung wählen' : 'Step 2 · Choose clothing'}
                </p>
              </div>
              <div style={{ padding: '16px' }}>
                {items.length === 0 ? (
                  <p style={{ fontSize: '13px', color: muted, textAlign: 'center' as const }}>
                    {locale === 'de' ? 'Keine Kleidung im Schrank' : 'No clothes in wardrobe'}
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {items.map(item => (
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
            </motion.div>

            {/* Generate Button */}
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={generateAvatar}
              disabled={loading || !selfie || !selectedItem}
              style={{ width: '100%', padding: '18px', background: (!selfie || !selectedItem || loading) ? (isDark ? '#0d1225' : '#e8eeff') : `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 700, color: (!selfie || !selectedItem || loading) ? muted : '#fff', cursor: (!selfie || !selectedItem || loading) ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: (!selfie || !selectedItem || loading) ? 'none' : `0 4px 20px ${accent}40`, transition: 'all 0.2s' }}>
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
      <div style={{ padding: '12px 16px' }}>
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

        {/* Info Box */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ background: accentDim, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: accent, marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
            💡 {locale === 'de' ? 'Tipps für beste Ergebnisse' : 'Tips for best results'}
          </p>
          {[
            locale === 'de' ? 'Ganzkörper Foto verwenden' : 'Use a full body photo',
            locale === 'de' ? 'Heller Hintergrund empfohlen' : 'Light background recommended',
            locale === 'de' ? 'Einzelnes Kleidungsstück wählen' : 'Choose a single clothing item',
            locale === 'de' ? 'Gute Beleuchtung für bestes Ergebnis' : 'Good lighting for best result',
          ].map((tip, i) => (
            <p key={i} style={{ fontSize: '12px', color: muted, marginBottom: '4px' }}>· {tip}</p>
          ))}
        </motion.div>

      </main>
    </div>
  )
}