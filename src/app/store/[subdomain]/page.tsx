'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { ProductCatalog } from '@/components/store/product-catalog'
import { SimpleCategoryView } from '@/components/store/simple-category-view'
import { api } from '@/lib/api'
import type { StoreData } from '@/types'

export default function StorePage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStoreData()
  }, [subdomain])

  const fetchStoreData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // En desarrollo, usar el subdomain del localStorage si es 'test'
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const response = await api.get(`/public/store/${targetSubdomain}`)
      setStoreData(response.data)
    } catch (err: any) {
      console.error('Error fetching store:', err)
      setError(err.response?.data?.message || 'Error al cargar la tienda')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tienda...</p>
        </div>
      </div>
    )
  }

  if (error || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tienda no encontrada</h1>
          <p className="text-gray-600">{error || 'La tienda que buscas no existe'}</p>
        </div>
      </div>
    )
  }

  // Verificar si la tienda simple está habilitada
  const isSimpleStore = storeData.settings?.simpleStoreEnabled === true

  return (
    <StoreLayout storeData={storeData}>
      {isSimpleStore ? (
        <SimpleCategoryView 
          subdomain={storeData.subdomain} 
          storeName={storeData.storeName}
        />
      ) : (
        <ProductCatalog subdomain={storeData.subdomain} />
      )}
    </StoreLayout>
  )
}