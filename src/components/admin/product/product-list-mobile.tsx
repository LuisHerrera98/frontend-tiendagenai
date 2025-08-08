'use client'

import { Product } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProductListMobileProps {
  products: Product[]
  brands: any[]
  onViewProduct: (product: Product) => void
  onViewImages: (product: Product) => void
  onDeleteProduct: (product: Product) => void
}

export function ProductListMobile({ 
  products, 
  brands, 
  onViewProduct,
  onViewImages,
  onDeleteProduct 
}: ProductListMobileProps) {
  const router = useRouter()

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <Card key={product._id} className="p-4">
          <div className="flex gap-3">
            {/* Product Image */}
            <div className="flex-shrink-0">
              {product.images?.[0] ? (
                <div
                  onClick={() => onViewImages(product)}
                  className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                >
                  <img
                    src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <p className="font-semibold text-sm truncate">{product.name}</p>
                <p className="text-xs text-gray-500">Código: {product.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <span className="text-gray-500">Precio: </span>
                  <span className="font-medium">${product.price}</span>
                </div>
                <div>
                  <span className="text-gray-500">Stock: </span>
                  <span className="font-medium">
                    {product.stock?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                  </span>
                </div>
                {brands?.find(b => b._id === product.brand_id) && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Marca: </span>
                    <span>{brands.find(b => b._id === product.brand_id)?.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Badge variant={product.active ? 'default' : 'secondary'} className="text-xs">
                  {product.active ? 'Activo' : 'Inactivo'}
                </Badge>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => onViewProduct(product)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => router.push(`/admin/productos/editar/${product._id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => onDeleteProduct(product)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}