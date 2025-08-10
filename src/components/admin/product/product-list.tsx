'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { productService } from '@/lib/products'
import { genderService } from '@/lib/genders'
import { brandService } from '@/lib/brands'
import { typeService } from '@/lib/types'
import { Product, ProductFilters } from '@/types'
import { ProductFilters as ProductFiltersComponent } from './product-filters'
import { ViewProductDialog } from './view-product-dialog'
import { ProductListMobile } from './product-list-mobile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Eye, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
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
import { useAuth } from '@/contexts/auth-context'
import { Permission } from '@/types/permissions'

export function ProductList() {
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, limit: 10, showAll: true })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const router = useRouter()
  const { hasPermission } = useAuth()

  // Check permissions
  const canViewCosts = hasPermission(Permission.PRODUCTS_COSTS)
  const canEditProducts = hasPermission(Permission.PRODUCTS_EDIT)
  const canDeleteProducts = hasPermission(Permission.PRODUCTS_DELETE)
  const canCreateProducts = hasPermission(Permission.PRODUCTS_CREATE)

  const nextImage = () => {
    if (selectedProduct?.images && currentImageIndex < selectedProduct.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const closeModal = () => {
    setSelectedProduct(null)
    setCurrentImageIndex(0)
  }

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
  })

  const { data: genders } = useQuery({
    queryKey: ['genders'],
    queryFn: genderService.getAll,
  })

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getAll,
  })

  const { data: types } = useQuery({
    queryKey: ['types'],
    queryFn: typeService.getAll,
  })

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters)
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando productos...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error al cargar productos</div>
  }

  const hasActiveFilters = filters.name || filters.categoryId || filters.brandName || filters.modelName
  const showNoResults = !isLoading && (!data?.data || data.data.length === 0)

  if (showNoResults && !hasActiveFilters) {
    return (
      <div className="space-y-4">
        <ProductFiltersComponent 
          onFiltersChange={handleFiltersChange}
          currentFilters={filters}
        />
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No hay productos registrados</p>
          {canCreateProducts && (
            <p className="text-sm text-gray-400">Haz clic en "Nuevo Producto" para agregar el primer producto</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ProductFiltersComponent 
        onFiltersChange={handleFiltersChange}
        currentFilters={filters}
      />
      
      {/* Loading overlay */}
      {isFetching && (
        <div className="flex items-center justify-center py-4 bg-gray-50 rounded-lg border">
          <Loader2 className="w-5 h-5 animate-spin text-green-600 mr-2" />
          <span className="text-sm text-gray-600">Buscando productos...</span>
        </div>
      )}
      
      {/* No results message */}
      {showNoResults && hasActiveFilters && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border">
          <p className="text-gray-500 mb-2">No se encontraron productos</p>
          <p className="text-sm text-gray-400">Intenta con otros filtros</p>
        </div>
      )}
      
      {/* Product Table/Cards */}
      {data?.data && data.data.length > 0 && (
        <>
          {/* Desktop view - Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Imagen</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Género</TableHead>
                  <TableHead>Precio</TableHead>
                  {canViewCosts && <TableHead>Costo</TableHead>}
                  {canViewCosts && <TableHead>Ganancia</TableHead>}
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
                        className="relative h-[70px] w-[70px] rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                        onClick={() => {
                          if (product.images && product.images.length > 0) {
                            setSelectedProduct(product)
                            setCurrentImageIndex(0)
                          }
                        }}
                      >
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 text-xs bg-gray-50 border-2 border-dashed border-gray-200">
                            Sin imagen
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{product.code}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{brands?.find(b => b._id === product.brand_id)?.name || '-'}</TableCell>
                    <TableCell>{types?.find(t => t._id === product.type_id)?.name || '-'}</TableCell>
                    <TableCell>
                      {(() => {
                        const gender = genders?.find(g => g._id === product.gender_id)
                        const genderName = gender?.name || '-'
                        const lowerName = genderName.toLowerCase()
                        
                        return (
                          <Badge variant="outline" className={`${
                            lowerName.includes('hombre') || lowerName.includes('masculino') ? 'border-blue-200 text-blue-700 bg-blue-50' :
                            lowerName.includes('mujer') || lowerName.includes('femenino') ? 'border-pink-200 text-pink-700 bg-pink-50' :
                            lowerName.includes('niño') ? 'border-cyan-200 text-cyan-700 bg-cyan-50' :
                            lowerName.includes('niña') ? 'border-purple-200 text-purple-700 bg-purple-50' :
                            'border-gray-200 text-gray-700 bg-gray-50'
                          }`}>
                            {genderName}
                          </Badge>
                        )
                      })()}
                    </TableCell>
                    <TableCell>${Math.floor(product.price) === product.price ? product.price : product.price.toFixed(2)}</TableCell>
                    {canViewCosts && (
                      <TableCell>
                        ${Math.floor(product.cost || 0) === (product.cost || 0) ? (product.cost || 0) : (product.cost || 0).toFixed(2)}
                      </TableCell>
                    )}
                    {canViewCosts && (
                      <TableCell>
                        <span className="font-medium text-green-600">
                          ${Math.floor((product.price - (product.cost || 0))) === (product.price - (product.cost || 0)) ? (product.price - (product.cost || 0)) : (product.price - (product.cost || 0)).toFixed(2)}
                        </span>
                      </TableCell>
                    )}
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setViewProduct(product)
                            setViewDialogOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEditProducts && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/admin/productos/editar/${product._id}`)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {canDeleteProducts && (
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view - Cards */}
          <div className="block md:hidden">
            <ProductListMobile 
              products={data.data}
              brands={brands || []}
              onViewProduct={(product) => {
                setViewProduct(product)
                setViewDialogOpen(true)
              }}
              onViewImages={(product) => {
                setSelectedProduct(product)
                setCurrentImageIndex(0)
              }}
              onDeleteProduct={() => {}}
            />
          </div>
        </>
      )}

      {/* Pagination */}
      {data?.data && data.data.length > 0 && data.totalPages > 1 && (
      <div className="flex justify-center space-x-2">
        <Button
          variant="outline"
          onClick={() => handlePageChange(Math.max(1, filters.page! - 1))}
          disabled={filters.page === 1}
        >
          Anterior
        </Button>
        <span className="flex items-center px-3">
          Página {filters.page} de {data.totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => handlePageChange(filters.page! + 1)}
          disabled={filters.page! >= data.totalPages}
        >
          Siguiente
        </Button>
      </div>
      )}

      {/* Image Carousel Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={closeModal}
              className="absolute right-0 -top-12 z-10 h-10 w-10 p-0 bg-white border-gray-300 hover:bg-gray-100 shadow-sm"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Image Container */}
            <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
              {selectedProduct?.images && selectedProduct.images.length > 0 && (
                <>
                  <img
                    src={selectedProduct.images[currentImageIndex]}
                    alt={`${selectedProduct.name} - Imagen ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain p-4"
                  />

                  {/* Navigation Arrows - Only show if more than 1 image */}
                  {selectedProduct.images.length > 1 && (
                    <>
                      {/* Previous Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-md disabled:opacity-30"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>

                      {/* Next Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={nextImage}
                        disabled={currentImageIndex === selectedProduct.images.length - 1}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-md disabled:opacity-30"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Image Dots Indicator */}
            {selectedProduct?.images && selectedProduct.images.length > 1 && (
              <div className="flex justify-center space-x-2 mt-4">
                {selectedProduct.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex
                        ? 'bg-green-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <ViewProductDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        product={viewProduct}
      />

    </div>
  )
}