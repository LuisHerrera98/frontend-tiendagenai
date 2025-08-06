import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { AuthProvider } from '@/contexts/auth-context'

export const metadata: Metadata = {
  title: 'Tu Tienda Online - Crea tu e-commerce en minutos',
  description: 'Plataforma para crear tu tienda online en minutos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen w-full">
        <AuthProvider>
          <Providers>
            <div className="min-h-screen w-full">
              {children}
            </div>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
}
