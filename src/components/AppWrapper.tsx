'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SplashScreen from './SplashScreen'

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('splashShown')
    const isAppPage = pathname.includes('/dresser') || pathname.includes('/wardrobe') || pathname.includes('/outfits') || pathname.includes('/profile')
    if (!hasSeenSplash && isAppPage) {
      setShowSplash(true)
      sessionStorage.setItem('splashShown', 'true')
      // Daten im Hintergrund vorladen
      preloadData()
    }
  }, [])

  async function preloadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    // Kleidung und Outfits parallel laden
    await Promise.all([
      supabase.from('clothing_items').select('*').eq('user_id', session.user.id),
      supabase.from('outfits').select('*').eq('user_id', session.user.id),
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    ])
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      {children}
    </>
  )
}