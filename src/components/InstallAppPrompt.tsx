'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'

type Platform = 'ios' | 'android-native' | 'android-manual' | 'desktop' | 'installed'

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'desktop'

  // Bereits als App installiert? (standalone mode)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  if (isStandalone) return 'installed'

  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
  const isAndroid = /Android/.test(ua)

  if (isIOS) return 'ios'
  if (isAndroid) return 'android-native' // wird ggf. auf 'android-manual' korrigiert, falls kein beforeinstallprompt kommt
  return 'desktop'
}

export default function InstallAppPrompt() {
  const [platform, setPlatform] = useState<Platform>('desktop')
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const { theme } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'

  const card = isDark ? '#1D1D20' : '#ffffff'
  const border = isDark ? '#2a2a2e' : '#E7E2D5'
  const text = isDark ? '#F5F3EE' : '#24211B'
  const muted = isDark ? '#9a978f' : '#8C8776'
  const accent = isDark ? '#5C82A0' : '#355C7D'
  const sageGradient = 'linear-gradient(135deg, #7FA98E, #355C7D)'

  useEffect(() => {
    const p = detectPlatform()
    setPlatform(p)

    if (p === 'installed' || p === 'desktop') return

    // Android: warten ob der native Install-Prompt kommt
    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // Falls nach 1.5s kein beforeinstallprompt kam (z.B. Samsung Internet), auf manuelle Anleitung umschalten
    const fallbackTimer = setTimeout(() => {
      setDeferredPrompt(prev => {
        if (!prev && p === 'android-native') setPlatform('android-manual')
        return prev
      })
    }, 1500)

    const dismissed = localStorage.getItem('kw_install_banner_dismissed_at')
    const shouldShow = !dismissed || (Date.now() - Number(dismissed)) > 1000 * 60 * 60 * 24 * 3 // alle 3 Tage wieder
    if (shouldShow) {
      const t = setTimeout(() => setShowBanner(true), 1200)
      return () => { clearTimeout(t); clearTimeout(fallbackTimer); window.removeEventListener('beforeinstallprompt', onBeforeInstall) }
    }

    return () => { clearTimeout(fallbackTimer); window.removeEventListener('beforeinstallprompt', onBeforeInstall) }
  }, [])

  function dismissBanner() {
    setShowBanner(false)
    localStorage.setItem('kw_install_banner_dismissed_at', String(Date.now()))
  }

  async function handleNativeInstall() {
    if (!deferredPrompt) { setShowModal(true); return }
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
      localStorage.setItem('kw_install_banner_dismissed_at', String(Date.now()))
    }
    setDeferredPrompt(null)
  }

  if (platform === 'installed' || platform === 'desktop') return null

  const bannerText = locale === 'de'
    ? { title: '📲 KiWardrobe als App installieren', sub: 'Schneller, ohne Browserleiste — wie eine echte App.' }
    : { title: '📲 Install KiWardrobe as an app', sub: 'Faster, no browser bar — just like a native app.' }

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          style={{
              width: 'calc(100% - 32px)', maxWidth: '480px', margin: '76px auto 16px',
              background: card, border: `1.5px solid ${border}`, borderRadius: '16px',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
              boxShadow: `0 6px 24px ${accent}12`, position: 'relative' as const, zIndex: 50,
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '11px', overflow: 'hidden', flexShrink: 0 }}>
              <img src="/icon-512.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: text, marginBottom: '2px' }}>{bannerText.title}</p>
              <p style={{ fontSize: '11.5px', color: muted, lineHeight: 1.4 }}>{bannerText.sub}</p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => platform === 'android-native' && deferredPrompt ? handleNativeInstall() : setShowModal(true)}
              style={{ background: sageGradient, border: 'none', borderRadius: '10px', padding: '9px 14px', fontSize: '12.5px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif", flexShrink: 0, whiteSpace: 'nowrap' as const }}>
              {locale === 'de' ? 'Installieren' : 'Install'}
            </motion.button>
            <button onClick={dismissBanner}
              style={{ position: 'absolute' as const, top: '6px', right: '6px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', color: muted, padding: '4px' }}>
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <InstallInstructionsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        platform={platform}
        locale={locale}
        theme={{ card, border, text, muted, accent, sageGradient, isDark }}
      />
    </>
  )
}

export function InstallInstructionsModal({
  open, onClose, platform, locale, theme, trigger,
}: {
  open: boolean
  onClose: () => void
  platform: Platform
  locale: string
  theme: { card: string; border: string; text: string; muted: string; accent: string; sageGradient: string; isDark: boolean }
  trigger?: React.ReactNode
}) {
  const { card, border, text, muted, accent, sageGradient } = theme

  const stepsIOSSafari = locale === 'de'
    ? [
        { icon: '⋯', title: '"•••"-Menü öffnen', desc: 'Unten rechts in der Leiste auf die drei Punkte "•••" tippen. (Falls stattdessen direkt ein Teilen-Symbol — Viereck mit Pfeil nach oben — in der Mitte der Leiste sichtbar ist, kannst du diesen Schritt überspringen und direkt darauf tippen.)' },
        { icon: '📤', title: '"Teilen" antippen', desc: 'Im aufklappenden Menü ganz oben auf "Teilen" tippen.' },
        { icon: '📜', title: 'Im Menü nach unten scrollen', desc: 'Es öffnet sich eine Liste mit App-Vorschlägen und Aktionen. "Zum Home-Bildschirm" steht meist erst weiter unten — so lange scrollen, bis du es siehst.' },
        { icon: '➕', title: '"Zum Home-Bildschirm" wählen', desc: 'Antippen, dann oben rechts auf "Hinzufügen" tippen.' },
        { icon: '✅', title: 'Fertig!', desc: 'KiWardrobe erscheint jetzt als Icon auf deinem Home-Bildschirm — startet ohne Browserleiste, wie eine echte App.' },
      ]
    : [
        { icon: '⋯', title: 'Open the "•••" menu', desc: 'Tap the three dots "•••" in the bottom right of the toolbar. (If a Share icon — square with an arrow pointing up — is already visible in the center of the toolbar, skip this step and tap that directly.)' },
        { icon: '📤', title: 'Tap "Share"', desc: 'In the menu that opens, tap "Share" at the top.' },
        { icon: '📜', title: 'Scroll down in the menu', desc: 'A list of apps and actions opens. "Add to Home Screen" is usually further down — keep scrolling until you see it.' },
        { icon: '➕', title: 'Tap "Add to Home Screen"', desc: 'Then tap "Add" in the top right corner.' },
        { icon: '✅', title: 'Done!', desc: 'KiWardrobe now appears as an icon on your home screen — opens without the browser bar, just like a native app.' },
      ]

  const stepsIOSChrome = locale === 'de'
    ? [
        { icon: '📤', title: 'Teilen-Symbol antippen', desc: 'Oben rechts in der Adressleiste auf das Teilen-Icon tippen (Viereck mit Pfeil nach oben).' },
        { icon: '📜', title: 'Runterscrollen zu "Zum Home-Bildschirm"', desc: 'In der sich öffnenden Liste nach unten scrollen (unter den einzelnen Kontakten/Apps), bis die Option "Zum Home-Bildschirm" erscheint.' },
        { icon: '➕', title: 'Hinzufügen bestätigen', desc: '"Zum Home-Bildschirm" antippen, dann oben rechts auf "Hinzufügen" tippen.' },
        { icon: '✅', title: 'Fertig!', desc: 'KiWardrobe erscheint jetzt als Icon auf deinem Home-Bildschirm — startet ohne Browserleiste, wie eine echte App.' },
      ]
    : [
        { icon: '📤', title: 'Tap the Share icon', desc: 'Top right of the address bar (square with an arrow pointing up).' },
        { icon: '📜', title: 'Scroll down to "Add to Home Screen"', desc: 'In the list that opens, scroll down past the contacts/apps row until you see "Add to Home Screen".' },
        { icon: '➕', title: 'Confirm', desc: 'Tap "Add to Home Screen", then tap "Add" in the top right corner.' },
        { icon: '✅', title: 'Done!', desc: 'KiWardrobe now appears as an icon on your home screen — opens without the browser bar, just like a native app.' },
      ]

  function detectIOSBrowser(): 'safari' | 'chrome' {
    if (typeof window === 'undefined') return 'safari'
    return /CriOS/.test(window.navigator.userAgent) ? 'chrome' : 'safari'
  }

  const [iosBrowser, setIosBrowser] = useState<'safari' | 'chrome'>(detectIOSBrowser())

  const stepsAndroidManual = locale === 'de'
    ? [
        { icon: '⋮', title: 'Menü öffnen', desc: 'Oben rechts im Browser auf die drei Punkte tippen.' },
        { icon: '📲', title: '"Zum Startbildschirm hinzufügen" wählen', desc: 'Je nach Browser heißt es auch "App installieren".' },
        { icon: '✅', title: 'Bestätigen', desc: 'Auf "Hinzufügen" bzw. "Installieren" tippen — fertig!' },
      ]
    : [
        { icon: '⋮', title: 'Open the menu', desc: 'Tap the three dots in the top right of your browser.' },
        { icon: '📲', title: 'Select "Add to Home screen"', desc: 'Depending on the browser it may say "Install app".' },
        { icon: '✅', title: 'Confirm', desc: 'Tap "Add" or "Install" — done!' },
      ]

  const steps = platform === 'ios' ? (iosBrowser === 'safari' ? stepsIOSSafari : stepsIOSChrome) : stepsAndroidManual
  const title = locale === 'de' ? 'App installieren' : 'Install app'
  const showVideo = platform === 'ios' && iosBrowser === 'safari' // Video optional, nur für Safari-Anleitung vorhanden

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '400px', maxHeight: '85vh', overflowY: 'auto' as const, background: card, border: `1px solid ${border}`, borderRadius: '24px', padding: '26px 22px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 500, color: text, letterSpacing: '-0.02em' }}>{title}</h2>
              <button onClick={onClose}
                style={{ background: 'transparent', border: `1px solid ${border}`, borderRadius: '10px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', color: muted }}>✕</button>
            </div>

            {platform === 'ios' && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                {(['safari', 'chrome'] as const).map(b => (
                  <button key={b} onClick={() => setIosBrowser(b)}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '10px', cursor: 'pointer',
                      fontSize: '12.5px', fontWeight: 700, fontFamily: "'Poppins', 'Inter', sans-serif",
                      border: `1.5px solid ${iosBrowser === b ? accent : border}`,
                      background: iosBrowser === b ? `${accent}14` : 'transparent',
                      color: iosBrowser === b ? accent : muted,
                    }}>
                    {b === 'safari' ? 'Safari' : 'Chrome'}
                  </button>
                ))}
              </div>
            )}

            {showVideo && (
              <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '18px', border: `1px solid ${border}`, background: '#000' }}>
                <video
                  src="/install-iphone.mp4"
                  controls
                  playsInline
                  muted
                  style={{ width: '100%', display: 'block' }}
                  onError={e => { (e.target as HTMLVideoElement).style.display = 'none' }}
                />
              </div>
            )}

            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < steps.length - 1 ? '18px' : '0' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: `${accent}14`, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>
                  {step.icon}
                </div>
                <div>
                  <p style={{ fontSize: '13.5px', fontWeight: 700, color: text, marginBottom: '3px' }}>
                    {i + 1}. {step.title}
                  </p>
                  <p style={{ fontSize: '12.5px', color: muted, lineHeight: 1.55 }}>{step.desc}</p>
                </div>
              </div>
            ))}

            <button onClick={onClose}
              style={{ width: '100%', marginTop: '22px', padding: '13px', background: sageGradient, border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
              {locale === 'de' ? 'Verstanden' : 'Got it'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}