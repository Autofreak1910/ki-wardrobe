'use client'

import { useTheme } from '@/context/ThemeContext'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

export default function Navbar({ activePage }: { activePage: string }) {
  const { theme, toggle } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const isDark = theme === 'dark'
  const [bubbleStyle, setBubbleStyle] = useState({ left: 0, width: 0 })
  const navRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const tabs = [
    { page: 'dresser', emoji: '✦', label: 'Dress Me' },
    { page: 'wardrobe', emoji: '👗', label: locale === 'de' ? 'Schrank' : 'Wardrobe' },
    { page: 'outfits', emoji: '💫', label: 'Outfits' },
    { page: 'profile', emoji: '👤', label: locale === 'de' ? 'Profil' : 'Profile' },
  ]

  function switchLanguage() {
    const newLocale = locale === 'de' ? 'en' : 'de'
    const segments = pathname.split('/')
    segments[1] = newLocale
    window.location.replace(segments.join('/'))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !navRef.current) return
    const activeIndex = tabs.findIndex(t => t.page === activePage)
    if (activeIndex === -1) return
    const navWidth = navRef.current.offsetWidth
    const tabWidth = navWidth / tabs.length
    setBubbleStyle({
      left: activeIndex * tabWidth + tabWidth * 0.1,
      width: tabWidth * 0.8,
    })
  }, [activePage, mounted])

  return (
    <>
      {/* Desktop Navbar */}
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', background: 'var(--bg)', position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text)' }}>
          Ki<em style={{ color: '#0ea472' }}>Wardrobe</em>
        </div>

        <div className="desktop-nav" style={{ display: 'flex', gap: '4px' }}>
          {['dresser', 'wardrobe', 'outfits', 'style'].map(page => (
            <button key={page} onClick={() => router.push('/' + locale + '/' + page)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif", background: page === activePage ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'transparent', color: page === activePage ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', transform: page === activePage ? 'scale(1.05)' : 'scale(1)' }}>
              {t('nav.' + page)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={switchLanguage} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}>
            {locale === 'de' ? '🇬🇧' : '🇩🇪'}
          </button>
          <button onClick={toggle} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s' }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => router.push('/' + locale + '/profile')}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', boxShadow: '0 2px 8px rgba(14,164,114,0.4)' }}>
            👤
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div
        ref={navRef}
        className="mobile-nav"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '64px',
          background: isDark ? 'rgba(13,17,23,0.85)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: isDark ? '0 -4px 24px rgba(0,0,0,0.3)' : '0 -4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Liquid Bubble */}
        {mounted && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: bubbleStyle.left,
            width: bubbleStyle.width,
            height: '48px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(14,164,114,0.25), rgba(8,145,178,0.25))'
              : 'linear-gradient(135deg, rgba(14,164,114,0.15), rgba(8,145,178,0.15))',
            borderRadius: '16px',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(14,164,114,0.2)',
            boxShadow: '0 2px 12px rgba(14,164,114,0.2)',
            pointerEvents: 'none',
          }} />
        )}

        {tabs.map(item => {
          const isActive = activePage === item.page
          return (
            <button
              key={item.page}
              onClick={() => router.push('/' + locale + '/' + item.page)}
              style={{
                display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', gap: '2px',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 16px', borderRadius: '16px',
                minWidth: '60px', flex: 1,
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: isActive ? 'scale(1.08) translateY(-2px)' : 'scale(1) translateY(0)',
                position: 'relative' as const,
                zIndex: 1,
              }}
            >
              <span style={{
                fontSize: '22px',
                filter: isActive ? 'none' : 'grayscale(1)',
                opacity: isActive ? 1 : 0.45,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'block',
              }}>
                {item.emoji}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? '#0ea472' : 'var(--text-secondary)',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.3s',
                letterSpacing: isActive ? '0.02em' : '0',
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
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