'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Platform = 'ios-safari' | 'ios-installed' | 'android'

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'ios-safari'
  const ua = window.navigator.userAgent
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  if (isIOS) return isStandalone ? 'ios-installed' : 'ios-safari'
  return 'android'
}

export default function LocationPermissionHelpModal({
  open,
  onClose,
  locale,
  theme,
}: {
  open: boolean
  onClose: () => void
  locale: string
  theme: {
    bg: string
    card: string
    border: string
    text: string
    muted: string
    accent: string
    sageGradient: string
  }
}) {
  const { bg, card, border, text, muted, accent, sageGradient } = theme
  const [platform] = useState<Platform>(detectPlatform())
  const isDe = locale === 'de'

  if (!open) return null

  const steps: Record<Platform, { title: string; body: string }[]> = {
    'ios-safari': [
      {
        title: isDe ? 'iPhone-Einstellungen öffnen' : 'Open iPhone Settings',
        body: isDe
          ? 'Öffne die App "Einstellungen" auf deinem iPhone (nicht in Safari, sondern die graue Zahnrad-App auf dem Home-Bildschirm).'
          : 'Open the "Settings" app on your iPhone (the grey gear icon on your home screen, not inside Safari).',
      },
      {
        title: isDe ? 'Zu Safari scrollen' : 'Scroll to Safari',
        body: isDe
          ? 'Scroll runter und tippe auf "Safari".'
          : 'Scroll down and tap "Safari".',
      },
      {
        title: isDe ? 'Standort-Einstellungen öffnen' : 'Open Location Settings',
        body: isDe
          ? 'Tippe auf "Standort" (bei manchen iOS-Versionen unter "Datenschutz & Sicherheit" innerhalb Safari zu finden).'
          : 'Tap "Location" (on some iOS versions found under "Privacy & Security" inside Safari settings).',
      },
      {
        title: isDe ? 'Auf "Fragen" oder "Erlauben" stellen' : 'Set to "Ask" or "Allow"',
        body: isDe
          ? 'Wähle "Fragen" oder "Erlauben" statt "Nie". Geh dann zurück in die App und lade die Seite neu — jetzt fragt der Browser wieder nach dem Standort.'
          : 'Choose "Ask" or "Allow" instead of "Never". Go back to the app and reload the page — the browser will ask for location again.',
      },
    ],
    'ios-installed': [
      {
        title: isDe ? 'iPhone-Einstellungen öffnen' : 'Open iPhone Settings',
        body: isDe
          ? 'Öffne die App "Einstellungen" auf deinem iPhone (die graue Zahnrad-App auf dem Home-Bildschirm).'
          : 'Open the "Settings" app on your iPhone (the grey gear icon on your home screen).',
      },
      {
        title: isDe ? 'Runterscrollen zu KiWardrobe' : 'Scroll down to KiWardrobe',
        body: isDe
          ? 'Scroll runter, bis du in der App-Liste "KiWardrobe" siehst, und tippe drauf. Falls sie dort nicht auftaucht, nutze stattdessen die Anleitung für Safari (unten).'
          : 'Scroll down until you see "KiWardrobe" in the app list and tap on it. If it doesn\'t show up there, use the Safari instructions instead (below).',
      },
      {
        title: isDe ? 'Standort erlauben' : 'Allow Location',
        body: isDe
          ? 'Tippe auf "Standort" und wähle "Beim Verwenden der App erlauben".'
          : 'Tap "Location" and choose "While Using the App".',
      },
    ],
    android: [
      {
        title: isDe ? 'Standort-Icon in der Adressleiste' : 'Location icon in address bar',
        body: isDe
          ? 'Tippe in Chrome auf das kleine Schloss- oder Info-Symbol links neben der Webadresse (kiwardrobe.com).'
          : 'In Chrome, tap the small lock or info icon left of the web address (kiwardrobe.com).',
      },
      {
        title: isDe ? 'Berechtigungen öffnen' : 'Open permissions',
        body: isDe
          ? 'Tippe auf "Berechtigungen" bzw. "Website-Einstellungen".'
          : 'Tap "Permissions" or "Site settings".',
      },
      {
        title: isDe ? 'Standort erlauben' : 'Allow location',
        body: isDe
          ? 'Stelle "Standort" auf "Zulassen" und lade die Seite neu.'
          : 'Set "Location" to "Allow" and reload the page.',
      },
    ],
  }

  const currentSteps = steps[platform]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px',
        }}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '440px', maxHeight: '85vh', overflowY: 'auto' as const,
            background: bg, border: `1px solid ${border}`, borderRadius: '28px 28px 0 0',
            padding: '24px 20px 32px',
          }}
        >
          <div style={{ width: '36px', height: '4px', background: border, borderRadius: '2px', margin: '0 auto 20px' }} />

          <div style={{ textAlign: 'center' as const, marginBottom: '18px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📍</div>
            <h2 style={{ fontSize: '19px', fontWeight: 800, color: text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
              {isDe ? 'Standort ist blockiert' : 'Location is blocked'}
            </h2>
            <p style={{ fontSize: '13px', color: muted, lineHeight: 1.6 }}>
              {isDe
                ? 'Du hast den Standortzugriff einmal abgelehnt — dein Browser fragt deshalb nicht mehr automatisch. Du musst das einmalig in den Einstellungen zurücksetzen.'
                : 'You declined location access once — your browser no longer asks automatically. You need to reset this once in your settings.'}
            </p>
          </div>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '18px', overflow: 'hidden', marginBottom: '16px' }}>
            {currentSteps.map((step, i) => (
              <div key={i} style={{ padding: '14px 16px', borderBottom: i < currentSteps.length - 1 ? `1px solid ${border}` : 'none', display: 'flex', gap: '12px' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', background: accent, color: '#fff',
                  fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontSize: '13.5px', fontWeight: 700, color: text, marginBottom: '3px' }}>{step.title}</p>
                  <p style={{ fontSize: '12.5px', color: muted, lineHeight: 1.5 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '11.5px', color: muted, textAlign: 'center' as const, marginBottom: '16px', lineHeight: 1.5 }}>
            {isDe
              ? 'Alternativ kannst du den Standort auch manuell über "Standort falsch? Manuell ändern" in deinem Profil eingeben — dann brauchst du gar keine Berechtigung.'
              : 'Alternatively, you can enter your location manually via "Location wrong? Change manually" in your profile — no permission needed at all.'}
          </p>

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              background: sageGradient, color: '#fff', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif",
            }}
          >
            {isDe ? 'Verstanden' : 'Got it'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}