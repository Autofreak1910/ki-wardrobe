'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import SplashScreen from './SplashScreen'

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Splash nur beim ersten App-Start zeigen
    const hasSeenSplash = sessionStorage.getItem('splashShown')
    const isAppPage = pathname.includes('/dresser') || pathname.includes('/wardrobe') || pathname.includes('/outfits') || pathname.includes('/profile')
    if (!hasSeenSplash && isAppPage) {
      setShowSplash(true)
      sessionStorage.setItem('splashShown', 'true')
    }
  }, [])

  function handleSplashDone() {
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {children}
    </>
  )
}