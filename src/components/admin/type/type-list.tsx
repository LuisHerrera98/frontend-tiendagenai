'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { typeService } from '@/lib/types'
import { Type } from '@/types'
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
import { EditTypeDialog } from './edit-type-dialog'
import { DeleteTypeDialog } from './delete-type-dialog'

export function TypeList() {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<Type | null>(null)

  const { data: types, isLoading, error } = useQuery({
    queryKey: ['types'],
    queryFn: typeService.getAll,
  })

  const handleEdit = (type: Type) => {
    setSelectedType(type)
    setEditOpen(true)
  }

  const handleDelete = (type: Type) => {
    setSelectedType(type)
    setDeleteOpen(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando tipos...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error al cargar tipos</div>
  }

  if (!types || types.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No hay tipos registrados</p>
        <p className="text-sm text-gray-400">Haz clic en "Nuevo Tipo" para agregar el primer tipo</p>
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
          {types.map((type) => (
            <TableRow key={type._id}>
              <TableCell className="font-medium">{type.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(type)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedType && (
        <>
          <EditTypeDialog
            type={selectedType}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <DeleteTypeDialog
            type={selectedType}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}
    </>
  )
}