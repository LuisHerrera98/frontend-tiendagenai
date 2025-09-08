'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { ProductCard } from '@/components/store/product-card'
import { api } from '@/lib/api'
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: any
}

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
}

interface Category {
  id: string
  name: string
}

interface FilterOptions {
  sizes: Array<{id: string, name: string}>
  colors: Array<{id: string, name: string}>
  brands: Array<{id: string, name: string}>
}

function ProductsContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  
  // Obtener valores iniciales de la URL
  const initialCategory = searchParams.get('category') || ''
  const initialCategoryName = searchParams.get('categoryName') ? decodeURIComponent(searchParams.get('categoryName')!) : ''
  const shouldHideFilters = !!searchParams.get('category') // Ocultar filtros si viene con categoría
  
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(initialCategoryName)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hideFilters] = useState(shouldHideFilters)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ sizes: [], colors: [], brands: [] })
  const [selectedFilters, setSelectedFilters] = useState({
    sizes: [] as string[],
    colors: [] as string[],
    brands: [] as string[]
  })
  const limit = 12

  useEffect(() => {
    fetchStoreData()
    fetchCategories()
  }, [subdomain])

  useEffect(() => {
    // Actualizar categoría cuando cambie la URL
    const categoryFromUrl = searchParams.get('category') || ''
    const categoryNameFromUrl = searchParams.get('categoryName') ? decodeURIComponent(searchParams.get('categoryName')!) : ''
    
    setSelectedCategory(categoryFromUrl)
    setSelectedCategoryName(categoryNameFromUrl)
    setCurrentPage(1) // Resetear a la primera página cuando cambie la categoría
  }, [searchParams])

  useEffect(() => {
    // Llamar a fetchProducts cuando cambie la categoría, página o filtros
    fetchProducts()
    // Obtener opciones de filtros cuando cambie la categoría
    if (selectedCategory) {
      fetchFilterOptions()
    }
  }, [selectedCategory, currentPage, selectedFilters])

  const fetchStoreData = async () => {
    try {
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const response = await api.get(`/public/store/${targetSubdomain}`)
      setStoreData(response.data)
    } catch (err) {
      console.error('Error fetching store:', err)
    }
  }

  const fetchCategories = async () => {
    try {
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const response = await api.get(`/public/categories/${targetSubdomain}`)
      setCategories(response.data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchFilterOptions = async () => {
    try {
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const response = await api.get(`/public/filters/${targetSubdomain}/${selectedCategory}`)
      setFilterOptions(response.data || { sizes: [], colors: [], brands: [] })
    } catch (err) {
      console.error('Error fetching filter options:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const params = new URLSearchParams()
      if (selectedCategory) {
        params.append('category', selectedCategory)
      }
      // Agregar filtros seleccionados
      if (selectedFilters.sizes.length > 0) {
        params.append('sizes', selectedFilters.sizes.join(','))
      }
      if (selectedFilters.colors.length > 0) {
        params.append('colors', selectedFilters.colors.join(','))
      }
      if (selectedFilters.brands.length > 0) {
        params.append('brands', selectedFilters.brands.join(','))
      }
      params.append('limit', limit.toString())
      params.append('page', currentPage.toString())

      const response = await api.get(`/public/products/${targetSubdomain}?${params}`)
      setProducts(response.data.products)
      setTotalPages(response.data.pagination.totalPages)
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const activeFiltersCount = selectedFilters.sizes.length + selectedFilters.colors.length + selectedFilters.brands.length

  return (
    <StoreLayout storeData={storeData}>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold uppercase">
            {selectedCategoryName || 'Nuestros Productos'}
          </h1>
          
          {selectedCategory && (
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filtrar</span>
              {activeFiltersCount > 0 && (
                <span className="bg-black text-white text-xs rounded-full px-2 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}
        </div>

        <div className={hideFilters ? "" : "flex flex-col lg:flex-row gap-8"}>
          {/* Filtros de categorías - Solo mostrar si no viene de vista simple */}
          {!hideFilters && (
            <aside className="lg:w-64">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="font-semibold mb-4">Categorías</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('')
                      setSelectedCategoryName('')
                      setCurrentPage(1)
                    }}
                    className={`block w-full text-left px-3 py-2 rounded ${
                      selectedCategory === '' 
                        ? 'bg-black text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    Todas las categorías
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id)
                        setSelectedCategoryName(category.name)
                        setCurrentPage(1)
                      }}
                      className={`block w-full text-left px-3 py-2 rounded ${
                        selectedCategory === category.id 
                          ? 'bg-black text-white' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Grid de productos */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-2 sm:p-4 animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-lg mb-2 sm:mb-4"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded mb-1 sm:mb-2"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((product, index) => (
                    <div 
                      key={product.id} 
                      style={{ 
                        animationDelay: `${index * 0.12}s`,
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
                      className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <span className="px-4 py-2">
                      Página {currentPage} de {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Filtros */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:w-96 max-h-[80vh] rounded-t-xl sm:rounded-xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Filtro de Tallas */}
              {filterOptions.sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Tallas</h3>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => {
                          setSelectedFilters(prev => ({
                            ...prev,
                            sizes: prev.sizes.includes(size.id) 
                              ? prev.sizes.filter(s => s !== size.id)
                              : [...prev.sizes, size.id]
                          }))
                        }}
                        className={`px-3 py-1.5 border rounded-lg transition-colors ${
                          selectedFilters.sizes.includes(size.id)
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Filtro de Colores */}
              {filterOptions.colors.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Colores</h3>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => {
                          setSelectedFilters(prev => ({
                            ...prev,
                            colors: prev.colors.includes(color.id) 
                              ? prev.colors.filter(c => c !== color.id)
                              : [...prev.colors, color.id]
                          }))
                        }}
                        className={`px-3 py-1.5 border rounded-lg transition-colors ${
                          selectedFilters.colors.includes(color.id)
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Filtro de Marcas */}
              {filterOptions.brands.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Marcas</h3>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => {
                          setSelectedFilters(prev => ({
                            ...prev,
                            brands: prev.brands.includes(brand.id) 
                              ? prev.brands.filter(b => b !== brand.id)
                              : [...prev.brands, brand.id]
                          }))
                        }}
                        className={`px-3 py-1.5 border rounded-lg transition-colors ${
                          selectedFilters.brands.includes(brand.id)
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => {
                  setSelectedFilters({ sizes: [], colors: [], brands: [] })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={() => {
                  setShowFilterModal(false)
                  fetchProducts()
                }}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </StoreLayout>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}