'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface FreeShippingBannerProps {
  enabled?: boolean
  minAmount?: number
  text?: string
}

export function FreeShippingBanner({ 
  enabled = false, 
  minAmount = 0, 
  text = 'ENVÍOS GRATIS SUPERANDO LOS' 
}: FreeShippingBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Array de mensajes que rotarán (solo si quieres agregar más en el futuro)
  const messages = [
    `${text} $${minAmount.toLocaleString('es-AR')}`
  ]

  // Auto-rotar mensajes cada 5 segundos (si hay más de uno)
  useEffect(() => {
    if (!enabled || messages.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [enabled, messages.length])

  if (!enabled) return null

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % messages.length)
  }

  return (
    <div className="bg-black text-white relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-2.5 sm:py-3">
          {/* Botón anterior (solo si hay múltiples mensajes) */}
          {messages.length > 1 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Mensaje anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Mensaje central */}
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium tracking-wider uppercase">
              {messages[currentIndex]}
            </p>
          </div>

          {/* Botón siguiente (solo si hay múltiples mensajes) */}
          {messages.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Siguiente mensaje"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}