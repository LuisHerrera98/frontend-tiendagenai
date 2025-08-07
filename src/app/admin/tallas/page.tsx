'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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

  const handleEdit = (size: any) => {
    setSelectedSize(size)
    setEditOpen(true)
  }

  const handleDelete = (size: any) => {
    setSelectedSize(size)
    setDeleteOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tallas</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Talla
        </Button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center">
                  Cargando...
                </td>
              </tr>
            ) : sizes.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No hay tallas registradas
                </td>
              </tr>
            ) : (
              sizes.map((size: any) => (
                <tr key={size._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {size.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {size.category_id?.name || 'Sin categoría'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(size)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(size)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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