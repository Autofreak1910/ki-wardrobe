'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'

// Diese Funktion kann von aussen aufgerufen werden um zu pruefen ob GA geladen werden darf
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('kw_cookie_consent') === 'accepted'
}

// GA laden (wird nur aufgerufen wenn Consent gegeben wurde)
export function loadGoogleAnalytics() {
  if (typeof window === 'undefined') return
  if (document.getElementById('ga-script')) return // schon geladen

  const script = document.createElement('script')
  script.id = 'ga-script'
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-S08985T3YF'
  document.head.appendChild(script)

  script.onload = () => {
    ;(window as any).dataLayer = (window as any).dataLayer || []
    function gtag(...args: any[]) { (window as any).dataLayer.push(args) }
    gtag('js', new Date())
    gtag('config', 'G-S08985T3YF')
  }
}

export default function CookieConsent() {
  const [show, setShow] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const { theme } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'
  const de = locale === 'de'

  const bg = isDark ? '#1D1D20' : '#ffffff'
  const border = isDark ? '#2a2a2e' : '#EAE7E0'
  const text = isDark ? '#F5F3EE' : '#1D1D20'
  const muted = isDark ? '#9a978f' : '#8A8680'
  const accent = isDark ? '#5C82A0' : '#355C7D'

  useEffect(() => {
    const consent = localStorage.getItem('kw_cookie_consent')
    if (consent === 'accepted') {
      loadGoogleAnalytics()
    } else if (!consent) {
      // Noch keine Entscheidung getroffen -> Banner zeigen
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
    // consent === 'declined' -> nichts tun, kein Banner
  }, [])

  function accept() {
    localStorage.setItem('kw_cookie_consent', 'accepted')
    loadGoogleAnalytics()
    setShow(false)
  }

  function decline() {
    localStorage.setItem('kw_cookie_consent', 'declined')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            bottom: 'calc(90px + env(safe-area-inset-bottom))',
            left: '12px',
            right: '12px',
            zIndex: 9995,
            maxWidth: '440px',
            margin: '0 auto',
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: '20px',
            padding: '18px 18px 16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
            fontFamily: "'Poppins', 'Inter', sans-serif",
          }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>🍪</span>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '4px' }}>
                {de ? 'Cookies & Analyse' : 'Cookies & Analytics'}
              </p>
              <p style={{ fontSize: '12px', color: muted, lineHeight: 1.5 }}>
                {de
                  ? 'Wir nutzen Google Analytics, um zu verstehen wie die App genutzt wird und sie zu verbessern. Es werden keine personenbezogenen Daten an Dritte verkauft.'
                  : 'We use Google Analytics to understand how the app is used and improve it. No personal data is sold to third parties.'}
              </p>
            </div>
          </div>

          {/* Details (aufklappbar) */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#faf8f5', borderRadius: '12px', padding: '12px 14px', border: `1px solid ${border}` }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: text, marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                    {de ? 'Was wird gespeichert:' : 'What is stored:'}
                  </p>
                  <div style={{ fontSize: '11px', color: muted, lineHeight: 1.6 }}>
                    <p style={{ marginBottom: '4px' }}>✓ {de ? 'Seitenaufrufe (welche Seiten besucht werden)' : 'Page views (which pages are visited)'}</p>
                    <p style={{ marginBottom: '4px' }}>✓ {de ? 'Gerätetyp & Browser (für Optimierung)' : 'Device type & browser (for optimization)'}</p>
                    <p style={{ marginBottom: '4px' }}>✓ {de ? 'Ungefährer Standort (nur Land/Stadt)' : 'Approximate location (country/city only)'}</p>
                    <p style={{ marginBottom: '4px' }}>✗ {de ? 'Keine persönlichen Daten (Name, Email etc.)' : 'No personal data (name, email etc.)'}</p>
                    <p>✗ {de ? 'Kein Weiterverkauf an Dritte' : 'No resale to third parties'}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setShowDetails(v => !v)}
            style={{ background: 'none', border: 'none', fontSize: '11px', color: accent, fontWeight: 600, cursor: 'pointer', padding: '0 0 12px', fontFamily: "'Poppins', 'Inter', sans-serif" }}>
            {showDetails
              ? (de ? '▲ Weniger anzeigen' : '▲ Show less')
              : (de ? '▼ Mehr erfahren' : '▼ Learn more')}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={decline}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: `1px solid ${border}`, background: 'transparent',
                color: muted, fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif",
              }}>
              {de ? 'Ablehnen' : 'Decline'}
            </button>
            <button onClick={accept}
              style={{
                flex: 2, padding: '12px', borderRadius: '12px',
                border: 'none', background: `linear-gradient(135deg, ${accent}, #0891b2)`,
                color: '#fff', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif",
                boxShadow: `0 4px 16px ${accent}40`,
              }}>
              {de ? 'Akzeptieren' : 'Accept'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}