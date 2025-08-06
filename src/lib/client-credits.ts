import { api } from './api'

export interface ClientCredit {
  _id: string
  document_number: string
  phone: string
  client_name: string
  amount: number
  original_sale_amount: number
  reason: string
  related_exchange_id?: string
  status: 'active' | 'used' | 'expired'
  used_in_sale_id?: string
  used_at?: string
  created_at: string
  expires_at: string
  notes: string
}

export interface CreateClientCreditDto {
  document_number: string
  phone?: string
  client_name?: string
  amount: number
  original_sale_amount: number
  reason: string
  related_exchange_id?: string
  notes?: string
}

export interface UseCreditsDto {
  documentNumber: string
  amount: number
  saleId: string
}

export const clientCreditService = {
  async create(data: CreateClientCreditDto): Promise<ClientCredit> {
    const response = await api.post('/client-credit', data)
    return response.data
  },

  async getActiveCredits(documentNumber: string): Promise<ClientCredit[]> {
    const response = await api.get(`/client-credit/active/${documentNumber}`)
    return response.data
  },

  async getTotalActiveCredits(documentNumber: string): Promise<number> {
    const response = await api.get(`/client-credit/total/${documentNumber}`)
    return response.data
  },

  async getClientHistory(documentNumber: string): Promise<ClientCredit[]> {
    const response = await api.get(`/client-credit/history/${documentNumber}`)
    return response.data
  },

  async useCredits(data: UseCreditsDto) {
    const response = await api.post('/client-credit/use', data)
    return response.data
  },

  async getAll(): Promise<ClientCredit[]> {
    const response = await api.get('/client-credit')
    return response.data
  }
}