'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesService, Sale, SalesStats, CreateSaleDto } from '@/lib/sales'
import { productService } from '@/lib/products'
import { exchangeService, CreateExchangeDto } from '@/lib/exchanges'
import { clientCreditService } from '@/lib/client-credits'
import { CreditSearch } from '@/components/admin/sales/credit-search'
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

function ExchangeDialog({ sale, open, setOpen }: { sale: Sale | null, open: boolean, setOpen: (open: boolean) => void }) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [paymentMethodDiff, setPaymentMethodDiff] = useState('no_aplica')
  const [notes, setNotes] = useState('')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false)
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false)
  const [creditOption, setCreditOption] = useState('create_credit') // 'create_credit', 'additional_product', 'cash_return'
  const [clientDocument, setClientDocument] = useState('')
  const [clientName, setClientName] = useState('')
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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (categoryDropdownOpen && !target.closest('.category-dropdown')) {
        setCategoryDropdownOpen(false)
      }
      if (sizeDropdownOpen && !target.closest('.size-dropdown')) {
        setSizeDropdownOpen(false)
      }
      if (paymentDropdownOpen && !target.closest('.payment-dropdown')) {
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
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] })
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
    setCreditOption('create_credit')
    setClientDocument('')
    setClientName('')
  }

  const handleCreateExchange = () => {
    if (!sale || !selectedProduct || !selectedSize) return

    const selectedProductData = products.find(p => p._id === selectedProduct)
    const priceDifference = selectedProductData ? selectedProductData.price - sale.price : 0

    // Validaciones para crédito
    if (priceDifference < 0 && creditOption === 'create_credit' && !clientDocument.trim()) {
      alert('Debe ingresar el documento del cliente para crear el crédito')
      return
    }

    const exchangeData: any = {
      original_sell_id: sale._id,
      new_product_id: selectedProduct,
      new_size_id: selectedSize
    }

    // Solo agregar campos con valores válidos
    if (notes?.trim()) {
      exchangeData.notes = notes
    }

    if (priceDifference > 0) {
      exchangeData.payment_method_difference = paymentMethodDiff !== 'no_aplica' ? paymentMethodDiff : 'efectivo'
    } else if (priceDifference < 0) {
      // Para créditos, usar 'no_aplica' como método de pago
      exchangeData.payment_method_difference = 'no_aplica'
    }

    if (priceDifference < 0) {
      exchangeData.credit_action = creditOption
      
      if (creditOption === 'create_credit' && clientDocument?.trim()) {
        exchangeData.client_document = clientDocument
        if (clientName?.trim()) {
          exchangeData.client_name = clientName
        }
      }
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
                  <p className="text-sm text-gray-600">
                    Talle: {sale.size_name}
                    {sale.size_change_info && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Cambio: {sale.size_change_info.original_size} → {sale.size_change_info.new_size}
                      </span>
                    )}
                  </p>
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

                {/* Si cliente debe pagar (producto más caro) */}
                {priceDifference > 0 && (
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
                          {['efectivo', 'transferencia', 'qr', 'tarjeta'].map((method) => (
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
                                <span>{method}</span>
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

                {/* Si es a favor del cliente (producto más barato) */}
                {priceDifference < 0 && (
                  <div className="mt-3 space-y-4">
                    <Label className="text-green-700">¿Qué hacer con la diferencia a favor del cliente?</Label>
                    
                    <div className="space-y-3">
                      {/* Opción 1: Crear crédito */}
                      <div 
                        onClick={() => setCreditOption('create_credit')}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          creditOption === 'create_credit' ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            creditOption === 'create_credit' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}>
                            {creditOption === 'create_credit' && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Guardar como crédito</p>
                            <p className="text-sm text-gray-600">El cliente podrá usar este crédito en futuras compras</p>
                          </div>
                        </div>
                      </div>

                      {/* Opción 2: Producto adicional */}
                      <div 
                        onClick={() => setCreditOption('additional_product')}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          creditOption === 'additional_product' ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            creditOption === 'additional_product' ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {creditOption === 'additional_product' && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Elegir producto adicional</p>
                            <p className="text-sm text-gray-600">Usar la diferencia para comprar otro producto</p>
                          </div>
                        </div>
                      </div>

                      {/* Opción 3: Devolver dinero */}
                      <div 
                        onClick={() => setCreditOption('cash_return')}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          creditOption === 'cash_return' ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            creditOption === 'cash_return' ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                          }`}>
                            {creditOption === 'cash_return' && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Devolver dinero</p>
                            <p className="text-sm text-gray-600">Devolver la diferencia en efectivo (última opción)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Campos para crear crédito */}
                    {creditOption === 'create_credit' && (
                      <div className="p-4 bg-green-50 rounded-lg space-y-3">
                        <div>
                          <Label htmlFor="client-document">Documento del cliente *</Label>
                          <Input
                            id="client-document"
                            value={clientDocument}
                            onChange={(e) => setClientDocument(e.target.value)}
                            placeholder="DNI o CUIL del cliente"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="client-name">Nombre del cliente (opcional)</Label>
                          <Input
                            id="client-name"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Nombre completo del cliente"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
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
            disabled={
              !selectedProduct || 
              !selectedSize || 
              createExchangeMutation.isPending ||
              (priceDifference < 0 && creditOption === 'create_credit' && !clientDocument.trim())
            }
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

function MassiveExchangeDialog({ transaction, open, setOpen }: { 
  transaction: any | null, 
  open: boolean, 
  setOpen: (open: boolean) => void 
}) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [newProducts, setNewProducts] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [notes, setNotes] = useState('')
  const [creditOption, setCreditOption] = useState('create_credit')
  const [clientDocument, setClientDocument] = useState('')
  const [clientName, setClientName] = useState('')
  const queryClient = useQueryClient()

  // Obtener categorías
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => import('@/lib/categories').then(module => module.categoryService.getAll()),
  })

  // Obtener productos filtrados por categoría
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-massive-exchange', selectedCategory],
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

  const resetForm = () => {
    setSelectedProducts([])
    setNewProducts([])
    setSelectedCategory('')
    setSelectedProduct('')
    setSelectedSize('')
    setNotes('')
    setCreditOption('create_credit')
    setClientDocument('')
    setClientName('')
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const toggleProductSelection = (saleId: string) => {
    setSelectedProducts(prev => 
      prev.includes(saleId) 
        ? prev.filter(id => id !== saleId)
        : [...prev, saleId]
    )
  }

  const addNewProduct = () => {
    if (!selectedProduct || !selectedSize) return

    const product = products.find(p => p._id === selectedProduct)
    const sizeData = availableSizes.find(s => s.size_id === selectedSize)
    
    if (!product || !sizeData) return

    const newProduct = {
      id: `new-${Date.now()}`,
      product_id: selectedProduct,
      product_name: product.name,
      size_id: selectedSize,
      size_name: sizeData.size_name,
      price: product.price,
      cost: product.cost,
      images: product.images || []
    }

    setNewProducts(prev => [...prev, newProduct])
    setSelectedProduct('')
    setSelectedSize('')
  }

  const removeNewProduct = (id: string) => {
    setNewProducts(prev => prev.filter(p => p.id !== id))
  }

  const massiveExchangeMutation = useMutation({
    mutationFn: async (exchangeData: any) => {
      return await exchangeService.createMassiveExchange(exchangeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] })
      queryClient.invalidateQueries({ queryKey: ['exchanges'] })
      setOpen(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Massive exchange creation failed:', error)
    }
  })

  const handleMassiveExchange = () => {
    if (selectedProducts.length === 0 || newProducts.length === 0) return

    const exchangeData = {
      original_sales: selectedProducts.map(saleId => ({ sale_id: saleId })),
      new_products: newProducts.map(product => ({
        product_id: product.product_id,
        product_name: product.product_name,
        size_id: product.size_id,
        size_name: product.size_name,
        method_payment: transaction.sales[0]?.method_payment || 'efectivo'
      })),
      notes: notes || undefined,
      credit_action: priceDifference < 0 ? creditOption : undefined,
      client_document: priceDifference < 0 && creditOption === 'create_credit' ? clientDocument : undefined,
      client_name: priceDifference < 0 && creditOption === 'create_credit' ? clientName : undefined,
      payment_method_difference: priceDifference > 0 ? (transaction.sales[0]?.method_payment || 'efectivo') : 'no_aplica'
    }

    massiveExchangeMutation.mutate(exchangeData)
  }

  if (!transaction) return null

  const selectedSales = transaction.sales.filter(sale => selectedProducts.includes(sale._id))
  const originalTotal = selectedSales.reduce((sum, sale) => sum + sale.price, 0)
  const newTotal = newProducts.reduce((sum, product) => sum + product.price, 0)
  const priceDifference = newTotal - originalTotal

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Cambio Masivo de Transacción</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Productos Originales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Productos a Cambiar</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transaction.sales.map((sale) => (
                <div 
                  key={sale._id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProducts.includes(sale._id) 
                      ? 'bg-orange-50 border-orange-300' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleProductSelection(sale._id)}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(sale._id)}
                      onChange={() => toggleProductSelection(sale._id)}
                      className="w-4 h-4 text-orange-600"
                    />
                    {sale.images && sale.images.length > 0 && (
                      <img 
                        src={sale.images[0].url} 
                        alt={sale.product_name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{sale.product_name}</p>
                      <p className="text-xs text-gray-600">Talle: {sale.size_name}</p>
                      <p className="text-sm font-medium text-green-600">${sale.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agregar Nuevos Productos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Nuevos Productos</h3>
            
            {/* Selector de productos similar al de ventas */}
            <div className="space-y-2">
              <Label>Categoría</Label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSelectedProduct('')
                  setSelectedSize('')
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Seleccionar categoría...</option>
                {categories?.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && (
              <div className="space-y-2">
                <Label>Producto</Label>
                {productsLoading ? (
                  <div className="p-3 text-center text-gray-500">Cargando productos...</div>
                ) : products.length === 0 ? (
                  <div className="p-3 text-center text-gray-500">No hay productos con stock</div>
                ) : (
                  <div className="max-h-32 overflow-y-auto border rounded-lg">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => {
                          setSelectedProduct(product._id)
                          setSelectedSize('')
                        }}
                        className={`flex items-center space-x-3 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedProduct === product._id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-b border-gray-100 last:border-b-0'
                        }`}
                      >
                        {product.images && product.images.length > 0 && (
                          <img 
                            src={product.images[0].url} 
                            alt={product.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-xs">{product.name}</p>
                          <p className="text-xs text-green-600 font-medium">${product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedProduct && (
              <div className="space-y-2">
                <Label>Talle</Label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Seleccionar talle...</option>
                  {availableSizes.map((size) => (
                    <option key={size.size_id} value={size.size_id}>
                      {size.size_name} (Stock: {size.quantity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              onClick={addNewProduct}
              disabled={!selectedProduct || !selectedSize}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>

            {/* Lista de nuevos productos */}
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {newProducts.map((product) => (
                <div key={product.id} className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                  {product.images && product.images.length > 0 && (
                    <img 
                      src={product.images[0].url} 
                      alt={product.product_name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-xs">{product.product_name}</p>
                    <p className="text-xs text-gray-600">Talle: {product.size_name}</p>
                    <p className="text-xs text-green-600 font-medium">${product.price}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNewProduct(product.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen del Cambio */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resumen del Cambio</h3>
            
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Productos seleccionados:</span> {selectedSales.length}</p>
                <p><span className="font-medium">Valor original:</span> ${originalTotal.toLocaleString('es-AR')}</p>
                <p><span className="font-medium">Nuevos productos:</span> {newProducts.length}</p>
                <p><span className="font-medium">Valor nuevo:</span> ${newTotal.toLocaleString('es-AR')}</p>
                <p className={`font-bold ${priceDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <span className="font-medium">Diferencia:</span> ${Math.abs(priceDifference).toLocaleString('es-AR')}
                  {priceDifference > 0 && ' (Cliente debe pagar)'}
                  {priceDifference < 0 && ' (A favor del cliente)'}
                  {priceDifference === 0 && ' (Sin diferencia)'}
                </p>
              </div>
            </div>

            {/* Opciones para diferencia negativa */}
            {priceDifference < 0 && (
              <div className="space-y-4">
                <Label className="text-green-700">¿Qué hacer con la diferencia a favor del cliente?</Label>
                
                <div className="space-y-3">
                  <div 
                    onClick={() => setCreditOption('create_credit')}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      creditOption === 'create_credit' ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        creditOption === 'create_credit' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {creditOption === 'create_credit' && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Guardar como crédito</p>
                        <p className="text-sm text-gray-600">El cliente podrá usar este crédito en futuras compras</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setCreditOption('cash_return')}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      creditOption === 'cash_return' ? 'bg-orange-50 border-orange-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        creditOption === 'cash_return' ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                      }`}>
                        {creditOption === 'cash_return' && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Devolver dinero</p>
                        <p className="text-sm text-gray-600">Devolver la diferencia en efectivo</p>
                      </div>
                    </div>
                  </div>
                </div>

                {creditOption === 'create_credit' && (
                  <div className="p-4 bg-green-50 rounded-lg space-y-3">
                    <div>
                      <Label htmlFor="client-document-massive">Documento del cliente *</Label>
                      <Input
                        id="client-document-massive"
                        value={clientDocument}
                        onChange={(e) => setClientDocument(e.target.value)}
                        placeholder="DNI o CUIL del cliente"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client-name-massive">Nombre del cliente (opcional)</Label>
                      <Input
                        id="client-name-massive"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Nombre completo del cliente"
                        className="mt-1"
                      />
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
            onClick={handleMassiveExchange}
            disabled={
              selectedProducts.length === 0 || 
              newProducts.length === 0 || 
              massiveExchangeMutation.isPending ||
              (priceDifference < 0 && creditOption === 'create_credit' && !clientDocument.trim())
            }
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {massiveExchangeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              'Procesar Cambio Masivo'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RegisterSaleDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<any[]>([])
  const [methodPayment, setMethodPayment] = useState('efectivo')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false)
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false)
  const [appliedCredits, setAppliedCredits] = useState(0)
  const [clientDocument, setClientDocument] = useState('')
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
    const handleClickOutside = (event: any) => {
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
    setAppliedCredits(0)
    setClientDocument('')
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const addToCart = () => {
    if (!selectedProduct || !selectedSize) return

    const product = products.find(p => p._id === selectedProduct)
    const sizeData = availableSizes.find(s => s.size_id === selectedSize)
    
    if (!product || !sizeData) return

    const cartItem = {
      product_id: selectedProduct,
      product_name: product.name,
      size_id: selectedSize,
      size_name: sizeData.size_name,
      price: product.price,
      cost: product.cost,
      quantity: quantity,
      images: product.images || []
    }

    setCart(prev => [...prev, cartItem])
    setSelectedProduct('')
    setSelectedSize('')
    setQuantity(1)
  }

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const registerSaleMutation = useMutation({
    mutationFn: async (salesData: any[]) => {
      const promises = salesData.map(sale => salesService.registerSale(sale))
      const results = await Promise.all(promises)
      
      // If there are applied credits, use them
      if (appliedCredits > 0 && clientDocument && results.length > 0) {
        const totalUsed = Math.min(appliedCredits, totalSales)
        await clientCreditService.useCredits({
          documentNumber: clientDocument,
          amount: totalUsed,
          saleId: results[0]._id // Use the first sale ID as reference
        })
      }
      
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] })
      setOpen(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Sale registration failed:', error)
    }
  })

  const handleRegisterSales = () => {
    if (cart.length === 0) return

    // Expandir cada item según su cantidad
    const expandedCart = cart.flatMap(item => 
      Array(item.quantity).fill(null).map(() => ({
        product_id: item.product_id,
        product_name: item.product_name,
        size_id: item.size_id,
        size_name: item.size_name,
        price: item.price,
        cost: item.cost,
        images: item.images
      }))
    )

    // Generar un transaction_id único para agrupar las ventas
    const transactionId = expandedCart.length > 1 
      ? `TRX-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
      : null

    const salesData = expandedCart.map(item => ({
      ...item,
      method_payment: methodPayment,
      transaction_id: transactionId
    }))

    registerSaleMutation.mutate(salesData)
  }

  const totalSales = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const finalTotal = Math.max(0, totalSales - appliedCredits)

  const handleCreditsFound = (totalCredits: number, document: string) => {
    const creditsToApply = Math.min(totalCredits, totalSales)
    setAppliedCredits(creditsToApply)
    setClientDocument(document)
  }

  const handleClearCredits = () => {
    setAppliedCredits(0)
    setClientDocument('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Registrar Venta</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selección de Producto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Agregar Producto</h3>
            
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

            {selectedSize && (
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={quantity === 0 ? '' : quantity}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setQuantity(0)
                    } else {
                      const num = parseInt(value)
                      const maxStock = availableSizes.find(s => s.size_id === selectedSize)?.quantity || 1
                      setQuantity(Math.min(Math.max(1, num || 1), maxStock))
                    }
                  }}
                  onBlur={() => {
                    if (quantity === 0) {
                      setQuantity(1)
                    }
                  }}
                  min={1}
                  max={availableSizes.find(s => s.size_id === selectedSize)?.quantity || 1}
                  placeholder="1"
                />
              </div>
            )}

            <Button
              onClick={addToCart}
              disabled={!selectedProduct || !selectedSize || quantity === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar al Carrito
            </Button>
          </div>

          {/* Carrito */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Carrito de Venta</h3>
            
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay productos en el carrito</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
                      <p className="text-sm text-green-600 font-medium">${item.price}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className="border-t pt-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="text-lg font-semibold">${totalSales.toLocaleString('es-AR')}</span>
                    </div>
                    {appliedCredits > 0 && (
                      <div className="flex justify-between items-center text-blue-600">
                        <span>Créditos aplicados:</span>
                        <span>-${appliedCredits.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-bold">Total a pagar:</span>
                      <span className="text-xl font-bold text-green-600">${finalTotal.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Método de Pago</Label>
                    <div className="relative payment-dropdown">
                      <button
                        type="button"
                        onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="text-gray-900 capitalize">{methodPayment}</span>
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
                                methodPayment === method ? 'bg-green-50 text-green-700' : 'text-gray-900'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{method}</span>
                                {methodPayment === method && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Credit Search */}
        {cart.length > 0 && (
          <CreditSearch
            onCreditsFound={handleCreditsFound}
            selectedCredits={appliedCredits}
            onClearCredits={handleClearCredits}
          />
        )}

        <div className="flex gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleRegisterSales}
            disabled={cart.length === 0 || registerSaleMutation.isPending}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {registerSaleMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              `Registrar Venta (${cart.length} producto${cart.length !== 1 ? 's' : ''})`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]} flex-shrink-0`} />
      </CardHeader>
      <CardContent className="pt-1 pb-3">
        {isLoading ? (
          <>
            <LoadingSkeleton className="h-6 w-16 mb-1" />
            <LoadingSkeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <div className="text-xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function VentasPage() {
  // Configurar filtro por defecto al día actual
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' })
  const [specificDate, setSpecificDate] = useState(getTodayDate())
  const [showRangeFilters, setShowRangeFilters] = useState(false)
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false)
  const [selectedSaleForExchange, setSelectedSaleForExchange] = useState<Sale | null>(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState({ url: '', alt: '' })
  const [registerSaleOpen, setRegisterSaleOpen] = useState(false)
  const [massiveExchangeDialogOpen, setMassiveExchangeDialogOpen] = useState(false)
  const [selectedTransactionForExchange, setSelectedTransactionForExchange] = useState<any>(null)

  // Obtener datos de ventas
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', dateFilter.startDate, dateFilter.endDate, specificDate],
    queryFn: () => salesService.getSales(
      specificDate || dateFilter.startDate, 
      specificDate || dateFilter.endDate
    ),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: true,
  })

  // Obtener estadísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['sales-stats', dateFilter.startDate, dateFilter.endDate, specificDate],
    queryFn: () => salesService.getSalesStats(
      specificDate || dateFilter.startDate, 
      specificDate || dateFilter.endDate
    ),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: true,
  })

  // Memoizar cálculos pesados y agrupar por transacción
  const salesData = useMemo(() => {
    if (!sales) return []
    
    // Agrupar ventas por transaction_id y ventas individuales
    const grouped = []
    const processed = new Set()
    
    sales.forEach(sale => {
      if (processed.has(sale._id)) return
      
      if (sale.transaction_id) {
        // Buscar todas las ventas con el mismo transaction_id
        const transactionSales = sales.filter(s => s.transaction_id === sale.transaction_id)
        grouped.push({
          type: 'transaction',
          transaction_id: sale.transaction_id,
          sales: transactionSales,
          total_amount: transactionSales.reduce((sum, s) => sum + s.price, 0),
          total_cost: transactionSales.reduce((sum, s) => sum + s.cost, 0),
          method_payment: sale.method_payment,
          dateSell_id: sale.dateSell_id,
          createdAt: sale.createdAt
        })
        // Marcar todas las ventas de esta transacción como procesadas
        transactionSales.forEach(s => processed.add(s._id))
      } else {
        // Venta individual
        grouped.push({
          type: 'individual',
          sale: sale
        })
        processed.add(sale._id)
      }
    })
    
    return grouped
  }, [sales])

  const statsData = useMemo(() => {
    if (!stats) return {
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
      averageSaleValue: 0
    }
    return stats
  }, [stats])

  const handleOpenExchange = (sale: Sale) => {
    setSelectedSaleForExchange(sale)
    setExchangeDialogOpen(true)
  }

  const handleOpenMassiveExchange = (transaction: any) => {
    setSelectedTransactionForExchange(transaction)
    setMassiveExchangeDialogOpen(true)
  }

  const handleOpenImage = (imageUrl: string, altText: string) => {
    setSelectedImage({ url: imageUrl, alt: altText })
    setImageModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* Desktop */}
          <h1 className="hidden sm:block text-3xl font-bold">Gestión de Ventas</h1>
          {/* Mobile */}
          <h1 className="block sm:hidden text-2xl font-bold">Ventas</h1>
          
          {/* Mostrar fechas activas como subtítulo */}
          {(specificDate || dateFilter.startDate || dateFilter.endDate) && (
            <div className="text-sm text-gray-600 mt-1">
              {specificDate ? (
                `Fecha: ${new Date(specificDate + 'T12:00:00').toLocaleDateString('es-AR')}`
              ) : (
                `${dateFilter.startDate ? new Date(dateFilter.startDate + 'T12:00:00').toLocaleDateString('es-AR') : 'Inicio'} - ${dateFilter.endDate ? new Date(dateFilter.endDate + 'T12:00:00').toLocaleDateString('es-AR') : 'Fin'}`
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setRegisterSaleOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Venta
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SaleMetricCard
          title="Total Ventas"
          value={statsData.totalSales.toString()}
          description="Ventas registradas"
          icon={ShoppingCart}
          isLoading={statsLoading}
          color="blue"
        />
        <SaleMetricCard
          title="Ingresos"
          value={`$${statsData.totalRevenue.toLocaleString('es-AR')}`}
          description="Ingresos totales"
          icon={DollarSign}
          isLoading={statsLoading}
          color="green"
        />
        <SaleMetricCard
          title="Ganancia"
          value={`$${statsData.totalProfit.toLocaleString('es-AR')}`}
          description="Ganancia neta"
          icon={TrendingUp}
          isLoading={statsLoading}
          color="purple"
        />
      </div>

      {/* Métricas por Método de Pago */}
      {stats?.paymentMethodBreakdown && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ventas por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600">Efectivo</span>
                  <span className="text-xs text-gray-500">💵</span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {stats.paymentMethodBreakdown.efectivo.count}
                </p>
                <p className="text-sm text-gray-500">
                  ${stats.paymentMethodBreakdown.efectivo.total.toLocaleString('es-AR')}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600">Transferencia</span>
                  <span className="text-xs text-gray-500">💳</span>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {stats.paymentMethodBreakdown.transferencia.count}
                </p>
                <p className="text-sm text-gray-500">
                  ${stats.paymentMethodBreakdown.transferencia.total.toLocaleString('es-AR')}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600">Tarjeta</span>
                  <span className="text-xs text-gray-500">💳</span>
                </div>
                <p className="text-xl font-bold text-purple-600">
                  {stats.paymentMethodBreakdown.tarjeta.count}
                </p>
                <p className="text-sm text-gray-500">
                  ${stats.paymentMethodBreakdown.tarjeta.total.toLocaleString('es-AR')}
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600">QR</span>
                  <span className="text-xs text-gray-500">📱</span>
                </div>
                <p className="text-xl font-bold text-orange-600">
                  {stats.paymentMethodBreakdown.qr.count}
                </p>
                <p className="text-sm text-gray-500">
                  ${stats.paymentMethodBreakdown.qr.total.toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle 
            className="flex items-center justify-between cursor-pointer text-sm"
            onClick={() => setShowRangeFilters(!showRangeFilters)}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros de Fecha
            </div>
            <div className="text-sm text-gray-500">
              {showRangeFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-1 pb-3">
          <div>
            <Label className="text-xs">Día Específico</Label>
            <Input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="h-8 mt-1"
            />
          </div>
          
          {showRangeFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t">
              <div>
                <Label className="text-xs">Fecha Inicio</Label>
                <Input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Fecha Fin</Label>
                <Input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="h-8 mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="space-y-2">
              <LoadingSkeleton className="h-12 w-full" />
              <LoadingSkeleton className="h-12 w-full" />
              <LoadingSkeleton className="h-12 w-full" />
            </div>
          ) : salesData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay ventas registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {salesData.map((item, index) => {
                if (item.type === 'transaction') {
                  // Renderizar transacción agrupada
                  return (
                    <div key={`transaction-${item.transaction_id}`} className="border-2 border-purple-300 rounded-lg bg-purple-50 overflow-hidden shadow-sm">
                      {/* Header de la transacción */}
                      <div className="bg-purple-100 px-4 py-2 border-b border-purple-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-purple-600 text-white text-xs">
                              📦 Venta Múltiple
                            </Badge>
                            <span className="text-sm text-purple-700 font-medium">
                              {item.sales.length} productos vendidos juntos
                            </span>
                            <span className="text-xs text-purple-600 font-mono">
                              {item.createdAt && item.createdAt.includes(':') && item.createdAt.length <= 5 
                                ? item.createdAt
                                : item.createdAt 
                                  ? (() => {
                                      const date = new Date(item.createdAt);
                                      const hours = date.getUTCHours().toString().padStart(2, '0');
                                      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                                      return `${hours}:${minutes}`;
                                    })()
                                  : 'N/A'
                              }
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenMassiveExchange(item)}
                              className="bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200 text-xs"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Cambio Masivo
                            </Button>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                ${item.total_amount.toLocaleString('es-AR')}
                              </div>
                              <div className="text-xs text-purple-600">
                                +${(item.total_amount - item.total_cost).toLocaleString('es-AR')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Lista de productos en la transacción */}
                      <div className="divide-y divide-purple-200">
                        {(() => {
                          // Solo agrupar productos que NO hayan sido cambiados
                          const groupedByProduct = {}
                          const exchangedSales = []
                          
                          item.sales.forEach(sale => {
                            // Si fue cambiado o anulado, mostrar individualmente
                            if (sale.exchange_type === 'anulada_por_cambio' || sale.exchange_type === 'cambiado') {
                              exchangedSales.push({...sale, quantity: 1})
                            } else {
                              // Solo agrupar productos normales o nuevos
                              const key = `${sale.product_name}-${sale.size_name}-${sale.exchange_type}`
                              if (!groupedByProduct[key]) {
                                groupedByProduct[key] = {
                                  ...sale,
                                  quantity: 0
                                }
                              }
                              groupedByProduct[key].quantity += 1
                            }
                          })
                          
                          // Combinar productos agrupados y individuales
                          const allProducts = [...Object.values(groupedByProduct), ...exchangedSales]
                          
                          return allProducts.map((sale, index) => {
                          const getBackgroundColor = () => {
                            if (sale.exchange_type === 'anulada_por_cambio') return 'bg-red-50'
                            if (sale.exchange_type === 'nueva_por_cambio') return 'bg-green-50'
                            if (sale.exchange_type === 'cambiado') return 'bg-orange-50'
                            return 'bg-purple-50'
                          }
                          
                          return (
                            <div key={`${sale._id}-${index}`} className={`${getBackgroundColor()} p-3 hover:bg-purple-100 transition-colors`}>
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 w-10 h-10">
                                  {sale.images && sale.images.length > 0 ? (
                                    <img 
                                      src={sale.images[0].url} 
                                      alt={sale.product_name}
                                      className="w-full h-full object-cover rounded-md cursor-pointer"
                                      onClick={() => handleOpenImage(sale.images[0].url, sale.product_name)}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                                      <Package className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {sale.product_name}
                                    {sale.exchange_type === 'cambiado' && (
                                      <Badge className="ml-2 bg-orange-100 text-orange-700 text-xs">
                                        🔄 Cambiado
                                      </Badge>
                                    )}
                                    {sale.exchange_type === 'anulada_por_cambio' && (
                                      <Badge className="ml-2 bg-red-100 text-red-700 text-xs">
                                        ❌ Anulado
                                      </Badge>
                                    )}
                                    {sale.exchange_type === 'nueva_por_cambio' && (
                                      <Badge className="ml-2 bg-green-100 text-green-700 text-xs">
                                        ✅ Nuevo
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Talle {sale.size_name} 
                                    {sale.quantity > 1 && (
                                      <span className="ml-1 text-purple-600 font-medium">
                                        (x{sale.quantity})
                                      </span>
                                    )}
                                  </div>
                                  {/* Información del cambio */}
                                  {sale.exchange_type === 'cambiado' && sale.original_product_info && (
                                    <div className="text-xs text-orange-600 mt-1">
                                      Original: {sale.original_product_info[0]?.name} Talle {sale.original_product_info[0]?.size_name}
                                    </div>
                                  )}
                                  {sale.exchange_type === 'anulada_por_cambio' && sale.new_product_info && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      Cambiado por: {sale.new_product_info[0]?.name} Talle {sale.new_product_info[0]?.size_name}
                                    </div>
                                  )}
                                  {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && (
                                    <div className="text-xs text-green-600 mt-1">
                                      Intercambio de: {sale.original_product_info[0]?.name} Talle {sale.original_product_info[0]?.size_name}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-green-600">
                                    ${(sale.price * sale.quantity).toLocaleString('es-AR')}
                                    {sale.quantity > 1 && (
                                      <div className="text-xs text-gray-500">
                                        ${sale.price.toLocaleString('es-AR')} c/u
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Costo: ${(sale.cost * sale.quantity).toLocaleString('es-AR')}
                                  </div>
                                </div>
                                {(sale.exchange_type === 'normal' || sale.exchange_type === 'nueva_por_cambio') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenExchange(sale)}
                                    className="h-6 px-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                          })
                        })()}
                      </div>
                    </div>
                  )
                }
                
                // Renderizar venta individual (código existente)
                const sale = item.sale
                // Determinar el fondo según el tipo de venta
                const getBackgroundColor = () => {
                  if (sale.exchange_type === 'anulada_por_cambio') return 'bg-red-50'
                  if (sale.exchange_type === 'nueva_por_cambio') return 'bg-green-50'
                  if (sale.exchange_type === 'cambiado') return 'bg-orange-50'
                  return 'bg-white'
                }
                
                const getBorderColor = () => {
                  if (sale.exchange_type === 'anulada_por_cambio') return 'border-red-200'
                  if (sale.exchange_type === 'nueva_por_cambio') return 'border-green-200'
                  if (sale.exchange_type === 'cambiado') return 'border-orange-200'
                  return 'border-gray-200'
                }

                return (
                <div key={sale._id} className={`${getBackgroundColor()} border ${getBorderColor()} rounded-lg hover:shadow-sm transition-shadow`}>
                  
                  {/* Layout Mobile */}
                  <div className="block sm:hidden p-3">
                    <div className="space-y-3">
                      {/* Fila 1: Título y hora */}
                      <div className="flex items-start justify-between">
                        <h3 className={`text-sm font-medium flex-1 ${
                          sale.exchange_type === 'anulada_por_cambio' ? 'text-gray-600 line-through' : 'text-gray-900'
                        }`}>
                          {sale.product_name}
                        </h3>
                        <div className="text-xs text-gray-500 font-mono ml-2">
                          {sale.createdAt && sale.createdAt.includes(':') && sale.createdAt.length <= 5 
                            ? sale.createdAt  // Formato antiguo HH:MM
                            : sale.createdAt 
                              ? (() => {
                                  const date = new Date(sale.createdAt);
                                  // Mostrar la hora tal como está en la base de datos
                                  const hours = date.getUTCHours().toString().padStart(2, '0');
                                  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                                  return `${hours}:${minutes}`;
                                })()
                              : 'N/A'
                          }
                        </div>
                      </div>

                      {/* Fila 2: Información de cambio si aplica */}
                      {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && (
                        <div className="text-xs text-green-600">
                          ✅ Intercambio de: {sale.original_product_info[0]?.name} Talle {sale.original_product_info[0]?.size_name}
                        </div>
                      )}
                      {sale.exchange_type === 'anulada_por_cambio' && sale.new_product_info && (
                        <div className="text-xs text-gray-600">
                          ❌ Cambiado por: {sale.new_product_info[0]?.name} Talle {sale.new_product_info[0]?.size_name}
                        </div>
                      )}

                      {/* Fila 3: Imágenes */}
                      <div className="flex items-center space-x-3">
                        {/* Layout normal - imagen única */}
                        {sale.exchange_type === 'normal' && (
                          <div className="flex-shrink-0 w-16 h-16">
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
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Layout para cambios - dos imágenes pequeñas */}
                        {(sale.exchange_type === 'nueva_por_cambio' || sale.exchange_type === 'anulada_por_cambio') && (
                          <div className="flex items-center space-x-2">
                            {/* Primera imagen */}
                            <div className="flex-shrink-0 w-12 h-12">
                              {sale.images && sale.images.length > 0 ? (
                                <div 
                                  className="relative w-full h-full cursor-pointer group"
                                  onClick={() => handleOpenImage(sale.images[0].url, sale.product_name)}
                                >
                                  <img 
                                    src={sale.images[0].url} 
                                    alt={sale.product_name}
                                    className="w-full h-full object-cover rounded-md border border-gray-300"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-md">
                                    <ZoomIn className="w-3 h-3 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center border border-gray-300">
                                  <Package className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Icono de cambio */}
                            <RefreshCw className={`w-4 h-4 ${
                              sale.exchange_type === 'nueva_por_cambio' ? 'text-green-600' : 'text-gray-600'
                            }`} />

                            {/* Segunda imagen */}
                            <div className="flex-shrink-0 w-12 h-12">
                              {/* Para nueva por cambio: mostrar producto original */}
                              {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && sale.original_product_info.length > 0 && (
                                <div 
                                  className="relative w-full h-full cursor-pointer group"
                                  onClick={() => sale.original_product_info?.[0]?.images?.[0]?.url && 
                                    handleOpenImage(sale.original_product_info[0].images[0].url, sale.original_product_info[0].name)}
                                >
                                  {sale.original_product_info[0].images && sale.original_product_info[0].images.length > 0 ? (
                                    <>
                                      <img 
                                        src={sale.original_product_info[0].images[0].url} 
                                        alt={sale.original_product_info[0].name}
                                        className="w-full h-full object-cover rounded-md border border-gray-300"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-md">
                                        <ZoomIn className="w-3 h-3 text-white" />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center border border-gray-300">
                                      <Package className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Para anulada por cambio: mostrar producto nuevo */}
                              {sale.exchange_type === 'anulada_por_cambio' && sale.new_product_info && sale.new_product_info.length > 0 && (
                                <div 
                                  className="relative w-full h-full cursor-pointer group"
                                  onClick={() => sale.new_product_info?.[0]?.images?.[0]?.url && 
                                    handleOpenImage(sale.new_product_info[0].images[0].url, sale.new_product_info[0].name)}
                                >
                                  {sale.new_product_info[0].images && sale.new_product_info[0].images.length > 0 ? (
                                    <>
                                      <img 
                                        src={sale.new_product_info[0].images[0].url} 
                                        alt={sale.new_product_info[0].name}
                                        className="w-full h-full object-cover rounded-md border border-gray-300"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-md">
                                        <ZoomIn className="w-3 h-3 text-white" />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center border border-gray-300">
                                      <Package className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Fila 4: Badges */}
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          Talle {sale.size_name}
                          {sale.size_change_info && (
                            <span className="ml-1 text-blue-600">
                              ({sale.size_change_info.original_size} → {sale.size_change_info.new_size})
                            </span>
                          )}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {sale.dateSell_id?.name || 'N/A'}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {sale.method_payment || 'efectivo'}
                        </Badge>
                        
                        {sale.exchange_type === 'anulada_por_cambio' && (
                          <Badge variant="destructive" className="text-xs">
                            Venta anulada
                          </Badge>
                        )}
                        {sale.exchange_type === 'nueva_por_cambio' && (
                          <Badge className="text-xs bg-green-600">
                            Nueva por cambio
                          </Badge>
                        )}
                        {sale.exchange_count > 0 && sale.exchange_type !== 'anulada_por_cambio' && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Cambios: {sale.exchange_count}
                          </Badge>
                        )}
                        {sale.transaction_id && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 font-mono">
                            {sale.transaction_id.substring(0, 12)}...
                          </Badge>
                        )}
                      </div>

                      {/* Fila 5: Precios */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className={`text-xs ${
                            sale.exchange_type === 'anulada_por_cambio' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Costo: <span className={`font-medium ${
                              sale.exchange_type === 'anulada_por_cambio' ? 'line-through' : ''
                            }`}>${sale.cost.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</span>
                          </div>
                          {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && (
                            <div className="text-xs text-green-600 font-medium">
                              Diferencia: +${(sale.price - sale.original_product_info[0]?.price || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className={`text-lg font-bold ${
                            sale.exchange_type === 'anulada_por_cambio' 
                              ? 'text-gray-400 line-through' 
                              : sale.exchange_type === 'nueva_por_cambio'
                              ? 'text-green-600'
                              : 'text-green-600'
                          }`}>
                            ${sale.price.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {sale.exchange_type !== 'anulada_por_cambio' && (
                              <div className={`text-sm font-medium ${
                                sale.exchange_type === 'nueva_por_cambio' ? 'text-green-600' : 'text-purple-600'
                              }`}>
                                +${(sale.price - sale.cost).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                              </div>
                            )}
                            {sale.exchange_type === 'anulada_por_cambio' && (
                              <div className="text-sm text-red-600 font-medium">
                                Anulada
                              </div>
                            )}
                            {(sale.exchange_type === 'normal' || sale.exchange_type === 'nueva_por_cambio') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenExchange(sale)}
                                className="h-7 px-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Layout Desktop */}
                  <div className="hidden sm:flex items-center p-4 space-x-4">
                    {/* Layout normal - imagen única */}
                    {sale.exchange_type === 'normal' && (
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
                    )}

                    {/* Layout para cambios - dos imágenes pequeñas */}
                    {(sale.exchange_type === 'nueva_por_cambio' || sale.exchange_type === 'anulada_por_cambio') && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center space-x-2">
                          {/* Primera imagen */}
                          <div className="w-8 h-8">
                            {sale.images && sale.images.length > 0 ? (
                              <div 
                                className="relative w-full h-full cursor-pointer group"
                                onClick={() => handleOpenImage(sale.images[0].url, sale.product_name)}
                              >
                                <img 
                                  src={sale.images[0].url} 
                                  alt={sale.product_name}
                                  className="w-full h-full object-cover rounded-md border border-gray-300"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-md">
                                  <ZoomIn className="w-2 h-2 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center border border-gray-300">
                                <Package className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Icono de cambio */}
                          <RefreshCw className={`w-3 h-3 ${
                            sale.exchange_type === 'nueva_por_cambio' ? 'text-green-600' : 'text-gray-600'
                          }`} />

                          {/* Segunda imagen */}
                          <div className="w-8 h-8">
                            {/* Para nueva por cambio: mostrar producto original */}
                            {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && sale.original_product_info.length > 0 && (
                              <div 
                                className="relative w-full h-full cursor-pointer group"
                                onClick={() => sale.original_product_info?.[0]?.images?.[0]?.url && 
                                  handleOpenImage(sale.original_product_info[0].images[0].url, sale.original_product_info[0].name)}
                              >
                                {sale.original_product_info[0].images && sale.original_product_info[0].images.length > 0 ? (
                                  <>
                                    <img 
                                      src={sale.original_product_info[0].images[0].url} 
                                      alt={sale.original_product_info[0].name}
                                      className="w-full h-full object-cover rounded-md border border-gray-300"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-md">
                                      <ZoomIn className="w-2 h-2 text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center border border-gray-300">
                                    <Package className="w-3 h-3 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Para anulada por cambio: mostrar producto nuevo */}
                            {sale.exchange_type === 'anulada_por_cambio' && sale.new_product_info && sale.new_product_info.length > 0 && (
                              <div 
                                className="relative w-full h-full cursor-pointer group"
                                onClick={() => sale.new_product_info?.[0]?.images?.[0]?.url && 
                                  handleOpenImage(sale.new_product_info[0].images[0].url, sale.new_product_info[0].name)}
                              >
                                {sale.new_product_info[0].images && sale.new_product_info[0].images.length > 0 ? (
                                  <>
                                    <img 
                                      src={sale.new_product_info[0].images[0].url} 
                                      alt={sale.new_product_info[0].name}
                                      className="w-full h-full object-cover rounded-md border border-gray-300"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-md">
                                      <ZoomIn className="w-2 h-2 text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center border border-gray-300">
                                    <Package className="w-3 h-3 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Información del producto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className={`text-sm font-medium truncate ${
                            sale.exchange_type === 'anulada_por_cambio' ? 'text-gray-600 line-through' : 'text-gray-900'
                          }`}>
                            {sale.product_name}
                          </h3>
                          
                          {/* Información de cambio */}
                          {sale.exchange_type === 'nueva_por_cambio' && sale.original_product_info && (
                            <span className="text-xs text-green-600">
                              Cambio por: {sale.original_product_info[0]?.name}
                            </span>
                          )}
                          {sale.exchange_type === 'anulada_por_cambio' && sale.new_product_info && (
                            <span className="text-xs text-gray-600">
                              Cambiado por: {sale.new_product_info[0]?.name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono ml-4">
                          {sale.createdAt && sale.createdAt.includes(':') && sale.createdAt.length <= 5 
                            ? sale.createdAt  // Formato antiguo HH:MM
                            : sale.createdAt 
                              ? (() => {
                                  const date = new Date(sale.createdAt);
                                  // Mostrar la hora tal como está en la base de datos
                                  const hours = date.getUTCHours().toString().padStart(2, '0');
                                  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
                                  return `${hours}:${minutes}`;
                                })()
                              : 'N/A'
                          }
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Talle {sale.size_name}
                          {sale.size_change_info && (
                            <span className="ml-1 text-blue-600">
                              ({sale.size_change_info.original_size} → {sale.size_change_info.new_size})
                            </span>
                          )}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {sale.dateSell_id?.name || 'N/A'}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {sale.method_payment || 'efectivo'}
                        </Badge>
                        
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
                        {sale.exchange_count > 0 && sale.exchange_type !== 'anulada_por_cambio' && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Cambios: {sale.exchange_count}
                          </Badge>
                        )}
                        {sale.transaction_id && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 font-mono">
                            {sale.transaction_id.substring(0, 12)}...
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
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
                        
                        <div className="flex items-center space-x-4">
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
                            {(sale.exchange_type === 'normal' || sale.exchange_type === 'nueva_por_cambio') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenExchange(sale)}
                                className="h-6 px-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Cambio
                              </Button>
                            )}
                          </div>
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

      {/* Modal de Registrar Venta */}
      <RegisterSaleDialog 
        open={registerSaleOpen} 
        setOpen={setRegisterSaleOpen} 
      />

      {/* Modal de Cambio */}
      <ExchangeDialog 
        sale={selectedSaleForExchange} 
        open={exchangeDialogOpen} 
        setOpen={setExchangeDialogOpen} 
      />

      {/* Modal de Cambio Masivo */}
      <MassiveExchangeDialog 
        transaction={selectedTransactionForExchange} 
        open={massiveExchangeDialogOpen} 
        setOpen={setMassiveExchangeDialogOpen} 
      />

      {/* Modal de Imagen */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-2">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">{selectedImage.alt}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImageModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <img 
              src={selectedImage.url} 
              alt={selectedImage.alt}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}