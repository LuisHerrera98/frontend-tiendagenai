'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sizeService } from '@/lib/sizes'
import { categoryService } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EditSizeDialog } from './edit-size-dialog'
import { DeleteSizeDialog } from './delete-size-dialog'

export function SizeList() {
  const [editingSize, setEditingSize] = useState<any | null>(null)
  const [deletingSize, setDeletingSize] = useState<any | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
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

  const handleEdit = (size: any) => {
    setEditingSize(size)
    setShowEditDialog(true)
  }

  const handleDelete = (size: any) => {
    setDeletingSize(size)
    setShowDeleteDialog(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando talles...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error al cargar talles</div>
  }

  if (!sizes || sizes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No hay talles registrados</p>
        <p className="text-sm text-gray-400">Haz clic en "Nuevo Talle" para agregar el primer talle</p>
      </div>
    )
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sizes.map((size) => (
          <TableRow key={size._id}>
            <TableCell className="font-medium">{size.name}</TableCell>
            <TableCell>{getCategoryName(size.category_id)}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEdit(size)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete(size)}
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {/* Edit Dialog */}
    <EditSizeDialog
      open={showEditDialog}
      onOpenChange={setShowEditDialog}
      size={editingSize}
    />

    {/* Delete Dialog */}
    <DeleteSizeDialog
      open={showDeleteDialog}
      onOpenChange={setShowDeleteDialog}
      size={deletingSize}
    />
  </>
  )
}