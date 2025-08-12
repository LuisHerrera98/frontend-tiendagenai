'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { api } from '@/lib/api'
import { ShoppingCart, Minus, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/contexts/cart-context'
import { useRouter } from 'next/navigation'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: any
}

interface ProductDetail {
  id: string
  name: string
  description: string
  price: number
  cost: number
  discount: number
  code: string
  gender: string
  images: string[]
  stockType?: 'sizes' | 'pack'
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

interface CartItem {
  sizeId: string
  sizeName: string
  quantity: number
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
  const [cartItems, setCartItems] = useState<CartItem[]>([])

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
    } catch (err) {
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  const addSizeToCart = () => {
    if (!product) return
    
    // Si no hay stock definido o está vacío
    if (!product.stock || product.stock.length === 0) {
      // Producto sin talles específicos (talle único)
      setCartItems([...cartItems, {
        sizeId: 'unico',
        sizeName: 'Único',
        quantity: 1
      }])
      return
    }
    
    // Buscar el primer talle con stock disponible
    const availableSize = product.stock.find(s => s.quantity > 0 && s.size?.id)
    if (availableSize && availableSize.size?.id) {
      setCartItems([...cartItems, {
        sizeId: availableSize.size.id,
        sizeName: availableSize.size.name || 'Sin nombre',
        quantity: 1
      }])
    } else {
      alert('No hay talles disponibles con stock')
    }
  }

  const updateQuantity = (index: number, newQuantity: number) => {
    if (!product) return
    
    const item = cartItems[index]
    const stock = product.stock.find(s => s.size.id === item.sizeId)
    
    if (stock && newQuantity > 0 && newQuantity <= stock.quantity) {
      const updatedItems = [...cartItems]
      updatedItems[index].quantity = newQuantity
      setCartItems(updatedItems)
    }
  }

  const updateSize = (index: number, newSizeId: string) => {
    if (!product) return
    
    const newSize = product.stock.find(s => s.size.id === newSizeId)
    if (newSize && newSize.quantity > 0) {
      const updatedItems = [...cartItems]
      updatedItems[index] = {
        sizeId: newSizeId,
        sizeName: newSize.size.name,
        quantity: 1
      }
      setCartItems(updatedItems)
    }
  }

  const removeItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const getTotalQuantity = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    if (!product) return 0
    const price = product.discount > 0 
      ? product.price * (1 - product.discount / 100)
      : product.price
    return price * getTotalQuantity()
  }

  const handleAddToCart = () => {
    if (cartItems.length === 0) {
      alert('Por favor agrega al menos un talle')
      return
    }
    
    if (!product) return
    
    // Validar que todos los items tengan sizeId
    const invalidItems = cartItems.filter(item => !item.sizeId)
    if (invalidItems.length > 0) {
      alert('Error: Algunos talles no tienen ID válido. Por favor recarga la página.')
      return
    }
    
    // Agregar cada item al carrito global
    cartItems.forEach(item => {
      if (item.sizeId) { // Doble verificación
        addItem({
          productId: product.id,
          productName: product.name,
          sizeId: item.sizeId,
          sizeName: item.sizeName || 'Sin nombre',
          quantity: item.quantity,
          price: product.price,
          discount: product.discount,
          image: product.images[0] || ''
        })
      }
    })
    
    // Limpiar los items locales
    setCartItems([])
    
    // Mostrar confirmación y redirigir
    alert('Producto agregado al carrito')
    router.push(`/store/${subdomain}/carrito`)
  }

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
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
          <Link href="/" className="text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </StoreLayout>
    )
  }

  const discountedPrice = product.discount > 0 
    ? product.price * (1 - product.discount / 100)
    : product.price

  return (
    <StoreLayout storeData={storeData}>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="text-gray-500 hover:text-gray-700">Inicio</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Imágenes */}
          <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ maxHeight: '500px' }}>
              <div className="aspect-w-1 aspect-h-1" style={{ maxWidth: '500px', margin: '0 auto' }}>
              {product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                    style={{ maxHeight: '500px' }}
                  />
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400" style={{ minHeight: '400px' }}>
                  Sin imagen
                </div>
              )}
              </div>
            </div>

            {/* Miniaturas */}
            {product.images.length > 1 && (
              <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-black scale-105' : 'border-gray-200 hover:border-gray-400'
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

          {/* Información del producto */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-600">{product.brand.name} - {product.model}</p>
              <p className="text-sm text-gray-500">Código: {product.code}</p>
            </div>

            <div className="flex items-baseline space-x-3">
              {product.discount > 0 ? (
                <>
                  <span className="text-3xl font-bold">${discountedPrice.toLocaleString('es-AR')}</span>
                  <span className="text-xl text-gray-500 line-through">${product.price.toLocaleString('es-AR')}</span>
                  <span className="text-green-600 font-medium">{product.discount}% OFF</span>
                </>
              ) : (
                <span className="text-3xl font-bold">${product.price.toLocaleString('es-AR')}</span>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            <div>
              {product.category && (
                <p className="text-sm text-gray-600 mb-2">
                  Categoría: <span className="font-medium">{product.category.name}</span>
                </p>
              )}
              <p className="text-sm text-gray-600">
                Género: <span className="font-medium capitalize">{product.gender}</span>
              </p>
            </div>

            {/* Selector de talles y cantidades */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Talles y Cantidades</h3>
                <button
                  onClick={addSizeToCart}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Agregar otro talle
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">No has agregado ningún talle</p>
                  <button
                    onClick={addSizeToCart}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    Agregar talle
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item, index) => {
                    const isUniqueSize = !product.stock || product.stock.length === 0
                    const stock = isUniqueSize ? null : product.stock.find(s => s.size.id === item.sizeId)
                    
                    return (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        {isUniqueSize ? (
                          <div className="flex-1 px-3 py-2 bg-white border rounded-lg">
                            Talle Único
                          </div>
                        ) : (
                          <select
                            value={item.sizeId}
                            onChange={(e) => updateSize(index, e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg"
                          >
                            {product.stock.map((s) => (
                              <option 
                                key={s.size.id} 
                                value={s.size.id}
                                disabled={s.quantity === 0}
                              >
                                {s.size.name} {s.quantity === 0 ? '(Sin stock)' : `(${s.quantity} disponibles)`}
                              </option>
                            ))}
                          </select>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            disabled={!stock || item.quantity >= stock.quantity}
                            className="p-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>Cantidad total:</span>
                    <span className="font-semibold">
                      {getTotalQuantity()} {product.stockType === 'pack' ? 
                        (getTotalQuantity() === 1 ? 'paquete' : 'paquetes') : 
                        (getTotalQuantity() === 1 ? 'unidad' : 'unidades')
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Total:</span>
                    <span className="font-bold">${getTotalPrice().toLocaleString('es-AR')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de agregar al carrito */}
            <button
              onClick={handleAddToCart}
              disabled={cartItems.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              <ShoppingCart className="w-5 h-5" />
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}