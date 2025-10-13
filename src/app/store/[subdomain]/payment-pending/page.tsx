'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { StoreLayout } from '@/components/store/store-layout'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function PaymentPendingPage() {
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
  const paymentType = searchParams.get('payment_type')

  useEffect(() => {
    fetchStoreData()
    
    // Limpiar el carrito ya que el pedido está en proceso
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
            <div className="bg-yellow-100 p-4 rounded-full">
              <Clock className="w-16 h-16 text-yellow-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Pago Pendiente</h1>
          
          <p className="text-gray-600 mb-8">
            Tu pago está siendo procesado. Te notificaremos por email cuando se complete.
          </p>
          
          {externalReference && (
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <p className="text-sm text-gray-600 mb-2">Número de pedido:</p>
              <p className="text-lg font-semibold">{externalReference}</p>
            </div>
          )}
          
          {paymentType && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-8">
              <p className="text-sm text-blue-800">
                <strong>Método de pago:</strong> {paymentType.replace(/_/g, ' ')}
              </p>
              {paymentType === 'ticket' && (
                <p className="text-sm text-blue-700 mt-2">
                  Los pagos con boleto pueden tardar hasta 48 horas hábiles en procesarse.
                </p>
              )}
              {paymentType === 'bank_transfer' && (
                <p className="text-sm text-blue-700 mt-2">
                  Las transferencias bancarias pueden tardar hasta 24 horas hábiles en procesarse.
                </p>
              )}
            </div>
          )}
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold mb-3">¿Qué sigue?</h3>
            <ul className="text-sm text-gray-600 text-left space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Tu pedido ha sido registrado</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">⏳</span>
                <span>Estamos esperando la confirmación del pago</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">○</span>
                <span>Una vez confirmado, prepararemos tu pedido</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-400 mr-2">○</span>
                <span>Recibirás un email con los detalles de envío</span>
              </li>
            </ul>
          </div>
          
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
          
          <div className="mt-12 p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Importante:</strong> Guarda el número de pedido. Te enviaremos un email 
              cuando tu pago sea confirmado. Si no recibes noticias en 48 horas, contáctanos.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}