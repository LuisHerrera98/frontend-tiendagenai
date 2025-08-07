'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { exchangeService, Exchange, CreateExchangeDto } from '@/lib/exchanges'
import { salesService, Sale } from '@/lib/sales'
import { productService } from '@/lib/products'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Plus, 
  Calendar,
  Filter,
  Loader2,
  ArrowRightLeft,
  Search
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

interface ExchangeMetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  isLoading?: boolean;
  color?: "blue" | "green" | "orange" | "purple";
}

function ExchangeMetricCard({ title, value, description, icon: Icon, isLoading = false, color = "blue" }: ExchangeMetricCardProps) {
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
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
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

function CreateExchangeDialog() {
  const [open, setOpen] = useState(false)
  const [saleSearch, setSaleSearch] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [paymentMethodDiff, setPaymentMethodDiff] = useState('no_aplica')
  const [notes, setNotes] = useState('')
  const [searchResults, setSearchResults] = useState<Sale[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const queryClient = useQueryClient()

  // Búsqueda de ventas
  const searchSales = async (searchTerm: string) => {
    if (!searchTerm) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    try {
      const sales = await salesService.getSales()
      const filtered = sales.filter(sale => 
        sale.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale._id.includes(searchTerm)
      )
      setSearchResults(filtered)
    } catch (error) {
      console.error('Error searching sales:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Obtener categorías
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => import('@/lib/categories').then(module => module.categoryService.getAll()),
  })

  // Obtener productos filtrados por categoría
  const { data: productsData } = useQuery({
    queryKey: ['products-for-exchange', selectedCategory],
    queryFn: () => productService.getProducts({ 
      categoryId: selectedCategory,
      limit: 1000, 
      showAll: false 
    }),
    enabled: !!selectedCategory,
  })

  const products = productsData?.data?.filter(product => {
    const totalStock = product.stock?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
    return totalStock > 0
  }) || []

  const availableSizes = selectedProduct && products.length > 0 
    ? products.find(p => p._id === selectedProduct)?.stock?.filter(s => s.quantity > 0) || []
    : []

  const createExchangeMutation = useMutation({
    mutationFn: async (exchangeData: CreateExchangeDto) => {
      return await exchangeService.createExchange(exchangeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] })
      queryClient.invalidateQueries({ queryKey: ['exchange-stats'] })
      setOpen(false)
      resetForm()
    },
    onError: (error) => {
      console.error('Exchange creation failed:', error)
    }
  })

  const resetForm = () => {
    setSaleSearch('')
    setSelectedSale(null)
    setSelectedCategory('')
    setSelectedProduct('')
    setSelectedSize('')
    setPaymentMethodDiff('no_aplica')
    setNotes('')
    setSearchResults([])
  }

  const handleCreateExchange = () => {
    if (!selectedSale || !selectedProduct || !selectedSize) return

    const exchangeData: CreateExchangeDto = {
      original_sell_id: selectedSale._id,
      new_product_id: selectedProduct,
      new_size_id: selectedSize,
      payment_method_difference: paymentMethodDiff,
      notes: notes
    }

    createExchangeMutation.mutate(exchangeData)
  }

  const selectedProductData = products.find(p => p._id === selectedProduct)
  const selectedSizeData = availableSizes.find(s => s.size_id === selectedSize)
  const priceDifference = selectedProductData && selectedSale 
    ? selectedProductData.price - selectedSale.price 
    : 0

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSales(saleSearch)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [saleSearch])

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-orange-600 hover:bg-orange-700"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Registrar Cambio
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Cambio</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Buscar venta original */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">1. Buscar Venta Original</h3>
              
              <div className="space-y-2">
                <Label>Buscar por nombre de producto o ID de venta</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar venta..."
                    value={saleSearch}
                    onChange={(e) => setSaleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isSearching && (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {searchResults.map((sale) => (
                    <div
                      key={sale._id}
                      onClick={() => setSelectedSale(sale)}
                      className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedSale?._id === sale._id ? 'bg-orange-50 border-l-4 border-orange-500' : 'border-b border-gray-100 last:border-b-0'
                      }`}
                    >
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
                        <p className="text-xs text-green-600 font-medium">${sale.price}</p>
                        <p className="text-xs text-gray-500">
                          {sale.dateSell_id?.name} - {sale.method_payment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedSale && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Venta Seleccionada</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Producto:</span> {selectedSale.product_name}</p>
                    <p><span className="font-medium">Talle:</span> {selectedSale.size_name}</p>
                    <p><span className="font-medium">Precio:</span> ${selectedSale.price}</p>
                    <p><span className="font-medium">Método:</span> {selectedSale.method_payment}</p>
                    <p><span className="font-medium">Fecha:</span> {selectedSale.dateSell_id?.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Seleccionar nuevo producto */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">2. Seleccionar Nuevo Producto</h3>
              
              {selectedSale && (
                <>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Seleccionar categoría...</option>
                      {categories?.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory && products.length > 0 && (
                    <div className="space-y-2">
                      <Label>Producto</Label>
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct && availableSizes.length > 0 && (
                    <div className="space-y-2">
                      <Label>Talle</Label>
                      <select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
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

                  {/* Diferencia de precio */}
                  {selectedProductData && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Resumen del Cambio</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Producto original:</span> ${selectedSale.price}</p>
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
                          <select
                            value={paymentMethodDiff}
                            onChange={(e) => setPaymentMethodDiff(e.target.value)}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="no_aplica">No aplica</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="qr">QR</option>
                            <option value="tarjeta">Tarjeta</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notas (opcional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Agregar notas sobre el cambio..."
                      className="min-h-[80px]"
                    />
                  </div>
                </>
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
              onClick={handleCreateExchange}
              disabled={!selectedSale || !selectedProduct || !selectedSize || createExchangeMutation.isPending}
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
    </>
  )
}

export default function CambiosPage() {
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' })
  const [specificDate, setSpecificDate] = useState('')
  const [showRangeFilters, setShowRangeFilters] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // Update time on client side only
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Fetch exchanges with date filter
  const { data: exchanges, isLoading: exchangesLoading } = useQuery({
    queryKey: ['exchanges', dateFilter.startDate, dateFilter.endDate, specificDate],
    queryFn: () => {
      if (specificDate) {
        return exchangeService.getExchanges(specificDate, specificDate)
      }
      return exchangeService.getExchanges(dateFilter.startDate, dateFilter.endDate)
    },
    refetchInterval: 30000,
  })

  // Fetch exchange stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['exchange-stats', dateFilter.startDate, dateFilter.endDate, specificDate],
    queryFn: () => {
      if (specificDate) {
        return exchangeService.getExchangeStats(specificDate, specificDate)
      }
      return exchangeService.getExchangeStats(dateFilter.startDate, dateFilter.endDate)
    },
    refetchInterval: 30000,
  })

  const handleDateFilterChange = (field: string, value: string) => {
    setDateFilter(prev => ({ ...prev, [field]: value }))
    if (value && specificDate) {
      setSpecificDate('')
    }
  }

  const handleSpecificDateChange = (value: string) => {
    setSpecificDate(value)
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
    if (!showRangeFilters && specificDate) {
      setSpecificDate('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cambios</h1>
          <p className="text-gray-600">Registra y gestiona los cambios de productos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Última actualización: {currentTime || '--:--:--'}
          </div>
          <CreateExchangeDialog />
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <ExchangeMetricCard
          title="Cambios Totales"
          value={stats?.totalExchanges || 0}
          description="Cantidad de cambios"
          icon={RefreshCw}
          isLoading={statsLoading}
          color="blue"
        />
        <ExchangeMetricCard
          title="Con Pago Adicional"
          value={stats?.exchangesWithPayment || 0}
          description="Cambios con diferencia"
          icon={TrendingUp}
          isLoading={statsLoading}
          color="orange"
        />
        <ExchangeMetricCard
          title="Con Crédito"
          value={stats?.exchangesWithCredit || 0}
          description="A favor del cliente"
          icon={DollarSign}
          isLoading={statsLoading}
          color="green"
        />
        <ExchangeMetricCard
          title="Diferencia Total"
          value={stats ? `$${stats.totalPriceDifference.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '$0'}
          description="Suma de diferencias"
          icon={ArrowRightLeft}
          isLoading={statsLoading}
          color="purple"
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seleccionar Día</Label>
              <Input
                type="date"
                value={specificDate}
                onChange={(e) => handleSpecificDateChange(e.target.value)}
                placeholder="Seleccionar día específico"
              />
            </div>
            
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

      {/* Lista de Cambios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cambios Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exchangesLoading ? (
            <div className="space-y-2">
              <LoadingSkeleton className="h-12 w-full" />
              <LoadingSkeleton className="h-12 w-full" />
              <LoadingSkeleton className="h-12 w-full" />
            </div>
          ) : exchanges?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay cambios registrados</p>
              {dateFilter.startDate || dateFilter.endDate || specificDate ? (
                <p className="text-sm">Intenta cambiar los filtros de fecha</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              {exchanges?.map((exchange) => (
                <div key={exchange._id} className="flex items-center bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Producto Original */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-800">Producto Original</h4>
                      <div className="flex items-center space-x-2">
                        {exchange.original_images && exchange.original_images.length > 0 && (
                          <img 
                            src={exchange.original_images[0].url} 
                            alt={exchange.original_product_name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm text-gray-900">{exchange.original_product_name}</p>
                          <p className="text-xs text-gray-600">Talle: {exchange.original_size_name}</p>
                          <p className="text-xs text-green-600 font-medium">${exchange.original_price}</p>
                        </div>
                      </div>
                    </div>

                    {/* Producto Nuevo */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-800">Producto Nuevo</h4>
                      <div className="flex items-center space-x-2">
                        {exchange.new_images && exchange.new_images.length > 0 && (
                          <img 
                            src={exchange.new_images[0].url} 
                            alt={exchange.new_product_name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm text-gray-900">{exchange.new_product_name}</p>
                          <p className="text-xs text-gray-600">Talle: {exchange.new_size_name}</p>
                          <p className="text-xs text-green-600 font-medium">${exchange.new_price}</p>
                        </div>
                      </div>
                    </div>

                    {/* Detalles del Cambio */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-800">Detalles</h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Diferencia:</span>
                          <span className={`text-xs font-medium ${
                            exchange.price_difference > 0 ? 'text-red-600' : 
                            exchange.price_difference < 0 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            ${Math.abs(exchange.price_difference)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Estado:</span>
                          <Badge 
                            variant={exchange.status === 'completado' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {exchange.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Fecha:</span>
                          <span className="text-xs text-gray-900">{exchange.exchange_date}</span>
                        </div>
                        {exchange.notes && (
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Nota:</span> {exchange.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}