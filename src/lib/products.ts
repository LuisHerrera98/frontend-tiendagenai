import { api } from './api'
import { Product, ProductsResponse, FiltersResponse, CreateProductDto, UpdateProductDto, ProductFilters } from '@/types'

export const productService = {
  // Get products with filters
  getProducts: async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
    const params = new URLSearchParams()
    
    if (filters.categoryId) params.append('categoryId', filters.categoryId)
    if (filters.brandName) params.append('brandName', filters.brandName)
    if (filters.modelName) params.append('modelName', filters.modelName)
    if (filters.sizeName) params.append('sizeName', filters.sizeName)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await api.get(`/product/search/filtered?${params.toString()}`)
    return response.data
  },

  // Get filters for category
  getFilters: async (categoryId?: string): Promise<FiltersResponse> => {
    const endpoint = categoryId 
      ? `/product/filters/${categoryId}`
      : '/product/filters/all/options'
    
    const response = await api.get(endpoint)
    return response.data
  },

  // Create product with images
  createProduct: async (productData: CreateProductDto, images?: File[]): Promise<Product> => {
    const formData = new FormData()
    
    // Add product data
    Object.entries(productData).forEach(([key, value]) => {
      if (key === 'stock') {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, value?.toString() || '')
      }
    })
    
    // Add images
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image)
      })
    }

    const response = await api.post('/product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Update product
  updateProduct: async (id: string, productData: UpdateProductDto): Promise<Product> => {
    const response = await api.patch(`/product/${id}`, productData)
    return response.data
  },

  // Delete product
  deleteProduct: async (id: string): Promise<{ message: string; deletedImagesCount: number }> => {
    const response = await api.delete(`/product/${id}`)
    return response.data
  },

  // Get products by size
  getProductsBySize: async (sizeId: string, page = 1, limit = 8): Promise<ProductsResponse> => {
    const response = await api.get(`/product/by-size/${sizeId}?page=${page}&limit=${limit}`)
    return response.data
  },

  // Increment product quantity
  incrementQuantity: async (productId: string, sizeId: string): Promise<Product> => {
    const response = await api.patch(`/product/${productId}/increment/${sizeId}`)
    return response.data
  },

  // Decrement product quantity (sell)
  decrementQuantity: async (productId: string, sizeId: string): Promise<Product> => {
    const response = await api.patch(`/product/${productId}/decrement/${sizeId}`)
    return response.data
  },

  // Get investment total
  getInvestment: async (): Promise<{ totalInversion: number; message: string }> => {
    const response = await api.get('/product/inversion')
    return response.data
  },

  // Get sizes for category
  getSizesForCategory: async (categoryId: string) => {
    const response = await api.get(`/product/sizes-for-category/${categoryId}`)
    return response.data
  },
}