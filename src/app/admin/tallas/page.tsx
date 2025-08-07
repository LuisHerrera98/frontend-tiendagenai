'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { CreateSizeDialog } from '@/components/admin/size/create-size-dialog'
import { EditSizeDialog } from '@/components/admin/size/edit-size-dialog'
import { DeleteSizeDialog } from '@/components/admin/size/delete-size-dialog'
import { useQuery } from '@tanstack/react-query'
import { getSizes } from '@/lib/sizes'

export default function TallasPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState<any>(null)

  const { data: sizes = [], isLoading } = useQuery({
    queryKey: ['sizes'],
    queryFn: getSizes,
  })

  // Debug: Log para verificar los datos
  console.log('Sizes data:', sizes)

  // Agrupar tallas por categoría
  const sizesByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    
    sizes.forEach((size: any) => {
      const categoryName = size.category_id?.name || 'Sin categoría'
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(size)
    })
    
    return grouped
  }, [sizes])

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
        <Button onClick={() => setCreateOpen(true)} className="bg-black hover:bg-gray-800">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Talla
        </Button>
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
        <div className="space-y-6">
          {Object.entries(sizesByCategory).map(([categoryName, categorySizes]) => (
            <div key={categoryName} className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">{categoryName}</h3>
              <div className="flex flex-wrap gap-3">
                {categorySizes.map((size: any) => (
                  <div
                    key={size._id}
                    className="group relative bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-medium">{size.name}</span>
                    
                    {/* Acciones al hover */}
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => handleEdit(size)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full shadow-lg"
                        title="Editar"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(size)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
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