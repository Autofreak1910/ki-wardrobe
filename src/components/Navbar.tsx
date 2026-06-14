'use client'

import { useTheme } from '@/context/ThemeContext'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'

export default function Navbar({ activePage }: { activePage: string }) {
  const { theme, toggle } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const isDark = theme === 'dark'
  const navRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [tabWidth, setTabWidth] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState(-1)
  const currentActiveIndex = useRef(0)
  const dragIndexRef = useRef(-1)

  const tabs = [
    {
      page: 'dresser', label: locale === 'de' ? 'Stylist' : 'Stylist',
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.3 : 1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
          <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z"/>
        </svg>
      )
    },
    {
      page: 'wardrobe', label: locale === 'de' ? 'Schrank' : 'Wardrobe',
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.3 : 1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      )
    },
    {
      page: 'outfits', label: 'Outfits',
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.3 : 1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      )
    },
    {
      page: 'profile', label: locale === 'de' ? 'Profil' : 'Profile',
      icon: (a: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.3 : 1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
  ]

  const activeIndex = tabs.findIndex(t => t.page === activePage)
  const bubbleX = useMotionValue(0)
  const bubbleScale = useMotionValue(1)
  const SPRING = { type: 'spring' as const, stiffness: 600, damping: 40, mass: 0.6 }
  const SNAP_SPRING = { type: 'spring' as const, stiffness: 400, damping: 35, mass: 0.8 }

  function switchLanguage() {
    const nl = locale === 'de' ? 'en' : 'de'
    const s = pathname.split('/')
    s[1] = nl
    window.location.replace(s.join('/'))
  }

  const PILL_W = 64
  const PILL_H = 64

  function getPillX(index: number, totalW: number) {
    const tabW = totalW / tabs.length
    return index * tabW + tabW / 2 - PILL_W / 2
  }

  function snap(index: number, stretch = false) {
    if (!navRef.current) return
    const x = getPillX(index, navRef.current.offsetWidth)
    animate(bubbleX, x, stretch ? SPRING : SNAP_SPRING)
    animate(bubbleScale, stretch ? 1.18 : 1, stretch ? SPRING : SNAP_SPRING)
  }

  function getIndex(clientX: number) {
    if (!navRef.current) return 0
    const left = navRef.current.getBoundingClientRect().left
    const w = navRef.current.offsetWidth / tabs.length
    return Math.max(0, Math.min(tabs.length - 1, Math.floor((clientX - left) / w)))
  }

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { tabs.forEach(t => router.prefetch('/' + locale + '/' + t.page)) }, [locale])

  useEffect(() => {
    if (!mounted || !navRef.current) return
    const w = navRef.current.offsetWidth / tabs.length
    setTabWidth(w)
    currentActiveIndex.current = activeIndex
    bubbleX.set(getPillX(activeIndex, navRef.current.offsetWidth))
  }, [mounted])

  useEffect(() => {
    if (!mounted || !navRef.current || isDragging) return
    currentActiveIndex.current = activeIndex
    snap(activeIndex)
  }, [activeIndex, mounted])

  function onDragStart(e: React.TouchEvent | React.MouseEvent) {
    if (!navRef.current) return
    setIsDragging(true)
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    const idx = getIndex(x)
    dragIndexRef.current = idx
    setDragIndex(idx)
    snap(idx, true)
  }

  function onDragMove(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging || !navRef.current) return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const idx = getIndex(clientX)

    // Smooth follow during drag
    const left = navRef.current.getBoundingClientRect().left
    const totalW = navRef.current.offsetWidth
    const rawX = clientX - left - PILL_W / 2
    const clampedX = Math.max(0, Math.min(totalW - PILL_W, rawX))
    animate(bubbleX, clampedX, { duration: 0 })

    if (idx !== dragIndexRef.current) {
      dragIndexRef.current = idx
      setDragIndex(idx)
      animate(bubbleScale, 1.15, SPRING)
    }
  }

  function onDragEnd(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging || !navRef.current) return
    const x = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX
    const targetIndex = getIndex(x)
    setIsDragging(false)
    setDragIndex(-1)
    dragIndexRef.current = -1
    currentActiveIndex.current = targetIndex
    snap(targetIndex, false)
    router.push('/' + locale + '/' + tabs[targetIndex].page)
  }

  function onLeave() {
    if (!isDragging) return
    setIsDragging(false)
    setDragIndex(-1)
    dragIndexRef.current = -1
    snap(currentActiveIndex.current, false)
  }

  const accent = '#0ea472'
  const navBg = isDark ? 'rgba(8,15,12,0.92)' : 'rgba(240,253,248,0.92)'
  const navBorder = isDark ? '#1a3328' : '#d1f0e4'

  return (
    <>
      {/* Desktop Navbar */}
      <nav style={{
        borderBottom: `1px solid ${navBorder}`,
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '56px',
        background: navBg,
        position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.03em', color: isDark ? '#e8f5ee' : '#0a2e1e', fontFamily: "'DM Sans', sans-serif" }}>
          Ki<em style={{ fontFamily: "'DM Serif Display', serif" }}>Wardrobe</em>
        </span>
        <div className="desktop-nav" style={{ display: 'flex', gap: '2px' }}>
          {tabs.map(tab => (
            <button key={tab.page} onClick={() => router.push('/' + locale + '/' + tab.page)}
              style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: tab.page === activePage ? 600 : 400, fontFamily: "'DM Sans', sans-serif", background: tab.page === activePage ? 'rgba(14,164,114,0.12)' : 'transparent', color: tab.page === activePage ? accent : isDark ? '#4d7a62' : '#6b9e87', transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button onClick={switchLanguage} style={{ background: 'transparent', border: `1px solid ${navBorder}`, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', color: isDark ? '#4d7a62' : '#6b9e87', fontFamily: "'DM Sans', sans-serif" }}>
            {locale === 'de' ? 'EN' : 'DE'}
          </button>
          <button onClick={toggle} style={{ background: 'transparent', border: `1px solid ${navBorder}`, borderRadius: '6px', padding: '5px 9px', cursor: 'pointer', fontSize: '13px', color: isDark ? '#4d7a62' : '#6b9e87' }}>
            {isDark ? '○' : '●'}
          </button>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <div
        ref={navRef}
        className="mobile-nav"
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onLeave}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '80px',
          background: navBg,
          backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
          borderTop: `1px solid ${navBorder}`,
          display: 'flex', alignItems: 'center',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
          touchAction: 'none', userSelect: 'none',
        }}
      >
        {/* Liquid Glass Bubble */}
        {mounted && (
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              y: '-50%',
              x: bubbleX,
              width: PILL_W,
              height: PILL_H,
              scale: bubbleScale,
              borderRadius: '50%',
              // Liquid glass effect
              background: isDark
                ? 'radial-gradient(circle at 35% 35%, rgba(14,164,114,0.35) 0%, rgba(8,145,178,0.2) 50%, rgba(14,164,114,0.1) 100%)'
                : 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, rgba(14,164,114,0.25) 50%, rgba(8,145,178,0.15) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: isDark
                ? '1px solid rgba(14,164,114,0.4)'
                : '1px solid rgba(255,255,255,0.8)',
              boxShadow: isDark
                ? '0 4px 24px rgba(14,164,114,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 4px 24px rgba(14,164,114,0.25), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(14,164,114,0.1)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Tab buttons */}
        {tabs.map((item) => {
          const isActive = activePage === item.page
          const tabIdx = tabs.findIndex(t => t.page === item.page)
          const isHighlighted = isDragging ? dragIndex === tabIdx : isActive

          return (
            <motion.button
              key={item.page}
              onClick={() => !isDragging && router.push('/' + locale + '/' + item.page)}
              animate={{ scale: isHighlighted ? 1.08 : 1 }}
              transition={SPRING}
              style={{
                display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', justifyContent: 'center', gap: '3px',
                background: 'none', border: 'none',
                cursor: 'pointer', flex: 1, height: '80px',
                position: 'relative' as const, zIndex: 1,
                pointerEvents: isDragging ? 'none' : 'auto',
                WebkitTapHighlightColor: 'transparent',
                padding: 0,
              }}
            >
              <motion.span
                animate={{ color: isHighlighted ? (isDark ? '#0ea472' : '#0a2e1e') : isDark ? '#2a4a35' : '#b8d4c4' }}
                transition={{ duration: 0.15 }}
                style={{ display: 'flex' }}
              >
                {item.icon(isHighlighted)}
              </motion.span>
              <motion.span
                animate={{
                  color: isHighlighted ? (isDark ? accent : '#0a2e1e') : isDark ? '#2a4a35' : '#b8d4c4',
                  fontWeight: isHighlighted ? 700 : 400,
                  opacity: isHighlighted ? 1 : 0.6,
                }}
                transition={{ duration: 0.15 }}
                style={{ fontSize: '10px', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em' }}
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