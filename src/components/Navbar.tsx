'use client'

import { useTheme } from '@/context/ThemeContext'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

export default function Navbar({ activePage }: { activePage: string }) {
  const { theme, toggle } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const isDark = theme === 'dark'
  const navRef = useRef<HTMLDivElement>(null)
  const [tabWidth, setTabWidth] = useState(0)
  const [mounted, setMounted] = useState(false)

  const tabs = [
    { page: 'dresser', emoji: '✦', label: 'Dress Me' },
    { page: 'wardrobe', emoji: '👗', label: locale === 'de' ? 'Schrank' : 'Wardrobe' },
    { page: 'outfits', emoji: '💫', label: 'Outfits' },
    { page: 'profile', emoji: '👤', label: locale === 'de' ? 'Profil' : 'Profile' },
  ]

  const activeIndex = tabs.findIndex(t => t.page === activePage)

  const bubbleX = useMotionValue(0)
  const springX = useSpring(bubbleX, { stiffness: 400, damping: 30, mass: 0.8 })
  const bubbleWidth = useMotionValue(0)
  const springWidth = useSpring(bubbleWidth, { stiffness: 400, damping: 30 })

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
    const w = navRef.current.offsetWidth / tabs.length
    setTabWidth(w)
    bubbleX.set(activeIndex * w + w * 0.1)
    bubbleWidth.set(w * 0.8)
  }, [mounted, activeIndex])

  return (
    <>
      {/* Desktop Navbar */}
      <nav style={{
        borderBottom: '1px solid var(--border)', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px', background: isDark ? 'rgba(13,17,23,0.9)' : 'rgba(255,255,255,0.9)',
        position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text)' }}>
          Ki<em style={{ color: '#0ea472' }}>Wardrobe</em>
        </div>
        <div className="desktop-nav" style={{ display: 'flex', gap: '4px' }}>
          {['dresser', 'wardrobe', 'outfits', 'style'].map(page => (
            <button key={page} onClick={() => router.push('/' + locale + '/' + page)}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                background: page === activePage ? 'linear-gradient(135deg, #0ea472, #0891b2)' : 'transparent',
                color: page === activePage ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: page === activePage ? 'scale(1.05)' : 'scale(1)',
              }}>
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
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea472, #0891b2)', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(14,164,114,0.4)' }}>
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
          background: isDark ? 'rgba(13,17,23,0.88)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          display: 'flex', alignItems: 'center',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: isDark ? '0 -8px 32px rgba(0,0,0,0.4)' : '0 -8px 32px rgba(0,0,0,0.06)',
        }}
      >
        {/* Liquid Bubble */}
        {mounted && (
          <motion.div
            style={{
              position: 'absolute',
              top: '8px',
              x: springX,
              width: springWidth,
              height: '48px',
              background: isDark
                ? 'linear-gradient(135deg, rgba(14,164,114,0.3), rgba(8,145,178,0.3))'
                : 'linear-gradient(135deg, rgba(14,164,114,0.18), rgba(8,145,178,0.18))',
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(14,164,114,0.25)',
              boxShadow: '0 2px 16px rgba(14,164,114,0.25)',
              pointerEvents: 'none',
            }}
          />
        )}

        {tabs.map((item, i) => {
          const isActive = activePage === item.page
          return (
            <motion.button
              key={item.page}
              onClick={() => router.push('/' + locale + '/' + item.page)}
              animate={{
                scale: isActive ? 1.08 : 1,
                y: isActive ? -2 : 0,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', gap: '2px',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 0', flex: 1,
                position: 'relative' as const, zIndex: 1,
              }}
            >
              <motion.span
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  fontSize: '20px',
                  filter: isActive ? 'none' : 'grayscale(1)',
                  opacity: isActive ? 1 : 0.4,
                  display: 'block',
                  transition: 'filter 0.3s, opacity 0.3s',
                }}
              >
                {item.emoji}
              </motion.span>
              <motion.span
                animate={{ color: isActive ? '#0ea472' : isDark ? '#8b93a7' : '#9ca3af' }}
                style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 700 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: isActive ? '0.02em' : '0',
                }}
              >
                {item.label}
              </motion.span>
            </motion.button>
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