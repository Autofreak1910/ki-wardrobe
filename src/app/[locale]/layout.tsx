import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/context/ThemeContext'
import AppWrapper from '@/components/AppWrapper'
import '../globals.css'

const APP_URL = 'https://www.kiwardrobe.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isDe = locale === 'de'

  const title = isDe
    ? 'KiWardrobe — Dein KI-Stylist für den Alltag'
    : 'KiWardrobe — Your AI Stylist for Everyday Outfits'
  const description = isDe
    ? 'Digitalisiere deinen Kleiderschrank und lass dir jeden Tag ein passendes Outfit von der KI vorschlagen — abgestimmt auf Wetter und Anlass. Plus Virtual Try-On: probier Kleidung virtuell an einem Foto von dir aus.'
    : 'Digitize your wardrobe and get a matching outfit suggested by AI every day — tailored to weather and occasion. Plus Virtual Try-On: try on clothes virtually on a photo of yourself.'

  return {
    metadataBase: new URL(APP_URL),
    title,
    description,
    keywords: isDe
      ? ['KI Kleiderschrank', 'Outfit Generator', 'Virtual Try-On', 'KI Stylist', 'Kleiderschrank App', 'Outfit App', 'KiWardrobe']
      : ['AI wardrobe', 'outfit generator', 'virtual try-on', 'AI stylist', 'wardrobe app', 'outfit app', 'KiWardrobe'],
    alternates: {
      canonical: `${APP_URL}/${locale}`,
      languages: {
        de: `${APP_URL}/de`,
        en: `${APP_URL}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${APP_URL}/${locale}`,
      siteName: 'KiWardrobe',
      images: [{ url: `${APP_URL}/icon-512.png`, width: 512, height: 512, alt: 'KiWardrobe' }],
      locale: isDe ? 'de_DE' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [`${APP_URL}/icon-512.png`],
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: {
      google: 'Hm8TQYL0FaKLMbsndH9pdWjZUptrXfgs_b_MLj6nuVk',
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'de' | 'en')) notFound()
  const messages = await getMessages({ locale })

  return (
    <html lang={locale}>
     <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = saved || (prefersDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KiWardrobe" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FDFCF9" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#161616" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="prefetch" href={`/${locale}/dresser`} />
        <link rel="prefetch" href={`/${locale}/wardrobe`} />
        <link rel="prefetch" href={`/${locale}/outfits`} />
        <link rel="prefetch" href={`/${locale}/profile`} />

        {/* Light Mode Splash */}
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2064-2752.jpg" media="(device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-2732.jpg" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2420.jpg" media="(device-width: 834px) and (device-height: 1210px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2388.jpg" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2224.jpg" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1536-2048.jpg" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1640-2360.jpg" media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1620-2160.jpg" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1488-2266.jpg" media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1320-2868.jpg" media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1206-2622.jpg" media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1260-2736.jpg" media="(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1290-2796.jpg" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1179-2556.jpg" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1170-2532.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1284-2778.jpg" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1080-2340.jpg" media="(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242-2688.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125-2436.jpg" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-828-1792.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242-2208.jpg" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750-1334.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-640-1136.jpg" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: light)" />

        {/* Dark Mode Splash */}
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-2064-2752.jpg" media="(device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-2048-2732.jpg" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1668-2420.jpg" media="(device-width: 834px) and (device-height: 1210px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1668-2388.jpg" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1668-2224.jpg" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1536-2048.jpg" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1640-2360.jpg" media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1620-2160.jpg" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1488-2266.jpg" media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1320-2868.jpg" media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1206-2622.jpg" media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1260-2736.jpg" media="(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1290-2796.jpg" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1179-2556.jpg" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1170-2532.jpg" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1284-2778.jpg" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1080-2340.jpg" media="(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1242-2688.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1125-2436.jpg" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-828-1792.jpg" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-1242-2208.jpg" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-750-1334.jpg" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
        <link rel="apple-touch-startup-image" href="/splash-dark/apple-splash-640-1136.jpg" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait) and (prefers-color-scheme: dark)" />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <AppWrapper>{children}</AppWrapper>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}