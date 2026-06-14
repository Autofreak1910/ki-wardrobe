'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SplashScreen from './SplashScreen'

const TAB_ORDER = ['dresser', 'wardrobe', 'outfits', 'profile']

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [displayed, setDisplayed] = useState<React.ReactNode>(null)
  const [incoming, setIncoming] = useState<React.ReactNode>(null)
  const [phase, setPhase] = useState<'idle' | 'enter'>('idle')
  const [direction, setDirection] = useState(0)
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const prevIdx = useRef(-1)
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

  // First render — just show immediately
  useEffect(() => {
    if (displayed === null) {
      setDisplayed(children)
      prevIdx.current = TAB_ORDER.findIndex(t => pathname.includes(t))
    }
  }, [])

  useEffect(() => {
    if (displayed === null) return // wait for first render
    if (pathname === prevPathname.current) {
      // Same path, just update content
      setDisplayed(children)
      return
    }

    const pIdx = TAB_ORDER.findIndex(t => prevPathname.current.includes(t))
    const nIdx = TAB_ORDER.findIndex(t => pathname.includes(t))
    const dir = (pIdx !== -1 && nIdx !== -1) ? (nIdx > pIdx ? 1 : -1) : 0

    prevPathname.current = pathname
    setDirection(dir)
    setIncoming(children)
    setPhase('enter')

    // After animation done, swap displayed
    const t = setTimeout(() => {
      setDisplayed(children)
      setIncoming(null)
      setPhase('idle')
    }, 300)

    return () => clearTimeout(t)
  }, [pathname, children])

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
        overflow: 'hidden',
      }}>

        {/* Alte Seite bleibt sichtbar, slided raus */}
        <div style={{
          position: 'absolute', inset: 0,
          animation: phase === 'enter'
            ? `exitTo${direction > 0 ? 'Left' : 'Right'} 0.3s cubic-bezier(0.4,0,0.2,1) both`
            : 'none',
          zIndex: phase === 'enter' ? 1 : 2,
        }}>
          {displayed}
        </div>

        {/* Neue Seite slided rein */}
        {phase === 'enter' && incoming && (
          <div style={{
            position: 'absolute', inset: 0,
            animation: `enterFrom${direction > 0 ? 'Right' : 'Left'} 0.3s cubic-bezier(0.4,0,0.2,1) both`,
            zIndex: 2,
          }}>
            {incoming}
          </div>
        )}
      </div>

      <style>{`
        @keyframes exitToLeft {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(-18%); opacity: 0; }
        }
        @keyframes exitToRight {
          from { transform: translateX(0); opacity: 1; }
          to   { transform: translateX(18%); opacity: 0; }
        }
        @keyframes enterFromRight {
          from { transform: translateX(18%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes enterFromLeft {
          from { transform: translateX(-18%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}