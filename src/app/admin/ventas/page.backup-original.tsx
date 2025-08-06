'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesService, Sale, SalesStats, CreateSaleDto } from '@/lib/sales'
import { productService } from '@/lib/products'
import { exchangeService, CreateExchangeDto } from '@/lib/exchanges'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Plus, 
  Calendar,
  Filter,
  Loader2,
  RefreshCw,
  X,
  ZoomIn
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function LoadingSkeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

function SaleMetricCard({ title, value, description, icon: Icon, isLoading = false, color = "blue" }) {
  const colorClasses = {
    blue: "text-blue-500",
    green: "text-green-500", 
    orange: "text-orange-500",
    purple: "text-purple-500"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]} flex-shrink-0`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <LoadingSkeleton className="h-8 w-16 mb-1" />
            <LoadingSkeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function ImageModal({ imageUrl, altText, open, setOpen }: { imageUrl: string, altText: string, open: boolean, setOpen: (open: boolean) => void }) {
  if (!imageUrl) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-2">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{altText}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={altText}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ExchangeDialog({ sale, open, setOpen }: { sale: Sale | null, open: boolean, setOpen: (open: boolean) => void }) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [paymentMethodDiff, setPaymentMethodDiff] = useState('no_aplica')
  const [notes, setNotes] = useState('')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false)
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false)
  const queryClient = useQueryClient()

  // Obtener categorías
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => import('@/lib/categories').then(module => module.categoryService.getAll()),
  })

  // Obtener productos filtrados por categoría
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-exchange', selectedCategory],
    queryFn: () => productService.getProducts({ 
      categoryId: selectedCategory,
      limit: 1000, 
      showAll: false 
    }),
    enabled: !!selectedCategory,
    staleTime: 5 * 60 * 1000,
  })

  const products = useMemo(() => {
    if (!productsData?.data) return []
    return productsData.data.filter(product => {
      const totalStock = product.stock?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
      return totalStock > 0
    })
  }, [productsData])

  const availableSizes = useMemo(() => {
    if (selectedProduct && products.length > 0) {
      const product = products.find(p => p._id === selectedProduct)
      if (product) {
        return product.stock?.filter(s => s.quantity > 0) || []
      }
    }
    return []
  }, [selectedProduct, products])

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownOpen && !event.target.closest('.category-dropdown')) {
        setCategoryDropdownOpen(false)
      }
      if (sizeDropdownOpen && !event.target.closest('.size-dropdown')) {
        setSizeDropdownOpen(false)
      }
      if (paymentDropdownOpen && !event.target.closest('.payment-dropdown')) {
        setPaymentDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [categoryDropdownOpen, sizeDropdownOpen, paymentDropdownOpen])

  const createExchangeMutation = useMutation({
    mutationFn: async (exchangeData: CreateExchangeDto) => {
      return await exchangeService.createExchange(exchangeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['exchanges'] })
      setOpen(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Exchange creation failed:', error)
    }
  })

  const resetForm = () => {
    setSelectedCategory('')
    setSelectedProduct('')
    setSelectedSize('')
    setPaymentMethodDiff('no_aplica')
    setNotes('')
    setCategoryDropdownOpen(false)
    setSizeDropdownOpen(false)
    setPaymentDropdownOpen(false)
  }

  const handleCreateExchange = () => {
    if (!sale || !selectedProduct || !selectedSize) return

    const exchangeData: CreateExchangeDto = {
      original_sell_id: sale._id,
      new_product_id: selectedProduct,
      new_size_id: selectedSize,
      payment_method_difference: paymentMethodDiff,
      notes: notes
    }

    createExchangeMutation.mutate(exchangeData)
  }

  const selectedProductData = products.find(p => p._id === selectedProduct)
  const selectedSizeData = availableSizes.find(s => s.size_id === selectedSize)
  const priceDifference = selectedProductData && sale 
    ? selectedProductData.price - sale.price 
    : 0

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Cambiar Producto</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Producto Original */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Producto Original</h3>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {sale.images && sale.images.length > 0 && (
                  <img 
                    src={sale.images[0].url} 
                    alt={sale.product_name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{sale.product_name}</p>
                  <p className="text-sm text-gray-600">Talle: {sale.size_name}</p>
                  <p className="text-sm font-medium text-green-600">${sale.price}</p>
                  <p className="text-sm text-gray-600">Método: {sale.method_payment}</p>
                  <p className="text-sm text-gray-600">Fecha: {sale.dateSell_id?.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seleccionar Nuevo Producto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Nuevo Producto</h3>
            
            <div className="space-y-2">
              <Label>Categoría</Label>
              <div className="relative category-dropdown">
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedCategory 
                      ? categories?.find(cat => cat._id === selectedCategory)?.name || 'Seleccionar categoría...'
                      : 'Seleccionar categoría...'
                    }
                  </span>
                  <svg 
                    className={`h-4 w-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {categoryDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {!categories || categories.length === 0 ? (
                      <div className="p-3 text-center text-gray-500">Cargando categorías...</div>
                    ) : (
                      categories.map((category) => (
                        <button
                          key={category._id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category._id)
                            setCategoryDropdownOpen(false)
                            setSelectedProduct('')
                            setSelectedSize('')
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                            selectedCategory === category._id ? 'bg-orange-50 text-orange-700' : 'text-gray-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{category.name}</span>
                            {selectedCategory === category._id && (
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedCategory && (
              <div className="space-y-2">
                <Label>Producto</Label>
                {productsLoading ? (
                  <div className="p-3 text-center text-gray-500">Cargando productos...</div>
                ) : products.length === 0 ? (
                  <div className="p-3 text-center text-gray-500">No hay productos con stock</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => {
                          setSelectedProduct(product._id)
                          setSelectedSize('')
                        }}
                        className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedProduct === product._id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-b border-gray-100 last:border-b-0'
                        }`}
                      >
                        {product.images && product.images.length > 0 && (
                          <img 
                            src={product.images[0].url} 
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-sm text-green-600 font-medium">${product.price}</p>
                        </div>
                        {selectedProduct === product._id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedProduct && (
              <div className="space-y-2">
                <Label>Talle</Label>
                <div className="relative size-dropdown">
                  <button
                    type="button"
                    onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className={selectedSize ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedSize 
                        ? (() => {
                            const size = availableSizes.find(s => s.size_id === selectedSize)
                            return size ? `${size.size_name} (Stock: ${size.quantity})` : 'Seleccionar talle...'
                          })()
                        : 'Seleccionar talle...'
                      }
                    </span>
                    <svg 
                      className={`h-4 w-4 transition-transform ${sizeDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {sizeDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {availableSizes.length === 0 ? (
                        <div className="p-3 text-center text-gray-500">No hay talles con stock</div>
                      ) : (
                        availableSizes.map((size) => (
                          <button
                            key={size.size_id}
                            type="button"
                            onClick={() => {
                              setSelectedSize(size.size_id)
                              setSizeDropdownOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                              selectedSize === size.size_id ? 'bg-orange-50 text-orange-700' : 'text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{size.size_name}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Stock: {size.quantity}</span>
                                {selectedSize === size.size_id && (
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resumen del cambio */}
            {selectedProductData && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Resumen del Cambio</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Producto original:</span> ${sale.price}</p>
                  <p><span className="font-medium">Producto nuevo:</span> ${selectedProductData.price}</p>
                  <p className={`font-bold ${priceDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <span className="font-medium">Diferencia:</span> ${Math.abs(priceDifference)}
                    {priceDifference > 0 && ' (Cliente debe pagar)'}
                    {priceDifference < 0 && ' (A favor del cliente)'}
                    {priceDifference === 0 && ' (Sin diferencia)'}
                  </p>
                </div>

                {priceDifference !== 0 && (
                  <div className="mt-3 space-y-2">
                    <Label>Método de pago para diferencia</Label>
                    <div className="relative payment-dropdown">
                      <button
                        type="button"
                        onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="text-gray-900 capitalize">
                          {paymentMethodDiff === 'no_aplica' ? 'No aplica' : paymentMethodDiff}
                        </span>
                        <svg 
                          className={`h-4 w-4 transition-transform ${paymentDropdownOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {paymentDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                          {['no_aplica', 'efectivo', 'transferencia', 'qr', 'tarjeta'].map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => {
                                setPaymentMethodDiff(method)
                                setPaymentDropdownOpen(false)
                              }}
                              className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors capitalize ${
                                paymentMethodDiff === method ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{method === 'no_aplica' ? 'No aplica' : method}</span>
                                {paymentMethodDiff === method && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar notas sobre el cambio..."
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateExchange}
            disabled={!selectedProduct || !selectedSize || createExchangeMutation.isPending}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {createExchangeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              `Registrar Cambio`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RegisterSaleDialog() {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState([])
  const [methodPayment, setMethodPayment] = useState('efectivo')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false)
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false)
  const queryClient = useQueryClient()

  // Obtener categorías
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => import('@/lib/categories').then(module => module.categoryService.getAll()),
  })

  // Obtener productos filtrados por categoría
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-sale', selectedCategory],
    queryFn: () => productService.getProducts({ 
      categoryId: selectedCategory,
      limit: 1000, 
      showAll: false 
    }),
    enabled: !!selectedCategory,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const products = useMemo(() => {
    if (!productsData?.data) return []
    return productsData.data.filter(product => {
      const totalStock = product.stock?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
      return totalStock > 0 // Solo productos con stock
    })
  }, [productsData])

  // Memoizar talles disponibles
  const availableSizes = useMemo(() => {
    if (selectedProduct && products.length > 0) {
      const product = products.find(p => p._id === selectedProduct)
      if (product) {
        return product.stock?.filter(s => s.quantity > 0) || []
      }
    }
    return []
  }, [selectedProduct, products])

  // Reset size when product changes
  useEffect(() => {
    setSelectedSize('')
  }, [selectedProduct])

  // Resetear selecciones cuando cambia la categoría
  useEffect(() => {
    setSelectedProduct('')
    setSelectedSize('')
    setQuantity(1)
  }, [selectedCategory])

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownOpen && !event.target.closest('.category-dropdown')) {
        setCategoryDropdownOpen(false)
      }
      if (sizeDropdownOpen && !event.target.closest('.size-dropdown')) {
        setSizeDropdownOpen(false)
      }
      if (paymentDropdownOpen && !event.target.closest('.payment-dropdown')) {
        setPaymentDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [categoryDropdownOpen, sizeDropdownOpen, paymentDropdownOpen])

  const registerSaleMutation = useMutation({
    mutationFn: async (cartItems) => {
      console.log('Registering sales:', cartItems)
      // Registrar múltiples ventas secuencialmente
      const results = []
      for (const item of cartItems) {
        try {
          const result = await salesService.registerSale(item)
          results.push(result)
        } catch (error) {
          console.error('Error registering sale:', error, 'Item:', item)
          throw error
        }
      }
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] })
      queryClient.invalidateQueries({ queryKey: ['products-for-sale'] })
      setOpen(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Sales registration failed:', error)
    }
  })

  const resetForm = () => {
    setSelectedCategory('')
    setSelectedProduct('')
    setSelectedSize('')
    setQuantity(1)
    setCart([])
    setMethodPayment('efectivo')
    setCategoryDropdownOpen(false)
    setSizeDropdownOpen(false)
    setPaymentDropdownOpen(false)
  }

  const addToCart = () => {
    if (!selectedProduct || !selectedSize || quantity < 1) return

    const product = products.find(p => p._id === selectedProduct)
    const sizeData = availableSizes.find(s => s.size_id === selectedSize)
    
    if (!product || !sizeData) return

    // Verificar que no exceda el stock disponible
    const maxQuantity = sizeData.quantity
    const finalQuantity = Math.min(quantity, maxQuantity)

    // Verificar si ya existe en el carrito
    const existingItemIndex = cart.findIndex(item => 
      item.product_id === product._id && item.size_id === sizeData.size_id
    )

    if (existingItemIndex >= 0) {
      // Actualizar cantidad del item existente
      const newCart = [...cart]
      const currentQuantity = newCart[existingItemIndex].quantity
      const newQuantity = Math.min(currentQuantity + finalQuantity, maxQuantity)
      newCart[existingItemIndex].quantity = newQuantity
      setCart(newCart)
    } else {
      // Agregar nuevo item al carrito
      const cartItem = {
        product_id: product._id,
        product_name: product.name,
        size_id: sizeData.size_id,
        size_name: sizeData.size_name,
        price: product.price,
        cost: product.cost,
        images: product.images,
        quantity: finalQuantity,
        maxStock: maxQuantity
      }
      setCart([...cart, cartItem])
    }

    // Reset selections
    setSelectedProduct('')
    setSelectedSize('')
    setQuantity(1)
  }

  const removeFromCart = (productId, sizeId) => {
    setCart(cart.filter(item => !(item.product_id === productId && item.size_id === sizeId)))
  }

  const updateCartQuantity = (productId, sizeId, newQuantity) => {
    const newCart = cart.map(item => {
      if (item.product_id === productId && item.size_id === sizeId) {
        return { ...item, quantity: Math.min(Math.max(1, newQuantity), item.maxStock) }
      }
      return item
    })
    setCart(newCart)
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleRegisterSale = async () => {
    if (cart.length === 0) return

    // Convertir items del carrito a múltiples ventas
    const salesData = cart.flatMap(item => 
      Array(item.quantity).fill().map(() => ({
        product_id: item.product_id,
        product_name: item.product_name,
        size_id: item.size_id,
        size_name: item.size_name,
        price: Number(item.price),
        cost: Number(item.cost),
        images: item.images || [],
        method_payment: methodPayment,
      }))
    )

    console.log('Registering', salesData.length, 'sales from', cart.length, 'cart items')
    registerSaleMutation.mutate(salesData)
  }

  const handleOpenModal = () => {
    setOpen(true)
  }

  return (
    <>
      <Button 
        onClick={handleOpenModal}
        className="bg-green-600 hover:bg-green-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Registrar Venta
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Venta</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de selección */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Agregar Productos</h3>
            
            <div className="space-y-2">
              <Label>Categoría</Label>
              <div className="relative category-dropdown">
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedCategory 
                      ? categories?.find(cat => cat._id === selectedCategory)?.name || 'Seleccionar categoría...'
                      : 'Seleccionar categoría...'
                    }
                  </span>
                  <svg 
                    className={`h-4 w-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {categoryDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {!categories || categories.length === 0 ? (
                      <div className="p-3 text-center text-gray-500">Cargando categorías...</div>
                    ) : (
                      categories.map((category) => (
                        <button
                          key={category._id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(category._id)
                            setCategoryDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                            selectedCategory === category._id ? 'bg-green-50 text-green-700' : 'text-gray-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{category.name}</span>
                            {selectedCategory === category._id && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedCategory && (
              <div className="space-y-2">
                <Label>Producto</Label>
                {productsLoading ? (
                  <div className="p-3 text-center text-gray-500">Cargando productos...</div>
                ) : products.length === 0 ? (
                  <div className="p-3 text-center text-gray-500">No hay productos con stock</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => setSelectedProduct(product._id)}
                        className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedProduct === product._id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-b border-gray-100 last:border-b-0'
                        }`}
                      >
                        {product.images && product.images.length > 0 && (
                          <img 
                            src={product.images[0].url} 
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-sm text-green-600 font-medium">${product.price}</p>
                        </div>
                        {selectedProduct === product._id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedProduct && (
              <div className="space-y-2">
                <Label>Talle</Label>
                <div className="relative size-dropdown">
                  <button
                    type="button"
                    onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className={selectedSize ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedSize 
                        ? (() => {
                            const size = availableSizes.find(s => s.size_id === selectedSize)
                            return size ? `${size.size_name} (Stock: ${size.quantity})` : 'Seleccionar talle...'
                          })()
                        : 'Seleccionar talle...'
                      }
                    </span>
                    <svg 
                      className={`h-4 w-4 transition-transform ${sizeDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {sizeDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {availableSizes.length === 0 ? (
                        <div className="p-3 text-center text-gray-500">No hay talles con stock</div>
                      ) : (
                        availableSizes.map((size) => (
                          <button
                            key={size.size_id}
                            type="button"
                            onClick={() => {
                              setSelectedSize(size.size_id)
                              setSizeDropdownOpen(false)
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                              selectedSize === size.size_id ? 'bg-green-50 text-green-700' : 'text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{size.size_name}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Stock: {size.quantity}</span>
                                {selectedSize === size.size_id && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedProduct && selectedSize && (
              <div className="space-y-4">
                {/* Preview del producto seleccionado */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const product = products.find(p => p._id === selectedProduct)
                      return product?.images && product.images.length > 0 && (
                        <img 
                          src={product.images[0].url} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )
                    })()}
                    <div className="flex-1">
                      <p className="font-medium">{products.find(p => p._id === selectedProduct)?.name}</p>
                      <p className="text-sm text-gray-600">
                        Talle: {availableSizes.find(s => s.size_id === selectedSize)?.size_name}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        ${products.find(p => p._id === selectedProduct)?.price}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selector de cantidad */}
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={availableSizes.find(s => s.size_id === selectedSize)?.quantity || 1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(
                        availableSizes.find(s => s.size_id === selectedSize)?.quantity || 1,
                        quantity + 1
                      ))}
                      disabled={quantity >= (availableSizes.find(s => s.size_id === selectedSize)?.quantity || 1)}
                    >
                      +
                    </Button>
                    <span className="text-sm text-gray-500">
                      (Stock: {availableSizes.find(s => s.size_id === selectedSize)?.quantity})
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={addToCart}
              disabled={!selectedProduct || !selectedSize}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar al Carrito
            </Button>
          </div>

          {/* Carrito */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Carrito de Venta</h3>
              <Badge variant="secondary">{cart.length} items</Badge>
            </div>

            {/* Método de Pago */}
            {cart.length > 0 && (
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                <Label>Método de Pago</Label>
                <div className="relative payment-dropdown">
                  <button
                    type="button"
                    onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-gray-900 capitalize">
                      {methodPayment}
                    </span>
                    <svg 
                      className={`h-4 w-4 transition-transform ${paymentDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {paymentDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                      {['efectivo', 'transferencia', 'qr', 'tarjeta'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setMethodPayment(method)
                            setPaymentDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors capitalize ${
                            methodPayment === method ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{method}</span>
                            {methodPayment === method && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">El carrito está vacío</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item.product_id}-${item.size_id}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {/* Imagen del producto */}
                    {item.images && item.images.length > 0 && (
                      <img 
                        src={item.images[0].url} 
                        alt={item.product_name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-gray-600">Talle: {item.size_name}</p>
                      <p className="text-xs text-green-600 font-medium">${item.price} c/u</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.product_id, item.size_id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-6 w-6 p-0"
                        >
                          -
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartQuantity(item.product_id, item.size_id, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="h-6 w-6 p-0"
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product_id, item.size_id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">
                    ${getTotalAmount().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => {
              setOpen(false)
              resetForm()
            }}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRegisterSale}
            disabled={cart.length === 0 || registerSaleMutation.isPending}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {registerSaleMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              `Registrar Venta - $${getTotalAmount().toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
            )}
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function VentasPage() {
  // Configurar filtro por defecto al último mes
  const getLastMonthDates = () => {
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    return {
      startDate: lastMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }
  }

  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' })
  const [specificDate, setSpecificDate] = useState('')
  const [showRangeFilters, setShowRangeFilters] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false)
  const [selectedSaleForExchange, setSelectedSaleForExchange] = useState<Sale | null>(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState({ url: '', alt: '' })

  // Update time on client side only
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Fetch sales with date filter
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', dateFilter.startDate, dateFilter.endDate, specificDate],
    queryFn: () => {
      if (specificDate) {
        return salesService.getSales(specificDate, specificDate)
      }
      return salesService.getSales(dateFilter.startDate, dateFilter.endDate)
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch sales stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['sales-stats', dateFilter.startDate, dateFilter.endDate, specificDate],
    queryFn: () => {
      if (specificDate) {
        return salesService.getSalesStats(specificDate, specificDate)
      }
      return salesService.getSalesStats(dateFilter.startDate, dateFilter.endDate)
    },
    refetchInterval: 30000,
  })

  const handleDateFilterChange = (field: string, value: string) => {
    setDateFilter(prev => ({ ...prev, [field]: value }))
    // Clear specific date when using range filter
    if (value && specificDate) {
      setSpecificDate('')
    }
  }

  const handleSpecificDateChange = (value: string) => {
    setSpecificDate(value)
    // Clear range filter when using specific date
    if (value && (dateFilter.startDate || dateFilter.endDate)) {
      setDateFilter({ startDate: '', endDate: '' })
      setShowRangeFilters(false)
    }
  }

  const clearFilters = () => {
    setDateFilter({ startDate: '', endDate: '' })
    setSpecificDate('')
    setShowRangeFilters(false)
  }

  const toggleRangeFilters = () => {
    setShowRangeFilters(!showRangeFilters)
    // Clear specific date when showing range filters
    if (!showRangeFilters && specificDate) {
      setSpecificDate('')
    }
  }

  const handleOpenExchange = (sale: Sale) => {
    setSelectedSaleForExchange(sale)
    setExchangeDialogOpen(true)
  }

  const handleOpenImage = (imageUrl: string, altText: string) => {
    setSelectedImage({ url: imageUrl, alt: altText })
    setImageModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Desktop */}
      <div className="hidden sm:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Ventas</h1>
          <p className="text-gray-600">Registra y gestiona las ventas de productos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Última actualización: {currentTime || '--:--:--'}
          </div>
          <RegisterSaleDialog />
        </div>
      </div>

      {/* Header Mobile */}
      <div className="block sm:hidden space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Ventas</h1>
          <RegisterSaleDialog />
        </div>
        <div className="text-xs text-muted-foreground">
          Última actualización: {currentTime || '--:--:--'}
        </div>
      </div>

      {/* Métricas */}
      <div className="space-y-2 sm:grid sm:gap-4 sm:grid-cols-3 sm:space-y-0">
        <SaleMetricCard
          title="Ventas"
          value={stats?.totalSales || 0}
          description="Cantidad de ventas"
          icon={ShoppingCart}
          isLoading={statsLoading}
          color="blue"
        />
        <SaleMetricCard
          title="Ingresos"
          value={stats ? `$${stats.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 0 })}` : '$0'}
          description="Total facturado"
          icon={DollarSign}
          isLoading={statsLoading}
          color="green"
        />
        <SaleMetricCard
          title="Ganancia"
          value={stats ? `$${stats.totalProfit.toLocaleString('es-AR', { minimumFractionDigits: 0 })}` : '$0'}
          description="Ingresos - Costos"
          icon={TrendingUp}
          isLoading={statsLoading}
          color="purple"
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 sm:pt-2">
          <div className="space-y-3 sm:space-y-4">
            {/* Filtro por día específico - Principal */}
            <div className="space-y-2">
              <Label>Seleccionar Día</Label>
              <Input
                type="date"
                value={specificDate}
                onChange={(e) => handleSpecificDateChange(e.target.value)}
                placeholder="Seleccionar día específico"
              />
            </div>
            
            {/* Toggle para mostrar filtros de rango */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={toggleRangeFilters}
                className="text-sm text-gray-600 hover:text-gray-900 p-0 h-auto"
              >
                {showRangeFilters ? '▼' : '▶'} Filtrar por rango de fechas
              </Button>
              {(specificDate || dateFilter.startDate || dateFilter.endDate) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar Filtros
                </Button>
              )}
            </div>
            
            {/* Filtros de rango de fechas - Colapsables */}
            {showRangeFilters && (
              <div className="flex gap-4 items-end mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin</Label>
                  <Input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ventas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ventas Registradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="space-y-2">
              <LoadingSkeleton className="h-12 w-full" />
              <LoadingSkeleton className="h-12 w-full" />
              <LoadingSkeleton className="h-12 w-full" />
            </div>
          ) : sales?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay ventas registradas</p>
              {dateFilter.startDate || dateFilter.endDate || specificDate ? (
                <p className="text-sm">Intenta cambiar los filtros de fecha</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              {sales?.map((sale) => {
                // Determinar el estilo según el tipo de venta
                const getBackgroundColor = () => {
                  if (sale.exchange_type === 'anulada_por_cambio') return 'bg-gray-100'
                  if (sale.exchange_type === 'nueva_por_cambio') return 'bg-green-50'
                  return 'bg-white'
                }
                
                const getBorderColor = () => {
                  if (sale.exchange_type === 'anulada_por_cambio') return 'border-gray-300'
                  if (sale.exchange_type === 'nueva_por_cambio') return 'border-green-200'
                  return 'border-gray-200'
                }

                return (
                <div key={sale._id} className={`${getBackgroundColor()} border ${getBorderColor()} rounded-lg p-4 hover:shadow-sm transition-shadow`}>
                  <div className="flex items-center space-x-4">
                    {/* Imagen del producto */}
                    <div className="flex-shrink-0 w-12 h-12">
                      {sale.images && sale.images.length > 0 ? (
                        <div 
                          className="relative w-full h-full cursor-pointer group"
                          onClick={() => handleOpenImage(sale.images[0].url, sale.product_name)}
                        >
                          <img 
                            src={sale.images[0].url} 
                            alt={sale.product_name}
                            className="w-full h-full object-cover rounded-md transition-opacity group-hover:opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-md">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>


                    {/* Para ventas de cambio, mostrar también la imagen del producto original */}
                    {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && sale.original_product_info.length > 0 && (
                      <div className="flex-shrink-0 mr-4">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 cursor-pointer group relative"
                            onClick={() => sale.original_product_info?.[0]?.images?.[0]?.url && 
                              handleOpenImage(sale.original_product_info[0].images[0].url, sale.original_product_info[0].name)}
                          >
                            {sale.original_product_info[0].images && sale.original_product_info[0].images.length > 0 ? (
                              <>
                                <img 
                                  src={sale.original_product_info[0].images[0].url} 
                                  alt={sale.original_product_info[0].name}
                                  className="w-full h-full object-cover rounded-md opacity-70 group-hover:opacity-50 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ZoomIn className="w-2 h-2 text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                                <Package className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <RefreshCw className="w-3 h-3 text-green-600" />
                        </div>
                      </div>
                    )}

                    {/* Para ventas anuladas, mostrar también la imagen del producto nuevo */}
                    {sale.exchange_type === 'anulada_por_cambio' && sale.new_product_info && sale.new_product_info.length > 0 && (
                      <div className="flex-shrink-0 mr-4">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-3 h-3 text-gray-600" />
                          <div 
                            className="w-8 h-8 cursor-pointer group relative"
                            onClick={() => sale.new_product_info?.[0]?.images?.[0]?.url && 
                              handleOpenImage(sale.new_product_info[0].images[0].url, sale.new_product_info[0].name)}
                          >
                            {sale.new_product_info[0].images && sale.new_product_info[0].images.length > 0 ? (
                              <>
                                <img 
                                  src={sale.new_product_info[0].images[0].url} 
                                  alt={sale.new_product_info[0].name}
                                  className="w-full h-full object-cover rounded-md opacity-70 group-hover:opacity-50 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ZoomIn className="w-2 h-2 text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                                <Package className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Información principal del producto */
                    {/* Imagen del producto */}
                    <div className="flex-shrink-0 w-12 h-12 mr-4">
                      {sale.images && sale.images.length > 0 ? (
                        <div 
                          className="relative w-full h-full cursor-pointer group"
                          onClick={() => handleOpenImage(sale.images[0].url, sale.product_name)}
                        >
                          <img 
                            src={sale.images[0].url} 
                            alt={sale.product_name}
                            className="w-full h-full object-cover rounded-md transition-opacity group-hover:opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-md">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                  {/* Para ventas de cambio, mostrar también la imagen del producto original */}
                  {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && sale.original_product_info.length > 0 && (
                    <div className="flex-shrink-0 mr-4">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-8 h-8 cursor-pointer group relative"
                          onClick={() => sale.original_product_info?.[0]?.images?.[0]?.url && 
                            handleOpenImage(sale.original_product_info[0].images[0].url, sale.original_product_info[0].name)}
                        >
                          {sale.original_product_info[0].images && sale.original_product_info[0].images.length > 0 ? (
                            <>
                              <img 
                                src={sale.original_product_info[0].images[0].url} 
                                alt={sale.original_product_info[0].name}
                                className="w-full h-full object-cover rounded-md opacity-70 group-hover:opacity-50 transition-opacity"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn className="w-2 h-2 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                              <Package className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <RefreshCw className="w-3 h-3 text-green-600" />
                      </div>
                    </div>
                  )}

                  {/* Para ventas anuladas, mostrar también la imagen del producto nuevo */}
                  {sale.exchange_type === 'anulada_por_cambio' && sale.new_product_info && sale.new_product_info.length > 0 && (
                    <div className="flex-shrink-0 mr-4">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-3 h-3 text-gray-600" />
                        <div 
                          className="w-8 h-8 cursor-pointer group relative"
                          onClick={() => sale.new_product_info?.[0]?.images?.[0]?.url && 
                            handleOpenImage(sale.new_product_info[0].images[0].url, sale.new_product_info[0].name)}
                        >
                          {sale.new_product_info[0].images && sale.new_product_info[0].images.length > 0 ? (
                            <>
                              <img 
                                src={sale.new_product_info[0].images[0].url} 
                                alt={sale.new_product_info[0].name}
                                className="w-full h-full object-cover rounded-md opacity-70 group-hover:opacity-50 transition-opacity"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn className="w-2 h-2 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                              <Package className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información principal del producto */}
                  <div className="flex-1 min-w-0">
                    {/* Primera línea: Nombre del producto y hora */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className={`text-sm font-medium truncate ${
                          sale.exchange_type === 'anulada_por_cambio' ? 'text-gray-600 line-through' : 'text-gray-900'
                        }`}>
                          {sale.product_name}
                        </h3>
                        
                        {/* Información de cambio - Versión móvil simplificada */}
                        <div className="block sm:hidden mt-1">
                          {sale.exchange_type === 'nueva_por_cambio' && (
                            <span className="text-xs text-green-600 font-medium">Cambio</span>
                          )}
                          {sale.exchange_type === 'anulada_por_cambio' && (
                            <span className="text-xs text-gray-600 font-medium">Anulada</span>
                          )}
                        </div>
                        
                        {/* Información de cambio - Versión desktop completa */}
                        <div className="hidden sm:block">
                          {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && (
                            <span className="text-xs text-green-600 ml-2">
                              (Cambio por {sale.original_product_info[0]?.name})
                            </span>
                          )}
                          {sale.exchange_type === 'anulada_por_cambio' && sale.new_product_info && (
                            <span className="text-xs text-gray-600 ml-2">
                              (Cambiado por {sale.new_product_info[0]?.name})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Hora - Solo desktop */}
                      <div className="hidden sm:block text-xs text-gray-500 font-mono ml-4">
                        {sale.createdAt}
                      </div>
                    </div>

                    {/* Segunda línea: Badges */}
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Talle {sale.size_name}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {sale.dateSell_id?.name || 'N/A'}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {sale.method_payment || 'efectivo'}
                      </Badge>
                      
                      {/* Hora móvil */}
                      <div className="block sm:hidden text-xs text-gray-500 font-mono">
                        {sale.createdAt}
                      </div>
                      
                      {/* Badges de estado - Solo desktop */}
                      <div className="hidden sm:flex gap-1">
                        {sale.exchange_type === 'anulada_por_cambio' && (
                          <Badge variant="destructive" className="text-xs">
                            Venta anulada por cambio
                          </Badge>
                        )}
                        {sale.exchange_type === 'nueva_por_cambio' && (
                          <Badge className="text-xs bg-green-600">
                            Nueva por cambio
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Precios en la parte inferior */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      {/* Desktop: Una línea con todo */}
                      <div className="hidden sm:flex items-center space-x-4">
                        <div className={`text-xs ${
                          sale.exchange_type === 'anulada_por_cambio' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Costo: <span className={`font-medium ${
                            sale.exchange_type === 'anulada_por_cambio' ? 'line-through' : ''
                          }`}>${sale.cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && (
                          <div className="text-xs text-gray-500">
                            Diferencia: <span className="font-medium text-green-600">
                              ${(sale.price - sale.original_product_info[0]?.price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Mobile: Layout vertical más compacto */}
                      <div className="block sm:hidden">
                        <div className="flex items-center justify-between">
                          <div className={`text-xs ${
                            sale.exchange_type === 'anulada_por_cambio' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Costo: <span className={`font-medium ${
                              sale.exchange_type === 'anulada_por_cambio' ? 'line-through' : ''
                            }`}>${sale.cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && (
                            <div className="text-xs text-green-600 font-medium">
                              Dif: +${(sale.price - sale.original_product_info[0]?.price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                        <div className={`text-sm font-medium ${
                          sale.exchange_type === 'anulada_por_cambio' 
                            ? 'text-gray-400 line-through' 
                            : sale.exchange_type === 'nueva_por_cambio'
                            ? 'text-green-600'
                            : 'text-green-600'
                        }`}>
                          ${sale.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {sale.exchange_type !== 'anulada_por_cambio' && (
                            <div className={`text-xs font-medium ${
                              sale.exchange_type === 'nueva_por_cambio' ? 'text-green-600' : 'text-purple-600'
                            }`}>
                              +${(sale.price - sale.cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </div>
                          )}
                          {sale.exchange_type === 'anulada_por_cambio' && (
                            <div className="text-xs text-red-600 font-medium">
                              Anulada
                            </div>
                          )}
                          {sale.exchange_type === 'normal' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenExchange(sale)}
                              className="h-6 px-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
                            >
                              <RefreshCw className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Cambio</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Cambio */}
      <ExchangeDialog 
        sale={selectedSaleForExchange} 
        open={exchangeDialogOpen} 
        setOpen={setExchangeDialogOpen} 
      />

      {/* Modal de Imagen */}
      <ImageModal 
        imageUrl={selectedImage.url}
        altText={selectedImage.alt}
        open={imageModalOpen}
        setOpen={setImageModalOpen}
      />
    </div>
  )
}