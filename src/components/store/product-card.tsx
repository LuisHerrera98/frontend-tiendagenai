'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Heart } from 'lucide-react'
import { getProductImage } from '@/lib/cloudinary-transforms'
import { QuickBuyModal } from './quick-buy-modal'
import { useParams } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  price: number
  cashPrice?: number
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
  const [showQuickBuy, setShowQuickBuy] = useState(false)
  const params = useParams()
  const subdomain = params.subdomain as string
  
  const imageUrl = product.images?.[0] 
    ? getProductImage(product.images[0], 'card')
    : '/placeholder-product.jpg'
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-200 group flex flex-col h-full">
      <Link href={`/store/${subdomain}/producto/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
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
              <ShoppingCart className="w-12 h-12" />
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <Link href={`/store/${subdomain}/producto/${product.id}`} className="flex-grow">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 hover:text-gray-700 line-clamp-2 uppercase mb-1">
            {product.name}
          </h3>
        </Link>
        
        <div className="mt-auto">
          {/* Precios */}
          <div className="mb-2 space-y-1">
            {/* Precio de lista (siempre visible) */}
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              ${product.price.toLocaleString('es-AR')}
            </p>
            
            {/* Precio efectivo/transferencia (si existe y es menor) */}
            {product.cashPrice && product.cashPrice < product.price && (
              <div className="flex items-baseline gap-1">
                <p className="text-base sm:text-lg font-bold text-green-700">
                  ${product.cashPrice.toLocaleString('es-AR')}
                </p>
                <span className="text-xs text-green-600">Efectivo</span>
              </div>
            )}
          </div>
          
          <button 
            className="w-full py-2.5 px-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            onClick={(e) => {
              e.preventDefault()
              setShowQuickBuy(true)
            }}
          >
            Comprar
          </button>
        </div>
      </div>
      
      {/* Quick Buy Modal */}
      <QuickBuyModal
        isOpen={showQuickBuy}
        onClose={() => setShowQuickBuy(false)}
        productId={product.id}
        subdomain={subdomain}
      />
    </div>
  )
}