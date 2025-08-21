'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, Layers } from 'lucide-react'
import { CreateSizeDialog } from '@/components/admin/size/create-size-dialog'
import { CreateMultipleSizesDialog } from '@/components/admin/size/create-multiple-sizes-dialog'
import { EditSizeDialog } from '@/components/admin/size/edit-size-dialog'
import { DeleteSizeDialog } from '@/components/admin/size/delete-size-dialog'
import { useQuery } from '@tanstack/react-query'
import { getSizes } from '@/lib/sizes'
import { getCategories } from '@/lib/categories'

export default function TallasPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [createMultipleOpen, setCreateMultipleOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState<any>(null)

  const { data: sizes = [], isLoading: sizesLoading } = useQuery({
    queryKey: ['sizes'],
    queryFn: getSizes,
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const isLoading = sizesLoading || categoriesLoading

  // Agrupar tallas por categoría
  const sizesByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    
    // Crear un mapa de categorías para búsqueda rápida
    const categoryMap = new Map(categories.map(cat => [cat._id, cat]))
    
    sizes.forEach((size: any) => {
      const category = categoryMap.get(size.category_id)
      const categoryName = category?.name || 'Sin categoría'
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(size)
    })
    
    return grouped
  }, [sizes, categories])

  const handleEdit = (size: any) => {
    setSelectedSize(size)
    setEditOpen(true)
  }

  const handleDelete = (size: any) => {
    setSelectedSize(size)
    setDeleteOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tallas</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setCreateOpen(true)} 
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Una Talla
          </Button>
          <Button 
            onClick={() => setCreateMultipleOpen(true)} 
            className="bg-black hover:bg-gray-800"
          >
            <Layers className="mr-2 h-4 w-4" />
            Múltiples Tallas
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : sizes.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <p className="text-gray-500">No hay tallas registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(sizesByCategory).map(([categoryName, categorySizes]) => (
            <div key={categoryName} className="bg-white shadow-sm rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wider">{categoryName}</h3>
              <div className="flex flex-wrap gap-2">
                {categorySizes.map((size: any) => (
                  <div
                    key={size._id}
                    className="group relative bg-gray-900 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-medium">{size.name}</span>
                    
                    {/* Acciones al hover */}
                    <div className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <button
                        onClick={() => handleEdit(size)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-0.5 rounded-full shadow"
                        title="Editar"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(size)}
                        className="bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full shadow"
                        title="Eliminar"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateSizeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <CreateMultipleSizesDialog
        open={createMultipleOpen}
        onOpenChange={setCreateMultipleOpen}
      />

      {selectedSize && (
        <>
          <EditSizeDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            size={selectedSize}
          />

          <DeleteSizeDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            size={selectedSize}
          />
        </>
      )}
    </div>
  )
}