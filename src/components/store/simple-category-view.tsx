'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Package } from 'lucide-react'

interface SimpleCategoryViewProps {
  subdomain: string
  storeName: string
}

interface Category {
  id: string
  _id?: string
  name: string
  description?: string
}

export function SimpleCategoryView({ subdomain, storeName }: SimpleCategoryViewProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
  }, [subdomain])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/public/categories/${subdomain}`)
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    // Navegar a la página de productos con la categoría preseleccionada
    router.push(`/store/${subdomain}/productos?category=${categoryId}&categoryName=${encodeURIComponent(categoryName)}`)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Título de la tienda */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{storeName}</h1>
          <p className="text-base sm:text-lg text-gray-600 px-4 sm:px-0">Selecciona una categoría para ver nuestros productos</p>
        </div>

        {/* Grid de categorías */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {categories.map((category) => (
              <button
                key={category.id || category._id}
                onClick={() => handleCategoryClick(category.id || category._id, category.name)}
                className="group relative bg-white border-2 border-gray-200 rounded-lg px-4 sm:px-6 py-2.5 sm:py-3 md:py-4 hover:border-gray-900 hover:shadow-md transition-all duration-200"
              >
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 text-center uppercase tracking-wide">
                  {category.name}
                </h3>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No hay categorías disponibles en este momento</p>
            <p className="text-gray-500 text-sm mt-2">Por favor, vuelve más tarde</p>
          </div>
        )}

        {/* Texto adicional */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            ¿Necesitas ayuda? Contáctanos por WhatsApp
          </p>
        </div>
      </div>
    </div>
  )
}