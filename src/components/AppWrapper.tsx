'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import SplashScreen from './SplashScreen'

const TAB_ORDER = ['dresser', 'wardrobe', 'outfits', 'profile']

function getTabIndex(pathname: string) {
  return TAB_ORDER.findIndex(t => pathname.includes(t))
}

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionKey, setTransitionKey] = useState(0)
  const [direction, setDirection] = useState(0) // -1 left, 1 right
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
    const prevIdx = getTabIndex(prevPathname.current)
    const nextIdx = getTabIndex(pathname)
    if (prevIdx !== -1 && nextIdx !== -1 && prevIdx !== nextIdx) {
      setDirection(nextIdx > prevIdx ? 1 : -1)
    } else {
      setDirection(0)
    }
    prevPathname.current = pathname
    setDisplayChildren(children)
    setTransitionKey(k => k + 1)
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

  const variants = {
    enter: (dir: number) => ({
      x: dir === 0 ? 0 : dir > 0 ? '30%' : '-30%',
      opacity: 0,
      scale: dir === 0 ? 0.98 : 1,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir === 0 ? 0 : dir > 0 ? '-30%' : '30%',
      opacity: 0,
      scale: dir === 0 ? 0.98 : 1,
    }),
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <div style={{
        opacity: showSplash ? 0 : 1,
        transition: 'opacity 0.3s ease',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={transitionKey}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.28,
              ease: [0.32, 0, 0.67, 0],
            }}
            style={{
              position: 'absolute',
              inset: 0,
              willChange: 'transform, opacity',
            }}
          >
            {displayChildren}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}