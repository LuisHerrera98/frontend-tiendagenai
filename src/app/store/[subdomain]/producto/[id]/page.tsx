'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { api } from '@/lib/api'
import { ShoppingCart, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'
import { CartNotification } from '@/components/store/cart-notification'
import { WhatsAppProductConsultation } from '@/components/store/whatsapp-product-consultation'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: any
  settings?: {
    freeShippingEnabled?: boolean
    freeShippingMinAmount?: number
    freeShippingText?: string
    whatsapp?: string
  }
}

interface ProductDetail {
  id: string
  name: string
  description: string
  price: number
  cashPrice?: number
  cost: number
  discount: number
  code: string
  gender: string
  images: string[]
  stockType?: 'sizes' | 'unit'
  category: {
    id: string
    name: string
  }
  brand: {
    id: string
    name: string
  }
  model: string
  stock: Array<{
    size: {
      id: string
      name: string
    }
    quantity: number
  }>
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const subdomain = params.subdomain as string
  const productId = params.id as string
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [showCartNotification, setShowCartNotification] = useState(false)
  const [cartNotificationData, setCartNotificationData] = useState<{
    productName: string
    productImage?: string
    productPrice?: number
    sizeName?: string
    quantity?: number
  }>({ productName: '' })

  useEffect(() => {
    fetchStoreData()
    fetchProductDetail()
  }, [subdomain, productId])

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

  const fetchProductDetail = async () => {
    try {
      setLoading(true)
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const response = await api.get(`/public/product/${targetSubdomain}/${productId}`)
      setProduct(response.data)
      
      // Auto-select first available size for non-pack products
      if (response.data.stockType !== 'unit' && response.data.stock?.length > 0) {
        const firstAvailable = response.data.stock.find((s: any) => s.quantity > 0)
        if (firstAvailable) {
          setSelectedSize(firstAvailable.size.id)
        }
      }
    } catch (err) {
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    
    // For size products, check if size is selected
    if (product.stockType !== 'unit' && !selectedSize && product.stock?.length > 0) {
      alert('Por favor selecciona un talle')
      return
    }

    // Check stock
    if (product.stockType === 'unit') {
      const unitStock = product.stock?.[0]?.quantity || 0
      if (unitStock < quantity) {
        alert('No hay suficiente stock disponible')
        return
      }
    } else if (selectedSize) {
      const sizeStock = product.stock.find(s => s.size.id === selectedSize)
      if (!sizeStock || sizeStock.quantity < quantity) {
        alert('No hay suficiente stock disponible para este talle')
        return
      }
    }

    // Add to cart
    const sizeName = product.stockType === 'unit' 
      ? 'PAQUETE'
      : product.stock.find(s => s.size.id === selectedSize)?.size.name || 'Único'

    addItem({
      productId: product.id,
      productName: product.name,
      sizeId: selectedSize || 'unit',
      sizeName: sizeName,
      quantity: quantity,
      price: product.price,
      discount: product.discount,
      image: product.images[0] || ''
    })

    // Show notification
    setCartNotificationData({
      productName: product.name,
      productImage: product.images[0],
      productPrice: product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price,
      sizeName: sizeName,
      quantity: quantity
    })
    setShowCartNotification(true)
    
    // Reset quantity
    setQuantity(1)
  }

  const incrementQuantity = () => {
    if (!product) return
    
    if (product.stockType === 'unit') {
      const unitStock = product.stock?.[0]?.quantity || 999
      if (quantity < unitStock) {
        setQuantity(quantity + 1)
      }
    } else if (selectedSize) {
      const sizeStock = product.stock.find(s => s.size.id === selectedSize)
      if (sizeStock && quantity < sizeStock.quantity) {
        setQuantity(quantity + 1)
      }
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  if (loading || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <StoreLayout storeData={storeData}>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
          <Link href={`/store/${subdomain}`} className="text-blue-600 hover:underline">
            Volver a la tienda
          </Link>
        </div>
      </StoreLayout>
    )
  }

  const discountedPrice = product.discount > 0 
    ? product.price * (1 - product.discount / 100)
    : product.price

  const hasStock = product.stockType === 'unit' 
    ? product.stock?.[0]?.quantity > 0
    : product.stock?.some(s => s.quantity > 0)

  // Calculate if free shipping applies
  const cartTotal = discountedPrice * quantity
  const freeShippingApplies = storeData?.settings?.freeShippingEnabled && 
    storeData.settings.freeShippingMinAmount && 
    cartTotal >= storeData.settings.freeShippingMinAmount

  return (
    <StoreLayout storeData={storeData}>
      {/* Cart Notification */}
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

      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm mb-4 sm:mb-6">
          <ol className="flex items-center space-x-1 sm:space-x-2">
            <li>
              <Link 
                href={`/store/${subdomain}`} 
                className="text-gray-500 hover:text-gray-700 uppercase"
              >
                Inicio
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            {product.category && (
              <>
                <li className="text-gray-500 uppercase hidden sm:block">{product.category.name}</li>
                <li className="text-gray-400 hidden sm:block">/</li>
              </>
            )}
            <li className="text-gray-900 uppercase truncate">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-gray-50 rounded-lg overflow-hidden aspect-square">
              {product.images.length > 0 ? (
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Sin imagen
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-black ring-2 ring-black ring-offset-2' 
                        : 'border-gray-200 hover:border-gray-400'
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

          {/* Product Info */}
          <div className="space-y-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold uppercase mb-2 leading-tight">{product.name}</h1>
              <p className="text-sm text-gray-500">Producto ID: {product.code}</p>
            </div>

            {/* Prices */}
            <div className="space-y-2">
              {product.discount > 0 ? (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold">
                      ${discountedPrice.toLocaleString('es-AR')}
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      ${product.price.toLocaleString('es-AR')}
                    </span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-sm">
                      -{product.discount}%
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-3xl font-bold">
                  ${product.price.toLocaleString('es-AR')}
                </span>
              )}


              {product.cashPrice && product.cashPrice < product.price && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-green-700">
                      ${product.cashPrice.toLocaleString('es-AR')}
                    </span>
                    <span className="text-sm text-green-600">con Transferencia</span>
                  </div>
                </div>
              )}
            </div>

            {/* Free Shipping Message */}
            {storeData?.settings?.freeShippingEnabled && storeData.settings.freeShippingMinAmount && (
              <div className={`p-3 rounded-lg ${freeShippingApplies ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                {freeShippingApplies ? (
                  <p className="text-sm font-medium text-green-700">
                    ¡Agregá este producto y tenés envío gratis! 🚚
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    Envío gratis superando los ${storeData.settings.freeShippingMinAmount.toLocaleString('es-AR')}
                  </p>
                )}
              </div>
            )}

            {/* Size Selector or Color Info */}
            {product.stockType !== 'unit' && product.stock && product.stock.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 uppercase text-sm">Talle</h3>
                <div className="flex flex-wrap gap-2">
                  {product.stock.map((item) => {
                    const isAvailable = item.quantity > 0
                    const isSelected = selectedSize === item.size.id
                    
                    return (
                      <button
                        key={item.size.id}
                        onClick={() => isAvailable && setSelectedSize(item.size.id)}
                        disabled={!isAvailable}
                        className={`
                          py-2 px-4 rounded-md border font-medium text-sm transition-all
                          ${isSelected 
                            ? 'border-black bg-black text-white' 
                            : isAvailable
                              ? 'border-gray-300 hover:border-gray-500 bg-white'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                          }
                        `}
                      >
                        {item.size.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <h3 className="font-semibold mb-3 uppercase">
                {product.stockType === 'unit' ? 'Cantidad de Unidades' : 'Cantidad'}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val) && val >= 1) {
                        setQuantity(val)
                      }
                    }}
                    className="w-16 text-center font-semibold text-lg focus:outline-none"
                  />
                  <button
                    onClick={incrementQuantity}
                    disabled={!hasStock}
                    className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-3">
              {hasStock ? (
                <button
                  onClick={handleAddToCart}
                  disabled={product.stockType !== 'unit' && !selectedSize && product.stock?.length > 0}
                  className="w-full py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Agregar al carrito
                </button>
              ) : (
                <>
                  <button
                    disabled
                    className="w-full py-4 bg-gray-200 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
                  >
                    Sin Stock
                  </button>
                  <WhatsAppProductConsultation product={product} storePhone={storeData?.settings?.whatsapp} />
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 uppercase">Descripción</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="border-t pt-4 space-y-2">
              {product.brand && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Marca:</span> {product.brand.name}
                </p>
              )}
              {product.category && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Categoría:</span> {product.category.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}