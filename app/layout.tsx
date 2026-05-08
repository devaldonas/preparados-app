import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PREPARADOS - Sua preparação para emergências',
  description: 'Prepare-se para qualquer situação com EDC, BOB ou BOLT. Monte sua mochila, conecte-se com pessoas próximas.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  )
}