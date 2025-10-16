'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { getProductImage } from '@/lib/cloudinary-transforms'
import { useParams } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  price: number
  cashPrice?: number
  installmentText?: string
  withoutStock?: boolean
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
  const params = useParams()
  const subdomain = params.subdomain as string

  const imageUrl = product.images?.[0]
    ? getProductImage(product.images[0], 'card')
    : '/placeholder-product.jpg'

  return (
    <Link
      href={`/store/${subdomain}/producto/${product.id}`}
      className="bg-white rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-200 group flex flex-col h-full"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
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

      <div className="p-3 sm:p-4 flex flex-col">
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 hover:text-gray-700 line-clamp-2 uppercase mb-2">
          {product.name}
        </h3>

        {/* Precios */}
        <div className="space-y-1">
          {/* Precio de lista (siempre visible) */}
          <p className="text-[14.5px] sm:text-[16.5px] font-medium text-gray-900">
            ${product.price.toLocaleString('es-AR')}
          </p>

          {/* Precio transferencia (si existe) */}
          {product.cashPrice && (
            <div className="flex items-start gap-1">
              <p className="text-[19px] sm:text-[23px] font-bold text-green-700 leading-none">
                ${product.cashPrice.toLocaleString('es-AR')}
              </p>
              <span className="text-xs text-green-600 -mt-1.5">con Transferencia</span>
            </div>
          )}

          {/* Texto de cuotas (si existe) */}
          {product.installmentText && (
            <p className="text-xs sm:text-sm text-gray-600">
              {product.installmentText}
            </p>
          )}

          {/* Mensaje de consultar stock (si withoutStock es true) - siempre abajo de todo */}
          {product.withoutStock && (
            <div className="inline-block mt-2 px-2.5 py-1 bg-gray-100 rounded">
              <p className="text-[11px] font-normal text-gray-900">
                Consultar stock próximo
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}