'use client'

import { useTheme } from '@/context/ThemeContext'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'

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
  const dragIndexRef = useRef(-1)

  const tabs = [
    { page: 'dresser', emoji: '✦', label: 'Dress Me' },
    { page: 'wardrobe', emoji: '👗', label: locale === 'de' ? 'Schrank' : 'Wardrobe' },
    { page: 'outfits', emoji: '💫', label: 'Outfits' },
    { page: 'profile', emoji: '👤', label: locale === 'de' ? 'Profil' : 'Profile' },
  ]

  const activeIndex = tabs.findIndex(t => t.page === activePage)
  const bubbleX = useMotionValue(0)
  const bubbleW = useMotionValue(0)

  const SPRING = { type: 'spring' as const, stiffness: 1500, damping: 80, mass: 0.1 }

  function switchLanguage() {
    const newLocale = locale === 'de' ? 'en' : 'de'
    const segments = pathname.split('/')
    segments[1] = newLocale
    window.location.replace(segments.join('/'))
  }

  function getPos(index: number, w: number) {
    return { x: index * w + w * 0.08, width: w * 0.84 }
  }

  function snap(index: number, w: number, stretch = false) {
    const pos = getPos(index, w)
    animate(bubbleX, pos.x, { ...SPRING })
    animate(bubbleW, stretch ? pos.width * 1.12 : pos.width, { ...SPRING })
  }

  function getIndex(clientX: number) {
    if (!navRef.current) return 0
    const left = navRef.current.getBoundingClientRect().left
    const w = navRef.current.offsetWidth / tabs.length
    return Math.max(0, Math.min(tabs.length - 1, Math.floor((clientX - left) / w)))
  }

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !navRef.current) return
    const w = navRef.current.offsetWidth / tabs.length
    setTabWidth(w)
    currentActiveIndex.current = activeIndex
    const pos = getPos(activeIndex, w)
    bubbleX.set(pos.x)
    bubbleW.set(pos.width)
  }, [mounted])

  useEffect(() => {
    if (!mounted || !navRef.current || isDragging) return
    const w = navRef.current.offsetWidth / tabs.length
    currentActiveIndex.current = activeIndex
    snap(activeIndex, w)
  }, [activeIndex, mounted])

  function onDragStart(e: React.TouchEvent | React.MouseEvent) {
    if (!navRef.current) return
    setIsDragging(true)
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    const idx = getIndex(x)
    dragIndexRef.current = idx
    setDragIndex(idx)
    const w = navRef.current.offsetWidth / tabs.length
    snap(idx, w, true)
  }

  function onDragMove(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging || !navRef.current) return
    e.preventDefault()
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX
    const idx = getIndex(x)
    if (idx === dragIndexRef.current) return
    dragIndexRef.current = idx
    setDragIndex(idx)
    const w = navRef.current.offsetWidth / tabs.length
    snap(idx, w, true)
  }

  function onDragEnd(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging || !navRef.current) return
    const x = 'changedTouches' in e
      ? e.changedTouches[0].clientX
      : (e as React.MouseEvent).clientX
    const targetIndex = getIndex(x)
    const w = navRef.current.offsetWidth / tabs.length
    setIsDragging(false)
    setDragIndex(-1)
    dragIndexRef.current = -1
    currentActiveIndex.current = targetIndex
    snap(targetIndex, w, false)
    router.push('/' + locale + '/' + tabs[targetIndex].page)
  }

  function onLeave() {
    if (!isDragging || !navRef.current) return
    setIsDragging(false)
    setDragIndex(-1)
    dragIndexRef.current = -1
    const w = navRef.current.offsetWidth / tabs.length
    snap(currentActiveIndex.current, w)
  }

  return (
    <>
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
          height: '72px',
          background: isDark ? 'rgba(10,12,18,0.94)' : 'rgba(250,250,252,0.94)',
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'}`,
          display: 'flex', alignItems: 'center',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: isDark
            ? '0 -1px 0 rgba(255,255,255,0.05), 0 -8px 32px rgba(0,0,0,0.5)'
            : '0 -1px 0 rgba(0,0,0,0.04), 0 -8px 32px rgba(0,0,0,0.05)',
          touchAction: 'none', userSelect: 'none',
        }}
      >
        {mounted && tabWidth > 0 && (
          <motion.div style={{
            position: 'absolute', top: '10px',
            x: bubbleX, width: bubbleW, height: '52px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(14,164,114,0.25), rgba(8,145,178,0.25))'
              : 'linear-gradient(135deg, rgba(14,164,114,0.16), rgba(8,145,178,0.16))',
            borderRadius: '18px',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${isDark ? 'rgba(14,164,114,0.35)' : 'rgba(14,164,114,0.22)'}`,
            boxShadow: isDark
              ? '0 0 20px rgba(14,164,114,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 0 20px rgba(14,164,114,0.1), inset 0 1px 0 rgba(255,255,255,0.7)',
            pointerEvents: 'none',
          }} />
        )}

        {tabs.map((item) => {
          const isActive = activePage === item.page
          const isHighlighted = isDragging
            ? dragIndex === tabs.findIndex(t => t.page === item.page)
            : isActive

          return (
            <motion.button
              key={item.page}
              onClick={() => !isDragging && router.push('/' + locale + '/' + item.page)}
              animate={{ scale: isHighlighted ? 1.1 : 1, y: isHighlighted ? -3 : 0 }}
              transition={SPRING}
              style={{
                display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', gap: '3px',
                background: 'none', border: 'none',
                cursor: 'pointer', padding: '8px 0', flex: 1,
                position: 'relative' as const, zIndex: 1,
                pointerEvents: isDragging ? 'none' : 'auto',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <motion.span
                animate={{
                  filter: isHighlighted ? 'none' : 'grayscale(1)',
                  opacity: isHighlighted ? 1 : 0.38,
                  scale: isHighlighted ? 1.08 : 1,
                }}
                transition={SPRING}
                style={{ fontSize: '22px', display: 'block', lineHeight: 1 }}
              >
                {item.emoji}
              </motion.span>
              <motion.span
                animate={{
                  color: isHighlighted ? '#0ea472' : isDark ? '#6b7280' : '#9ca3af',
                  opacity: isHighlighted ? 1 : 0.6,
                }}
                transition={{ duration: 0.12 }}
                style={{
                  fontSize: '10px',
                  fontWeight: isHighlighted ? 700 : 400,
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