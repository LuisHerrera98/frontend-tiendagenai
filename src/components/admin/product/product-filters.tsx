'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/lib/categories'
import { productService } from '@/lib/products'
import { genderService } from '@/lib/genders'
import { brandService } from '@/lib/brands'
import { typeService } from '@/lib/types'
import { colorService } from '@/lib/colors'
import type { ProductFilters } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { Search, X, Filter, ChevronDown } from 'lucide-react'

interface ProductFiltersProps {
  onFiltersChange: (filters: ProductFilters) => void
  currentFilters: ProductFilters
}

export function ProductFilters({ onFiltersChange, currentFilters }: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(currentFilters)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const { data: filterOptions } = useQuery({
    queryKey: ['product-filters', localFilters.categoryId],
    queryFn: () => localFilters.categoryId ? 
      productService.getFilters(localFilters.categoryId) : 
      productService.getFilters(),
  })

  const { data: genders } = useQuery({
    queryKey: ['genders'],
    queryFn: genderService.getAll,
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

  useEffect(() => {
    setLocalFilters(currentFilters)
  }, [currentFilters])

  // Auto-close filters on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) { // sm breakpoint
        setIsFiltersOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleFilterChange = (key: keyof ProductFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined }
    
    // Si cambió la categoría, limpiar marca y modelo
    if (key === 'categoryId') {
      newFilters.brandName = undefined
      newFilters.modelName = undefined
    }
    
    setLocalFilters(newFilters)
    
    // Solo aplicar automáticamente los dropdowns, no el texto
    if (key !== 'name') {
      onFiltersChange({ ...newFilters, page: 1 })
    }
  }

  const applyFilters = () => {
    onFiltersChange({ ...localFilters, page: 1 })
  }

  const clearFilters = () => {
    const emptyFilters: ProductFilters = { page: 1, limit: currentFilters.limit }
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const hasActiveFilters = localFilters.name || localFilters.categoryId || localFilters.brandName || localFilters.modelName || localFilters.gender || localFilters.colorId

  return (
    <Card className="mb-6">
      {/* Mobile Filter Toggle */}
      <div className="sm:hidden">
        <CardContent className="p-4">
          <Button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            variant="outline"
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  Activos
                </span>
              )}
            </div>
            {isFiltersOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CardContent>
      </div>

      {/* Filters Content */}
      <CardContent className={`p-4 ${isFiltersOpen ? 'block' : 'hidden'} sm:block`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Búsqueda por nombre */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="name" className="text-sm font-medium">
              Buscar por nombre
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="name"
                type="text"
                placeholder="Buscar producto..."
                value={localFilters.name || ''}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="pl-10 w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    applyFilters()
                  }
                }}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Filtro por categoría */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categoría</Label>
            <CustomSelect
              options={[
                { value: '', label: 'Todas las categorías' },
                ...(categories?.map(category => ({
                  value: category._id,
                  label: category.name
                })) || [])
              ]}
              value={localFilters.categoryId || ''}
              onChange={(value) => handleFilterChange('categoryId', value)}
              placeholder="Todas las categorías"
            />
          </div>

          {/* Filtro por marca */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Marca</Label>
            <CustomSelect
              options={[
                { value: '', label: 'Todas las marcas' },
                ...(brands?.map(brand => ({
                  value: brand._id,
                  label: brand.name
                })) || [])
              ]}
              value={localFilters.brandName || ''}
              onChange={(value) => handleFilterChange('brandName', value)}
              placeholder="Todas las marcas"
              disabled={!brands?.length}
            />
          </div>

          {/* Filtro por tipo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo</Label>
            <CustomSelect
              options={[
                { value: '', label: 'Todos los tipos' },
                ...(types?.map(type => ({
                  value: type._id,
                  label: type.name
                })) || [])
              ]}
              value={localFilters.modelName || ''}
              onChange={(value) => handleFilterChange('modelName', value)}
              placeholder="Todos los tipos"
              disabled={!types?.length}
            />
          </div>

          {/* Filtro por género */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Género</Label>
            <CustomSelect
              options={[
                { value: '', label: 'Todos los géneros' },
                { value: 'hombre', label: 'Hombre' },
                { value: 'mujer', label: 'Mujer' },
                { value: 'niño', label: 'Niño' },
                { value: 'niña', label: 'Niña' }
              ]}
              value={localFilters.gender || ''}
              onChange={(value) => handleFilterChange('gender', value)}
              placeholder="Todos los géneros"
            />
          </div>

          {/* Filtro por color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Color</Label>
            <CustomSelect
              options={[
                { value: '', label: 'Todos los colores' },
                ...(colors?.map(color => ({
                  value: color._id,
                  label: color.name
                })) || [])
              ]}
              value={localFilters.colorId || ''}
              onChange={(value) => handleFilterChange('colorId', value)}
              placeholder="Todos los colores"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t gap-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={applyFilters} size="sm" className="bg-black hover:bg-gray-800 text-white flex-1 sm:flex-initial">
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" size="sm" className="flex-1 sm:flex-initial">
                <X className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Limpiar filtros</span>
                <span className="sm:hidden">Limpiar</span>
              </Button>
            )}
            {/* Close filters button for mobile */}
            <Button 
              onClick={() => setIsFiltersOpen(false)}
              variant="outline" 
              size="sm"
              className="sm:hidden flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </div>
          {hasActiveFilters && (
            <div className="text-sm text-gray-600 hidden sm:block">
              Filtros activos
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}