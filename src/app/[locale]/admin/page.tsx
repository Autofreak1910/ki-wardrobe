'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const ADMIN_EMAIL = 'kiwardrobebusiness@gmail.com'

type Stats = {
  totalUsers: number
  premiumUsers: number
  freeUsers: number
  newToday: number
  newWeek: number
  outfitsToday: number
  outfitsWeek: number
  avatarsToday: number
  totalItems: number
mrr: string
  payingUsers: number
  referralPremium: number
  recentUsers: { username: string; created_at: string; is_premium: boolean }[]
}

export default function AdminPage() {
  const [authChecking, setAuthChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const bg = '#080c18'
  const card = '#0d1225'
  const border = '#1a2540'
  const text = '#e8eeff'
  const muted = '#4d6080'
  const accent = '#4d7eff'
  const green = '#0ea472'
  const gold = '#f59e0b'

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
      router.push('/de/dresser')
      return
    }
    setAuthorized(true)
    setAuthChecking(false)
  }

  async function unlock() {
    setLoading(true)
    setPasswordError('')
    try {
      const res = await fetch('/api/admin-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, userEmail: ADMIN_EMAIL }),
      })
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setUnlocked(true)
      } else {
        setPasswordError('Falsches Passwort')
      }
    } catch {
      setPasswordError('Fehler beim Verbinden')
    }
    setLoading(false)
  }

  async function refresh() {
    setLoading(true)
    const res = await fetch('/api/admin-dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, userEmail: ADMIN_EMAIL }),
    })
    const data = await res.json()
    if (data.success) setStats(data.stats)
    setLoading(false)
  }

  if (authChecking) {
    return <div style={{ height: '100dvh', background: bg }} />
  }

  if (!authorized) return null

  if (!unlocked) {
    return (
      <div style={{ height: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: '360px', background: card, border: `1px solid ${border}`, borderRadius: '20px', padding: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: accent, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Restricted</p>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: text, marginBottom: '20px' }}>
            Admin Dashboard
          </h1>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && unlock()}
            placeholder="Passwort"
            style={{ width: '100%', background: bg, border: `1.5px solid ${border}`, borderRadius: '12px', padding: '13px 16px', fontSize: '14px', color: text, outline: 'none', marginBottom: '12px', boxSizing: 'border-box' as const, fontFamily: "'DM Sans', sans-serif" }} />
          {passwordError && <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px' }}>{passwordError}</p>}
          <button onClick={unlock} disabled={loading}
            style={{ width: '100%', background: `linear-gradient(135deg, ${accent}, #6b9fff)`, border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {loading ? '...' : 'Entsperren →'}
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: bg, fontFamily: "'DM Sans', sans-serif", padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: '7px', height: '7px', borderRadius: '50%', background: green }} />
              <p style={{ fontSize: '11px', fontWeight: 700, color: green, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Live</p>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '32px', fontWeight: 400, color: text, letterSpacing: '-0.02em' }}>
              KiWardrobe <em style={{ color: accent }}>Control</em>
            </h1>
          </div>
          <button onClick={refresh} disabled={loading}
            style={{ background: card, border: `1px solid ${border}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: text, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {loading ? '...' : '↻ Refresh'}
          </button>
        </div>

        {stats && (
          <>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: `linear-gradient(135deg, ${green}, #0891b2)`, borderRadius: '24px', padding: '28px', marginBottom: '16px', position: 'relative' as const, overflow: 'hidden' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: '8px' }}>Monthly Recurring Revenue</p>
              <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '52px', fontWeight: 400, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                €{stats.mrr}
              </p>
       <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginTop: '8px' }}>
                {stats.payingUsers} zahlende Mitglieder × €4,99
                {stats.referralPremium > 0 && ` · +${stats.referralPremium} via Referral (kostenlos)`}
              </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'User gesamt', value: stats.totalUsers, color: text },
                { label: 'Pro Mitglieder', value: stats.premiumUsers, color: gold },
                { label: 'Neu heute', value: stats.newToday, color: green },
                { label: 'Neu diese Woche', value: stats.newWeek, color: accent },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px 14px' }}>
                  <p style={{ fontSize: '26px', fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: '4px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: muted, fontWeight: 500 }}>{s.label}</p>
                </motion.div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Outfits heute', value: stats.outfitsToday },
                { label: 'Outfits diese Woche', value: stats.outfitsWeek },
                { label: 'Try-Ons heute', value: stats.avatarsToday },
              ].map((s, i) => (
                <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px 14px', textAlign: 'center' as const }}>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: text, letterSpacing: '-0.03em', marginBottom: '4px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: muted, fontWeight: 500 }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${border}` }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Neueste User</p>
              </div>
              {stats.recentUsers.map((u, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: i < stats.recentUsers.length - 1 ? `1px solid ${border}` : 'none' }}>
                  <p style={{ fontSize: '14px', color: text, fontWeight: 600 }}>{u.username}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {u.is_premium && (
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, ${gold}, #f59e0b)`, borderRadius: '4px', padding: '2px 6px' }}>PRO</span>
                    )}
                    <p style={{ fontSize: '12px', color: muted }}>{new Date(u.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '13px', color: muted }}>Kleidungsstücke gesamt im System</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: text }}>{stats.totalItems}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}