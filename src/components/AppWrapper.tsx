'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SplashScreen from './SplashScreen'

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const isAppPage = pathname.includes('/dresser') || pathname.includes('/wardrobe') || pathname.includes('/outfits') || pathname.includes('/profile')
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
      }}>
        {children}
      </div>
    </>
  )
}