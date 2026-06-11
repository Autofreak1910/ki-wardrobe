import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0ea472',
}

export const metadata: Metadata = {
  title: 'KiWardrobe',
  description: 'Dein persönlicher KI-Stylist',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KiWardrobe',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}