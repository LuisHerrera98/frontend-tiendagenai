import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'Ecommerce Store',
  description: 'Modern ecommerce platform with admin management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen w-full">
        <Providers>
          <div className="min-h-screen w-full">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
