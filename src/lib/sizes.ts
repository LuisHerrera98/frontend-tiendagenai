import { api } from './api'
import { Size } from '@/types'

export const sizeService = {
  // Get all sizes
  getAll: async (): Promise<Size[]> => {
    const response = await api.get('/size')
    return response.data
  },

  // Get sizes by category
  getByCategory: async (categoryId: string): Promise<Size[]> => {
    const response = await api.get(`/size/category/${categoryId}`)
    return response.data
  },

  // Create size
  create: async (name: string, categoryId: string): Promise<Size> => {
    const response = await api.post('/size', { name, category_id: categoryId })
    return response.data
  },

  // Create multiple sizes
  createMultiple: async (categoryId: string, sizes: { name: string }[]): Promise<{
    success: boolean
    created: Size[]
    skipped: { name: string; reason: string }[]
    errors: { name: string; error: string }[]
    summary: {
      total: number
      created: number
      skipped: number
      errors: number
    }
  }> => {
    const response = await api.post('/size/multiple', { category_id: categoryId, sizes })
    return response.data
  },

  // Update size
  update: async (id: string, name: string, categoryId?: string): Promise<Size> => {
    const data: any = { name }
    if (categoryId) data.category_id = categoryId
    
    const response = await api.patch(`/size/${id}`, data)
    return response.data
  },

  // Delete size
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/size/${id}`)
    return response.data
  },
}

// Export para usar en los componentes
export const getSizes = sizeService.getAll