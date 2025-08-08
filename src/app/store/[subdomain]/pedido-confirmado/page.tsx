'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { api } from '@/lib/api'
import { CheckCircle, Package, Copy, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/contexts/cart-context'
import toast from 'react-hot-toast'

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
  const [orderSaved, setOrderSaved] = useState(false)
  const { clearCart } = useCart()

  useEffect(() => {
    fetchStoreData()
    
    // Guardar información del pedido en localStorage
    if (orderId && !orderSaved) {
      const orderData = {
        orderNumber: orderId,
        date: new Date().toISOString(),
        status: 'pending',
        subdomain: subdomain
      }
      
      // Guardar como último pedido
      localStorage.setItem(`lastOrder_${subdomain}`, JSON.stringify(orderData))
      // También guardar con el número de orden para búsquedas
      localStorage.setItem(`order_${orderId}`, JSON.stringify({
        ...orderData,
        customerName: localStorage.getItem('lastCustomerName') || 'Cliente',
        customerPhone: localStorage.getItem('lastCustomerPhone') || '',
        customerEmail: localStorage.getItem('lastCustomerEmail') || '',
        total: parseFloat(localStorage.getItem('lastOrderTotal') || '0'),
        items: JSON.parse(localStorage.getItem('lastOrderItems') || '[]')
      }))
      
      // Limpiar el carrito
      clearCart()
      setOrderSaved(true)
    }
  }, [subdomain, orderId, orderSaved, clearCart])

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

  const copyOrderNumber = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId)
      toast.success('Número de pedido copiado')
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
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">¡Pedido confirmado!</h1>
          <p className="text-gray-600 text-lg">
            Tu pedido ha sido recibido exitosamente
          </p>
        </div>

        {/* Order Number Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Número de pedido</p>
              <p className="text-2xl font-bold text-gray-900">{orderId}</p>
            </div>
            <button
              onClick={copyOrderNumber}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="Copiar número de pedido"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <p className="text-blue-700">
              <strong>💡 Consejo:</strong> Guarda este número para hacer seguimiento de tu pedido
            </p>
          </div>
          
          <p className="text-gray-600 text-sm">
            En breve nos pondremos en contacto contigo para coordinar la entrega y el pago.
            Recibirás una notificación cuando tu pedido esté listo.
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link 
            href={`/store/${subdomain}/tracking?order=${orderId}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            <Package className="w-5 h-5" />
            Ver estado del pedido
          </Link>
          
          <Link 
            href={`/store/${subdomain}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            Seguir comprando
          </Link>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📦</div>
            <p className="text-sm font-medium">Preparación</p>
            <p className="text-xs text-gray-600">24-48 horas</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📱</div>
            <p className="text-sm font-medium">Notificación</p>
            <p className="text-xs text-gray-600">Por WhatsApp</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🏪</div>
            <p className="text-sm font-medium">Retiro</p>
            <p className="text-xs text-gray-600">En tienda</p>
          </div>
        </div>

        {/* Tracking Link */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
          <h3 className="font-semibold mb-2">¿Quieres ver el estado de tu pedido?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Puedes hacer seguimiento en tiempo real de tu pedido usando tu número de orden
          </p>
          <Link
            href={`/store/${subdomain}/tracking`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Ir a seguimiento de pedidos
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Contact */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>¿Tienes alguna pregunta?</p>
          <p>No dudes en contactarnos</p>
        </div>
      </div>
    </StoreLayout>
  )
}