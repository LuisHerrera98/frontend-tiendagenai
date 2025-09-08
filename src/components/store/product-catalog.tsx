'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { ProductCard } from './product-card'
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: {
    id: string
    name: string
  }
  brand: {
    id: string
    name: string
  }
  gender: string
}

interface Category {
  id: string
  name: string
}

interface Filters {
  brands: Array<{ id: string; name: string }>
  genders: Array<{ id: string; name: string }>
}

interface ProductCatalogProps {
  subdomain: string
}

export function ProductCatalog({ subdomain }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<Filters>({ brands: [], genders: [] })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedGender, setSelectedGender] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const limit = 20

  useEffect(() => {
    fetchCategories()
    fetchFilters()
  }, [subdomain])

  useEffect(() => {
    fetchProducts()
  }, [subdomain, selectedCategory, selectedBrand, selectedGender, currentPage])

  const fetchCategories = async () => {
    try {
      const response = await api.get(`/public/categories/${subdomain}`)
      setCategories(response.data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchFilters = async () => {
    try {
      const response = await api.get(`/public/filters/${subdomain}`)
      setFilters(response.data)
    } catch (err) {
      console.error('Error fetching filters:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedBrand) params.append('brand', selectedBrand)
      if (selectedGender) params.append('gender', selectedGender)
      params.append('limit', limit.toString())
      params.append('page', currentPage.toString())

      const response = await api.get(`/public/products/${subdomain}?${params}`)
      setProducts(response.data.products)
      setTotalPages(response.data.pagination.totalPages)
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedBrand('')
    setSelectedGender('')
    setCurrentPage(1)
  }

  const hasActiveFilters = selectedCategory || selectedBrand || selectedGender

  const FilterSection = () => (
    <div className="space-y-4">
      {/* Categorías */}
      <div>
        <label className="block text-sm font-medium mb-1">Categoría</label>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Marcas */}
      <div>
        <label className="block text-sm font-medium mb-1">Marca</label>
        <select
          value={selectedBrand}
          onChange={(e) => {
            setSelectedBrand(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">Todas las marcas</option>
          {filters.brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {/* Género */}
      <div>
        <label className="block text-sm font-medium mb-1">Género</label>
        <select
          value={selectedGender}
          onChange={(e) => {
            setSelectedGender(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">Todos los géneros</option>
          {filters.genders.map((gender) => (
            <option key={gender.id} value={gender.id}>
              {gender.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full text-sm text-red-600 hover:text-red-700 flex items-center justify-center gap-1 py-2 border border-red-200 rounded-md hover:bg-red-50 transition"
        >
          <X className="w-4 h-4" />
          Limpiar filtros
        </button>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Productos</h1>
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden flex items-center gap-2 px-3 py-1.5 border rounded text-sm"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      <div className="flex gap-6">
        {/* Filtros Desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="font-semibold text-base mb-4">Filtros</h2>
            <FilterSection />
          </div>
        </aside>

        {/* Filtros Mobile */}
        {showMobileFilters && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileFilters(false)}>
            <div className="absolute left-0 top-0 h-full w-64 bg-white p-6 shadow-lg overflow-y-auto" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="absolute top-4 right-4 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="font-semibold mb-4">Filtros</h2>
              <FilterSection />
            </div>
          </div>
        )}

        {/* Grid de productos */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-3 animate-pulse border">
                  <div className="bg-gray-200 aspect-square rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {products.map((product, index) => (
                  <div 
                    key={product.id}
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      opacity: 0,
                      animation: 'fadeInUp 0.9s ease-out forwards'
                    }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-1 text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron productos</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}