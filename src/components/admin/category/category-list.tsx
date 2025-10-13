'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/lib/categories'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { EditCategoryDialog } from './edit-category-dialog'
import { DeleteCategoryDialog } from './delete-category-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function CategoryList() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  if (isLoading) {
    return <div className="text-center py-8">Cargando categorías...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error al cargar categorías</div>
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No hay categorías registradas</p>
        <p className="text-sm text-gray-400">Haz clic en "Nueva Categoría" para agregar la primera categoría</p>
      </div>
    )
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría Padre</TableHead>
          <TableHead>Productos</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => {
          const parentCategory = categories.find(c => c._id === category.parent_id)
          return (
            <TableRow key={category._id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {parentCategory ? parentCategory.name : '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {category.productsCount || 0}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingCategory(category)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>

    {/* Edit Category Dialog */}
    <EditCategoryDialog
      open={!!editingCategory}
      onOpenChange={(open) => !open && setEditingCategory(null)}
      category={editingCategory}
    />

    {/* Delete Category Dialog */}
    <DeleteCategoryDialog
      open={!!deletingCategory}
      onOpenChange={(open) => !open && setDeletingCategory(null)}
      category={deletingCategory}
    />
  </>
  )
}