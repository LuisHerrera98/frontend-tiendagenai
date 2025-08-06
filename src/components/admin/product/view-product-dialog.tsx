'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/lib/categories'
import { sizeService } from '@/lib/sizes'
import { brandService } from '@/lib/brands'
import { typeService } from '@/lib/types'
import { genderService } from '@/lib/genders'
import { Product } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ViewProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

export function ViewProductDialog({ open, onOpenChange, product }: ViewProductDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getAll,
  })

  const { data: types } = useQuery({
    queryKey: ['types'],
    queryFn: typeService.getAll,
  })

  const { data: genders } = useQuery({
    queryKey: ['genders'],
    queryFn: genderService.getAll,
  })

  useEffect(() => {
    setCurrentImageIndex(0)
  }, [product])

  if (!product) return null

  const category = categories?.find(c => c._id === product.category_id)
  const brand = brands?.find(b => b._id === product.brand_id)
  const type = types?.find(t => t._id === product.type_id)
  const gender = genders?.find(g => g._id === product.gender_id)
  const totalStock = product.stock?.reduce((total, item) => total + item.quantity, 0) || 0

  const nextImage = () => {
    if (product.images && currentImageIndex < product.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">Detalles del Producto</DialogTitle>
          <p className="text-sm text-gray-600">Vista completa del producto #{product.code}</p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative bg-gray-50 rounded-lg overflow-hidden aspect-square">
              {product.images && product.images.length > 0 ? (
                <>
                  <Image
                    src={product.images[currentImageIndex].url}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                  />
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                        disabled={currentImageIndex === 0}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                        disabled={currentImageIndex === product.images.length - 1}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <span>Sin imagen</span>
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex justify-center gap-2">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-gray-800 w-6' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={product.active ? 'default' : 'secondary'}>
                  {product.active ? 'Activo' : 'Inactivo'}
                </Badge>
                {product.discount > 0 && (
                  <Badge variant="destructive">-{product.discount}%</Badge>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Categoría</Label>
                  <p className="font-medium">{category?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Marca</Label>
                  <p className="font-medium">{brand?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Tipo</Label>
                  <p className="font-medium">{type?.name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Género</Label>
                  <Badge variant="outline" className={`${
                    gender?.name.toLowerCase().includes('hombre') || gender?.name.toLowerCase().includes('masculino') ? 'border-blue-200 text-blue-700 bg-blue-50' :
                    gender?.name.toLowerCase().includes('mujer') || gender?.name.toLowerCase().includes('femenino') ? 'border-pink-200 text-pink-700 bg-pink-50' :
                    gender?.name.toLowerCase().includes('niño') ? 'border-cyan-200 text-cyan-700 bg-cyan-50' :
                    gender?.name.toLowerCase().includes('niña') ? 'border-purple-200 text-purple-700 bg-purple-50' :
                    'border-gray-200 text-gray-700 bg-gray-50'
                  }`}>
                    {gender?.name || '-'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm text-gray-600">Precio</Label>
                  <p className="text-lg font-bold text-green-600">
                    ${Math.floor(product.price) === product.price ? product.price : product.price.toFixed(2)}
                  </p>
                  {product.discount > 0 && (
                    <p className="text-sm text-gray-500 line-through">
                      ${(product.price / (1 - product.discount / 100)).toFixed(2)}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Costo</Label>
                  <p className="text-lg font-semibold">
                    ${Math.floor(product.cost) === product.cost ? product.cost : product.cost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Stock Total</Label>
                  <p className="text-lg font-semibold">{totalStock}</p>
                </div>
              </div>

              {/* Stock by Size */}
              {product.stock && product.stock.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Inventario por Talla</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {product.stock
                      .sort((a, b) => {
                        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
                        const aIndex = sizeOrder.indexOf(a.size_name);
                        const bIndex = sizeOrder.indexOf(b.size_name);
                        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                        if (aIndex !== -1) return -1;
                        if (bIndex !== -1) return 1;
                        return a.size_name.localeCompare(b.size_name);
                      })
                      .map((stockItem, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white border rounded-lg">
                          <span className="font-medium">{stockItem.size_name}</span>
                          <Badge variant={stockItem.quantity > 0 ? 'default' : 'secondary'}>
                            {stockItem.quantity}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}