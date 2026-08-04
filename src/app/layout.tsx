import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#061712',
}

export const metadata: Metadata = {
  title: 'KiWardrobe',
  description: 'Dein persönlicher KI-Stylist',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KiWardrobe',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
  verification: {
    google: 'Hm8TQYL0FaKLMbsndH9pdWjZUptrXfgs_b_MLj6nuVk',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{'analytics_storage':'denied'});`,
          }}
        />
        <script async={true} src="https://www.googletagmanager.com/gtag/js?id=G-S08985T3YF" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-S08985T3YF');`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}