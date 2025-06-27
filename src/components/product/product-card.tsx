'use client'

import Image from 'next/image'
import { Product } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const firstImage = product.images?.[0]
  const hasStock = product.stock?.some(s => s.quantity > 0)
  const totalStock = product.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0

  const finalPrice = product.discount > 0 
    ? product.price * (1 - product.discount / 100)
    : product.price

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white border border-gray-200 shadow-sm">
      {/* Image */}
      <div className="relative bg-white">
        {firstImage ? (
          <div className="relative w-full aspect-square">
            <Image
              src={firstImage.url}
              alt={product.name}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center aspect-square text-gray-400 bg-gray-50">
            <span className="text-sm">Sin imagen</span>
          </div>
        )}
        
        {/* Discount Badge */}
        {product.discount > 0 && (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
            -{product.discount}%
          </Badge>
        )}
        
        {/* Stock Badge */}
        {!hasStock && (
          <Badge className="absolute top-2 left-2 bg-gray-500 text-white text-xs">
            Sin Stock
          </Badge>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-3 bg-gray-50">
        <div className="space-y-1">
          {/* Brand and Code */}
          <div className="text-xs text-gray-500 truncate">
            {product.brand_name && <span>{product.brand_name}</span>}
            {product.brand_name && product.code && <span> • </span>}
            <span>#{product.code}</span>
          </div>
          
          {/* Product Name */}
          <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 min-h-[1.8rem]">
            {product.name}
          </h3>
          
          {/* Model */}
          {product.model_name && (
            <p className="text-xs text-gray-600 truncate">{product.model_name}</p>
          )}
          
          {/* Price */}
          <div className="flex items-center space-x-1">
            {product.discount > 0 ? (
              <>
                <span className="text-sm sm:text-base font-bold text-green-600">
                  ${finalPrice.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 line-through">
                  ${product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-bold">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Stock Info - Simplified for mobile */}
          <div className="text-xs text-gray-500">
            <span>Stock: {totalStock}</span>
            {product.stock && product.stock.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {product.stock
                  .filter(s => s.quantity > 0)
                  .slice(0, 2) // Show max 2 sizes to save space
                  .map((stock, index) => (
                    <Badge key={index} variant="outline" className="text-xs py-0 px-1 h-4">
                      {stock.size_name}
                    </Badge>
                  ))}
                {product.stock.filter(s => s.quantity > 0).length > 2 && (
                  <span className="text-xs text-gray-400">+{product.stock.filter(s => s.quantity > 0).length - 2}</span>
                )}
              </div>
            )}
          </div>
          
          {/* Add to Cart Button */}
          <Button 
            className="w-full mt-2 text-xs h-7 sm:h-8" 
            disabled={!hasStock}
            variant={hasStock ? "default" : "secondary"}
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            {hasStock ? 'Agregar' : 'Sin Stock'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}