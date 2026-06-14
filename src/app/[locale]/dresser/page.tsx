'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const occasions = ['casual', 'uni', 'work', 'date', 'sport', 'party', 'festival'] as const

const occasionConfig: Record<string, { label: string; icon: string }> = {
  casual:   { label: 'Casual',   icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z' },
  uni:      { label: 'Uni',      icon: 'M12 3L1 9l4 2.18V15c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3.82L21 9 12 3zm6 12H6v-2.5l6 3.27 6-3.27V15z' },
  work:     { label: 'Work',     icon: 'M20 6h-2.18c.07-.44.18-.86.18-1.3C18 2.99 16.54 2 15 2c-.88 0-1.61.39-2.15.97L12 3.76l-.85-.79C10.61 2.39 9.88 2 9 2 7.46 2 6 2.99 6 4.7c0 .44.11.86.18 1.3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z' },
  date:     { label: 'Date',     icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  sport:    { label: 'Sport',    icon: 'M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z' },
  party:    { label: 'Party',    icon: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z' },
  festival: { label: 'Festival', icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' },
}

const categoryConfig = [
  { key: 'tops',   label: 'Tops',   path: 'M3 6c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v2H3V6zm0 4h18v10c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10z' },
  { key: 'hosen',  label: 'Hosen',  path: 'M6 2h12l2 8-4 1v11h-4v-6h-4v6H4V11L0 10z' },
  { key: 'jacken', label: 'Jacken', path: 'M16.5 3C14.76 3 13.09 3.81 12 5.09 10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z' },
  { key: 'schuhe', label: 'Schuhe', path: 'M13.5 4l2.5 8H4L1.5 4h12zM1 14h22v2H1v-2zm0 4h22v2H1v-2z' },
  { key: 'acc',    label: 'Acc',    path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z' },
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

function OccasionIcon({ path, size = 16 }: { path: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d={path} />
    </svg>
  )
}

export default function DresserPage() {
  const [selected, setSelected] = useState<string>('casual')
  const [loading, setLoading] = useState(false)
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [saved, setSaved] = useState(false)
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([])
  const [hasItems, setHasItems] = useState(true)
  const [activeCategories, setActiveCategories] = useState<string[]>(['tops', 'hosen', 'jacken', 'schuhe', 'acc'])
  const { theme } = useTheme()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isDark = theme === 'dark'
  const mainRef = useRef<HTMLElement>(null)

  const days = locale === 'de'
    ? ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = days[new Date().getDay()]
  const dateStr = new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long' })

  useEffect(() => { loadWardrobe() }, [])

  async function loadWardrobe() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/' + locale + '/auth/login'); return }
    const { data } = await supabase.from('clothing_items').select('*').eq('user_id', session.user.id)
    if (data) {
      setWardrobeItems(data)
      setHasItems(data.length >= 3)
    }
  }

  function toggleCategory(cat: string) {
    setActiveCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
    setOutfit(null)
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
        headers: { 'Content-Type': 'application/json', 'x-locale': locale },
        body: JSON.stringify({ items: itemsToUse, occasion: selected, weather: '18°C', categories: activeCategories }),
      })
      const data = await res.json()
      if (data.success) {
        const matchedItems = data.items.map((name: string) => {
          return wardrobeItems.find(i => {
            const itemName = (i.name ?? '').toLowerCase().trim()
            const searchName = name.toLowerCase().trim()
            return itemName === searchName ||
              itemName.includes(searchName) ||
              searchName.includes(itemName) ||
              itemName.split(' ').some(word => word.length > 3 && searchName.includes(word)) ||
              searchName.split(' ').some(word => word.length > 3 && itemName.includes(word))
          })
        }).filter(Boolean)
        setOutfit({ items: data.items, reasoning: data.reasoning, itemObjects: matchedItems })
        setTimeout(() => mainRef.current?.scrollTo({ top: mainRef.current.scrollHeight, behavior: 'smooth' }), 100)
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

  return (
    <div className="app-container dresser-root">
      <Navbar activePage="dresser" />

      <main ref={mainRef} className="dresser-main">

        <header className="dresser-header">
          <div className="dresser-date-row">
            <span className="dresser-date-label">{today}, {dateStr}</span>
            <div className="dresser-weather-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></svg>
              <span>18°C</span>
              <span className="dresser-weather-dot" />
              <span>{wardrobeItems.length} {t('wardrobe.pieces')}</span>
            </div>
          </div>
          <h1 className="dresser-title">{t('dresser.title')}</h1>
        </header>

        {!hasItems ? (
          <div className="dresser-empty">
            <div className="dresser-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <p className="dresser-empty-title">{t('dresser.notEnough')}</p>
            <p className="dresser-empty-sub">{t('dresser.notEnoughSub')}</p>
            <button className="btn-primary" onClick={() => router.push('/' + locale + '/wardrobe')}>
              {t('dresser.uploadNow')}
            </button>
          </div>
        ) : (
          <>
            <section className="dresser-section">
              <p className="dresser-section-label">{locale === 'de' ? 'Anlass' : 'Occasion'}</p>
              <div className="occasion-grid">
                {occasions.map(occ => {
                  const cfg = occasionConfig[occ]
                  const isActive = selected === occ
                  return (
                    <button
                      key={occ}
                      className={`occasion-chip${isActive ? ' occasion-chip--active' : ''}`}
                      onClick={() => { setSelected(occ); setOutfit(null); setSaved(false) }}
                    >
                      <span className="occasion-chip-icon">
                        <OccasionIcon path={cfg.icon} size={14} />
                      </span>
                      <span>{t('dresser.occasions.' + occ)}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="dresser-section">
              <div className="dresser-row-between">
                <p className="dresser-section-label">{t('dresser.whatForOutfit')}</p>
                <button
                  className={`btn-ghost-sm${activeCategories.length === 5 ? ' btn-ghost-sm--active' : ''}`}
                  onClick={() => { setActiveCategories(['tops', 'hosen', 'jacken', 'schuhe', 'acc']); setOutfit(null) }}
                >
                  {locale === 'de' ? 'Alle' : 'All'}
                </button>
              </div>
              <div className="category-row">
                {categoryConfig.map(cat => {
                  const isActive = activeCategories.includes(cat.key)
                  const hasInWardrobe = wardrobeItems.some(i => i.category === cat.key)
                  return (
                    <button
                      key={cat.key}
                      className={`category-chip${isActive ? ' category-chip--active' : ''}${!hasInWardrobe ? ' category-chip--disabled' : ''}`}
                      onClick={() => toggleCategory(cat.key)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d={cat.path} />
                      </svg>
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <button
              className={`btn-generate${loading ? ' btn-generate--loading' : ''}`}
              onClick={generateOutfit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>{t('dresser.generating')}</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm6 10l.75 2.25L21 15l-2.25.75L18 18l-.75-2.25L15 15l2.25-.75L18 12zM6 14l.5 1.5L8 16l-1.5.5L6 18l-.5-1.5L4 16l1.5-.5L6 14z"/>
                  </svg>
                  <span>{t('dresser.button')}</span>
                </>
              )}
            </button>

            {outfit && (
              <div className="outfit-card">
                <div className="outfit-card-header">
                  <div>
                    <p className="outfit-card-eyebrow">{t('dresser.outfitFor')}</p>
                    <p className="outfit-card-occasion">{t('dresser.occasions.' + selected)}</p>
                  </div>
                  <button
                    className={`btn-save${saved ? ' btn-save--saved' : ''}`}
                    onClick={saveOutfit}
                  >
                    {saved ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        <span>{t('dresser.saved')}</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                        <span>{t('dresser.save')}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className={`outfit-grid outfit-grid--${outfit.itemObjects.length >= 3 ? '3' : '2'}`}>
                  {outfit.itemObjects.length > 0
                    ? outfit.itemObjects.map((item, i) => (
                      <div key={i} className="outfit-item">
                        <div className="outfit-item-img">
                          <img src={item.image_url} alt={item.name ?? ''} />
                        </div>
                        <div className="outfit-item-info">
                          <p className="outfit-item-name">{item.name}</p>
                          <p className="outfit-item-sub">{item.color}{item.brand ? ` · ${item.brand}` : ''}</p>
                        </div>
                      </div>
                    ))
                    : outfit.items.map((name, i) => (
                      <div key={i} className="outfit-item outfit-item--text">
                        <p>{name}</p>
                      </div>
                    ))
                  }
                </div>

                {outfit.reasoning && (
                  <div className="outfit-reasoning">
                    <div className="outfit-reasoning-header">
                      <div className="outfit-reasoning-dot" />
                      <span>{t('dresser.kiStylist')}</span>
                    </div>
                    <p className="outfit-reasoning-text">{outfit.reasoning}</p>
                  </div>
                )}

                <div className="outfit-card-footer">
                  <button className="btn-regen" onClick={generateOutfit}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                    {t('dresser.newOutfit')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        .dresser-root {
          height: 100vh; height: 100dvh;
          display: flex; flex-direction: column;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }
        .dresser-main {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          max-width: 560px; width: 100%; margin: 0 auto;
          padding: 84px 20px 110px;
          -webkit-overflow-scrolling: touch;
        }
        .dresser-header { margin-bottom: 28px; }
        .dresser-date-row {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 10px;
        }
        .dresser-date-label {
          font-size: 12px; font-weight: 500;
          color: var(--text-secondary);
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .dresser-weather-pill {
          display: flex; align-items: center; gap: 5px;
          background: var(--bg-secondary); border: 1px solid var(--border);
          border-radius: 100px; padding: 5px 12px;
          font-size: 12px; color: var(--text-secondary);
        }
        .dresser-weather-dot {
          width: 3px; height: 3px; border-radius: 50%; background: var(--border);
        }
        .dresser-title {
          font-family: 'DM Serif Display', serif;
          font-size: 36px; font-weight: 400;
          color: var(--text); line-height: 1.15; letter-spacing: -0.02em;
        }
        .dresser-section { margin-bottom: 20px; }
        .dresser-section-label {
          font-size: 11px; font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;
        }
        .dresser-row-between {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 10px;
        }
        .dresser-row-between .dresser-section-label { margin-bottom: 0; }
        .occasion-grid { display: flex; flex-wrap: wrap; gap: 7px; }
        .occasion-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 100px;
          border: 1px solid var(--border); background: var(--bg-card);
          color: var(--text-secondary); font-size: 13px; font-weight: 500;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: all 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .occasion-chip:active { transform: scale(0.96); }
        .occasion-chip--active {
          background: var(--text); border-color: var(--text); color: var(--bg);
        }
        .occasion-chip-icon { display: flex; align-items: center; opacity: 0.7; }
        .occasion-chip--active .occasion-chip-icon { opacity: 1; }
        .category-row { display: flex; gap: 7px; flex-wrap: wrap; }
        .category-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 100px;
          border: 1px solid var(--border); background: var(--bg-card);
          color: var(--text-secondary); font-size: 12px; font-weight: 500;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: all 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .category-chip:active { transform: scale(0.96); }
        .category-chip--active { background: #0ea472; border-color: #0ea472; color: #fff; }
        .category-chip--disabled { opacity: 0.35; }
        .btn-ghost-sm {
          font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          color: var(--text-secondary); background: transparent;
          border: 1px solid var(--border); border-radius: 100px;
          padding: 5px 12px; cursor: pointer; transition: all 0.15s;
        }
        .btn-ghost-sm--active { background: var(--text); border-color: var(--text); color: var(--bg); }
        .btn-generate {
          width: 100%; display: flex; align-items: center;
          justify-content: center; gap: 9px;
          padding: 17px 24px; margin-bottom: 24px;
          border-radius: 16px; border: none;
          background: linear-gradient(135deg, #0ea472 0%, #0891b2 100%);
          color: #fff; font-size: 16px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
          -webkit-tap-highlight-color: transparent;
          box-shadow: 0 4px 20px rgba(14,164,114,0.35);
        }
        .btn-generate:active { transform: scale(0.98); opacity: 0.9; }
        .btn-generate--loading {
          background: var(--bg-secondary); color: var(--text-secondary);
          box-shadow: none; cursor: not-allowed;
        }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite; flex-shrink: 0;
        }
        .btn-generate--loading .spinner {
          border-color: var(--border); border-top-color: var(--text-secondary);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .outfit-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 20px; overflow: hidden;
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .outfit-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px; border-bottom: 1px solid var(--border);
        }
        .outfit-card-eyebrow {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text-secondary); margin-bottom: 3px;
        }
        .outfit-card-occasion {
          font-size: 15px; font-weight: 700;
          color: var(--text); letter-spacing: -0.01em;
        }
        .btn-save {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 8px 14px; border-radius: 100px;
          border: 1px solid var(--border); background: transparent;
          color: var(--text); font-size: 12px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: all 0.2s; -webkit-tap-highlight-color: transparent;
        }
        .btn-save--saved { background: #0ea472; border-color: #0ea472; color: #fff; }
        .outfit-grid { display: grid; gap: 10px; padding: 14px; }
        .outfit-grid--3 { grid-template-columns: repeat(3, 1fr); }
        .outfit-grid--2 { grid-template-columns: repeat(2, 1fr); }
        .outfit-item {
          border-radius: 12px; overflow: hidden;
          border: 1px solid var(--border); background: var(--bg-secondary);
        }
        .outfit-item-img { aspect-ratio: 1; overflow: hidden; }
        .outfit-item-img img {
          width: 100%; height: 100%; object-fit: cover;
          display: block; transition: transform 0.3s;
        }
        .outfit-item:active .outfit-item-img img { transform: scale(1.04); }
        .outfit-item-info { padding: 8px 10px; }
        .outfit-item-name {
          font-size: 12px; font-weight: 600; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;
        }
        .outfit-item-sub { font-size: 11px; color: var(--text-secondary); }
        .outfit-item--text {
          display: flex; align-items: center; justify-content: center;
          padding: 20px 12px; min-height: 90px;
          font-size: 13px; font-weight: 500; color: var(--text); text-align: center;
        }
        .outfit-reasoning {
          margin: 0 14px 14px; background: var(--bg-secondary);
          border-radius: 14px; padding: 14px 16px; border: 1px solid var(--border);
        }
        .outfit-reasoning-header {
          display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: #0ea472;
        }
        .outfit-reasoning-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #0ea472; flex-shrink: 0;
        }
        .outfit-reasoning-text {
          font-size: 13px; color: var(--text-secondary); line-height: 1.65;
        }
        .outfit-card-footer { padding: 0 14px 14px; }
        .btn-regen {
          width: 100%; display: flex; align-items: center;
          justify-content: center; gap: 7px; padding: 12px;
          background: transparent; border: 1px solid var(--border);
          border-radius: 12px; font-size: 13px; font-weight: 500;
          color: var(--text-secondary); font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .btn-regen:active { background: var(--bg-secondary); }
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 13px 28px; background: var(--text); color: var(--bg);
          border: none; border-radius: 12px; font-size: 14px; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: opacity 0.15s; -webkit-tap-highlight-color: transparent;
        }
        .btn-primary:active { opacity: 0.8; }
        .dresser-empty {
          text-align: center; padding: 48px 24px;
          background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border);
        }
        .dresser-empty-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: var(--bg-secondary); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 18px; color: var(--text-secondary);
        }
        .dresser-empty-title {
          font-family: 'DM Serif Display', serif;
          font-size: 20px; color: var(--text); margin-bottom: 8px;
        }
        .dresser-empty-sub {
          font-size: 14px; color: var(--text-secondary);
          line-height: 1.6; margin-bottom: 24px;
        }
      `}</style>
    </div>
  )
}