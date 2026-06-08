'use client'

import { useTheme } from '@/context/ThemeContext'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar({ activePage }: { activePage: string }) {
  const { theme, toggle } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const isDark = theme === 'dark'
  const [menuOpen, setMenuOpen] = useState(false)

  function switchLanguage() {
    const newLocale = locale === 'de' ? 'en' : 'de'
    const segments = pathname.split('/')
    segments[1] = newLocale
    window.location.replace(segments.join('/'))
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text)' }}>
          Ki<em style={{ color: '#0ea472' }}>Wardrobe</em>
        </div>

        {/* Desktop Nav Links — hidden on mobile */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '4px' }}>
          {['dresser', 'wardrobe', 'outfits', 'style'].map(page => (
            <button key={page} onClick={() => router.push('/' + locale + '/' + page)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif", background: page === activePage ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'transparent', color: page === activePage ? '#fff' : 'var(--text-secondary)' }}>
              {t('nav.' + page)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={switchLanguage} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
            {locale === 'de' ? '🇬🇧' : '🇩🇪'}
          </button>
          <button onClick={toggle} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => router.push('/' + locale + '/profile')}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            👤
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }} className="mobile-nav">
        {[
          { page: 'dresser', emoji: '✦', label: 'Dress Me' },
          { page: 'wardrobe', emoji: '👗', label: locale === 'de' ? 'Schrank' : 'Wardrobe' },
          { page: 'outfits', emoji: '💫', label: 'Outfits' },
          { page: 'profile', emoji: '👤', label: locale === 'de' ? 'Profil' : 'Profile' },
        ].map(item => (
          <button key={item.page} onClick={() => router.push('/' + locale + '/' + item.page)}
            style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '12px', minWidth: '60px' }}>
            <span style={{ fontSize: '20px', filter: activePage === item.page ? 'none' : 'grayscale(0.5)', opacity: activePage === item.page ? 1 : 0.5 }}>{item.emoji}</span>
            <span style={{ fontSize: '10px', fontWeight: activePage === item.page ? 600 : 400, color: activePage === item.page ? '#0ea472' : 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>{item.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .mobile-nav { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 639px) {
          .mobile-nav { display: flex !important; }
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}