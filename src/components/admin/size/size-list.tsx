'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sizeService } from '@/lib/sizes'
import { categoryService } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Tag, Package } from 'lucide-react'
import { DeleteSizeDialog } from './delete-size-dialog'

export function SizeList() {
  const [deletingSize, setDeletingSize] = useState<any | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: sizes, isLoading, error } = useQuery({
    queryKey: ['sizes'],
    queryFn: sizeService.getAll,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const getCategoryName = (categoryId: string) => {
    return categories?.find(cat => cat._id === categoryId)?.name || 'Sin categoría'
  }

  // Función para ordenar talles
  const sortSizes = (sizes: any[]) => {
    return sizes.sort((a, b) => {
      const aName = a.name.toUpperCase()
      const bName = b.name.toUpperCase()
      
      // Orden específico para talles de letras
      const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', 'XXXXL', '4XL', 'XXXXXL', '5XL']
      
      const aIndex = sizeOrder.indexOf(aName)
      const bIndex = sizeOrder.indexOf(bName)
      
      // Si ambos están en el orden específico, usar ese orden
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      
      // Si solo uno está en el orden específico, ese va primero
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      // Si ninguno está en el orden específico, ordenar numéricamente si son números
      const aNum = parseInt(aName)
      const bNum = parseInt(bName)
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum
      }
      
      // Si no son números, ordenar alfabéticamente
      return aName.localeCompare(bName)
    })
  }

  // Agrupar talles por categoría y ordenar
  const sizesByCategory = sizes?.reduce((acc, size) => {
    const categoryId = size.category_id || 'uncategorized'
    const categoryName = getCategoryName(categoryId)
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        name: categoryName,
        sizes: []
      }
    }
    acc[categoryId].sizes.push(size)
    return acc
  }, {}) || {}

  // Ordenar los talles en cada categoría
  Object.keys(sizesByCategory).forEach(categoryId => {
    sizesByCategory[categoryId].sizes = sortSizes(sizesByCategory[categoryId].sizes)
  })

  const handleDelete = (size: any) => {
    setDeletingSize(size)
    setShowDeleteDialog(true)
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">Error al cargar talles</div>
        <div className="text-sm text-red-400">Intenta recargar la página</div>
      </div>
    )
  }

  if (!sizes || sizes.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 mb-2 text-lg font-medium">No hay talles registrados</p>
        <p className="text-sm text-gray-400">Haz clic en "Nuevo Talle" para agregar el primer talle</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {Object.entries(sizesByCategory).map(([categoryId, categoryData]) => (
          <Card key={categoryId} className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4 text-green-600" />
                {categoryData.name}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {categoryData.sizes.length} {categoryData.sizes.length === 1 ? 'talle' : 'talles'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                {categoryData.sizes.map((size) => (
                  <div
                    key={size._id}
                    className="group relative bg-gray-900 rounded-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer"
                  >
                    {/* Talle principal con colores del admin panel */}
                    <div className="w-14 h-14 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white group-hover:text-white transition-colors">
                        {size.name}
                      </span>
                    </div>

                    {/* Solo botón de eliminar */}
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(size)
                        }}
                        className="h-6 w-6 p-0 bg-red-600 hover:bg-red-700 text-white border-0 rounded-full shadow-md"
                        title={`Eliminar talle ${size.name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Dialog */}
      <DeleteSizeDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        size={deletingSize}
      />
    </>
  )
}