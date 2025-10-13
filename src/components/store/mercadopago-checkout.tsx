'use client'

import { useEffect, useState } from 'react'
import { initMercadoPago } from '@mercadopago/sdk-react'
import { Button } from '@/components/ui/button'
import { CreditCard, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface MercadoPagoCheckoutProps {
  orderId: string
  subdomain: string
  onSuccess?: () => void
  onError?: (error: any) => void
}

export function MercadoPagoCheckout({ 
  orderId, 
  subdomain,
  onSuccess,
  onError 
}: MercadoPagoCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [initPoint, setInitPoint] = useState<string | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [paymentConfig, setPaymentConfig] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentConfig()
  }, [subdomain])

  const fetchPaymentConfig = async () => {
    try {
      const response = await api.get(`/public/payment-config/${subdomain}`)
      setPaymentConfig(response.data)
      
      if (response.data.enabled && response.data.publicKey) {
        setPublicKey(response.data.publicKey)
        // Inicializar MercadoPago con la public key
        initMercadoPago(response.data.publicKey, {
          locale: 'es-AR'
        })
      }
    } catch (err) {
      console.error('Error fetching payment config:', err)
      setError('Error al cargar la configuración de pago')
    }
  }

  const handleCreatePreference = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.post(
        `/public/order/${subdomain}/${orderId}/payment-preference`
      )
      
      if (response.data.preferenceId) {
        setPreferenceId(response.data.preferenceId)

        // Guardar initPoint para redirigir
        if (response.data.initPoint) {
          setInitPoint(response.data.initPoint)
          // Redirigir automáticamente al checkout
          window.location.href = response.data.initPoint
        }
      } else {
        throw new Error('No se pudo crear la preferencia de pago')
      }
    } catch (err: any) {
      console.error('Error creating preference:', err)
      const errorMessage = err.response?.data?.message || 'Error al iniciar el pago'
      setError(errorMessage)
      toast.error(errorMessage)
      if (onError) onError(err)
    } finally {
      setLoading(false)
    }
  }

  // Si no está habilitado Mercado Pago, no mostrar nada
  if (!paymentConfig?.enabled || !paymentConfig?.available) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Pago con Mercado Pago
        </h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Paga de forma segura con tarjeta de crédito, débito o con tu cuenta de Mercado Pago.
          </p>

          <Button
            onClick={handleCreatePreference}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? (
              'Redirigiendo al pago...'
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar con Mercado Pago
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
            <img
              src="https://http2.mlstatic.com/storage/logos-api-admin/a5f047d0-9be0-11ec-aad4-c3381f368aaf-m.svg"
              alt="Mercado Pago"
              className="h-4"
            />
            <span>Procesado de forma segura</span>
          </div>
        </div>
      </div>
    </div>
  )
}