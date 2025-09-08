'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, Package, Home, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface OrderConfirmationModalProps {
  isOpen: boolean
  orderId: string
  subdomain: string
  customerEmail?: string
}

export function OrderConfirmationModal({ 
  isOpen, 
  orderId, 
  subdomain,
  customerEmail 
}: OrderConfirmationModalProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const copyOrderNumber = () => {
    if (!orderId) return
    
    // Método alternativo que funciona en más navegadores
    const textArea = document.createElement('textarea')
    textArea.value = orderId
    textArea.style.position = 'fixed'
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.width = '2em'
    textArea.style.height = '2em'
    textArea.style.padding = '0'
    textArea.style.border = 'none'
    textArea.style.outline = 'none'
    textArea.style.boxShadow = 'none'
    textArea.style.background = 'transparent'
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        setCopied(true)
        toast.success('Código copiado')
        setTimeout(() => setCopied(false), 2000)
      } else {
        // Seleccionar el texto para copiar manual
        const orderElement = document.getElementById('order-code')
        if (orderElement) {
          const range = document.createRange()
          const selection = window.getSelection()
          range.selectNodeContents(orderElement)
          selection?.removeAllRanges()
          selection?.addRange(range)
          toast('Selecciona el código y copia con Ctrl+C', {
            icon: '📋',
            duration: 3000,
          })
        }
      }
    } catch (err) {
      // Seleccionar el texto para copiar manual
      const orderElement = document.getElementById('order-code')
      if (orderElement) {
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(orderElement)
        selection?.removeAllRanges()
        selection?.addRange(range)
        toast('Selecciona el código y copia con Ctrl+C', {
          icon: '📋',
          duration: 3000,
        })
      }
    }
    
    document.body.removeChild(textArea)
  }

  const handleGoHome = () => {
    router.push(`/store/${subdomain}`)
  }

  const handleGoTracking = () => {
    router.push(`/store/${subdomain}/tracking?order=${orderId}`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          {/* Success Icon */}
          <div className="bg-green-50 py-6">
            <div className="flex justify-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
                <CheckCircle className="w-14 h-14 text-green-500" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Title */}
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Pedido Realizado!
              </h3>
              <p className="text-gray-600">
                El pedido está siendo revisado por la tienda, pronto te contactaremos.
              </p>
            </div>

            {/* Order Number */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Código de seguimiento
                  </p>
                  <p id="order-code" className="text-lg font-bold text-gray-900 mt-1 select-all">
                    {orderId}
                  </p>
                </div>
                <button
                  onClick={copyOrderNumber}
                  className={`p-2 rounded-lg transition-colors ${
                    copied 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Copiar código"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Email Info - Comentado porque el backend no envía emails aún */}
            {/* <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-6">
              <p className="text-sm text-blue-700">
                <strong>📧 Importante:</strong> Te enviaremos la confirmación por email
                {customerEmail && <span className="font-medium"> ({customerEmail})</span>}
              </p>
            </div> */}

            {/* What's Next */}
            <div className="space-y-2 mb-6">
              <p className="text-sm font-semibold text-gray-700">¿Qué sigue?</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>La tienda revisará tu pedido</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Te contactaremos para coordinar el pago y entrega</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Recibirás notificaciones del estado de tu pedido</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGoTracking}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Package className="w-5 h-5" />
                Seguimiento del pedido
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Home className="w-5 h-5" />
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}