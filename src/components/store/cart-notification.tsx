'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'

interface CartNotificationProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  subdomain: string
  productImage?: string
  productPrice?: number
  sizeName?: string
  quantity?: number
}

export function CartNotification({ 
  isOpen, 
  onClose, 
  productName,
  subdomain,
  productImage,
  productPrice,
  sizeName,
  quantity = 1
}: CartNotificationProps) {
  const router = useRouter()
  const { getItemsCount, getTotal } = useCart()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300) // Esperar a que termine la animación
  }

  const handleGoToCart = () => {
    router.push(`/store/${subdomain}/carrito`)
    handleClose()
  }

  if (!isOpen) return null

  const total = getTotal()
  const itemsCount = getItemsCount()

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden w-[90vw] max-w-md">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Product info */}
            <div className="flex gap-4 mb-4">
              {productImage && (
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={productImage} 
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {productName}
                </h3>
                {sizeName && sizeName !== 'pack' && sizeName !== 'PAQUETE' && (
                  <p className="text-sm text-gray-600">
                    Talle: {sizeName}
                  </p>
                )}
                {quantity > 1 && (
                  <p className="text-sm text-gray-600">
                    Cantidad: {quantity}
                  </p>
                )}
                {productPrice && (
                  <p className="text-lg font-semibold mt-1">
                    ${(productPrice * quantity).toLocaleString('es-AR')}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800 font-medium">
                ¡Agregado al carrito!
              </p>
            </div>

            {/* Cart summary */}
            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">
                  Total ({itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}):
                </span>
                <span className="font-bold text-lg">
                  ${total.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={handleGoToCart}
                className="w-full py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Ver carrito
              </button>
              <button
                onClick={handleClose}
                className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}