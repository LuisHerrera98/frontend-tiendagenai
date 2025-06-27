'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/lib/categories'
import { productService } from '@/lib/products'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'

interface ProductFiltersProps {
  onFiltersChange: (filters: any) => void
}

export function ProductFilters({ onFiltersChange }: ProductFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const { data: filters } = useQuery({
    queryKey: ['filters', selectedCategory],
    queryFn: () => productService.getFilters(selectedCategory),
    enabled: !!selectedCategory,
    staleTime: 0, // Force refresh to get updated data
    gcTime: 0, // Don't cache old data
  })

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSelectedBrand('') // Reset brand when category changes
    setSelectedSize('') // Reset size when category changes
    
    updateFilters({
      categoryId: categoryId || undefined,
      brandName: undefined,
      sizeName: undefined
    })
  }

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand)
    updateFilters({
      categoryId: selectedCategory || undefined,
      brandName: brand || undefined,
      sizeName: selectedSize || undefined
    })
  }

  const handleSizeChange = (size: string) => {
    setSelectedSize(size)
    updateFilters({
      categoryId: selectedCategory || undefined,
      brandName: selectedBrand || undefined,
      sizeName: size || undefined
    })
  }

  const updateFilters = (newFilters: any) => {
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedBrand('')
    setSelectedSize('')
    onFiltersChange({})
  }

  // Prepare options for selects
  const categoryOptions = categories?.map(cat => ({
    value: cat._id,
    label: cat.name
  })) || []

  const brandOptions = filters?.brands?.map((brand: string) => ({
    value: brand,
    label: brand
  })) || []

  const sizeOptions = filters?.sizes?.map((size: string) => ({
    value: size,
    label: size
  })) || []

  return (
    <div className="space-y-3">
      <Card className="shadow-sm">
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {/* Categories */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">Categoría</label>
            <CustomSelect
              options={categoryOptions}
              value={selectedCategory}
              onValueChange={handleCategoryChange}
              placeholder="Seleccionar categoría"
            />
          </div>

          {/* Brands */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">Marca</label>
            <CustomSelect
              options={brandOptions}
              value={selectedBrand}
              onValueChange={handleBrandChange}
              placeholder={selectedCategory ? "Seleccionar marca" : "Selecciona una categoría"}
              disabled={!selectedCategory}
            />
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">Talla</label>
            <CustomSelect
              options={sizeOptions}
              value={selectedSize}
              onValueChange={handleSizeChange}
              placeholder={selectedCategory ? "Seleccionar talla" : "Selecciona una categoría"}
              disabled={!selectedCategory}
            />
          </div>

          {/* Clear filters */}
          <Button 
            variant="outline" 
            className="w-full mt-3 h-8 text-xs" 
            onClick={clearFilters}
            disabled={!selectedCategory && !selectedBrand && !selectedSize}
          >
            Limpiar Filtros
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}