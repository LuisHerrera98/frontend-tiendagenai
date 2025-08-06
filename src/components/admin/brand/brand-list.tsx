'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { brandService } from '@/lib/brands'
import { Brand } from '@/types'
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
import { EditBrandDialog } from './edit-brand-dialog'
import { DeleteBrandDialog } from './delete-brand-dialog'

export function BrandList() {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const { data: brands, isLoading, error } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getAll,
  })

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand)
    setEditOpen(true)
  }

  const handleDelete = (brand: Brand) => {
    setSelectedBrand(brand)
    setDeleteOpen(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando marcas...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error al cargar marcas</div>
  }

  if (!brands || brands.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No hay marcas registradas</p>
        <p className="text-sm text-gray-400">Haz clic en "Nueva Marca" para agregar la primera marca</p>
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
          {brands.map((brand) => (
            <TableRow key={brand._id}>
              <TableCell className="font-medium">{brand.name}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(brand)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(brand)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedBrand && (
        <>
          <EditBrandDialog
            brand={selectedBrand}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <DeleteBrandDialog
            brand={selectedBrand}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}
    </>
  )
}