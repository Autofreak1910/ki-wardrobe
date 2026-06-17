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
              { title: 'Welche Daten wir speichern', content: '• E-Mail-Adresse und Passwort (verschlüsselt)\n• Benutzername, Alter, Land\n• Hochgeladene Kleidungsbilder\n• Selfie-/Körperfotos für die Virtual-Try-On-Funktion\n• Generierte Outfits und Avatar-Bilder\n• Standortdaten (Koordinaten) für die Wetteranzeige und tägliche Outfit-Vorschläge\n• Push-Notification-Anmeldedaten (falls aktiviert)\n• Zahlungsbezogene Daten bei Abschluss eines Pro-Abonnements (über Stripe)\n• Referral-Code und Einladungsstatistiken\n• Nutzungsstatistiken der App' },
              { title: 'Wofür wir Daten nutzen', content: '• Bereitstellung der App-Funktionen\n• KI-basierte Outfit-Generierung und virtuelle Anprobe (Virtual Try-On)\n• Tagesaktuelle, wetterbasierte Outfit-Vorschläge\n• Versand von Push-Benachrichtigungen (nur mit deiner Zustimmung)\n• Abwicklung von Pro-Abonnements\n• Personalisierung der Nutzererfahrung\n• Verbesserung des Services' },
              { title: 'Standortdaten', content: 'Mit deiner Erlaubnis erfassen wir deinen ungefähren Standort (GPS-Koordinaten), um dir aktuelle Wetterdaten und passende Outfit-Vorschläge anzuzeigen. Diese Koordinaten werden in deinem Profil gespeichert, damit auch automatisch generierte Tages-Outfits das Wetter an deinem Ort berücksichtigen können. Du kannst die Standortfreigabe jederzeit über die Berechtigungen deines Geräts/Browsers widerrufen.' },
              { title: 'Push-Benachrichtigungen', content: 'Wenn du Push-Benachrichtigungen aktivierst, speichern wir ein technisches Abonnement (Endpoint-URL und Verschlüsselungsschlüssel deines Geräts), um dir tägliche Outfit-Erinnerungen zu schicken. Du kannst dies jederzeit in deinem Profil deaktivieren — dabei wird das Abonnement vollständig gelöscht.' },
              { title: 'Zahlungen', content: 'Bei Abschluss eines KiWardrobe Pro-Abonnements werden Zahlungsdaten ausschließlich von unserem Zahlungsdienstleister Stripe verarbeitet. Wir selbst speichern keine vollständigen Kreditkartendaten. Es gelten zusätzlich die Datenschutzbestimmungen von Stripe (stripe.com/privacy).' },
              { title: 'Freunde einladen (Referral-Programm)', content: 'Wenn du Freunde über deinen persönlichen Einladungslink einlädst, wird gespeichert, welcher Account über welchen Code registriert wurde, um die vereinbarten Prämien (kostenlose Testzeit) zu vergeben.' },
              { title: 'Drittanbieter', content: '• Supabase (Datenspeicherung, EU-Server Frankfurt)\n• OpenAI (KI-Analyse für Outfit-Vorschläge und Stilanalyse, Daten werden laut OpenAI-Richtlinien nicht für Training genutzt)\n• Replicate (KI-Bildverarbeitung für Virtual Try-On/Avatar-Generierung und Hintergrundentfernung)\n• Stripe (Zahlungsabwicklung für Pro-Abonnements)\n• Vercel (Hosting, inkl. Server in den USA)\n• Open-Meteo / OpenStreetMap (Wetter- und Standortdaten, anonymisiert)' },
              { title: 'Deine Rechte', content: '• Auskunft über gespeicherte Daten\n• Berichtigung falscher Daten\n• Löschung deiner Daten\n• Datenportabilität\n• Widerspruch gegen die Verarbeitung\n\nKontakt: support.kiwardrobe@gmail.com' },
              { title: 'Datenlöschung', content: 'Du kannst dein Konto inklusive aller gespeicherten Daten (Profil, Kleidungsstücke, Outfits, Avatar-Bilder, Push-Anmeldungen) jederzeit selbst über die App löschen (Profil → Account löschen). Diese Löschung ist sofort wirksam und unwiderruflich. Alternativ kannst du uns auch unter support.kiwardrobe@gmail.com kontaktieren.' },
              { title: 'Speicherdauer', content: 'Deine Daten werden gespeichert, solange dein Account aktiv ist. Nach Löschung deines Accounts werden alle personenbezogenen Daten unverzüglich entfernt, mit Ausnahme gesetzlich vorgeschriebener Aufbewahrungsfristen für Rechnungsdaten (z. B. bei abgeschlossenen Zahlungen über Stripe, dort gelten gesetzliche Aufbewahrungspflichten von bis zu 10 Jahren für Rechnungsunterlagen).' },
              { title: 'Cookies', content: 'Wir verwenden nur technisch notwendige Cookies für die Authentifizierung. Keine Werbe-Cookies, kein Tracking durch Dritte zu Werbezwecken.' },
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