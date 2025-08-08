'use client'

import Link from 'next/link'
import { ShoppingCart, Heart } from 'lucide-react'
import { getProductImage } from '@/lib/cloudinary-transforms'

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: {
    id: string
    name: string
  }
  brand: {
    id: string
    name: string
  }
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0] 
    ? getProductImage(product.images[0], 'card')
    : '/placeholder-product.jpg'
  
  return (
    <div className="bg-white rounded border hover:shadow-md transition-all duration-200 group">
      <Link href={`/producto/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.images?.[0] ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.jpg'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ShoppingCart className="w-8 h-8" />
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-3">
        <Link href={`/producto/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 hover:text-gray-700 line-clamp-2 mb-1">
            {product.name}
          </h3>
        </Link>
        
        {product.brand.name && (
          <p className="text-xs text-gray-500 mb-2">{product.brand.name}</p>
        )}
        
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-900">
            ${product.price.toLocaleString('es-AR')}
          </p>
          
          <button 
            className="p-1.5 bg-black text-white rounded hover:bg-gray-800 transition"
            onClick={() => {
              // TODO: Implementar agregar al carrito
              console.log('Agregar al carrito:', product.id)
            }}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}