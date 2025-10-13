'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { StoreLayout } from '@/components/store/store-layout'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function PaymentSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const [storeData, setStoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Parámetros de MercadoPago
  const collectionId = searchParams.get('collection_id')
  const collectionStatus = searchParams.get('collection_status')
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  const externalReference = searchParams.get('external_reference')
  const paymentType = searchParams.get('payment_type')
  const merchantOrderId = searchParams.get('merchant_order_id')
  const preferenceId = searchParams.get('preference_id')
  const siteId = searchParams.get('site_id')
  const processingMode = searchParams.get('processing_mode')
  const merchantAccountId = searchParams.get('merchant_account_id')

  useEffect(() => {
    fetchStoreData()
    
    // Limpiar el carrito después de pago exitoso
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart')
    }
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
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">¡Pago Exitoso!</h1>
          
          <p className="text-gray-600 mb-8">
            Tu pago ha sido procesado exitosamente. Recibirás un email de confirmación con los detalles de tu pedido.
          </p>
          
          {externalReference && (
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <p className="text-sm text-gray-600 mb-2">Número de pedido:</p>
              <p className="text-lg font-semibold">{externalReference}</p>
            </div>
          )}
          
          {paymentId && (
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <p className="text-sm text-gray-600 mb-2">ID de pago:</p>
              <p className="text-lg font-mono">{paymentId}</p>
              {paymentType && (
                <p className="text-sm text-gray-500 mt-2">
                  Método: {paymentType.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            <Link href={`/store/${subdomain}/tracking`}>
              <Button className="w-full sm:w-auto">
                Ver estado del pedido
              </Button>
            </Link>
            
            <Link href={`/store/${subdomain}`}>
              <Button variant="outline" className="w-full sm:w-auto ml-0 sm:ml-3">
                Volver a la tienda
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Importante:</strong> Guarda el número de pedido para hacer seguimiento de tu compra.
              Si tienes alguna pregunta, no dudes en contactarnos.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}