'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
import { EditProductDialog } from './edit-product-dialog'
import { ViewProductDialog } from './view-product-dialog'
import { DeleteProductDialog } from './delete-product-dialog'
import { useAuth } from '@/contexts/auth-context'
import { Permission } from '@/types/permissions'
import { cn } from '@/lib/utils'

interface ProductTableInfiniteProps {
  products: Product[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore?: boolean
}

export function ProductTableInfinite({
  products,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore = false
}: ProductTableInfiniteProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  
  const { hasPermission } = useAuth()
  const canEdit = hasPermission(Permission.PRODUCTS_EDIT)
  const canDelete = hasPermission(Permission.PRODUCTS_DELETE)
  const canViewCosts = hasPermission(Permission.PRODUCTS_COSTS)

  // Ref para el observador de intersección
  const observerTarget = useRef<HTMLDivElement>(null)

  const handleView = (product: Product) => {
    setSelectedProduct(product)
    setViewOpen(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setEditOpen(true)
  }

  const handleDelete = (product: Product) => {
    setSelectedProduct(product)
    setDeleteOpen(true)
  }

  // Configurar el Intersection Observer para scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, isLoadingMore, onLoadMore])

  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <p className="text-sm text-gray-600">Cargando productos...</p>
        </div>
      </div>
    )
  }

  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <p className="text-lg">No se encontraron productos</p>
        <p className="text-sm mt-2">Intenta ajustar los filtros</p>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getTotalStock = (product: Product) => {
    return product.stock?.reduce((total, item) => total + (item.quantity || 0), 0) || 0
  }
  
  const getStockDisplay = (product: Product) => {
    const total = getTotalStock(product)
    if (product.stockType === 'pack') {
      return `${total} ${total === 1 ? 'paquete' : 'paquetes'}`
    }
    return `${total} ${total === 1 ? 'unidad' : 'unidades'}`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <table className="w-full">
          <thead className="bg-gray-50 border-b sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Imagen
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const profit = product.price - product.cost
              const profitPercentage = product.cost > 0 ? (profit / product.cost) * 100 : 0
              
              return (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {product.images && product.images.length > 0 ? (
                      <div className="relative w-10 h-10">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-[10px] text-gray-400">Sin</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    {product.code}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      <span className="text-xs text-gray-500">
                        {[product.brand_name, product.model_name].filter(Boolean).join(' - ') || 'Sin marca/tipo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-xs text-green-600">-{product.discount}%</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center">
                      <span className={cn(
                        "text-sm font-medium",
                        getTotalStock(product) > 0 ? "text-gray-900" : "text-red-600"
                      )}>
                        {getTotalStock(product)}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {product.stockType === 'pack' ? 'paquetes' : 'unidades'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <span className={cn(
                      "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                      product.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    )}>
                      {product.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(product)}
                        className="p-1 h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="p-1 h-8 w-8 hover:bg-amber-50 hover:text-amber-600"
                          title="Editar producto"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product)}
                          className="p-1 h-8 w-8 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {/* Indicador de carga para más productos */}
        <div ref={observerTarget} className="py-4">
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando más productos...</span>
          </div>
        )}
        {!hasMore && products.length > 0 && (
          <div className="text-center text-sm text-gray-500 py-2">
            No hay más productos para mostrar
          </div>
        )}
        </div>
      </div>

      {/* Dialogs */}
      {selectedProduct && (
        <>
          <ViewProductDialog
            product={selectedProduct}
            open={viewOpen}
            onOpenChange={setViewOpen}
          />
          <EditProductDialog
            product={selectedProduct}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <DeleteProductDialog
            product={selectedProduct}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}
    </div>
  )
}