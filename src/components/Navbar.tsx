'use client'

import { useTheme } from '@/context/ThemeContext'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue, animate } from 'framer-motion'

export default function Navbar({ activePage }: { activePage: string }) {
  const { theme, toggle } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const isDark = theme === 'dark'
  const navRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [tabWidth, setTabWidth] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const dragStartX = useRef(0)
  const currentActiveIndex = useRef(0)

  const tabs = [
    { page: 'dresser', emoji: '✦', label: 'Dress Me' },
    { page: 'wardrobe', emoji: '👗', label: locale === 'de' ? 'Schrank' : 'Wardrobe' },
    { page: 'outfits', emoji: '💫', label: 'Outfits' },
    { page: 'profile', emoji: '👤', label: locale === 'de' ? 'Profil' : 'Profile' },
  ]

  const activeIndex = tabs.findIndex(t => t.page === activePage)

  const bubbleX = useMotionValue(0)
  const springX = useSpring(bubbleX, { stiffness: 500, damping: 35, mass: 0.6 })
  const bubbleScale = useMotionValue(1)
  const springScale = useSpring(bubbleScale, { stiffness: 400, damping: 25 })

  function switchLanguage() {
    const newLocale = locale === 'de' ? 'en' : 'de'
    const segments = pathname.split('/')
    segments[1] = newLocale
    window.location.replace(segments.join('/'))
  }

  function getTabCenter(index: number, w: number) {
    return index * w + w * 0.1
  }

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !navRef.current) return
    const w = navRef.current.offsetWidth / tabs.length
    setTabWidth(w)
    currentActiveIndex.current = activeIndex
    bubbleX.set(getTabCenter(activeIndex, w))
  }, [mounted, activeIndex])

  function handleDragStart(e: React.TouchEvent | React.MouseEvent) {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    dragStartX.current = clientX
    bubbleScale.set(1.1)
  }

  function handleDragMove(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging || !navRef.current) return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const navLeft = navRef.current.getBoundingClientRect().left
    const relX = clientX - navLeft
    const w = navRef.current.offsetWidth / tabs.length
    const rawIndex = Math.floor(relX / w)
    const clampedIndex = Math.max(0, Math.min(tabs.length - 1, rawIndex))
    setHoveredIndex(clampedIndex)
    bubbleX.set(getTabCenter(clampedIndex, w))
  }

  function handleDragEnd(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging || !navRef.current) return
    setIsDragging(false)
    bubbleScale.set(1)
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX
    const navLeft = navRef.current.getBoundingClientRect().left
    const relX = clientX - navLeft
    const w = navRef.current.offsetWidth / tabs.length
    const targetIndex = Math.max(0, Math.min(tabs.length - 1, Math.floor(relX / w)))
    setHoveredIndex(-1)
    if (targetIndex !== currentActiveIndex.current) {
      router.push('/' + locale + '/' + tabs[targetIndex].page)
    }
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav style={{
        borderBottom: '1px solid var(--border)', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px',
        background: isDark ? 'rgba(13,17,23,0.9)' : 'rgba(255,255,255,0.9)',
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
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={() => { if (isDragging) { setIsDragging(false); bubbleScale.set(1); setHoveredIndex(-1) } }}
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
          touchAction: 'none',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        {/* Liquid Bubble */}
        {mounted && tabWidth > 0 && (
          <motion.div
            style={{
              position: 'absolute',
              top: '8px',
              x: springX,
              scaleX: springScale,
              width: tabWidth * 0.8,
              height: '48px',
              background: isDark
                ? 'linear-gradient(135deg, rgba(14,164,114,0.3), rgba(8,145,178,0.3))'
                : 'linear-gradient(135deg, rgba(14,164,114,0.2), rgba(8,145,178,0.2))',
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(14,164,114,0.3)',
              boxShadow: '0 2px 16px rgba(14,164,114,0.3)',
              pointerEvents: 'none',
              transformOrigin: 'center',
            }}
          />
        )}

        {tabs.map((item, i) => {
          const isActive = activePage === item.page
          const isHovered = hoveredIndex === i
          const isHighlighted = isDragging ? isHovered : isActive

          return (
            <motion.button
              key={item.page}
              onClick={() => !isDragging && router.push('/' + locale + '/' + item.page)}
              animate={{
                scale: isHighlighted ? 1.1 : 1,
                y: isHighlighted ? -3 : 0,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', gap: '2px',
                background: 'none', border: 'none',
                cursor: isDragging ? 'grabbing' : 'pointer',
                padding: '8px 0', flex: 1,
                position: 'relative' as const, zIndex: 1,
                pointerEvents: isDragging ? 'none' : 'auto',
              }}
            >
              <span style={{
                fontSize: '20px',
                filter: isHighlighted ? 'none' : 'grayscale(1)',
                opacity: isHighlighted ? 1 : 0.4,
                display: 'block',
                transition: 'filter 0.2s, opacity 0.2s',
              }}>
                {item.emoji}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: isHighlighted ? 700 : 400,
                color: isHighlighted ? '#0ea472' : isDark ? '#8b93a7' : '#9ca3af',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'color 0.2s',
              }}>
                {item.label}
              </span>
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