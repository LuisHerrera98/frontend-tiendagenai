'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { colorService } from '@/lib/colors'
import { Color } from '@/types'
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
import { EditColorDialog } from './edit-color-dialog'
import { DeleteColorDialog } from './delete-color-dialog'

export function ColorList() {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)

  const { data: colors, isLoading, error } = useQuery({
    queryKey: ['colors'],
    queryFn: colorService.getAll,
  })

  const handleEdit = (color: Color) => {
    setSelectedColor(color)
    setEditOpen(true)
  }

  const handleDelete = (color: Color) => {
    setSelectedColor(color)
    setDeleteOpen(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando colores...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error al cargar colores</div>
  }

  if (!colors || colors.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No hay colores registrados</p>
        <p className="text-sm text-gray-400">Haz clic en "Nuevo Color" para agregar el primer color</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {colors.map((color) => (
            <TableRow key={color._id}>
              <TableCell className="font-medium">{color.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(color)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(color)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedColor && (
        <>
          <EditColorDialog
            color={selectedColor}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <DeleteColorDialog
            color={selectedColor}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}
    </>
  )
}