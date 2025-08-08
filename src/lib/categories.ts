import { api } from './api'
import { Category } from '@/types'

export const categoryService = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/category')
    return response.data
  },

  // Create category
  create: async (name: string): Promise<Category> => {
    const response = await api.post('/category', { name })
    return response.data
  },

  // Update category
  update: async (id: string, name: string): Promise<Category> => {
    const response = await api.patch(`/category/${id}`, { name })
    return response.data
  },

  // Delete category
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/category/${id}`)
    return response.data
  },
}

// Export para usar en los componentes
export const getCategories = categoryService.getAll