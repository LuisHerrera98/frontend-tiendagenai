import { api } from './api'

export interface Color {
  _id: string
  name: string
  hex_code?: string
  active: boolean
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface CreateColorDto {
  name: string
  hex_code?: string
  active?: boolean
}

export interface UpdateColorDto {
  name?: string
  hex_code?: string
  active?: boolean
}

export const colorService = {
  async getAll(): Promise<Color[]> {
    const response = await api.get('/color')
    return response.data
  },

  async getById(id: string): Promise<Color> {
    const response = await api.get(`/color/${id}`)
    return response.data
  },

  async create(data: CreateColorDto): Promise<Color> {
    const response = await api.post('/color', data)
    return response.data
  },

  async update(id: string, data: UpdateColorDto): Promise<Color> {
    const response = await api.patch(`/color/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/color/${id}`)
  }
}