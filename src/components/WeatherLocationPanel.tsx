'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type CityResult = { name: string; admin1?: string; country: string; latitude: number; longitude: number }

export default function WeatherLocationPanel({
  open,
  onClose,
  locale,
  onLocationSet,
  theme,
}: {
  open: boolean
  onClose: () => void
  locale: string
  onLocationSet: (lat: number, lon: number) => void
  theme: {
    card: string
    border: string
    text: string
    muted: string
    accent: string
    accentDim: string
  }
}) {
  const { card, border, text, muted, accent, accentDim } = theme
  const isDe = locale === 'de'

  const [requesting, setRequesting] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [cityQuery, setCityQuery] = useState('')
  const [citySearchResults, setCitySearchResults] = useState<CityResult[]>([])
  const [citySearching, setCitySearching] = useState(false)
  const [showCitySearch, setShowCitySearch] = useState(false)

  if (!open) return null

  async function requestLocation() {
    setRequesting(true)
    setRequestError(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 0,
          enableHighAccuracy: false,
        })
      )
      onLocationSet(pos.coords.latitude, pos.coords.longitude)
      onClose()
    } catch (err: any) {
      if (err?.code === 1) {
        setRequestError(isDe
          ? 'Standort ist in deinen Geräte-Einstellungen blockiert. Nutze die manuelle Suche unten, oder ändere es in den Einstellungen.'
          : 'Location is blocked in your device settings. Use manual search below, or change it in Settings.')
      } else {
        setRequestError(isDe ? 'Standort konnte nicht ermittelt werden.' : 'Could not determine location.')
      }
    } finally {
      setRequesting(false)
    }
  }

  async function searchCity(query: string) {
    setCityQuery(query)
    if (query.trim().length < 2) { setCitySearchResults([]); return }
    setCitySearching(true)
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${locale}`)
      const data = await res.json()
      setCitySearchResults(data.results ?? [])
    } catch {
      setCitySearchResults([])
    }
    setCitySearching(false)
  }

  function selectCity(city: CityResult) {
    onLocationSet(city.latitude, city.longitude)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      style={{
          position: 'fixed', top: '86px', right: '18px', zIndex: 50,
          width: '280px', maxHeight: 'calc(100dvh - 120px)', overflowY: 'auto' as const,
          background: card, border: `1px solid ${border}`,
          borderRadius: '18px', padding: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: text }}>
            {isDe ? '📍 Standort' : '📍 Location'}
          </p>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: muted, fontSize: '13px', cursor: 'pointer', padding: 0 }}>✕</button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={requesting}
          onClick={requestLocation}
          style={{
            width: '100%', padding: '11px', borderRadius: '12px', border: 'none',
            background: accent, color: '#fff', fontSize: '13px', fontWeight: 700,
            cursor: requesting ? 'wait' : 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif",
            marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          {requesting
            ? (isDe ? 'Suche...' : 'Locating...')
            : (isDe ? '📍 Meinen Standort verwenden' : '📍 Use my location')}
        </motion.button>

        {requestError && (
          <p style={{ fontSize: '11px', color: '#ef4444', lineHeight: 1.4, marginBottom: '8px' }}>{requestError}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 10px' }}>
          <div style={{ flex: 1, height: '1px', background: border }} />
          <p style={{ fontSize: '10px', color: muted, fontWeight: 600 }}>{isDe ? 'oder' : 'or'}</p>
          <div style={{ flex: 1, height: '1px', background: border }} />
        </div>

        {!showCitySearch ? (
          <button
            onClick={() => setShowCitySearch(true)}
            style={{
              width: '100%', padding: '10px', borderRadius: '12px', border: `1px solid ${border}`,
              background: 'transparent', color: text, fontSize: '12.5px', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif",
            }}
          >
            {isDe ? '🔍 Stadt manuell suchen' : '🔍 Search city manually'}
          </button>
        ) : (
          <div>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => searchCity(e.target.value)}
              placeholder={isDe ? 'Stadt suchen...' : 'Search city...'}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box' as const, background: accentDim,
                border: `1px solid ${border}`, borderRadius: '10px', padding: '9px 11px',
                fontSize: '12.5px', color: text, outline: 'none',
                fontFamily: "'Poppins', 'Inter', sans-serif",
              }}
            />
            {citySearching && (
              <p style={{ fontSize: '11px', color: muted, marginTop: '6px' }}>{isDe ? 'Suche...' : 'Searching...'}</p>
            )}
            {citySearchResults.length > 0 && (
              <div style={{ marginTop: '6px', border: `1px solid ${border}`, borderRadius: '10px', overflow: 'hidden' }}>
                {citySearchResults.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => selectCity(c)}
                    style={{
                      width: '100%', textAlign: 'left' as const, padding: '9px 11px',
                      background: card, border: 'none',
                      borderBottom: i < citySearchResults.length - 1 ? `1px solid ${border}` : 'none',
                      cursor: 'pointer', fontSize: '12px', color: text,
                      fontFamily: "'Poppins', 'Inter', sans-serif",
                    }}
                  >
                    {c.name}{c.admin1 ? `, ${c.admin1}` : ''}, {c.country}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}