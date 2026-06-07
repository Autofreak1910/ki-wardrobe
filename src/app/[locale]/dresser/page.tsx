'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

const occasions = ['casual', 'uni', 'work', 'date', 'sport', 'party', 'festival'] as const
const categoryFilters = [
  { key: 'tops', emoji: '👕' },
  { key: 'hosen', emoji: '👖' },
  { key: 'jacken', emoji: '🧥' },
  { key: 'schuhe', emoji: '👟' },
  { key: 'acc', emoji: '🧢' },
]

type ClothingItem = {
  id: string
  image_url: string
  category: string
  color: string
  name?: string
  brand?: string
}

type Outfit = {
  items: string[]
  reasoning: string
  itemObjects: ClothingItem[]
}

export default function DresserPage() {
  const [selected, setSelected] = useState<string>('casual')
  const [loading, setLoading] = useState(false)
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [saved, setSaved] = useState(false)
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([])
  const [hasItems, setHasItems] = useState(true)
  const [activeCategories, setActiveCategories] = useState<string[]>(['tops', 'hosen', 'jacken', 'schuhe', 'acc'])
  const { theme, toggle } = useTheme()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const isDark = theme === 'dark'

  const days = locale === 'de'
    ? ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const today = days[new Date().getDay()]

  useEffect(() => { loadWardrobe() }, [])

  async function loadWardrobe() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('clothing_items').select('*').eq('user_id', user.id)
    if (data) {
      setWardrobeItems(data)
      setHasItems(data.length >= 3)
    }
  }

  function toggleCategory(cat: string) {
    setActiveCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
    setOutfit(null)
  }

  function switchLanguage() {
    const newLocale = locale === 'de' ? 'en' : 'de'
    const segments = pathname.split('/')
    segments[1] = newLocale
    window.location.replace(segments.join('/'))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/' + locale + '/auth/login')
  }

  async function generateOutfit() {
    if (wardrobeItems.length < 3) return
    setLoading(true)
    setSaved(false)
    setOutfit(null)
    const filteredItems = wardrobeItems.filter(i => activeCategories.includes(i.category))
    const itemsToUse = filteredItems.length >= 2 ? filteredItems : wardrobeItems
    try {
    const res = await fetch('/api/generate-outfit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-locale': locale,
  },
  body: JSON.stringify({ items: itemsToUse, occasion: selected, weather: '18°C', categories: activeCategories }),
})
      const data = await res.json()
      if (data.success) {
        const matchedItems = data.items.map((name: string) =>
          wardrobeItems.find(i => i.name === name || i.name?.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes((i.name ?? '').toLowerCase()))
        ).filter(Boolean)
        setOutfit({ items: data.items, reasoning: data.reasoning, itemObjects: matchedItems })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function saveOutfit() {
    if (!outfit) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('outfits').insert({
      user_id: user.id, occasion: selected,
      item_ids: outfit.itemObjects.map(i => i.id),
      name: `${t('dresser.occasions.' + selected)} Outfit`,
    })
    setSaved(true)
  }

  const occasionEmoji: Record<string, string> = {
    casual: '😎', uni: '🎒', work: '💼', date: '🌹', sport: '🏃', party: '🎉', festival: '🎪'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text)' }}>
          Ki<em style={{ color: '#0ea472' }}>Wardrobe</em>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['dresser', 'wardrobe', 'outfits', 'style'].map(page => (
            <button key={page} onClick={() => router.push('/' + locale + '/' + page)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif", background: page === 'dresser' ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'transparent', color: page === 'dresser' ? '#fff' : 'var(--text-secondary)' }}>
              {t('nav.' + page)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={switchLanguage} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
            {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
          </button>
          <button onClick={toggle} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => router.push('/' + locale + '/profile')}
  style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  👤
</button>
<button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>
  Logout
</button>
        </div>
      </nav>

      <main style={{ maxWidth: '580px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{today}</p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '38px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.2, marginBottom: '10px' }}>
            {t('dresser.title')}
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '20px', padding: '6px 14px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>🌤 18°C</span>
            <span style={{ fontSize: '12px', color: 'var(--border)' }}>·</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{wardrobeItems.length} {t('wardrobe.pieces')}</span>
          </div>
        </div>

        {!hasItems ? (
          <div style={{ textAlign: 'center', padding: '48px 32px', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>👗</div>
            <p style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px', fontFamily: "'DM Serif Display', serif" }}>{t('dresser.notEnough')}</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>{t('dresser.notEnoughSub')}</p>
            <button onClick={() => router.push('/' + locale + '/wardrobe')}
              style={{ background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '12px', padding: '13px 28px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {t('dresser.uploadNow')}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, justifyContent: 'center', marginBottom: '20px' }}>
              {occasions.map(occ => (
                <button key={occ} onClick={() => { setSelected(occ); setOutfit(null); setSaved(false) }}
                  style={{ padding: '9px 18px', borderRadius: '20px', border: selected === occ ? 'none' : '1px solid var(--border)', background: selected === occ ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-secondary)', color: selected === occ ? '#fff' : 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{occasionEmoji[occ]}</span>{t('dresser.occasions.' + occ)}
                </button>
              ))}
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                  {t('dresser.whatForOutfit')}
                </p>
                <button onClick={() => { setActiveCategories(['tops','hosen','jacken','schuhe','acc']); setOutfit(null) }}
                  style={{ padding: '4px 10px', borderRadius: '20px', border: 'none', background: activeCategories.length === 5 ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-card)', color: activeCategories.length === 5 ? '#fff' : 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  ✦ {t('dresser.fullOutfit')}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                {categoryFilters.map(cat => {
                  const isActive = activeCategories.includes(cat.key)
                  const hasInWardrobe = wardrobeItems.some(i => i.category === cat.key)
                  return (
                    <button key={cat.key} onClick={() => toggleCategory(cat.key)}
                      style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '5px', border: isActive ? 'none' : '1px solid var(--border)', background: isActive ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'var(--bg-card)', color: isActive ? '#fff' : hasInWardrobe ? 'var(--text)' : 'var(--text-secondary)', opacity: hasInWardrobe ? 1 : 0.5 }}>
                      <span>{cat.emoji}</span>{t('dresser.categories.' + cat.key)}
                    </button>
                  )
                })}
              </div>
            </div>

            <button onClick={generateOutfit} disabled={loading}
              style={{ display: 'block', width: '100%', padding: '18px', background: loading ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #0ea472 0%, #0891b2 100%)', border: loading ? '1px solid var(--border)' : 'none', borderRadius: '16px', fontSize: '17px', fontWeight: 600, color: loading ? 'var(--text-secondary)' : '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Serif Display', serif", marginBottom: '28px', transition: 'all 0.2s' }}>
              {loading ? `✦ ${t('dresser.generating')}` : `✦ ${t('dresser.button')}`}
            </button>

            {outfit && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', animation: 'fadeIn 0.4s ease' }}>
                <div style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{occasionEmoji[selected]}</span>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '2px' }}>{t('dresser.outfitFor')}</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, #0ea472, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('dresser.occasions.' + selected)}
                      </p>
                    </div>
                  </div>
                  <button onClick={saveOutfit}
                    style={{ background: saved ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'transparent', border: `1px solid ${saved ? 'transparent' : 'var(--border)'}`, borderRadius: '20px', padding: '7px 16px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: saved ? '#fff' : 'var(--text)', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}>
                    {saved ? `✓ ${t('dresser.saved')}` : `♡ ${t('dresser.save')}`}
                  </button>
                </div>

                <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: outfit.itemObjects.length >= 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '10px' }}>
                  {outfit.itemObjects.length > 0 ? outfit.itemObjects.map((item, i) => (
                    <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', transition: 'transform 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                      <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
                        <img src={item.image_url} alt={item.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginBottom: '2px' }}>{item.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.color}{item.brand ? ' · ' + item.brand : ''}</p>
                      </div>
                    </div>
                  )) : outfit.items.map((name, i) => (
                    <div key={i} style={{ borderRadius: '12px', padding: '20px 12px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, textAlign: 'center' as const }}>{name}</p>
                    </div>
                  ))}
                </div>

                {outfit.reasoning && (
                  <div style={{ margin: '0 16px 16px', background: isDark ? 'rgba(14,164,114,0.06)' : 'rgba(14,164,114,0.05)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(14,164,114,0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>✦</div>
                      <p style={{ fontSize: '12px', fontWeight: 600, background: 'linear-gradient(135deg, #0ea472, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('dresser.kiStylist')}
                      </p>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '34px' }}>{outfit.reasoning}</p>
                  </div>
                )}

                <div style={{ padding: '0 16px 16px' }}>
                  <button onClick={generateOutfit}
                    style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                    ↻ {t('dresser.newOutfit')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}