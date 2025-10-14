'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/lib/categories'
import { sizeService } from '@/lib/sizes'
import { brandService } from '@/lib/brands'
import { typeService } from '@/lib/types'
import { genderService } from '@/lib/genders'
import { colorService } from '@/lib/colors'
import { Product } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
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

  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: colorService.getAll,
  })

  useEffect(() => {
    setCurrentImageIndex(0)
  }, [product])

  if (!product) return null

  const category = categories?.find(c => c._id === product.category_id)
  const brand = brands?.find(b => b._id === product.brand_id)
  const type = types?.find(t => t._id === product.type_id)
  const gender = genders?.find(g => g._id === product.gender_id)
  const color = colors?.find(c => c._id === product.color_id)
  const totalStock = product.stock?.reduce((total, item) => total + item.quantity, 0) || 0
  const profit = product.price - product.cost
  const profitPercentage = product.cost > 0 ? (profit / product.cost) * 100 : 0

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-1 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>
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
                  <img
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
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
                  <p className="font-medium">{brand?.name || product.brand_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Tipo</Label>
                  <p className="font-medium">{type?.name || product.model_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Color</Label>
                  <p className="font-medium">{color?.name || '-'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-600 mb-2 block">Géneros</Label>
                <div className="flex flex-wrap gap-2">
                  {product.genders && product.genders.length > 0 ? (
                    product.genders.map((g, index) => (
                      <Badge key={index} variant="outline" className={`${
                        g === 'hombre' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                        g === 'mujer' ? 'border-pink-200 text-pink-700 bg-pink-50' :
                        g === 'niño' ? 'border-cyan-200 text-cyan-700 bg-cyan-50' :
                        g === 'niña' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                        'border-gray-200 text-gray-700 bg-gray-50'
                      } capitalize`}>
                        {g}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Sin género especificado</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <Label className="text-sm text-gray-600">Precio Lista (Tarjeta)</Label>
                    <p className="text-2xl font-bold text-blue-600">
                      ${Math.floor(product.price) === product.price ? product.price.toLocaleString() : product.price.toFixed(2)}
                    </p>
                    {product.discount > 0 && (
                      <p className="text-sm text-gray-500 line-through">
                        ${(product.price / (1 - product.discount / 100)).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Stock Total</Label>
                    <p className={`text-2xl font-bold ${
                      totalStock > 10 ? 'text-green-600' : 
                      totalStock > 0 ? 'text-amber-600' : 
                      'text-red-600'
                    }`}>
                      {totalStock} <span className="text-sm font-normal">
                        {product.stockType === 'unit' ? 'unidades' : 'unidades'}
                      </span>
                    </p>
                  </div>
                </div>

                {product.cashPrice && product.cashPrice > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <Label className="text-sm text-gray-600">Precio Efectivo/Transferencia</Label>
                      <div className="flex items-baseline gap-3">
                        <p className="text-2xl font-bold text-green-600">
                          ${Math.floor(product.cashPrice) === product.cashPrice ? product.cashPrice.toLocaleString() : product.cashPrice.toFixed(2)}
                        </p>
                        {product.price > product.cashPrice && (
                          <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                            Ahorra ${(product.price - product.cashPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm text-gray-600">Costo</Label>
                    <p className="text-lg font-semibold">
                      ${Math.floor(product.cost) === product.cost ? product.cost.toLocaleString() : product.cost.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Ganancia</Label>
                    <p className={`text-lg font-semibold ${
                      profit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${Math.floor(profit) === profit ? profit.toLocaleString() : profit.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Margen</Label>
                    <p className={`text-lg font-semibold ${
                      profitPercentage > 30 ? 'text-green-600' : 
                      profitPercentage > 15 ? 'text-amber-600' : 
                      'text-red-600'
                    }`}>
                      {profitPercentage.toFixed(1)}%
                    </p>
                  </div>
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