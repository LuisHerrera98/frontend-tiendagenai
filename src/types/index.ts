export interface Product {
  _id: string
  name: string
  code: string
  category_id?: string
  type_id?: string
  brand_id?: string
  brand_name?: string
  model_name?: string
  color_id?: string
  cost: number
  price: number
  discount: number
  active: boolean
  gender_id?: string
  genders?: string[]  // Array de géneros
  images: string[]  // Ahora son URLs directas
  stock: ProductStock[]
  stockType?: 'sizes' | 'unit'  // Tipo de stock: por talles o unidad
  createdAt: string
  updatedAt: string
}

// Este tipo se usa para las ventas (Sales)
export interface ProductImage {
  url: string
  publicId: string
}

export interface ProductStock {
  size_id: string
  size_name: string
  quantity: number
  available: boolean
}

export interface Category {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Size {
  _id: string
  name: string
  category_id: string
  createdAt: string
  updatedAt: string
}

export interface Brand {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Color {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Sell {
  _id: string
  product_id: string
  product_name: string
  size_id: string
  size_name: string
  price: number
  cost: number
  images: ProductImage[]
  createdAt: string
}

export interface CreateProductDto {
  name: string
  category_id?: string
  model_name?: string
  brand_name?: string
  brand_id?: string
  type_id?: string
  gender_id?: string
  genders?: string[]
  color_id?: string
  cost: number
  price: number
  discount?: number
  active?: boolean
  gender?: 'hombre' | 'mujer' | 'unisex'
  stock: Omit<ProductStock, 'available'>[]
  stockType?: 'sizes' | 'unit'
  images?: string[]  // Array of URLs from Cloudinary
}

export interface UpdateProductDto {
  name?: string
  category_id?: string
  model_name?: string
  brand_name?: string
  brand_id?: string
  type_id?: string
  gender_id?: string
  genders?: string[]
  color_id?: string
  cost?: number
  price?: number
  discount?: number
  active?: boolean
  gender?: 'hombre' | 'mujer' | 'unisex'
  stock?: ProductStock[]
  stockType?: 'sizes' | 'unit'
  images?: string[] | ProductImage[]  // Can be URLs or existing images
}

export interface ProductFilters {
  categoryId?: string
  brandName?: string
  modelName?: string
  sizeName?: string
  name?: string
  gender?: 'hombre' | 'mujer' | 'unisex'
  colorId?: string
  active?: boolean // Filtro de estado activo/inactivo
  page?: number
  limit?: number
  showAll?: boolean // Para mostrar productos inactivos en admin
}

export interface ProductsResponse {
  data: Product[]
  total: number
  page: number
  totalPages: number
  filters?: ProductFilters
}

export interface FiltersResponse {
  brands: string[]
  models: string[]
  sizes: string[]
}

export interface Brand {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Type {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface CreateBrandDto {
  name: string
}

export interface UpdateBrandDto {
  name?: string
}

export interface CreateTypeDto {
  name: string
}

export interface UpdateTypeDto {
  name?: string
}

export interface Gender {
  _id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface CreateGenderDto {
  name: string
}

export interface UpdateGenderDto {
  name?: string
}