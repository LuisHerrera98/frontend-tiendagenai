'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, Package } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: {
    logo?: string
    primaryColor?: string
  }
}

interface StoreHeaderProps {
  storeData: StoreData
}

export function StoreHeader({ storeData }: StoreHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { getItemsCount } = useCart()
  const router = useRouter()
  const itemsCount = getItemsCount()

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Nombre */}
          <Link href={`/store/${storeData.subdomain}`} className="flex items-center">
            {storeData.customization?.logo ? (
              <img 
                src={storeData.customization.logo} 
                alt={storeData.storeName}
                className="h-8 w-auto"
              />
            ) : (
              <h1 className="text-xl font-bold" style={{ color: 'var(--store-primary)' }}>
                {storeData.storeName}
              </h1>
            )}
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href={`/store/${storeData.subdomain}`} className="text-gray-700 hover:text-gray-900">
              Inicio
            </Link>
            <Link href={`/store/${storeData.subdomain}/tracking`} className="text-gray-700 hover:text-gray-900 flex items-center gap-1">
              <Package className="w-4 h-4" />
              Mi Pedido
            </Link>
            <Link href={`/store/${storeData.subdomain}/contacto`} className="text-gray-700 hover:text-gray-900">
              Contacto
            </Link>
          </nav>

          {/* Iconos de acción */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push(`/store/${storeData.subdomain}/carrito`)}
              className="p-2 hover:bg-gray-100 rounded-full relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemsCount}
                </span>
              )}
            </button>

            {/* Botón menú móvil */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link href={`/store/${storeData.subdomain}`} className="text-gray-700 hover:text-gray-900">
                Inicio
              </Link>
              <Link href={`/store/${storeData.subdomain}/tracking`} className="text-gray-700 hover:text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Mi Pedido
              </Link>
              <Link href={`/store/${storeData.subdomain}/contacto`} className="text-gray-700 hover:text-gray-900">
                Contacto
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}