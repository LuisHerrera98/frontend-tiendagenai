'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { api } from '@/lib/api'
import { useCart } from '@/contexts/cart-context'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: any
}

export default function CartPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    getTotalWithDiscount 
  } = useCart()

  useEffect(() => {
    fetchStoreData()
  }, [subdomain])

  const fetchStoreData = async () => {
    try {
      setLoading(true)
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const response = await api.get(`/public/store/${targetSubdomain}`)
      setStoreData(response.data)
    } catch (err) {
      console.error('Error fetching store:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = () => {
    router.push(`/store/${subdomain}/checkout`)
  }

  if (loading || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <StoreLayout storeData={storeData}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mi Carrito</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-4">Tu carrito está vacío</p>
            <Link 
              href={`/store/${subdomain}`}
              className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Continuar comprando
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {items.map((item, index) => {
                  const itemTotal = item.price * item.quantity
                  const discount = (itemTotal * item.discount) / 100
                  const finalPrice = itemTotal - discount

                  return (
                    <div key={`${item.productId}-${item.sizeId}`} className="bg-white p-4 rounded-lg shadow">
                      <div className="flex gap-4">
                        {/* Imagen */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              Sin imagen
                            </div>
                          )}
                        </div>

                        {/* Información del producto */}
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.productName}</h3>
                          <p className="text-sm text-gray-600">Talle: {item.sizeName}</p>
                          
                          <div className="flex items-baseline gap-2 mt-1">
                            {item.discount > 0 ? (
                              <>
                                <span className="font-semibold">${finalPrice.toLocaleString('es-AR')}</span>
                                <span className="text-sm text-gray-500 line-through">${itemTotal.toLocaleString('es-AR')}</span>
                                <span className="text-sm text-green-600">{item.discount}% OFF</span>
                              </>
                            ) : (
                              <span className="font-semibold">${itemTotal.toLocaleString('es-AR')}</span>
                            )}
                          </div>

                          {/* Controles de cantidad */}
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.productId, item.sizeId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.sizeId, item.quantity + 1)}
                                className="p-1 border rounded hover:bg-gray-100"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.productId, item.sizeId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={clearCart}
                className="mt-4 text-red-600 hover:text-red-700 text-sm"
              >
                Vaciar carrito
              </button>
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
                
                <div className="space-y-2 mb-4">
                  {items.map((item) => {
                    const itemTotal = item.price * item.quantity
                    const discount = (itemTotal * item.discount) / 100
                    const finalPrice = itemTotal - discount

                    return (
                      <div key={`${item.productId}-${item.sizeId}`} className="flex justify-between text-sm">
                        <span>{item.productName} ({item.sizeName}) x{item.quantity}</span>
                        <span>${finalPrice.toLocaleString('es-AR')}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${getTotalWithDiscount().toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800"
                >
                  Continuar con el pedido
                </button>

                <Link 
                  href={`/store/${subdomain}`}
                  className="block text-center mt-4 text-sm text-gray-600 hover:underline"
                >
                  Seguir comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  )
}