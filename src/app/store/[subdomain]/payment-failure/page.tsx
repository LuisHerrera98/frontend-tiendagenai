'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { StoreLayout } from '@/components/store/store-layout'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function PaymentFailurePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const subdomain = params.subdomain as string
  const [storeData, setStoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Parámetros de MercadoPago
  const collectionId = searchParams.get('collection_id')
  const collectionStatus = searchParams.get('collection_status')
  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')
  const externalReference = searchParams.get('external_reference')

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
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-red-100 p-4 rounded-full">
              <XCircle className="w-16 h-16 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Pago No Completado</h1>
          
          <p className="text-gray-600 mb-8">
            No se pudo procesar tu pago. Esto puede deberse a fondos insuficientes, 
            límites de tarjeta o datos incorrectos.
          </p>
          
          {externalReference && (
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <p className="text-sm text-gray-600 mb-2">Número de pedido:</p>
              <p className="text-lg font-semibold">{externalReference}</p>
            </div>
          )}
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8">
            <p className="text-sm text-yellow-800">
              <strong>¿Qué puedes hacer?</strong>
            </p>
            <ul className="text-sm text-yellow-700 mt-2 text-left list-disc list-inside">
              <li>Verifica que tu tarjeta tenga fondos suficientes</li>
              <li>Confirma que los datos ingresados sean correctos</li>
              <li>Intenta con otro método de pago</li>
              <li>Contacta a tu banco si el problema persiste</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Link href={`/store/${subdomain}/carrito`}>
              <Button className="w-full sm:w-auto">
                Volver al carrito
              </Button>
            </Link>
            
            <Link href={`/store/${subdomain}`}>
              <Button variant="outline" className="w-full sm:w-auto ml-0 sm:ml-3">
                Seguir comprando
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Si necesitas ayuda, no dudes en contactarnos. Tu carrito sigue disponible 
              para cuando quieras intentar nuevamente.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}