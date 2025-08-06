import { api } from './api'

export interface Sale {
  _id: string
  dateSell_id: {
    _id: string
    name: string
    date: string
  }
  product_name: string
  size_name: string
  price: number
  cost: number
  images: any[]
  method_payment: string
  exchange_type: 'normal' | 'anulada_por_cambio' | 'nueva_por_cambio'
  related_exchange_id?: string
  original_product_info?: Array<{
    name: string
    size_name: string
    price: number
    images: any[]
  }>
  new_product_info?: Array<{
    name: string
    size_name: string
    price: number
    images: any[]
  }>
  size_change_info?: {
    original_size: string
    new_size: string
    changed_at: string
  }
  exchange_count?: number
  transaction_id?: string
  createdAt: string
}

export interface CreateSaleDto {
  product_id: string
  product_name: string
  size_id: string
  size_name: string
  price: number
  cost: number
  images: any[]
  method_payment?: string
  transaction_id?: string
}

export interface SalesStats {
  totalSales: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  averageSaleValue: number
  salesByDate: {
    [date: string]: {
      count: number
      revenue: number
      cost: number
      profit: number
    }
  }
  paymentMethodBreakdown: {
    efectivo: { count: number; total: number }
    transferencia: { count: number; total: number }
    tarjeta: { count: number; total: number }
    qr: { count: number; total: number }
    no_aplica: { count: number; total: number }
  }
}

export const salesService = {
  // Test de conectividad
  testConnection: async () => {
    try {
      const response = await api.get('/sell')
      console.log('API connection test successful:', response.status)
      return true
    } catch (error) {
      console.error('API connection test failed:', error)
      return false
    }
  },

  // Registrar nueva venta
  registerSale: async (saleData: CreateSaleDto) => {
    const response = await api.post('/sell/register', saleData)
    return response.data
  },

  // Obtener todas las ventas con filtros opcionales
  getSales: async (startDate?: string, endDate?: string): Promise<Sale[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const response = await api.get(`/sell?${params.toString()}`)
    return response.data
  },

  // Obtener estadísticas de ventas
  getSalesStats: async (startDate?: string, endDate?: string): Promise<SalesStats> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const response = await api.get(`/sell/stats?${params.toString()}`)
    return response.data
  },

  // Obtener venta específica
  getSale: async (id: string): Promise<Sale> => {
    const response = await api.get(`/sell/${id}`)
    return response.data
  },

  // Actualizar venta
  updateSale: async (id: string, data: Partial<CreateSaleDto>): Promise<Sale> => {
    const response = await api.patch(`/sell/${id}`, data)
    return response.data
  },

  // Eliminar venta
  deleteSale: async (id: string) => {
    const response = await api.delete(`/sell/${id}`)
    return response.data
  },
}