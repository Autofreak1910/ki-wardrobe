'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

type Outfit = {
  id: string
  name: string
  occasion: string
  item_ids: string[]
  is_favorite: boolean
  created_at: string
}

type ClothingItem = {
  id: string
  image_url: string
  name?: string
  color: string
  category: string
}

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const isDark = theme === 'dark'

  const occasionEmoji: Record<string, string> = {
    casual: '😎', uni: '🎒', work: '💼', date: '🌹', sport: '🏃', party: '🎉', festival: '🎪'
  }

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [outfitsRes, itemsRes] = await Promise.all([
      supabase.from('outfits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('clothing_items').select('*').eq('user_id', user.id)
    ])
    if (outfitsRes.data) setOutfits(outfitsRes.data)
    if (itemsRes.data) setItems(itemsRes.data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function toggleFavorite(outfit: Outfit) {
    await supabase.from('outfits').update({ is_favorite: !outfit.is_favorite }).eq('id', outfit.id)
    setOutfits(prev => prev.map(o => o.id === outfit.id ? { ...o, is_favorite: !o.is_favorite } : o))
  }

  async function deleteOutfit(id: string) {
    await supabase.from('outfits').delete().eq('id', id)
    setOutfits(prev => prev.filter(o => o.id !== id))
  }

  function getItemsForOutfit(outfit: Outfit) {
    return outfit.item_ids?.map(id => items.find(i => i.id === id)).filter(Boolean) as ClothingItem[]
  }

  return (
  <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' as const, background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <Navbar activePage="outfits" />

      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '800px', width: '100%', margin: '0 auto', padding: '24px 16px 100px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', fontWeight: 400, color: 'var(--text)', marginBottom: '4px' }}>
              {t('outfits.title')}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{outfits.length} {t('outfits.saved')}</p>
          </div>
          <button onClick={() => router.push('/' + locale + '/dresser')}
            style={{ background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' as const }}>
            ✦ {t('outfits.newOutfit')}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>{t('outfits.loading')}</div>
        ) : outfits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👔</div>
            <p style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px', fontFamily: "'DM Serif Display', serif" }}>{t('outfits.empty')}</p>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>{t('outfits.emptySub')}</p>
            <button onClick={() => router.push('/' + locale + '/dresser')}
              style={{ background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', borderRadius: '12px', padding: '13px 28px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {t('outfits.dressMe')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {outfits.map(outfit => {
              const outfitItems = getItemsForOutfit(outfit)
              return (
                <div key={outfit.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(outfitItems.length || 1, 3)}, 1fr)`, height: '140px' }}>
                    {outfitItems.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                        <img src={item.image_url} alt={item.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                    {outfitItems.length === 0 && (
                      <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', fontSize: '32px' }}>
                        {occasionEmoji[outfit.occasion] ?? '👔'}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{outfit.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px' }}>{occasionEmoji[outfit.occasion]}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{outfitItems.length} {t('outfits.pieces')}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button onClick={() => toggleFavorite(outfit)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '14px' }}>
                          {outfit.is_favorite ? '❤️' : '🤍'}
                        </button>
                        <button onClick={() => deleteOutfit(outfit.id)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '14px' }}>
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}