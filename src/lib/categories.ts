import { api } from './api'
import { Category } from '@/types'

export const categoryService = {
  // Get all categories (flat list for admin)
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/category')
    return response.data
  },

  // Get categories tree (hierarchical for public store)
  getTree: async (): Promise<Category[]> => {
    const response = await api.get('/category/tree/hierarchy')
    return response.data
  },

  // Create category
  create: async (name: string, parent_id?: string): Promise<Category> => {
    const response = await api.post('/category', { name, parent_id })
    return response.data
  },

  // Update category
  update: async (id: string, name: string, parent_id?: string): Promise<Category> => {
    const response = await api.patch(`/category/${id}`, { name, parent_id })
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