'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'

export default function LegalPage() {
const searchParams = useSearchParams()
  const [tab, setTab] = useState<'impressum' | 'datenschutz' | 'agb'>(
    (searchParams.get('tab') as 'impressum' | 'datenschutz' | 'agb') ?? 'impressum'
  )
  const locale = useLocale()
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
  <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' as const, background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <main style={{ flex: 1, overflowY: 'auto' as const, maxWidth: '600px', width: '100%', margin: '0 auto', padding: '32px 16px 40px 16px' }}>

        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif", padding: '0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← {locale === 'de' ? 'Zurück' : 'Back'}
        </button>

        {/* Tab Switch */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', padding: '4px' }}>
          {(['impressum', 'datenschutz', 'agb'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: tab === t ? 'var(--bg-card)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
              {t === 'impressum' ? 'Impressum' : t === 'datenschutz' ? 'Datenschutz' : 'AGB'}
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

        {tab === 'agb' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '24px', fontWeight: 400, color: 'var(--text)', marginBottom: '20px' }}>Allgemeine Geschäftsbedingungen</h1>

            {[
              { title: '1. Geltungsbereich', content: 'Diese AGB gelten für die Nutzung der App KiWardrobe, betrieben von Luca Darvas, Bernd-Rosemeyer-Straße 14, 85551 Kirchheim bei München ("Anbieter"). Mit der Registrierung erkennst du diese AGB an.' },
              { title: '2. Leistungsbeschreibung', content: 'KiWardrobe bietet eine KI-gestützte Anwendung zur Verwaltung des persönlichen Kleiderschranks, zur Erstellung von Outfit-Vorschlägen sowie zur virtuellen Anprobe von Kleidung (Virtual Try-On). Ein Teil der Funktionen ist kostenlos nutzbar (KiWardrobe Free), erweiterte Funktionen sind im kostenpflichtigen Abonnement (KiWardrobe Pro) enthalten.' },
              { title: '3. Vertragsschluss', content: 'Der Vertrag über die Free-Nutzung kommt durch erfolgreiche Registrierung zustande. Der Vertrag über ein Pro-Abonnement kommt durch Abschluss des Bezahlvorgangs über unseren Zahlungsdienstleister Stripe zustande.' },
              { title: '4. Preise und Zahlung', content: 'Der aktuelle Preis für KiWardrobe Pro wird vor Vertragsschluss in der App angezeigt (Stand: €4,99/Monat). Die Zahlung erfolgt monatlich im Voraus über Stripe. Preisänderungen werden mit angemessener Vorlaufzeit angekündigt.' },
              { title: '5. Laufzeit und Kündigung', content: 'Das Pro-Abonnement verlängert sich automatisch um jeweils einen Monat, sofern es nicht rechtzeitig vor Ablauf des laufenden Abrechnungszeitraums gekündigt wird. Die Kündigung ist jederzeit über die Profileinstellungen in der App oder per E-Mail an support.kiwardrobe@gmail.com möglich. Bereits bezahlte Zeiträume werden bei einer Kündigung nicht anteilig zurückerstattet; der Zugang zu Pro-Funktionen bleibt bis zum Ende des bezahlten Zeitraums bestehen.' },
              { title: '6. Widerrufsrecht', content: 'Verbrauchern steht grundsätzlich ein gesetzliches Widerrufsrecht von 14 Tagen nach Vertragsschluss zu. Da es sich bei KiWardrobe Pro um digitale Inhalte handelt, die sofort nach Zahlung bereitgestellt werden, erlischt das Widerrufsrecht vorzeitig, wenn du der sofortigen Ausführung ausdrücklich zustimmst und bestätigst, dass du dadurch dein Widerrufsrecht verlierst. Diese Zustimmung wird im Bestellprozess eingeholt.' },
              { title: '7. Nutzungsrechte und Pflichten', content: 'Du erhältst ein einfaches, nicht übertragbares Nutzungsrecht an der App für die Dauer deines Accounts. Du verpflichtest dich, keine missbräuchlichen, rechtswidrigen oder die Rechte Dritter verletzenden Inhalte (z. B. Bilder) hochzuladen. Bei Verstößen kann der Account gesperrt oder gelöscht werden.' },
              { title: '8. KI-generierte Inhalte', content: 'Outfit-Vorschläge und virtuelle Anprobe-Ergebnisse werden mithilfe von KI-Modellen Dritter (u. a. OpenAI, Replicate) erzeugt. Der Anbieter übernimmt keine Garantie für die optische Genauigkeit, Eignung oder Fehlerfreiheit der KI-generierten Ergebnisse.' },
              { title: '9. Referral-Programm', content: 'Im Rahmen des Einladungsprogramms können Nutzer durch das Einladen neuer Nutzer zeitlich begrenzte kostenlose Pro-Zeiträume erhalten. Der Anbieter behält sich vor, das Programm jederzeit anzupassen, einzuschränken oder zu beenden sowie Belohnungen bei Missbrauch (z. B. Fake-Accounts) zu widerrufen.' },
              { title: '10. Haftung', content: 'Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie nach den Vorschriften des Produkthaftungsgesetzes. Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vorhersehbaren, vertragstypischen Schaden begrenzt. Im Übrigen ist die Haftung ausgeschlossen, soweit gesetzlich zulässig.' },
              { title: '11. Verfügbarkeit', content: 'Der Anbieter bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit der App, übernimmt jedoch keine Garantie für eine bestimmte Verfügbarkeit, insbesondere bei Wartungsarbeiten oder Ausfällen von Drittanbietern (Hosting, KI-Dienste).' },
              { title: '12. Änderung der AGB', content: 'Der Anbieter kann diese AGB mit Wirkung für die Zukunft ändern. Über wesentliche Änderungen wirst du rechtzeitig informiert. Widersprichst du nicht innerhalb von 30 Tagen, gelten die neuen AGB als akzeptiert.' },
              { title: '13. Schlussbestimmungen', content: 'Es gilt deutsches Recht. Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.\n\nKontakt: support.kiwardrobe@gmail.com' },
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