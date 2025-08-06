import { api } from './api'

export interface Exchange {
  _id: string
  original_sell_id: {
    _id: string
    product_name: string
    size_name: string
    price: number
    cost: number
    method_payment: string
    dateSell_id: {
      name: string
      date: string
    }
  }
  original_product_name: string
  original_size_name: string
  original_price: number
  original_cost: number
  original_images: any[]
  new_product_id: string
  new_product_name: string
  new_size_id: string
  new_size_name: string
  new_price: number
  new_cost: number
  new_images: any[]
  price_difference: number
  payment_method_difference: string
  status: string
  exchange_date: string
  exchange_time: string
  notes: string
}

export interface CreateExchangeDto {
  original_sell_id: string
  new_product_id: string
  new_size_id: string
  payment_method_difference?: string
  notes?: string
  credit_action?: 'create_credit' | 'additional_product' | 'cash_return'
  client_document?: string
  client_name?: string
}

export interface ExchangeStats {
  totalExchanges: number
  totalPriceDifference: number
  exchangesWithPayment: number
  exchangesWithCredit: number
  exchangesByStatus: {
    completado: number
    pendiente: number
    cancelado: number
  }
}

export const exchangeService = {
  // Crear nuevo cambio
  createExchange: async (exchangeData: CreateExchangeDto) => {
    const response = await api.post('/exchange', exchangeData)
    return response.data
  },

  // Obtener todos los cambios con filtros opcionales
  getExchanges: async (startDate?: string, endDate?: string): Promise<Exchange[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const response = await api.get(`/exchange?${params.toString()}`)
    return response.data
  },

  // Obtener estadísticas de cambios
  getExchangeStats: async (startDate?: string, endDate?: string): Promise<ExchangeStats> => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const response = await api.get(`/exchange/stats?${params.toString()}`)
    return response.data
  },

  // Obtener cambio específico
  getExchange: async (id: string): Promise<Exchange> => {
    const response = await api.get(`/exchange/${id}`)
    return response.data
  },

  // Actualizar cambio
  updateExchange: async (id: string, data: Partial<CreateExchangeDto>): Promise<Exchange> => {
    const response = await api.patch(`/exchange/${id}`, data)
    return response.data
  },

  // Eliminar cambio
  deleteExchange: async (id: string) => {
    const response = await api.delete(`/exchange/${id}`)
    return response.data
  },

  // Crear cambio masivo
  createMassiveExchange: async (massiveExchangeData: {
    original_sales: Array<{ sale_id: string }>
    new_products: Array<{
      product_id: string
      product_name: string
      size_id: string
      size_name: string
      method_payment?: string
    }>
    notes?: string
    credit_action?: string
    client_document?: string
    client_name?: string
    payment_method_difference?: string
  }) => {
    const response = await api.post('/exchange/massive', massiveExchangeData)
    return response.data
  },
}