'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import SplashScreen from './SplashScreen'
import OnboardingCarousel from './OnboardingCarousel'
import WelcomeAnimation from './WelcomeAnimation'
import Navbar from './Navbar'


const TAB_ORDER = ['dresser', 'wardrobe', 'outfits', 'profile']

// Reihenfolge der Tabs in der Navbar -- fuer die Richtung des Slide (links/rechts)
const NAV_ORDER = ['dresser', 'wardrobe', 'avatar', 'outfits', 'profile']

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function setupPushNotifications() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission === 'denied') return

    const registration = await navigator.serviceWorker.register('/sw-push.js')
    await navigator.serviceWorker.ready

    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission !== 'granted') return

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
    }

    const subJson = subscription.toJSON()
    await fetch('/api/save-push-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
    })
  } catch (err) {
    console.error('Push setup failed:', err)
  }
}

// Feedback & Legal sind inhaltlich Unterseiten vom Profil -- die Navbar soll dort
// stehen bleiben (mit "Profil" aktiv markiert), statt komplett zu verschwinden.
function getActivePage(pathname: string): string | null {
  for (const tab of NAV_ORDER) {
    if (pathname.includes(tab)) return tab
  }
  if (pathname.includes('feedback') || pathname.includes('legal')) return 'profile'
  return null
}



export default function AppWrapper({ children }: { children: React.ReactNode }) {
const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [dbOnboardingSeen, setDbOnboardingSeen] = useState<boolean | null>(null)
const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()


useEffect(() => {
    const isAppPage = TAB_ORDER.some(t => pathname.includes(t))
    if (!isAppPage) { setShowSplash(false); return }

    const forceOnboarding = localStorage.getItem('kw_force_onboarding') === 'true'

    if (forceOnboarding) {
      localStorage.removeItem('kw_force_onboarding')
      setShowSplash(false)
      setShowOnboarding(true)
      preloadData()
    } else {
      const hasSeenSplash = sessionStorage.getItem('splashShown')

      if (hasSeenSplash) {
        setShowSplash(false)
        checkOnboardingStatus()
      } else {
        preloadData()
      }
    }

supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/' + pathname.split('/')[1] + '/auth/login')
      }
    })
  }, [pathname])


  async function checkOnboardingStatus() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const { data } = await supabase.from('profiles').select('onboarding_seen').eq('id', session.user.id).single()
    const seen = data?.onboarding_seen ?? false
    setDbOnboardingSeen(seen)
    if (!seen) setShowOnboarding(true)
  }

 async function preloadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const [,, profileRes] = await Promise.all([
      supabase.from('clothing_items').select('*').eq('user_id', session.user.id),
      supabase.from('outfits').select('*').eq('user_id', session.user.id),
      supabase.from('profiles').select('is_premium, onboarding_seen').eq('id', session.user.id).single(),
    ])
    if (profileRes.data?.is_premium) setIsPremium(true)
    setDbOnboardingSeen(profileRes.data?.onboarding_seen ?? false)
  }

  function handleSplashDone() {
    sessionStorage.setItem('splashShown', 'true')
    setShowSplash(false)
    if (dbOnboardingSeen === false) {
      setShowOnboarding(true)
    } else if (dbOnboardingSeen === null) {
      checkOnboardingStatus()
    }
  }
async function handleOnboardingDone() {
    setShowOnboarding(false)
    setShowWelcome(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await supabase.from('profiles').update({ onboarding_seen: true }).eq('id', session.user.id)
    }
  }

  function handleWelcomeDone() {
    setShowWelcome(false)
  }

  const activePage = getActivePage(pathname)

return (
    <>
     {showSplash && <SplashScreen onDone={handleSplashDone} isPremium={isPremium} />}
      {showOnboarding && <OnboardingCarousel onDone={handleOnboardingDone} />}
      {showWelcome && <WelcomeAnimation onDone={handleWelcomeDone} />}
    
      <div style={{
        opacity: showSplash ? 0 : 1,
        transition: 'opacity 0.3s ease',
        height: '100%',
        position: 'relative' as const,
        overflow: 'hidden',
      }}>
        {/*
          Navbar sitzt jetzt HIER, ausserhalb des animierten Bereichs -- bleibt beim
          Seitenwechsel absolut ruhig stehen, unabhaengig davon wie stark der Inhalt
          darunter rutscht/federt. Einzelne Seiten rendern KEINE eigene <Navbar/> mehr.
        */}
        {activePage && <Navbar activePage={activePage} />}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
            style={{ height: '100%' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}