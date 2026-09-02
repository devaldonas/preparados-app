import type { Metadata, Viewport } from 'next'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'
import { CheckoutContainer } from '@/components/CheckoutContainer'

export const metadata: Metadata = {
  title: 'PREPARADO - Sua preparação para emergências',
  description: 'Prepare-se para qualquer situação com EDC, BOB ou BOLT.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#FFB800',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-title" content="PREPARADO" />
      </head>
      <body className="bg-gray-50 text-gray-900 h-full">
        <ClientLayout>{children}</ClientLayout>
        <CheckoutContainer />
      </body>
    </html>
  )
}
