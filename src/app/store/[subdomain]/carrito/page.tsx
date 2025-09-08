'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { api } from '@/lib/api'
import { useCart } from '@/contexts/cart-context'
import { Trash2, Plus, Minus, ShoppingBag, X, ChevronRight, Package } from 'lucide-react'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: any
  settings?: {
    freeShippingEnabled?: boolean
    freeShippingMinAmount?: number
    freeShippingText?: string
  }
}

export default function CartPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showClearCartDialog, setShowClearCartDialog] = useState(false)
  
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

  const getSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalDiscount = () => {
    return items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity
      return total + (itemTotal * item.discount / 100)
    }, 0)
  }

  const getFreeShippingProgress = () => {
    if (!storeData?.settings?.freeShippingEnabled || !storeData?.settings?.freeShippingMinAmount) {
      return null
    }
    
    const total = getTotalWithDiscount()
    const minAmount = storeData.settings.freeShippingMinAmount
    const remaining = minAmount - total
    const progress = Math.min((total / minAmount) * 100, 100)
    
    return { remaining, progress, minAmount }
  }

  if (loading || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const shippingProgress = getFreeShippingProgress()

  return (
    <StoreLayout storeData={storeData}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Carrito de compras</h1>
            {items.length > 0 && (
              <p className="text-gray-600 mt-1">{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
            )}
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 sm:p-16 text-center">
              <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Tu carrito está vacío</h2>
              <p className="text-gray-600 mb-6">¡Agrega productos para comenzar tu compra!</p>
              <Link 
                href={`/store/${subdomain}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
                Explorar productos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lista de productos - Mobile & Desktop */}
              <div className="lg:col-span-2 space-y-4">
                {/* Free Shipping Progress */}
                {shippingProgress && (
                  shippingProgress.remaining > 0 ? (
                    // Barra de progreso cuando aún falta para el envío gratis
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">
                          Te faltan ${shippingProgress.remaining.toLocaleString('es-AR')} para envío gratis
                        </span>
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${shippingProgress.progress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    // Mensaje cuando se alcanza el envío gratis
                    <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        <span className="text-base font-semibold text-green-800">
                          Tienes envío gratis
                        </span>
                      </div>
                    </div>
                  )
                )}

                {/* Products List */}
                <div className="bg-white rounded-lg shadow-sm divide-y">
                  {items.map((item) => {
                    const itemTotal = item.price * item.quantity
                    const discount = (itemTotal * item.discount) / 100
                    const finalPrice = itemTotal - discount

                    return (
                      <div key={`${item.productId}-${item.sizeId}`} className="p-4 sm:p-6 relative">
                        {/* Botón eliminar - Esquina superior derecha */}
                        <button
                          onClick={() => removeItem(item.productId, item.sizeId)}
                          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar del carrito"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="flex gap-4">
                          {/* Imagen */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Información del producto */}
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base pr-4">
                                {item.productName}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {item.sizeName === 'PAQUETE' ? 'Paquete' : `Talle: ${item.sizeName}`}
                              </p>
                            </div>

                            {/* Precio y cantidad - Mobile */}
                            <div className="mt-3 sm:hidden">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => updateQuantity(item.productId, item.sizeId, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.productId, item.sizeId, item.quantity + 1)}
                                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="text-right">
                                  {item.discount > 0 && (
                                    <div className="text-xs text-gray-500 line-through">
                                      ${itemTotal.toLocaleString('es-AR')}
                                    </div>
                                  )}
                                  <div className="font-semibold">
                                    ${finalPrice.toLocaleString('es-AR')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Precio y cantidad - Desktop */}
                        <div className="hidden sm:flex gap-4 mt-4">
                          <div className="w-20 sm:w-24 flex-shrink-0"></div>
                          <div className="flex-1 flex items-center justify-between pr-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.productId, item.sizeId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.sizeId, item.quantity + 1)}
                                className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="text-right">
                              {item.discount > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500 line-through">
                                    ${itemTotal.toLocaleString('es-AR')}
                                  </span>
                                  <span className="text-lg font-semibold text-gray-900">
                                    ${finalPrice.toLocaleString('es-AR')}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    {item.discount}% OFF
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-semibold text-gray-900">
                                  ${itemTotal.toLocaleString('es-AR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Acciones del carrito */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <Link 
                      href={`/store/${subdomain}`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Seguir comprando
                    </Link>
                    <button
                      onClick={() => setShowClearCartDialog(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Vaciar carrito
                    </button>
                  </div>
                </div>
              </div>

              {/* Resumen del pedido - Sticky en desktop */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-4">
                  <h2 className="text-lg font-semibold mb-4">Resumen del pedido</h2>
                  
                  {/* Desglose de precios */}
                  <div className="space-y-3 pb-4 border-b">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${getSubtotal().toLocaleString('es-AR')}</span>
                    </div>
                    
                    {getTotalDiscount() > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Descuentos</span>
                        <span className="text-green-600">-${getTotalDiscount().toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Envío</span>
                      <span className="text-gray-500">
                        {shippingProgress && shippingProgress.remaining <= 0 
                          ? 'GRATIS' 
                          : 'Se calcula en el checkout'}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-4">
                    <span className="text-lg font-semibold">Total</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${getTotalWithDiscount().toLocaleString('es-AR')}
                      </div>
                      {getTotalDiscount() > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          Ahorrás ${getTotalDiscount().toLocaleString('es-AR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botón de checkout */}
                  <button
                    onClick={handleCheckout}
                    className="w-full px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    Continuar compra
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Métodos de pago */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 text-center">
                      Aceptamos múltiples medios de pago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de confirmación para vaciar carrito */}
      <ConfirmDialog
        isOpen={showClearCartDialog}
        onClose={() => setShowClearCartDialog(false)}
        onConfirm={clearCart}
        title="¿Vaciar el carrito?"
        message="Se eliminarán todos los productos del carrito. Esta acción no se puede deshacer."
        confirmText="Sí, vaciar carrito"
        cancelText="Cancelar"
        type="danger"
      />
    </StoreLayout>
  )
}