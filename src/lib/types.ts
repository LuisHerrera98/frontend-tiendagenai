import { api } from './api'
import { Type } from '@/types'

export const typeService = {
  // Get all types
  getAll: async (): Promise<Type[]> => {
    const response = await api.get('/type')
    return response.data
  },

  // Create type
  create: async (name: string): Promise<Type> => {
    const response = await api.post('/type', { name })
    return response.data
  },

  // Update type
  update: async (id: string, name: string): Promise<Type> => {
    const response = await api.patch(`/type/${id}`, { name })
    return response.data
  },

  // Delete type
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/type/${id}`)
    return response.data
  },
}

// Export individual functions for convenience
export const getTypes = typeService.getAll
export const createType = typeService.create
export const updateType = typeService.update
export const deleteType = typeService.delete