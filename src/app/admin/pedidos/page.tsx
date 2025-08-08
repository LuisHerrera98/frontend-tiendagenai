'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { Package, Clock, CheckCircle, XCircle, Phone, MessageCircle, ChevronDown, ChevronUp, Mail, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Order {
  _id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  items: Array<{
    productId: string
    productName: string
    sizeId: string
    sizeName: string
    quantity: number
    price: number
    discount: number
    subtotal: number
  }>
  subtotal: number
  discount: number
  total: number
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  armado: 'Armado',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  armado: 'bg-blue-100 text-blue-800',
  entregado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    today: 0,
    todayRevenue: 0,
    totalRevenue: 0
  })
  const [selectedStatus, setSelectedStatus] = useState('todos')
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.get('/order')
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Error al cargar los pedidos')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/order/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/order/${orderId}/status`, { status: newStatus })
      toast.success('Estado actualizado')
      fetchOrders()
      fetchStats()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const filteredOrders = selectedStatus === 'todos' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus)

  const sendWhatsApp = (phone: string, customerName: string) => {
    // Limpiar el número de teléfono (quitar espacios y caracteres especiales)
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    const message = `Hola ${customerName}, tu pedido está listo para retirar. ¿Cuándo podrías pasar a buscarlo?`
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const callCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Gestión de Pedidos</h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pedidos</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pedidos Hoy</p>
              <p className="text-2xl font-bold">{stats.today}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Total</p>
              <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Hoy</p>
              <p className="text-2xl font-bold">${stats.todayRevenue.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={selectedStatus === 'todos' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('todos')}
          size="sm"
        >
          Todos
        </Button>
        <Button
          variant={selectedStatus === 'pending' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('pending')}
          size="sm"
          className="relative"
        >
          Pendientes
          {stats.pending > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {stats.pending}
            </span>
          )}
        </Button>
        <Button
          variant={selectedStatus === 'armado' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('armado')}
          size="sm"
        >
          Armados
        </Button>
        <Button
          variant={selectedStatus === 'entregado' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('entregado')}
          size="sm"
        >
          Entregados
        </Button>
        <Button
          variant={selectedStatus === 'cancelado' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('cancelado')}
          size="sm"
        >
          Cancelados
        </Button>
      </div>

      {/* Lista de pedidos */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No hay pedidos {selectedStatus !== 'todos' ? statusLabels[selectedStatus].toLowerCase() : ''}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order._id} className="overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleOrderExpansion(order._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-lg">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <div className="text-right">
                      <p className="font-bold text-lg">${order.total.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    {expandedOrders.has(order._id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Detalles expandidos */}
              {expandedOrders.has(order._id) && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información del cliente */}
                    <div>
                      <h3 className="font-semibold mb-3">Información del Cliente</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{order.customerPhone}</span>
                        </div>
                        {order.customerEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{order.customerEmail}</span>
                          </div>
                        )}
                        {order.notes && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm"><strong>Notas:</strong> {order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Productos */}
                    <div>
                      <h3 className="font-semibold mb-3">Productos</h3>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>
                              {item.productName} - Talle {item.sizeName} x{item.quantity}
                            </span>
                            <span className="font-medium">${item.subtotal.toLocaleString()}</span>
                          </div>
                        ))}
                        {order.discount > 0 && (
                          <div className="flex justify-between text-sm pt-2 border-t">
                            <span>Descuento</span>
                            <span className="text-red-600">-${order.discount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total</span>
                          <span>${order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="mt-6 pt-4 border-t flex gap-2 flex-wrap">
                    {order.status === 'pending' && (
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order._id, 'armado')
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Marcar como Armado
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order._id, 'cancelado')
                          }}
                          variant="destructive"
                          size="sm"
                        >
                          Cancelar Pedido
                        </Button>
                      </>
                    )}

                    {order.status === 'armado' && (
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order._id, 'entregado')
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Marcar como Entregado
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            sendWhatsApp(order.customerPhone, order.customerName)
                          }}
                          variant="outline"
                          size="sm"
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            callCustomer(order.customerPhone)
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Llamar
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order._id, 'cancelado')
                          }}
                          variant="destructive"
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </>
                    )}

                    {order.status === 'entregado' && (
                      <div className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Pedido entregado exitosamente
                      </div>
                    )}

                    {order.status === 'cancelado' && (
                      <div className="text-sm text-red-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Pedido cancelado
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}