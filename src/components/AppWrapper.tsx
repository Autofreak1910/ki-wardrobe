'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SplashScreen from './SplashScreen'
import OnboardingCarousel from './OnboardingCarousel'
import WelcomeAnimation from './WelcomeAnimation'

const TAB_ORDER = ['dresser', 'wardrobe', 'outfits', 'profile']

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

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

useEffect(() => {
    const isAppPage = TAB_ORDER.some(t => pathname.includes(t))
    if (!isAppPage) { setShowSplash(false); return }

    const hasSeenSplash = sessionStorage.getItem('splashShown')
    const hasSeenOnboarding = localStorage.getItem('kw_onboarding_seen')

    if (hasSeenSplash) {
      setShowSplash(false)
      if (!hasSeenOnboarding) setShowOnboarding(true)
    } else {
      preloadData()
    }

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
    const hasSeenOnboarding = localStorage.getItem('kw_onboarding_seen')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }
function handleOnboardingDone() {
    localStorage.setItem('kw_onboarding_seen', 'true')
    setShowOnboarding(false)
    setShowWelcome(true)
  }

  function handleWelcomeDone() {
    setShowWelcome(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {showOnboarding && <OnboardingCarousel onDone={handleOnboardingDone} />}
      {showWelcome && <WelcomeAnimation onDone={handleWelcomeDone} />}
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