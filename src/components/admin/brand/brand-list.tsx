'use client'

import { useQuery } from '@tanstack/react-query'
import { brandService } from '@/lib/brands'
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

export function BrandList() {
  const { data: brands, isLoading, error } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getAll,
  })

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Fecha de Creación</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {brands.map((brand) => (
          <TableRow key={brand._id}>
            <TableCell className="font-medium">{brand.name}</TableCell>
            <TableCell>{new Date(brand.createdAt).toLocaleDateString()}</TableCell>
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