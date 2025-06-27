'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productService } from '@/lib/products'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProductFilters } from './product-filters'
import { ProductCard } from './product-card'

export function ProductCatalog() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page, filters],
    queryFn: () => productService.getProducts({ page, limit: 12, ...filters }),
  })

  return (
    <div className="w-full">
      <div className="w-full px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8 max-w-7xl mx-auto">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ProductFilters onFiltersChange={setFilters} />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Productos</h1>
            <div className="text-sm text-gray-600">
              {isLoading ? 'Cargando...' : `Mostrando ${data?.data?.length || 0} de ${data?.total || 0} productos`}
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-red-500 text-lg mb-4">Error al cargar productos</p>
                <p className="text-gray-400 text-sm">Por favor, verifica que el backend esté funcionando</p>
              </CardContent>
            </Card>
          ) : !data?.data || data.data.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 text-lg mb-4">No hay productos disponibles</p>
                <p className="text-gray-400 text-sm">Los productos aparecerán aquí una vez que se agreguen desde el panel de administración</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {data.data.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center mt-6 sm:mt-8">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  size="sm"
                >
                  Anterior
                </Button>
                <span className="flex items-center px-3 sm:px-4 text-xs sm:text-sm">
                  Página {page} de {data.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  size="sm"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}