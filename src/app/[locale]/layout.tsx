import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/context/ThemeContext'
import '../globals.css'

export const metadata: Metadata = {
  title: 'KiWardrobe',
  description: 'Dein persönlicher KI-Stylist',
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
        <link rel="prefetch" href={`/${locale}/dresser`} />
        <link rel="prefetch" href={`/${locale}/wardrobe`} />
        <link rel="prefetch" href={`/${locale}/outfits`} />
        <link rel="prefetch" href={`/${locale}/profile`} />
        <head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="KiWardrobe" />
  <meta name="theme-color" content="#0ea472" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
</head>
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}