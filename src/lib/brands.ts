import { api } from './api'
import { Brand } from '@/types'

export const brandService = {
  // Get all brands
  getAll: async (): Promise<Brand[]> => {
    const response = await api.get('/brand')
    return response.data
  },

  // Create brand
  create: async (name: string): Promise<Brand> => {
    const response = await api.post('/brand', { name })
    return response.data
  },

  // Update brand
  update: async (id: string, name: string): Promise<Brand> => {
    const response = await api.patch(`/brand/${id}`, { name })
    return response.data
  },

  // Delete brand
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/brand/${id}`)
    return response.data
  },
}