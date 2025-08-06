'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { genderService } from '@/lib/genders'
import { Gender } from '@/types'
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
import { Badge } from '@/components/ui/badge'
import { EditGenderDialog } from './edit-gender-dialog'
import { DeleteGenderDialog } from './delete-gender-dialog'

export function GenderList() {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null)

  const { data: genders, isLoading, error } = useQuery({
    queryKey: ['genders'],
    queryFn: genderService.getAll,
  })

  const handleEdit = (gender: Gender) => {
    setSelectedGender(gender)
    setEditOpen(true)
  }

  const handleDelete = (gender: Gender) => {
    setSelectedGender(gender)
    setDeleteOpen(true)
  }

  const getGenderBadgeColor = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('hombre') || lowerName.includes('masculino')) return 'bg-blue-500'
    if (lowerName.includes('mujer') || lowerName.includes('femenino')) return 'bg-pink-500'
    if (lowerName.includes('niño')) return 'bg-cyan-500'
    if (lowerName.includes('niña')) return 'bg-purple-500'
    return 'bg-gray-500'
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando géneros...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error al cargar géneros</div>
  }

  if (!genders || genders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No hay géneros registrados</p>
        <p className="text-sm text-gray-400">Haz clic en "Nuevo Género" para agregar el primer género</p>
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
          {genders.map((gender) => (
            <TableRow key={gender._id}>
              <TableCell className="font-medium">
                <Badge 
                  className={`${getGenderBadgeColor(gender.name)} text-white`}
                >
                  {gender.name}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(gender)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(gender)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedGender && (
        <>
          <EditGenderDialog
            gender={selectedGender}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <DeleteGenderDialog
            gender={selectedGender}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}
    </>
  )
}