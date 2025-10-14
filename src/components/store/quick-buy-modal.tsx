'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/cart-context'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { CartNotification } from './cart-notification'

interface QuickBuyModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  subdomain: string
}

interface ProductDetail {
  id: string
  name: string
  description: string
  price: number
  cashPrice?: number
  discount: number
  code: string
  images: string[]
  stockType?: 'sizes' | 'pack'
  categoryId?: string
  stock: Array<{
    size: {
      id: string
      name: string
    }
    quantity: number
  }>
}

export function QuickBuyModal({ isOpen, onClose, productId, subdomain }: QuickBuyModalProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [storeData, setStoreData] = useState<any>(null)
  const [showCartNotification, setShowCartNotification] = useState(false)
  const [cartNotificationData, setCartNotificationData] = useState<{
    productName: string
    productImage?: string
    productPrice?: number
    sizeName?: string
    quantity?: number
  }>({ productName: '' })
  const [mounted, setMounted] = useState(false)
  const { addItem } = useCart()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetail()
      fetchStoreData()
    }
  }, [isOpen, productId])

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setSelectedSize('')
      setQuantity(1)
      setCurrentImageIndex(0)
    }
  }, [isOpen])

  const fetchProductDetail = async () => {
    try {
      setLoading(true)
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const response = await api.get(`/public/product/${targetSubdomain}/${productId}`)
      setProduct(response.data)
      
      // Auto-select first available size for size-based products
      if (response.data.stockType !== 'pack' && response.data.stock?.length > 0) {
        const availableSize = response.data.stock.find((s: any) => s.quantity > 0)
        if (availableSize) {
          setSelectedSize(availableSize.size.id)
        }
      }
    } catch (err) {
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStoreData = async () => {
    try {
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const response = await api.get(`/public/store/${targetSubdomain}`)
      setStoreData(response.data)
    } catch (err) {
      console.error('Error fetching store:', err)
    }
  }

  const handleAddToCart = () => {
    if (!product) return

    let productNameWithSize = product.name
    let selectedSizeName = ''

    if (product.stockType === 'pack') {
      // Para productos tipo pack
      if (quantity < 1) return
      
      productNameWithSize = `${product.name} (${quantity} ${quantity === 1 ? 'paquete' : 'paquetes'})`
      selectedSizeName = 'PAQUETE'
      
      addItem({
        productId: product.id,
        productName: product.name,
        sizeId: 'pack',
        sizeName: 'PAQUETE',
        quantity: quantity,
        price: product.price,
        discount: product.discount,
        image: product.images[0] || ''
      })
    } else {
      // Para productos con talles
      if (!selectedSize) {
        alert('Por favor selecciona un talle')
        return
      }
      
      const selectedStock = product.stock.find(s => s.size.id === selectedSize)
      if (!selectedStock) return
      
      productNameWithSize = `${product.name} - Talle ${selectedStock.size.name} (${quantity} ${quantity === 1 ? 'unidad' : 'unidades'})`
      selectedSizeName = selectedStock.size.name
      
      addItem({
        productId: product.id,
        productName: product.name,
        sizeId: selectedSize,
        sizeName: selectedStock.size.name,
        quantity: quantity,
        price: product.price,
        discount: product.discount,
        image: product.images[0] || ''
      })
    }

    // Mostrar notificación
    const price = product.discount > 0 
      ? product.price * (1 - product.discount / 100)
      : product.price
    
    setCartNotificationData({
      productName: product.name,
      productImage: product.images[0],
      productPrice: price,
      sizeName: selectedSizeName,
      quantity: quantity
    })
    setShowCartNotification(true)
    
    // Cerrar modal
    onClose()
    
    // No navegar automáticamente - el usuario puede elegir mediante la notificación
  }

  const getMaxQuantity = () => {
    if (!product) return 1
    
    if (product.stockType === 'pack') {
      return product.stock?.[0]?.quantity || 1
    } else if (selectedSize) {
      const stock = product.stock.find(s => s.size.id === selectedSize)
      return stock?.quantity || 1
    }
    return 1
  }

  const hasStock = () => {
    if (!product) return false
    
    if (product.stockType === 'pack') {
      return product.stock?.[0]?.quantity > 0
    } else {
      return product.stock?.some(s => s.quantity > 0)
    }
  }

  if (!mounted || !isOpen) return null

  const discountedPrice = product && product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product?.price || 0

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : product ? (
            <>
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Agregar al carrito</h3>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Images */}
                  <div>
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                      {product.images?.length > 0 ? (
                        <img
                          src={product.images[currentImageIndex]}
                          alt={product.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingCart className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                    
                    {/* Image thumbnails */}
                    {product.images?.length > 1 && (
                      <div className="flex gap-2 justify-center">
                        {product.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-12 h-12 rounded border-2 overflow-hidden ${
                              index === currentImageIndex ? 'border-black' : 'border-gray-200'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold uppercase">{product.name}</h2>
                      <p className="text-sm text-gray-500">Código: {product.code}</p>
                    </div>

                    {/* Price */}
                    <div>
                      {product.discount > 0 ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">
                            ${discountedPrice.toLocaleString('es-AR')}
                          </span>
                          <span className="text-lg text-gray-500 line-through">
                            ${product.price.toLocaleString('es-AR')}
                          </span>
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-sm">
                            -{product.discount}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold">
                          ${product.price.toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>

                    {hasStock() ? (
                      <>
                        {/* Size selector for size-based products */}
                        {product.stockType !== 'pack' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Talle
                            </label>
                            <select
                              value={selectedSize}
                              onChange={(e) => {
                                setSelectedSize(e.target.value)
                                setQuantity(1) // Reset quantity when changing size
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            >
                              <option value="">Selecciona un talle</option>
                              {product.stock.map((item) => (
                                <option 
                                  key={item.size.id} 
                                  value={item.size.id}
                                  disabled={item.quantity === 0}
                                >
                                  {item.size.name} {item.quantity === 0 ? '(Sin stock)' : `(${item.quantity} disponibles)`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Quantity selector */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cantidad {product.stockType === 'pack' && 'de paquetes'}
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className="w-16 text-center font-bold text-xl">
                              {quantity}
                            </span>
                            <button
                              onClick={() => setQuantity(Math.min(quantity + 1, getMaxQuantity()))}
                              disabled={quantity >= getMaxQuantity()}
                              className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                          {(product.stockType === 'pack' ? product.stock?.[0]?.quantity : 
                            (selectedSize && product.stock.find(s => s.size.id === selectedSize)?.quantity)) && (
                            <p className="text-sm text-gray-500 mt-1">
                              {product.stockType === 'pack' 
                                ? `${product.stock[0].quantity} paquetes disponibles`
                                : `${product.stock.find(s => s.size.id === selectedSize)?.quantity} unidades disponibles`
                              }
                            </p>
                          )}
                        </div>

                        {/* Total */}
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total:</span>
                            <span className="text-xl font-bold">
                              ${(discountedPrice * quantity).toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 font-medium">Sin stock disponible</p>
                          <p className="text-sm text-red-500 mt-1">
                            Este producto no está disponible en este momento
                          </p>
                        </div>
                        
                        {/* Botón de WhatsApp para consultar */}
                        {storeData?.settings?.whatsapp && (
                          <div className="mt-4">
                            <button
                              onClick={() => {
                                const whatsappNumber = storeData.settings.whatsapp.replace(/[^0-9]/g, '')
                                const productUrl = `${window.location.origin}/store/${subdomain}/producto/${product.id}`
                                const message = encodeURIComponent(
                                  `Hola! Me interesa el producto:\n\n` +
                                  `📦 *${product.name}*\n` +
                                  `📋 Código: ${product.code}\n` +
                                  `💰 Precio: $${product.price.toLocaleString('es-AR')}\n` +
                                  `🔗 ${productUrl}\n\n` +
                                  `¿Cuándo estará disponible?`
                                )
                                window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank')
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="w-5 h-5 fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              Consultar por WhatsApp
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!hasStock() || (product.stockType !== 'pack' && !selectedSize)}
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-black text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {hasStock() ? 'Agregar al carrito' : 'Sin stock'}
                </button>
                <button
                  onClick={onClose}
                  className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">Error al cargar el producto</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Notificación de producto agregado */}
      <CartNotification
        isOpen={showCartNotification}
        onClose={() => setShowCartNotification(false)}
        productName={cartNotificationData.productName}
        productImage={cartNotificationData.productImage}
        productPrice={cartNotificationData.productPrice}
        sizeName={cartNotificationData.sizeName}
        quantity={cartNotificationData.quantity}
        subdomain={subdomain}
      />
    </div>,
    document.body
  )
}