'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import Navbar from '@/components/Navbar'

export default function LegalPage() {
  const [tab, setTab] = useState<'impressum' | 'datenschutz'>('impressum')
  const locale = useLocale()
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' as const, background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <Navbar activePage="profile" />
      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '600px', width: '100%', margin: '0 auto', padding: '80px 16px 100px 16px' }}>

        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif", padding: '0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← {locale === 'de' ? 'Zurück' : 'Back'}
        </button>

        {/* Tab Switch */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '4px' }}>
          {(['impressum', 'datenschutz'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: tab === t ? 'var(--bg-card)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text-secondary)', fontSize: '13px', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              {t === 'impressum' ? 'Impressum' : 'Datenschutz'}
            </button>
          ))}
        </div>

        {tab === 'impressum' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: 'var(--text)', marginBottom: '20px' }}>Impressum</h1>

            {[
              { title: 'Angaben gemäß § 5 TMG', content: 'Luca Darvas\nBernd-Rosemeyer-Straße 14\n85551 Kirchheim bei München\nDeutschland' },
              { title: 'Kontakt', content: 'E-Mail: support.kiwardrobe@gmail.com' },
              { title: 'Verantwortlich für den Inhalt', content: 'Luca Darvas\nBernd-Rosemeyer-Straße 14\n85551 Kirchheim bei München' },
              { title: 'Haftungsausschluss', content: 'Die Inhalte dieser App wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.' },
            ].map(section => (
              <div key={section.title} style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>{section.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-line' as const }}>{section.content}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'datenschutz' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: 'var(--text)', marginBottom: '20px' }}>Datenschutzerklärung</h1>

            {[
              { title: 'Verantwortlicher', content: 'Luca Darvas\nBernd-Rosemeyer-Straße 14\n85551 Kirchheim bei München\nE-Mail: support.kiwardrobe@gmail.com' },
              { title: 'Welche Daten wir speichern', content: '• E-Mail-Adresse und Passwort (verschlüsselt)\n• Benutzername, Alter, Land\n• Hochgeladene Kleidungsbilder\n• Generierte Outfits\n• Nutzungsstatistiken der App' },
              { title: 'Wofür wir Daten nutzen', content: '• Bereitstellung der App-Funktionen\n• KI-basierte Outfit-Generierung\n• Personalisierung der Nutzererfahrung\n• Verbesserung des Services' },
              { title: 'Drittanbieter', content: '• Supabase (Datenspeicherung, EU-Server Frankfurt)\n• OpenAI (KI-Analyse, Daten werden nicht gespeichert)\n• Vercel (Hosting, USA)' },
              { title: 'Deine Rechte', content: '• Auskunft über gespeicherte Daten\n• Berichtigung falscher Daten\n• Löschung deiner Daten\n• Datenportabilität\n\nKontakt: support.kiwardrobe@gmail.com' },
              { title: 'Datenlöschung', content: 'Du kannst dein Konto und alle gespeicherten Daten jederzeit löschen. Schreibe uns an support.kiwardrobe@gmail.com' },
              { title: 'Cookies', content: 'Wir verwenden nur technisch notwendige Cookies für die Authentifizierung. Keine Werbe-Cookies.' },
            ].map(section => (
              <div key={section.title} style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '8px' }}>{section.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-line' as const }}>{section.content}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}