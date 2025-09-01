'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, Package, ChevronRight } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: {
    logo?: string
    primaryColor?: string
  }
  settings?: {
    simpleStoreEnabled?: boolean
    [key: string]: any
  }
}

interface Category {
  id: string
  _id?: string
  name: string
}

interface StoreHeaderProps {
  storeData: StoreData
}

export function StoreHeader({ storeData }: StoreHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const { getItemsCount } = useCart()
  const router = useRouter()
  const itemsCount = getItemsCount()
  const isSimpleStore = storeData.settings?.simpleStoreEnabled === true

  useEffect(() => {
    if (isSimpleStore) {
      fetchCategories()
    }
  }, [storeData.subdomain, isSimpleStore])

  const fetchCategories = async () => {
    try {
      const response = await api.get(`/public/categories/${storeData.subdomain}`)
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Menú hamburguesa - lado izquierdo */}
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo/Nombre - centro */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
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
          </div>

          {/* Carrito - lado derecho */}
          <button 
            onClick={() => router.push(`/store/${storeData.subdomain}/carrito`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <ShoppingCart className="w-6 h-6" />
            {itemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                {itemsCount}
              </span>
            )}
          </button>
        </div>

        {/* Menú desplegable */}
        {mobileMenuOpen && (
          <nav className="absolute top-16 left-0 right-0 bg-white shadow-lg border-t">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-1">
                <Link 
                  href={`/store/${storeData.subdomain}`} 
                  className="text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-3 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Inicio
                </Link>
                <Link 
                  href={`/store/${storeData.subdomain}/tracking`} 
                  className="text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-3 flex items-center gap-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Package className="w-4 h-4" />
                  Mi Pedido
                </Link>
                
                {/* Categorías - Solo mostrar si la tienda simple está activa */}
                {isSimpleStore && categories.length > 0 && (
                  <div className="border-t mt-2 pt-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                      Categorías
                    </p>
                    <div className="flex flex-col space-y-1">
                      {categories.map((category) => (
                        <Link
                          key={category.id || category._id}
                          href={`/store/${storeData.subdomain}/productos?category=${category.id || category._id}&categoryName=${encodeURIComponent(category.name)}`}
                          className="text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-3 flex items-center justify-between transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span>{category.name}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border-t mt-2 pt-2">
                  <Link 
                    href={`/store/${storeData.subdomain}/contacto`} 
                    className="text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-3 block transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contacto
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}