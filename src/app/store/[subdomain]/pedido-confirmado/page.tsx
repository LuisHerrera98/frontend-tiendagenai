'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { api } from '@/lib/api'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: any
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  const orderId = searchParams.get('orderId')
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStoreData()
  }, [subdomain])

  const fetchStoreData = async () => {
    try {
      setLoading(true)
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const response = await api.get(`/public/store/${targetSubdomain}`)
      setStoreData(response.data)
    } catch (err) {
      console.error('Error fetching store:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <StoreLayout storeData={storeData}>
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="mb-8">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">¡Pedido confirmado!</h1>
          <p className="text-gray-600 text-lg">
            Tu pedido ha sido recibido exitosamente
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-600 mb-2">Número de pedido:</p>
          <p className="text-xl font-semibold mb-4">{orderId}</p>
          
          <p className="text-gray-600">
            En breve nos pondremos en contacto contigo para coordinar la entrega y el pago.
          </p>
        </div>

        <div className="space-y-4">
          <Link 
            href={`/store/${subdomain}`}
            className="inline-block px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800"
          >
            Volver a la tienda
          </Link>
          
          <p className="text-sm text-gray-500">
            Si tienes alguna pregunta, no dudes en contactarnos
          </p>
        </div>
      </div>
    </StoreLayout>
  )
}