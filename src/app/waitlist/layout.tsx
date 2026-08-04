import Script from 'next/script'

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>KiWardrobe — Dein KI-Stylist</title>
        <link rel="icon" href="/icon-512.png" />
      </head>
      <body>
        <Script id="ga-consent" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{'analytics_storage':'denied'});`}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-S08985T3YF"
          strategy="beforeInteractive"
        />
        <Script id="ga-config" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-S08985T3YF');`}
        </Script>
        {children}
      </body>
    </html>
  )
}