'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const occasions = ['casual', 'uni', 'work', 'date', 'sport', 'party', 'festival'] as const

const categoryConfig = [
  { key: 'tops',   label: 'Tops' },
  { key: 'hosen',  label: 'Hosen' },
  { key: 'jacken', label: 'Jacken' },
  { key: 'schuhe', label: 'Schuhe' },
  { key: 'acc',    label: 'Acc' },
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
  const { theme } = useTheme()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isDark = theme === 'dark'
  const mainRef = useRef<HTMLElement>(null)

  const days = locale === 'de'
    ? ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag']
    : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const today = days[new Date().getDay()]
  // TEST
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
              itemName.split(' ').some(w => w.length > 3 && searchName.includes(w)) ||
              searchName.split(' ').some(w => w.length > 3 && itemName.includes(w))
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
    <div className="app-container d-root">
      <Navbar activePage="dresser" />
      <main ref={mainRef} className="d-main">

        {/* Header */}
        <div className="d-header">
          <p className="d-eyebrow">{today} · {dateStr}</p>
          <h1 className="d-title">{t('dresser.title')}</h1>
          <div className="d-meta">
            <span className="d-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity=".5"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-12.37l-1.06 1.06a.996.996 0 000 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 000-1.41-.996.996 0 00-1.41 0zM7.05 18.36l-1.06 1.06a.996.996 0 000 1.41c.39.39 1.03.39 1.41 0l1.06-1.06a.996.996 0 000-1.41-.96.96 0 00-1.41 0z"/></svg>
              18°C
            </span>
            <span className="d-meta-dot" />
            <span className="d-meta-item">{wardrobeItems.length} {t('wardrobe.pieces')}</span>
          </div>
        </div>

        {!hasItems ? (
          <div className="d-empty">
            <div className="d-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            </div>
            <p className="d-empty-title">{t('dresser.notEnough')}</p>
            <p className="d-empty-sub">{t('dresser.notEnoughSub')}</p>
            <button className="d-btn-primary" onClick={() => router.push('/' + locale + '/wardrobe')}>
              {t('dresser.uploadNow')}
            </button>
          </div>
        ) : (
          <>
            {/* Occasion */}
            <div className="d-block">
              <p className="d-label">{locale === 'de' ? 'Anlass' : 'Occasion'}</p>
              <div className="d-chips">
                {occasions.map(occ => (
                  <button
                    key={occ}
                    className={`d-chip${selected === occ ? ' d-chip--on' : ''}`}
                    onClick={() => { setSelected(occ); setOutfit(null); setSaved(false) }}
                  >
                    {t('dresser.occasions.' + occ)}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="d-block">
              <div className="d-block-head">
                <p className="d-label">{t('dresser.whatForOutfit')}</p>
                <button
                  className={`d-chip-sm${activeCategories.length === 5 ? ' d-chip-sm--on' : ''}`}
                  onClick={() => { setActiveCategories(['tops','hosen','jacken','schuhe','acc']); setOutfit(null) }}
                >
                  {locale === 'de' ? 'Alle' : 'All'}
                </button>
              </div>
              <div className="d-chips">
                {categoryConfig.map(cat => {
                  const isOn = activeCategories.includes(cat.key)
                  const exists = wardrobeItems.some(i => i.category === cat.key)
                  return (
                    <button
                      key={cat.key}
                      className={`d-chip${isOn ? ' d-chip--on' : ''}${!exists ? ' d-chip--dim' : ''}`}
                      onClick={() => toggleCategory(cat.key)}
                    >
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CTA */}
            <button
              className={`d-cta${loading ? ' d-cta--loading' : ''}`}
              onClick={generateOutfit}
              disabled={loading}
            >
              {loading
                ? <><span className="d-spinner" /><span>{t('dresser.generating')}</span></>
                : <span>{t('dresser.button')}</span>
              }
            </button>

            {/* Result */}
            {outfit && (
              <div className="d-card">
                <div className="d-card-top">
                  <div>
                    <p className="d-card-eyebrow">{t('dresser.outfitFor')}</p>
                    <p className="d-card-title">{t('dresser.occasions.' + selected)}</p>
                  </div>
                  <button className={`d-save${saved ? ' d-save--on' : ''}`} onClick={saveOutfit}>
                    {saved
                      ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> {t('dresser.saved')}</>
                      : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> {t('dresser.save')}</>
                    }
                  </button>
                </div>

                <div className={`d-grid d-grid--${outfit.itemObjects.length >= 3 ? '3' : '2'}`}>
                  {outfit.itemObjects.length > 0
                    ? outfit.itemObjects.map((item, i) => (
                      <div key={i} className="d-item">
                        <div className="d-item-img"><img src={item.image_url} alt={item.name ?? ''} /></div>
                        <div className="d-item-info">
                          <p className="d-item-name">{item.name}</p>
                          <p className="d-item-sub">{item.color}{item.brand ? ` · ${item.brand}` : ''}</p>
                        </div>
                      </div>
                    ))
                    : outfit.items.map((name, i) => (
                      <div key={i} className="d-item d-item--text"><p>{name}</p></div>
                    ))
                  }
                </div>

                {outfit.reasoning && (
                  <div className="d-ai">
                    <p className="d-ai-label">
                      <span className="d-ai-dot" />
                      {t('dresser.kiStylist')}
                    </p>
                    <p className="d-ai-text">{outfit.reasoning}</p>
                  </div>
                )}

                <div className="d-card-foot">
                  <button className="d-regen" onClick={generateOutfit}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                    {t('dresser.newOutfit')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        .d-root {
          height:100vh; height:100dvh;
          display:flex; flex-direction:column;
          background:var(--bg); overflow:hidden;
        }
        .d-main {
          flex:1; overflow-y:auto; overflow-x:hidden;
          max-width:540px; width:100%; margin:0 auto;
          padding:80px 20px 108px;
          -webkit-overflow-scrolling:touch;
        }

        /* Header */
        .d-header { margin-bottom:32px; }
        .d-eyebrow {
          font-size:11px; font-weight:500; letter-spacing:0.06em;
          text-transform:uppercase; color:var(--text-secondary); margin-bottom:8px;
        }
    .d-title {
          font-family:'DM Sans',sans-serif;
          font-size:28px; font-weight:700; line-height:1.1;
          letter-spacing:-0.03em; color:var(--text); margin-bottom:12px;
        }
        .d-meta {
          display:inline-flex; align-items:center; gap:6px;
          font-size:12px; color:var(--text-secondary);
        }
        .d-meta-item { display:flex; align-items:center; gap:4px; }
        .d-meta-dot { width:3px; height:3px; border-radius:50%; background:var(--border); }

        /* Blocks */
        .d-block { margin-bottom:24px; }
        .d-block-head {
          display:flex; align-items:center;
          justify-content:space-between; margin-bottom:10px;
        }
        .d-label {
          font-size:11px; font-weight:600; letter-spacing:0.07em;
          text-transform:uppercase; color:var(--text-secondary);
        }

        /* Chips */
        .d-chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
        .d-chip {
          padding:8px 15px; border-radius:8px;
          border:1px solid var(--border);
          background:transparent;
          color:var(--text-secondary);
          font-size:13px; font-weight:500;
          font-family:'DM Sans',sans-serif;
          cursor:pointer; transition:all 0.12s;
          -webkit-tap-highlight-color:transparent;
          letter-spacing:-0.01em;
        }
        .d-chip:active { transform:scale(0.96); }
        .d-chip--on {
          background:var(--text); border-color:var(--text); color:var(--bg);
        }
        .d-chip--dim { opacity:0.3; }
        .d-chip-sm {
          font-size:11px; font-weight:600;
          font-family:'DM Sans',sans-serif;
          padding:5px 11px; border-radius:6px;
          border:1px solid var(--border);
          background:transparent; color:var(--text-secondary);
          cursor:pointer; transition:all 0.12s; white-space:nowrap;
        }
        .d-chip-sm--on {
          background:var(--text); border-color:var(--text); color:var(--bg);
        }

        /* CTA */
       .d-cta {
          width:100%; padding:16px;
          border-radius:12px; border:none;
          background:#000000; color:#ffffff;
          font-size:15px; font-weight:600;
          font-family:'DM Sans',sans-serif;
          cursor:pointer; margin-bottom:24px;
          display:flex; align-items:center;
          justify-content:center; gap:8px;
          transition:opacity 0.15s, transform 0.15s;
          -webkit-tap-highlight-color:transparent;
          letter-spacing:-0.01em;
        }
        .d-cta:active { transform:scale(0.985); opacity:0.85; }
        .d-cta--loading {
          background:var(--bg-secondary);
          color:var(--text-secondary); cursor:not-allowed;
        }
        .d-spinner {
          width:15px; height:15px; border-radius:50%; flex-shrink:0;
          border:2px solid var(--border); border-top-color:var(--text-secondary);
          animation:dspin .65s linear infinite;
        }
        @keyframes dspin { to { transform:rotate(360deg); } }

        /* Card */
        .d-card {
          border:1px solid var(--border); border-radius:16px;
          overflow:hidden; background:var(--bg-card);
          animation:dslide .3s cubic-bezier(.16,1,.3,1);
        }
        @keyframes dslide {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .d-card-top {
          display:flex; align-items:center;
          justify-content:space-between;
          padding:14px 16px;
          border-bottom:1px solid var(--border);
        }
        .d-card-eyebrow {
          font-size:10px; font-weight:600; letter-spacing:0.07em;
          text-transform:uppercase; color:var(--text-secondary); margin-bottom:2px;
        }
        .d-card-title {
          font-size:15px; font-weight:700;
          color:var(--text); letter-spacing:-0.02em;
        }

        /* Save */
        .d-save {
          display:inline-flex; align-items:center; gap:5px;
          padding:7px 13px; border-radius:8px;
          border:1px solid var(--border);
          background:transparent; color:var(--text);
          font-size:12px; font-weight:600;
          font-family:'DM Sans',sans-serif; cursor:pointer;
          transition:all 0.15s; -webkit-tap-highlight-color:transparent;
        }
        .d-save--on { background:var(--text); border-color:var(--text); color:var(--bg); }

        /* Grid */
        .d-grid { display:grid; gap:8px; padding:12px; }
        .d-grid--3 { grid-template-columns:repeat(3,1fr); }
        .d-grid--2 { grid-template-columns:repeat(2,1fr); }
        .d-item {
          border-radius:10px; overflow:hidden;
          border:1px solid var(--border); background:var(--bg-secondary);
        }
        .d-item-img { aspect-ratio:1; overflow:hidden; }
        .d-item-img img {
          width:100%; height:100%; object-fit:cover;
          display:block; transition:transform .3s;
        }
        .d-item:active .d-item-img img { transform:scale(1.05); }
        .d-item-info { padding:7px 9px; }
        .d-item-name {
          font-size:11px; font-weight:600; color:var(--text);
          white-space:nowrap; overflow:hidden;
          text-overflow:ellipsis; margin-bottom:1px;
        }
        .d-item-sub { font-size:10px; color:var(--text-secondary); }
        .d-item--text {
          display:flex; align-items:center; justify-content:center;
          padding:16px 8px; min-height:80px;
          font-size:12px; font-weight:500; color:var(--text); text-align:center;
        }

        /* AI */
        .d-ai {
          margin:0 12px 12px;
          border:1px solid var(--border);
          border-radius:10px; padding:12px 14px;
          background:var(--bg-secondary);
        }
        .d-ai-label {
          display:flex; align-items:center; gap:7px;
          font-size:10px; font-weight:700; letter-spacing:0.07em;
          text-transform:uppercase; color:var(--text-secondary); margin-bottom:7px;
        }
    .d-ai-dot {
          width:5px; height:5px; border-radius:50%;
          background:var(--text-secondary); flex-shrink:0;
        }
        .d-ai-text { font-size:13px; color:var(--text-secondary); line-height:1.6; }

        /* Footer */
        .d-card-foot { padding:0 12px 12px; }
        .d-regen {
          width:100%; padding:11px;
          display:flex; align-items:center;
          justify-content:center; gap:6px;
          background:transparent;
          border:1px solid var(--border);
          border-radius:8px; font-size:12px;
          font-weight:500; color:var(--text-secondary);
          font-family:'DM Sans',sans-serif;
          cursor:pointer; transition:background .12s;
          -webkit-tap-highlight-color:transparent;
        }
        .d-regen:active { background:var(--bg-secondary); }

        /* Primary btn */
        .d-btn-primary {
          padding:12px 24px; background:var(--text); color:var(--bg);
          border:none; border-radius:10px; font-size:14px; font-weight:600;
          font-family:'DM Sans',sans-serif; cursor:pointer;
          transition:opacity .15s; -webkit-tap-highlight-color:transparent;
        }
        .d-btn-primary:active { opacity:0.8; }

        /* Empty */
        .d-empty {
          text-align:center; padding:48px 24px;
          border:1px solid var(--border); border-radius:16px;
          background:var(--bg-card);
        }
        .d-empty-icon {
          width:48px; height:48px; border-radius:12px;
          border:1px solid var(--border); background:var(--bg-secondary);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 16px; color:var(--text-secondary);
        }
        .d-empty-title {
          font-family:'DM Serif Display',serif;
          font-size:18px; color:var(--text); margin-bottom:8px;
        }
        .d-empty-sub {
          font-size:13px; color:var(--text-secondary);
          line-height:1.6; margin-bottom:20px;
        }
      `}</style>
    </div>
  )
}