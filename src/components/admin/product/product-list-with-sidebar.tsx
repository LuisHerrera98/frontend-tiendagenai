'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { productService } from '@/lib/products'
import { categoryService } from '@/lib/categories'
import { brandService } from '@/lib/brands'
import { typeService } from '@/lib/types'
import { colorService } from '@/lib/colors'
import type { Product, ProductFilters } from '@/types'
import { ProductTableInfinite } from './product-table-infinite'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CustomSelect } from '@/components/ui/custom-select'
import { Card } from '@/components/ui/card'
import { Search, X, Filter, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProductListWithSidebar() {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20, // Aumentado a 20 para mejor UX
    showAll: true,
  })
  const [searchText, setSearchText] = useState('')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  // Queries for filter options
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getAll,
  })

  const { data: types } = useQuery({
    queryKey: ['types'],
    queryFn: typeService.getAll,
  })

  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: colorService.getAll,
  })

  // Products infinite query
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam = 1 }) => 
      productService.getProducts({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      const currentPage = pages.length
      return currentPage < lastPage.totalPages ? currentPage + 1 : undefined
    },
    initialPageParam: 1,
  })

  // Flatten all pages of products
  const allProducts = data?.pages.flatMap(page => page.data) || []
  const totalProducts = data?.pages[0]?.total || 0

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset to page 1 when filters change
    }))
  }

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleSearch = () => {
    if (searchText.trim() || filters.name) {
      handleFilterChange('name', searchText.trim())
    }
  }

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      showAll: true,
    })
    setSearchText('')
  }

  const hasActiveFilters = !!(
    filters.name ||
    filters.categoryId ||
    filters.brandName ||
    filters.modelName ||
    filters.gender ||
    filters.colorId ||
    filters.active !== undefined
  )

  // Handle enter key in search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Mobile filter button */}
      <Button
        className="lg:hidden fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        size="lg"
        onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
      >
        <Filter className="w-5 h-5" />
      </Button>

      {/* Sidebar Filters */}
      <aside className={cn(
        "w-64 flex-shrink-0 space-y-4 overflow-visible",
        "lg:block",
        isMobileFiltersOpen ? "fixed inset-0 z-40 bg-white p-6 overflow-y-auto" : "hidden"
      )}>
        {/* Mobile close button */}
        {isMobileFiltersOpen && (
          <div className="flex justify-between items-center mb-4 lg:hidden">
            <h2 className="text-lg font-semibold">Filtros</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Card className="p-4 overflow-visible">
          <h3 className="font-semibold mb-4 text-sm text-gray-700">FILTROS</h3>
          
          {/* Search */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600 mb-1.5">Buscar por nombre</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar producto..."
                  className="flex-1 h-9"
                />
                <Button 
                  onClick={handleSearch}
                  size="sm"
                  className="px-3"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Category */}
            <div>
              <Label className="text-xs text-gray-600 mb-1.5">Categoría</Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Todas' },
                  ...(categories?.map(cat => ({
                    value: cat._id,
                    label: cat.name
                  })) || [])
                ]}
                value={filters.categoryId || ''}
                onChange={(value) => handleFilterChange('categoryId', value)}
                placeholder="Seleccionar"
              />
            </div>

            {/* Brand */}
            <div>
              <Label className="text-xs text-gray-600 mb-1.5">Marca</Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Todas' },
                  ...(brands?.map(brand => ({
                    value: brand._id,
                    label: brand.name
                  })) || [])
                ]}
                value={filters.brandName || ''}
                onChange={(value) => handleFilterChange('brandName', value)}
                placeholder="Seleccionar"
              />
            </div>

            {/* Type */}
            <div>
              <Label className="text-xs text-gray-600 mb-1.5">Tipo</Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Todos' },
                  ...(types?.map(type => ({
                    value: type._id,
                    label: type.name
                  })) || [])
                ]}
                value={filters.modelName || ''}
                onChange={(value) => handleFilterChange('modelName', value)}
                placeholder="Seleccionar"
              />
            </div>

            {/* Gender */}
            <div>
              <Label className="text-xs text-gray-600 mb-1.5">Género</Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'hombre', label: 'Hombre' },
                  { value: 'mujer', label: 'Mujer' },
                  { value: 'niño', label: 'Niño' },
                  { value: 'niña', label: 'Niña' },
                ]}
                value={filters.gender || ''}
                onChange={(value) => handleFilterChange('gender', value)}
                placeholder="Seleccionar"
              />
            </div>

            {/* Color */}
            <div>
              <Label className="text-xs text-gray-600 mb-1.5">Color</Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Todos' },
                  ...(colors?.map(color => ({
                    value: color._id,
                    label: color.name
                  })) || [])
                ]}
                value={filters.colorId || ''}
                onChange={(value) => handleFilterChange('colorId', value)}
                placeholder="Seleccionar"
              />
            </div>

            {/* Estado */}
            <div>
              <Label className="text-xs text-gray-600 mb-1.5">Estado</Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'true', label: 'Activos' },
                  { value: 'false', label: 'Inactivos' },
                ]}
                value={filters.active !== undefined ? String(filters.active) : ''}
                onChange={(value) => handleFilterChange('active', value ? value === 'true' : undefined)}
                placeholder="Seleccionar"
              />
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
              className="w-full mt-4"
            >
              <X className="w-4 h-4 mr-2" />
              Limpiar filtros
            </Button>
          )}
        </Card>

        {/* Results count */}
        <Card className="p-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {totalProducts}
            </span>{' '}
            productos encontrados
          </div>
          {allProducts.length < totalProducts && (
            <div className="text-xs text-gray-500 mt-1">
              Mostrando {allProducts.length} de {totalProducts}
            </div>
          )}
        </Card>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Lista de Productos</h2>
              {hasActiveFilters && (
                <span className="text-sm text-gray-500">
                  Filtros activos
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-h-0">
            <ProductTableInfinite
              products={allProducts}
              isLoading={isLoading}
              hasMore={hasNextPage || false}
              onLoadMore={handleLoadMore}
              isLoadingMore={isFetchingNextPage}
            />
          </div>
        </Card>
      </main>
    </div>
  )
}