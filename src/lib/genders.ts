import { api } from './api'
import { Gender } from '@/types'

export const genderService = {
  // Get all genders
  getAll: async (): Promise<Gender[]> => {
    const response = await api.get('/gender')
    return response.data
  },

  // Create gender
  create: async (name: string): Promise<Gender> => {
    const response = await api.post('/gender', { name })
    return response.data
  },

  // Update gender
  update: async (id: string, name: string): Promise<Gender> => {
    const response = await api.patch(`/gender/${id}`, { name })
    return response.data
  },

  // Delete gender
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/gender/${id}`)
    return response.data
  },
}

// Export individual functions for convenience
export const getGenders = genderService.getAll
export const createGender = genderService.create
export const updateGender = genderService.update
export const deleteGender = genderService.delete