'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, Package, ChevronRight, ChevronDown } from 'lucide-react'
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
  subcategories?: Category[]
}

interface StoreHeaderProps {
  storeData: StoreData
}

export function StoreHeader({ storeData }: StoreHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
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
      const response = await api.get(`/public/categories-tree/${storeData.subdomain}`)
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Menú hamburguesa - lado izquierdo */}
          <button 
            className={`p-2 rounded-lg transition-colors ${
              mobileMenuOpen ? 'bg-gray-100' : 'hover:bg-gray-100'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <Menu className="w-6 h-6" />
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

        {/* Overlay de fondo cuando el menú está abierto */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Menú desplegable con animación */}
        <nav className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
            <div className="px-4 py-4">
              {/* Header del menú con botón de cerrar */}
              <div className="flex items-center justify-between mb-6">
                <Link 
                  href={`/store/${storeData.subdomain}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center"
                >
                  {storeData.customization?.logo ? (
                    <img 
                      src={storeData.customization.logo} 
                      alt={storeData.storeName}
                      className="h-8 w-auto"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-gray-900">
                      {storeData.storeName}
                    </h2>
                  )}
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              
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
                      {categories.map((category) => {
                        const categoryId = category.id || category._id || ''
                        const hasSubcategories = category.subcategories && category.subcategories.length > 0
                        const isExpanded = expandedCategories.has(categoryId)

                        return (
                          <div key={categoryId}>
                            {/* Categoría padre */}
                            <div className="flex items-center">
                              {hasSubcategories ? (
                                <button
                                  onClick={() => toggleCategory(categoryId)}
                                  className="flex-1 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-3 flex items-center justify-between transition-colors"
                                >
                                  <span className="font-medium">{category.name}</span>
                                  <ChevronDown
                                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                      isExpanded ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                              ) : (
                                <Link
                                  href={`/store/${storeData.subdomain}/productos?category=${categoryId}&categoryName=${encodeURIComponent(category.name)}`}
                                  className="flex-1 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-3 flex items-center justify-between transition-colors"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <span>{category.name}</span>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </Link>
                              )}
                            </div>

                            {/* Subcategorías expandibles */}
                            {hasSubcategories && isExpanded && (
                              <div className="ml-4 mt-1 space-y-1 pb-2">
                                {/* Opción "Ver todo" */}
                                <Link
                                  href={`/store/${storeData.subdomain}/productos?category=${categoryId}&categoryName=${encodeURIComponent(category.name)}`}
                                  className="text-gray-600 hover:bg-blue-50 rounded-lg px-3 py-2 flex items-center gap-2 transition-colors text-sm"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <span className="font-medium text-blue-600">Ver todo</span>
                                </Link>

                                {/* Lista de subcategorías */}
                                {category.subcategories?.map((subcat) => {
                                  const subcatId = subcat.id || subcat._id || ''
                                  return (
                                    <Link
                                      key={subcatId}
                                      href={`/store/${storeData.subdomain}/productos?category=${subcatId}&categoryName=${encodeURIComponent(subcat.name)}`}
                                      className="text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between transition-colors text-sm border-l-2 border-gray-200 ml-2"
                                      onClick={() => setMobileMenuOpen(false)}
                                    >
                                      <span>{subcat.name}</span>
                                      <ChevronRight className="w-3 h-3 text-gray-400" />
                                    </Link>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
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
      </div>
    </header>
  )
}