'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SplashScreen from './SplashScreen'

const TAB_ORDER = ['dresser', 'wardrobe', 'outfits', 'profile']

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [animating, setAnimating] = useState(false)
  const [masking, setMasking] = useState(false)
  const [direction, setDirection] = useState(0)
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const isAppPage = TAB_ORDER.some(t => pathname.includes(t))
    if (!isAppPage) { setShowSplash(false); return }
    const hasSeenSplash = sessionStorage.getItem('splashShown')
    if (hasSeenSplash) { setShowSplash(false); return }
    preloadData()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/' + pathname.split('/')[1] + '/auth/login')
      }
    })
  }, [])

  useEffect(() => {
    const prevIdx = TAB_ORDER.findIndex(t => prevPathname.current.includes(t))
    const nextIdx = TAB_ORDER.findIndex(t => pathname.includes(t))

    if (prevIdx !== -1 && nextIdx !== -1 && prevIdx !== nextIdx) {
      setDirection(nextIdx > prevIdx ? 1 : -1)
      // Erst Maske drüber legen
      setMasking(true)
      // Dann nach kurzer Pause Maske weg + Animation
      setTimeout(() => {
        setMasking(false)
        setAnimating(true)
        setTimeout(() => setAnimating(false), 280)
      }, 80)
    }
    prevPathname.current = pathname
  }, [pathname])

  async function preloadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    await Promise.all([
      supabase.from('clothing_items').select('*').eq('user_id', session.user.id),
      supabase.from('outfits').select('*').eq('user_id', session.user.id),
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    ])
  }

  function handleSplashDone() {
    sessionStorage.setItem('splashShown', 'true')
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <div style={{
        opacity: showSplash ? 0 : 1,
        transition: 'opacity 0.3s ease',
        height: '100%',
        position: 'relative',
      }}>

        {/* Maske die kurz drüber liegt beim Wechsel */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'var(--bg)',
          opacity: masking ? 1 : 0,
          pointerEvents: masking ? 'all' : 'none',
          transition: masking ? 'none' : 'opacity 0.15s ease',
        }} />

        <div
          key={pathname}
          style={{
            height: '100%',
            animation: animating
              ? `slideIn${direction > 0 ? 'Right' : 'Left'} 0.28s cubic-bezier(0.16, 1, 0.3, 1) both`
              : 'none',
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  )
}