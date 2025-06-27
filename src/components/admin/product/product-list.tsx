'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { productService } from '@/lib/products'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Eye, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ProductList() {
  const [page, setPage] = useState(1)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedProductName, setSelectedProductName] = useState<string>('')
  const router = useRouter()
  const limit = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page, limit],
    queryFn: () => productService.getProducts({ page, limit }),
  })

  if (isLoading) {
    return <div className="text-center py-8">Cargando productos...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error al cargar productos</div>
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No hay productos registrados</p>
        <p className="text-sm text-gray-400">Haz clic en "Nuevo Producto" para agregar el primer producto</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Imagen</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((product: Product) => (
            <TableRow key={product._id} className="h-20">
              <TableCell className="w-20 p-2">
                <div 
                  className="relative h-[70px] w-[70px] bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    if (product.images && product.images.length > 0) {
                      setSelectedImage(product.images[0].url)
                      setSelectedProductName(product.name)
                    }
                  }}
                >
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-contain p-1"
                      sizes="70px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                      Sin imagen
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono">{product.code}</TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.brand_name || '-'}</TableCell>
              <TableCell>{product.model_name || '-'}</TableCell>
              <TableCell>${product.price.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={product.active ? 'default' : 'secondary'}>
                  {product.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell>
                {product.stock?.reduce((sum, item) => sum + item.quantity, 0) || 0}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push(`/admin/productos/editar/${product._id}`)}
                  >
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

      {/* Pagination */}
      <div className="flex justify-center space-x-2">
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Anterior
        </Button>
        <span className="flex items-center px-3">
          Página {page} de {data.totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage(p => p + 1)}
          disabled={page >= data.totalPages}
        >
          Siguiente
        </Button>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedProductName}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedImage(null)}
              className="absolute right-0 -top-12 z-10 h-10 w-10 p-0 bg-white border-gray-300 hover:bg-gray-100 shadow-sm"
            >
              <X className="h-4 w-4" />
            </Button>
            <div 
              className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setSelectedImage(null)}
            >
            {selectedImage && (
              <Image
                src={selectedImage}
                alt={selectedProductName}
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}