'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Search, Package, Clock, CheckCircle, Truck, XCircle, Phone, MessageSquare } from 'lucide-react'
import { api } from '@/lib/api'
import Image from 'next/image'

interface OrderData {
  orderNumber: string
  date: string
  status: 'pending' | 'armado' | 'entregado' | 'cancelado'
  customerName: string
  customerPhone: string
  customerEmail: string
  total: number
  items: Array<{
    productName: string
    image?: string
    sizeName: string
    quantity: number
    price: number
  }>
  estimatedDelivery?: string
  storePhone?: string
  storeWhatsapp?: string
}

const statusInfo = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    message: 'Tu pedido ha sido recibido y está siendo procesado'
  },
  armado: {
    label: 'Listo para retirar',
    color: 'bg-blue-100 text-blue-800',
    icon: Package,
    message: '¡Tu pedido está listo! Puedes pasar a retirarlo'
  },
  entregado: {
    label: 'Entregado',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    message: 'Tu pedido ha sido entregado exitosamente'
  },
  cancelado: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    message: 'Tu pedido ha sido cancelado'
  }
}

export default function TrackingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState('')
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const subdomain = params.subdomain as string

  useEffect(() => {
    // Si viene con número de orden en la URL, buscarlo automáticamente
    const orderFromUrl = searchParams.get('order')
    if (orderFromUrl) {
      setOrderNumber(orderFromUrl)
      searchOrder(orderFromUrl)
    }
    
    // También intentar cargar el último pedido del localStorage
    const lastOrder = localStorage.getItem(`lastOrder_${subdomain}`)
    if (lastOrder && !orderFromUrl) {
      try {
        const parsed = JSON.parse(lastOrder)
        if (parsed.orderNumber) {
          setOrderNumber(parsed.orderNumber)
          setOrderData(parsed)
        }
      } catch (e) {
        console.error('Error loading last order:', e)
      }
    }
  }, [subdomain, searchParams])

  const searchOrder = async (orderNum?: string) => {
    const searchNumber = orderNum || orderNumber
    if (!searchNumber) {
      setError('Por favor ingresa un número de pedido')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Intentar buscar en la API
      const response = await api.get(`/public/order-status/${subdomain}/${searchNumber}`)
      
      if (response.data) {
        const orderInfo: OrderData = {
          orderNumber: response.data.orderNumber,
          date: new Date(response.data.createdAt).toLocaleDateString(),
          status: response.data.status,
          customerName: response.data.customerName,
          customerPhone: response.data.customerPhone,
          customerEmail: response.data.customerEmail,
          total: response.data.total,
          items: response.data.items,
          estimatedDelivery: response.data.estimatedDelivery,
          storePhone: response.data.storePhone,
          storeWhatsapp: response.data.storeWhatsapp
        }
        
        setOrderData(orderInfo)
        // Guardar en localStorage para acceso rápido
        localStorage.setItem(`order_${searchNumber}`, JSON.stringify(orderInfo))
      }
    } catch (err) {
      // Si no encuentra en API, buscar en localStorage
      const localOrder = localStorage.getItem(`order_${searchNumber}`)
      if (localOrder) {
        try {
          setOrderData(JSON.parse(localOrder))
        } catch (e) {
          setError('No pudimos encontrar tu pedido. Verifica el número e intenta nuevamente.')
        }
      } else {
        setError('No pudimos encontrar tu pedido. Verifica el número e intenta nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = () => {
    if (!orderData) return 0
    switch (orderData.status) {
      case 'pending': return 33
      case 'armado': return 66
      case 'entregado': return 100
      case 'cancelado': return 0
      default: return 0
    }
  }

  const StatusIcon = orderData ? statusInfo[orderData.status].icon : Clock

  const sendWhatsApp = () => {
    if (!orderData?.storeWhatsapp) return
    const message = `Hola, quiero consultar sobre mi pedido #${orderData.orderNumber}`
    window.open(`https://wa.me/${orderData.storeWhatsapp}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const callStore = () => {
    if (!orderData?.storePhone) return
    window.location.href = `tel:${orderData.storePhone}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Seguimiento de Pedido
          </h1>
          <p className="text-gray-600">
            Ingresa tu número de pedido para ver el estado
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
              placeholder="Ej: ORD-12345"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
            <button
              onClick={() => searchOrder()}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Buscar
            </button>
          </div>
          {error && (
            <p className="mt-3 text-red-600 text-sm">{error}</p>
          )}
        </div>

        {/* Order Details */}
        {orderData && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Pedido #{orderData.orderNumber}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Realizado el {orderData.date}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full ${statusInfo[orderData.status].color} flex items-center gap-2`}>
                  <StatusIcon className="w-5 h-5" />
                  <span className="font-medium">
                    {statusInfo[orderData.status].label}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {orderData.status !== 'cancelado' && (
                <div className="mb-6">
                  <div className="relative">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${getProgressPercentage()}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span className={orderData.status === 'pending' ? 'font-bold text-blue-600' : ''}>
                        Recibido
                      </span>
                      <span className={orderData.status === 'armado' ? 'font-bold text-blue-600' : ''}>
                        Preparando
                      </span>
                      <span className={orderData.status === 'entregado' ? 'font-bold text-blue-600' : ''}>
                        Entregado
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <p className="text-blue-700">
                  {statusInfo[orderData.status].message}
                </p>
                {orderData.status === 'armado' && orderData.estimatedDelivery && (
                  <p className="text-sm text-blue-600 mt-1">
                    Horario de retiro: {orderData.estimatedDelivery}
                  </p>
                )}
              </div>

              {/* Contact Buttons */}
              {orderData.status === 'armado' && (
                <div className="flex gap-3">
                  {orderData.storeWhatsapp && (
                    <button
                      onClick={sendWhatsApp}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      WhatsApp
                    </button>
                  )}
                  {orderData.storePhone && (
                    <button
                      onClick={callStore}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      Llamar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Productos del pedido</h3>
              <div className="space-y-4">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                    {item.image ? (
                      <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productName}</h4>
                      <p className="text-sm text-gray-500">
                        Talle: {item.sizeName} • Cantidad: {item.quantity}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        ${item.price * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${orderData.total}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Información de contacto</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Nombre:</span>{' '}
                  <span className="font-medium">{orderData.customerName}</span>
                </p>
                <p>
                  <span className="text-gray-500">Teléfono:</span>{' '}
                  <span className="font-medium">{orderData.customerPhone}</span>
                </p>
                {orderData.customerEmail && (
                  <p>
                    <span className="text-gray-500">Email:</span>{' '}
                    <span className="font-medium">{orderData.customerEmail}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>¿No encuentras tu pedido?</p>
          <p>Contacta con nosotros para más información</p>
        </div>
      </div>
    </div>
  )
}