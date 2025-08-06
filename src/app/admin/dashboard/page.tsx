'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Tag, DollarSign, AlertTriangle, TrendingUp, Layers, ShoppingBag } from 'lucide-react'
import { productService } from '@/lib/products'
import { categoryService } from '@/lib/categories'
import { brandService } from '@/lib/brands'
import { typeService } from '@/lib/types'

function LoadingSkeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  isLoading = false, 
  error = null,
  trend = null,
  trendValue = null
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <LoadingSkeleton className="h-8 w-16 mb-1" />
            <LoadingSkeleton className="h-3 w-24" />
          </>
        ) : error ? (
          <>
            <div className="text-2xl font-bold text-red-500">Error</div>
            <p className="text-xs text-red-400">
              {error}
            </p>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
              {trend && (
                <div className={`flex items-center text-xs ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${
                    trend === 'down' ? 'rotate-180' : ''
                  }`} />
                  {trendValue}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState('')

  // Update time on client side only
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString())
    }
    
    updateTime() // Set initial time
    const interval = setInterval(updateTime, 1000) // Update every second
    
    return () => clearInterval(interval)
  }, [])

  // Fetch all products (including inactive ones for admin dashboard)
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: () => productService.getProducts({ limit: 1000, showAll: true }), // Get all products including inactive
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  // Fetch all categories
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['dashboard-categories'],
    queryFn: categoryService.getAll,
    refetchInterval: 5 * 60 * 1000,
  })

  // Fetch all brands
  const { data: brands, isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ['dashboard-brands'],
    queryFn: brandService.getAll,
    refetchInterval: 5 * 60 * 1000,
  })

  // Fetch all types
  const { data: types, isLoading: typesLoading, error: typesError } = useQuery({
    queryKey: ['dashboard-types'],
    queryFn: typeService.getAll,
    refetchInterval: 5 * 60 * 1000,
  })

  // Fetch investment/inventory value
  const { data: inversionData, isLoading: inversionLoading, error: inversionError } = useQuery({
    queryKey: ['dashboard-inversion'],
    queryFn: () => productService.getInvestment(),
    refetchInterval: 5 * 60 * 1000,
  })

  // Calculate metrics from products data
  const products = productsData?.data || []
  const totalProducts = products.length
  
  // Calculate stock metrics
  const lowStockProducts = products.filter(product => {
    const totalStock = product.stock?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
    return totalStock > 0 && totalStock <= 5
  }).length
  
  const outOfStockProducts = products.filter(product => {
    const totalStock = product.stock?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
    return totalStock === 0
  }).length
  
  const totalInventoryUnits = products.reduce((sum, product) => {
    const productStock = product.stock?.reduce((stockSum, item) => stockSum + (item.quantity || 0), 0) || 0
    return sum + productStock
  }, 0)
  
  // Calculate potential sales value (price × quantity) - INCLUYE PRODUCTOS INACTIVOS
  const potentialSalesValue = products.reduce((sum, product) => {
    const productStock = product.stock?.reduce((stockSum, item) => stockSum + (item.quantity || 0), 0) || 0
    return sum + (product.price || 0) * productStock
  }, 0)
  
  // Calculate potential sales value for ACTIVE products only
  const activePotentialSalesValue = products.filter(p => p.active).reduce((sum, product) => {
    const productStock = product.stock?.reduce((stockSum, item) => stockSum + (item.quantity || 0), 0) || 0
    return sum + (product.price || 0) * productStock
  }, 0)
  
  // Get total brands and types from database
  const totalBrands = brands?.length || 0
  const totalTypes = types?.length || 0
  
  // Active products count
  const activeProducts = products.filter(p => p.active).length
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Inicio</h1>
        <div className="text-sm text-muted-foreground">
          Última actualización: {currentTime || '--:--:--'}
        </div>
      </div>
      
      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Productos"
          value={totalProducts}
          description="Productos en el inventario"
          icon={Package}
          isLoading={productsLoading}
          error={productsError?.message}
          trend={activeProducts < totalProducts ? 'down' : null}
          trendValue={activeProducts < totalProducts ? `${totalProducts - activeProducts} inactivos` : null}
        />
        
        <MetricCard
          title="Unidades en Stock"
          value={totalInventoryUnits.toLocaleString()}
          description="Total de unidades disponibles"
          icon={Layers}
          isLoading={productsLoading}
          error={productsError?.message}
        />
        
        <MetricCard
          title="Categorías Activas"
          value={categories?.length || 0}
          description="Categorías disponibles"
          icon={Tag}
          isLoading={categoriesLoading}
          error={categoriesError?.message}
        />
        
        <MetricCard
          title="Inversión Total"
          value={inversionData ? `$${parseFloat(inversionData.totalInversion).toLocaleString('es-AR')}` : '$0'}
          description="Valor del inventario (costo)"
          icon={DollarSign}
          isLoading={inversionLoading}
          error={inversionError?.message}
        />
      </div>
      
      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Valor Potencial Ventas"
          value={`$${activePotentialSalesValue.toLocaleString('es-AR')}`}
          description="Valor productos activos (vendibles)"
          icon={ShoppingBag}
          isLoading={productsLoading}
          error={productsError?.message}
          trend={activePotentialSalesValue < potentialSalesValue ? 'down' : null}
          trendValue={activePotentialSalesValue < potentialSalesValue ? `$${(potentialSalesValue - activePotentialSalesValue).toLocaleString('es-AR')} inactivos` : null}
        />
        
        <MetricCard
          title="Stock Bajo"
          value={lowStockProducts}
          description="Productos con ≤ 5 unidades"
          icon={AlertTriangle}
          isLoading={productsLoading}
          error={productsError?.message}
          trend={lowStockProducts > 0 ? 'down' : 'up'}
          trendValue={lowStockProducts > 0 ? 'Requiere atención' : 'Todo bien'}
        />
        
        <MetricCard
          title="Sin Stock"
          value={outOfStockProducts}
          description="Productos agotados"
          icon={Package}
          isLoading={productsLoading}
          error={productsError?.message}
          trend={outOfStockProducts > 0 ? 'down' : 'up'}
          trendValue={outOfStockProducts > 0 ? 'Necesita reposición' : 'Stock disponible'}
        />
        
        <MetricCard
          title="Marcas"
          value={totalBrands}
          description="Total de marcas disponibles"
          icon={Tag}
          isLoading={brandsLoading}
          error={brandsError?.message}
        />
      </div>
      
      {/* Detail Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-3/4" />
                <LoadingSkeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-3">
                {outOfStockProducts > 0 && (
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm font-medium text-red-700">
                      {outOfStockProducts} productos sin stock
                    </span>
                    <span className="text-xs text-red-600">Crítico</span>
                  </div>
                )}
                {lowStockProducts > 0 && (
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <span className="text-sm font-medium text-orange-700">
                      {lowStockProducts} productos con stock bajo
                    </span>
                    <span className="text-xs text-orange-600">Atención</span>
                  </div>
                )}
                {outOfStockProducts === 0 && lowStockProducts === 0 && (
                  <div className="p-4 text-center text-green-600">
                    <Package className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">¡Todo el inventario está bien!</p>
                    <p className="text-xs text-green-500">No hay alertas de stock</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Resumen del Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-2">
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-3/4" />
                <LoadingSkeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Productos activos:</span>
                  <span className="font-semibold">{activeProducts}/{totalProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Marcas:</span>
                  <span className="font-semibold">{totalBrands}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tipos:</span>
                  <span className="font-semibold">{totalTypes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Categorías:</span>
                  <span className="font-semibold">{categories?.length || 0}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Stock total:</span>
                    <span className="font-bold text-lg">{totalInventoryUnits.toLocaleString()} unidades</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}