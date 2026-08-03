'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Status = 'idle' | 'checking' | 'up-to-date' | 'update-available'

export default function CheckForUpdateButton({
  locale,
  theme,
}: {
  locale: string
  theme: {
    card: string
    border: string
    text: string
    muted: string
    accent: string
    accentDim: string
    sageGradient: string
  }
}) {
  const { card, border, text, muted, accent, accentDim, sageGradient } = theme
  const isDe = locale === 'de'
  const [status, setStatus] = useState<Status>('idle')
  const [version, setVersion] = useState('')
  const [notes, setNotes] = useState<string[]>([])

  async function checkForUpdate() {
    setStatus('checking')
    try {
      const res = await fetch('/api/version', { cache: 'no-store' })
      const data = await res.json()
      const currentVersion = data.version
      const storedVersion = localStorage.getItem('kw_app_version')

      if (!storedVersion || storedVersion === currentVersion) {
        if (!storedVersion) localStorage.setItem('kw_app_version', currentVersion)
        setStatus('up-to-date')
        return
      }

      setVersion(currentVersion)
      setNotes((isDe ? data.notesDe : data.notesEn) ?? [])
      setStatus('update-available')
    } catch {
      setStatus('up-to-date')
    }
  }

  function handleUpdateNow() {
    try { localStorage.setItem('kw_app_version', version) } catch {}
    window.location.reload()
  }

  return (
    <div>
      <button
        onClick={checkForUpdate}
        disabled={status === 'checking'}
        style={{
          width: '100%', padding: '14px 16px', background: 'transparent', border: 'none',
          fontSize: '14px', color: text, cursor: status === 'checking' ? 'wait' : 'pointer',
          fontFamily: "'Poppins', 'Inter', sans-serif", fontWeight: 500, textAlign: 'left' as const,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>{isDe ? 'Nach Updates suchen' : 'Check for updates'}</span>
        {status === 'checking' ? (
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${border}`, borderTopColor: accent }} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={muted} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
        )}
      </button>

      <AnimatePresence>
        {status === 'up-to-date' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ margin: '0 16px 12px', padding: '10px 14px', background: accentDim, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>✓</span>
              <p style={{ fontSize: '12.5px', fontWeight: 600, color: accent }}>
                {isDe ? 'Du bist auf der neuesten Version' : "You're on the latest version"}
              </p>
            </div>
          </motion.div>
        )}

        {status === 'update-available' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ margin: '0 16px 12px', padding: '12px 14px', background: 'rgba(201,150,60,0.1)', border: '1px solid rgba(201,150,60,0.3)', borderRadius: '12px' }}>
              <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#9C6B1F', marginBottom: '6px' }}>
                {isDe ? `✨ Version ${version} verfügbar` : `✨ Version ${version} available`}
              </p>
              {notes.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  {notes.map((note, i) => (
                    <p key={i} style={{ fontSize: '12px', color: text, marginBottom: '2px' }}>✓ {note}</p>
                  ))}
                </div>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleUpdateNow}
                style={{
                  width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                  background: sageGradient, color: '#fff', fontSize: '12.5px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Poppins', 'Inter', sans-serif",
                }}
              >
                {isDe ? 'Jetzt aktualisieren' : 'Update now'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}