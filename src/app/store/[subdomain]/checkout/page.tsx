'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { api } from '@/lib/api'
import { useCart } from '@/contexts/cart-context'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: any
  settings?: {
    email?: string
    phone?: string
    address?: string
    whatsapp?: string
    whatsappEnabled?: boolean
    instagram?: string
    facebook?: string
  }
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const subdomain = params.subdomain as string
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const { items, getTotalWithDiscount, clearCart } = useCart()
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: ''
  })

  useEffect(() => {
    fetchStoreData()
    
    // Redirigir si el carrito está vacío
    if (items.length === 0) {
      router.push(`/store/${subdomain}/carrito`)
    }
  }, [subdomain, items])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerName || !formData.customerPhone) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      setSubmitting(true)
      
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      // Validar que todos los items tengan sizeId
      const invalidItems = items.filter(item => !item.sizeId)
      if (invalidItems.length > 0) {
        alert('Error: Algunos productos en el carrito no tienen talle seleccionado. Por favor revisa tu carrito.')
        return
      }
      
      // Preparar los items del pedido
      const orderItems = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        sizeId: item.sizeId || '', // Fallback para evitar undefined
        sizeName: item.sizeName || 'Sin nombre',
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0
      }))

      // Guardar información del cliente y pedido en localStorage para el tracking
      localStorage.setItem('lastCustomerName', formData.customerName)
      localStorage.setItem('lastCustomerPhone', formData.customerPhone)
      localStorage.setItem('lastCustomerEmail', formData.customerEmail)
      localStorage.setItem('lastOrderTotal', getTotalWithDiscount().toString())
      localStorage.setItem('lastOrderItems', JSON.stringify(
        items.map(item => ({
          productName: item.productName,
          image: item.image,
          sizeName: item.sizeName,
          quantity: item.quantity,
          price: item.price
        }))
      ))

      // Crear el pedido
      const response = await api.post(`/public/order/${targetSubdomain}`, {
        ...formData,
        items: orderItems
      })

      if (response.data?.order) {
        const orderNumber = response.data.order._id || response.data.order.orderNumber
        
        // Guardar información completa del pedido
        const orderInfo = {
          orderNumber: orderNumber,
          date: new Date().toISOString(),
          status: 'pending',
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          total: getTotalWithDiscount(),
          items: items.map(item => ({
            productName: item.productName,
            image: item.image,
            sizeName: item.sizeName,
            quantity: item.quantity,
            price: item.price
          })),
          storePhone: storeData?.settings?.phone,
          storeWhatsapp: storeData?.settings?.whatsapp
        }
        
        // Guardar con el número de orden para búsquedas
        localStorage.setItem(`order_${orderNumber}`, JSON.stringify(orderInfo))
        
        // Limpiar carrito
        clearCart()

        // Redirigir a página de confirmación
        router.push(`/store/${subdomain}/pedido-confirmado?orderId=${orderNumber}`)
      }
      
    } catch (error: any) {
      console.error('Error creating order:', error)
      alert(error.response?.data?.message || 'Error al crear el pedido. Por favor intenta nuevamente.')
    } finally {
      setSubmitting(false)
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/store/${subdomain}/carrito`}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al carrito
          </Link>
          <h1 className="text-3xl font-bold">Finalizar pedido</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Información de contacto</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      id="customerPhone"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: 1122334455"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      id="customerEmail"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Ej: Horario de entrega preferido, instrucciones especiales..."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Procesando...' : 'Confirmar pedido'}
              </button>
            </form>
          </div>

          {/* Resumen del pedido */}
          <div>
            <div className="bg-gray-50 p-6 rounded-lg sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
              
              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const itemTotal = item.price * item.quantity
                  const discount = (itemTotal * item.discount) / 100
                  const finalPrice = itemTotal - discount

                  return (
                    <div key={`${item.productId}-${item.sizeId}`} className="flex items-start gap-3">
                      {/* Mini imagen */}
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Sin imagen
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-gray-600">
                          Talle: {item.sizeName} | Cantidad: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold">${finalPrice.toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total a pagar</span>
                  <span>${getTotalWithDiscount().toLocaleString('es-AR')}</span>
                </div>
                
                <p className="text-sm text-gray-600 mt-2">
                  * El pago se coordinará con la tienda después de confirmar el pedido
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}