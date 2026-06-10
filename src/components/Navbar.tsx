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
  const [dragIndex, setDragIndex] = useState(-1)
  const currentActiveIndex = useRef(0)

  const tabs = [
    { page: 'dresser', emoji: '✦', label: 'Dress Me' },
    { page: 'wardrobe', emoji: '👗', label: locale === 'de' ? 'Schrank' : 'Wardrobe' },
    { page: 'outfits', emoji: '💫', label: 'Outfits' },
    { page: 'profile', emoji: '👤', label: locale === 'de' ? 'Profil' : 'Profile' },
  ]

  const activeIndex = tabs.findIndex(t => t.page === activePage)

  const bubbleX = useMotionValue(0)
  const bubbleW = useMotionValue(0)
  const springX = useSpring(bubbleX, { stiffness: 600, damping: 40, mass: 0.5 })
  const springW = useSpring(bubbleW, { stiffness: 600, damping: 40, mass: 0.5 })

  function switchLanguage() {
    const newLocale = locale === 'de' ? 'en' : 'de'
    const segments = pathname.split('/')
    segments[1] = newLocale
    window.location.replace(segments.join('/'))
  }

  function getBubblePos(index: number, w: number) {
    return { x: index * w + w * 0.08, width: w * 0.84 }
  }

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !navRef.current) return
    const w = navRef.current.offsetWidth / tabs.length
    setTabWidth(w)
    currentActiveIndex.current = activeIndex
    const pos = getBubblePos(activeIndex, w)
    animate(bubbleX, pos.x, { type: 'spring', stiffness: 600, damping: 40, mass: 0.5 })
    animate(bubbleW, pos.width, { type: 'spring', stiffness: 600, damping: 40 })
  }, [mounted, activeIndex])

  function getIndexFromX(clientX: number) {
    if (!navRef.current) return 0
    const navLeft = navRef.current.getBoundingClientRect().left
    const w = navRef.current.offsetWidth / tabs.length
    return Math.max(0, Math.min(tabs.length - 1, Math.floor((clientX - navLeft) / w)))
  }

  function handleDragStart(e: React.TouchEvent | React.MouseEvent) {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const idx = getIndexFromX(clientX)
    setDragIndex(idx)
    if (!navRef.current) return
    const w = navRef.current.offsetWidth / tabs.length
    const pos = getBubblePos(idx, w)
    animate(bubbleX, pos.x, { type: 'spring', stiffness: 800, damping: 40 })
    // Stretch bubble when dragging
    animate(bubbleW, pos.width * 1.15, { type: 'spring', stiffness: 800, damping: 40 })
  }

  function handleDragMove(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging || !navRef.current) return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const idx = getIndexFromX(clientX)
    if (idx === dragIndex) return
    setDragIndex(idx)
    const w = navRef.current.offsetWidth / tabs.length
    const pos = getBubblePos(idx, w)
    animate(bubbleX, pos.x, { type: 'spring', stiffness: 800, damping: 40, mass: 0.4 })
    animate(bubbleW, pos.width * 1.1, { type: 'spring', stiffness: 800, damping: 40 })
  }

  function handleDragEnd(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging || !navRef.current) return
    setIsDragging(false)
    const clientX = 'changedTouches' in e
      ? e.changedTouches[0].clientX
      : (e as React.MouseEvent).clientX
    const targetIndex = getIndexFromX(clientX)
    setDragIndex(-1)

    const w = navRef.current.offsetWidth / tabs.length
    const pos = getBubblePos(targetIndex, w)

    // Snap back to normal size with squish
    animate(bubbleW, pos.width * 1.08, { duration: 0.08 }).then(() => {
      animate(bubbleW, pos.width, { type: 'spring', stiffness: 500, damping: 30 })
    })
    animate(bubbleX, pos.x, { type: 'spring', stiffness: 600, damping: 40 })

    currentActiveIndex.current = targetIndex
    router.push('/' + locale + '/' + tabs[targetIndex].page)
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav style={{
        borderBottom: '1px solid var(--border)', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '60px',
        background: isDark ? 'rgba(13,17,23,0.92)' : 'rgba(255,255,255,0.92)',
        position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        boxShadow: isDark ? '0 1px 0 rgba(255,255,255,0.05)' : '0 1px 0 rgba(0,0,0,0.06)',
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
        onMouseLeave={() => {
          if (isDragging) {
            setIsDragging(false)
            setDragIndex(-1)
            if (navRef.current) {
              const w = navRef.current.offsetWidth / tabs.length
              const pos = getBubblePos(currentActiveIndex.current, w)
              animate(bubbleX, pos.x, { type: 'spring', stiffness: 600, damping: 40 })
              animate(bubbleW, pos.width, { type: 'spring', stiffness: 600, damping: 40 })
            }
          }
        }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '72px',
          background: isDark ? 'rgba(10,12,18,0.92)' : 'rgba(250,250,252,0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'}`,
          display: 'flex', alignItems: 'center',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: isDark
            ? '0 -1px 0 rgba(255,255,255,0.05), 0 -8px 32px rgba(0,0,0,0.5)'
            : '0 -1px 0 rgba(0,0,0,0.04), 0 -8px 32px rgba(0,0,0,0.05)',
          touchAction: 'none',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        {/* Liquid Glass Bubble */}
        {mounted && tabWidth > 0 && (
          <motion.div
            style={{
              position: 'absolute',
              top: '10px',
              x: springX,
              width: springW,
              height: '52px',
              background: isDark
                ? 'linear-gradient(135deg, rgba(14,164,114,0.22), rgba(8,145,178,0.22))'
                : 'linear-gradient(135deg, rgba(14,164,114,0.14), rgba(8,145,178,0.14))',
              borderRadius: '18px',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${isDark ? 'rgba(14,164,114,0.35)' : 'rgba(14,164,114,0.25)'}`,
              boxShadow: isDark
                ? '0 0 20px rgba(14,164,114,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 0 20px rgba(14,164,114,0.12), inset 0 1px 0 rgba(255,255,255,0.6)',
              pointerEvents: 'none',
            }}
          />
        )}

        {tabs.map((item, i) => {
          const isActive = activePage === item.page
          const isDragActive = isDragging && dragIndex === i
          const isHighlighted = isDragging ? isDragActive : isActive

          return (
            <motion.button
              key={item.page}
              onClick={() => !isDragging && router.push('/' + locale + '/' + item.page)}
              animate={{
                scale: isHighlighted ? 1.12 : 1,
                y: isHighlighted ? -4 : 0,
              }}
              transition={{ type: 'spring', stiffness: 600, damping: 35, mass: 0.4 }}
              style={{
                display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', gap: '3px',
                background: 'none', border: 'none',
                cursor: isDragging ? 'grabbing' : 'pointer',
                padding: '8px 0', flex: 1,
                position: 'relative' as const, zIndex: 1,
                pointerEvents: isDragging ? 'none' : 'auto',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <motion.span
                animate={{
                  filter: isHighlighted ? 'none' : 'grayscale(1)',
                  opacity: isHighlighted ? 1 : 0.38,
                  scale: isHighlighted ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 600, damping: 35 }}
                style={{ fontSize: '22px', display: 'block', lineHeight: 1 }}
              >
                {item.emoji}
              </motion.span>
              <motion.span
                animate={{
                  color: isHighlighted ? '#0ea472' : isDark ? '#6b7280' : '#9ca3af',
                  fontWeight: isHighlighted ? 700 : 400,
                  opacity: isHighlighted ? 1 : 0.7,
                }}
                style={{
                  fontSize: '10px',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '0.01em',
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