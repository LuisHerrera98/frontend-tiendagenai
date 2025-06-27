'use client'

import { useQuery } from '@tanstack/react-query'
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

export function CategoryList() {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category._id}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}