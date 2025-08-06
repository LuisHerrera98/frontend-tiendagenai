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

export default function VentasPage() {
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

  // Obtener datos de ventas
  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales', dateFilter.startDate, dateFilter.endDate, specificDate],
    queryFn: () => salesService.getSales(
      specificDate || dateFilter.startDate, 
      specificDate || dateFilter.endDate
    ),
    staleTime: 30 * 1000,
  })

  // Obtener estadísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['sales-stats', dateFilter.startDate, dateFilter.endDate, specificDate],
    queryFn: () => salesService.getSalesStats(
      specificDate || dateFilter.startDate, 
      specificDate || dateFilter.endDate
    ),
    staleTime: 30 * 1000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Ventas</h1>
          <p className="text-gray-600">Registra y gestiona las ventas de productos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Última actualización: {currentTime || '--:--:--'}
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Venta
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SaleMetricCard
          title="Total Ventas"
          value={stats?.totalSales?.toString() || "0"}
          description="Ventas registradas"
          icon={ShoppingCart}
          isLoading={statsLoading}
          color="blue"
        />
        <SaleMetricCard
          title="Ingresos"
          value={`$${stats?.totalRevenue?.toLocaleString('es-AR') || "0"}`}
          description="Ingresos totales"
          icon={DollarSign}
          isLoading={statsLoading}
          color="green"
        />
        <SaleMetricCard
          title="Ganancia"
          value={`$${stats?.totalProfit?.toLocaleString('es-AR') || "0"}`}
          description="Ganancia neta"
          icon={TrendingUp}
          isLoading={statsLoading}
          color="purple"
        />
        <SaleMetricCard
          title="Promedio"
          value={`$${stats?.averageSaleValue?.toLocaleString('es-AR') || "0"}`}
          description="Valor promedio por venta"
          icon={Package}
          isLoading={statsLoading}
          color="orange"
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros de Fecha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Día Específico</Label>
              <Input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
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
          ) : sales?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay ventas registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sales?.map((sale) => (
                <div key={sale._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center space-x-4">
                    {/* Imagen del producto */}
                    <div className="flex-shrink-0 w-12 h-12">
                      {sale.images && sale.images.length > 0 ? (
                        <img 
                          src={sale.images[0].url} 
                          alt={sale.product_name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-sm font-medium truncate text-gray-900">
                            {sale.product_name}
                          </h3>
                        </div>
                        <div className="text-xs text-gray-500 font-mono ml-4">
                          {sale.createdAt}
                        </div>
                      </div>

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
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-xs text-gray-500">
                            Costo: <span className="font-medium">${sale.cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-sm font-medium text-green-600">
                            ${sale.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </div>
                          
                          <div className="text-xs font-medium text-purple-600">
                            +${(sale.price - sale.cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
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