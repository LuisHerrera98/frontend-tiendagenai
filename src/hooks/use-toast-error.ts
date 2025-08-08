import { useState } from 'react'

interface UseToastErrorReturn {
  showToast: boolean
  toastMessage: string
  toastType: 'error' | 'success' | 'warning' | 'info'
  handleError: (error: any, entityType: string) => void
  showSuccess: (message: string) => void
  setShowToast: (show: boolean) => void
}

export function useToastError(): UseToastErrorReturn {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning' | 'info'>('error')

  const handleError = (error: any, entityType: string) => {
    const errorData = error?.response?.data
    const errorCode = errorData?.error
    const message = errorData?.message

    // Mapeo de errores específicos
    const errorMessages: Record<string, Record<string, string>> = {
      DUPLICATE_CATEGORY: {
        default: 'Ya existe una categoría con ese nombre. Por favor, elige un nombre diferente.'
      },
      DUPLICATE_BRAND: {
        default: 'Ya existe una marca con ese nombre. Por favor, elige un nombre diferente.'
      },
      DUPLICATE_TYPE: {
        default: 'Ya existe un tipo con ese nombre. Por favor, elige un nombre diferente.'
      },
      DUPLICATE_GENDER: {
        default: 'Ya existe un género con ese nombre. Por favor, elige un nombre diferente.'
      },
      DUPLICATE_SIZE: {
        default: message || 'Ya existe una talla con ese nombre en esta categoría.'
      }
    }

    // Determinar el mensaje a mostrar
    let displayMessage = `Error al procesar ${entityType}. Por favor, intenta nuevamente.`
    
    if (errorCode && errorMessages[errorCode]) {
      displayMessage = errorMessages[errorCode].default
    } else if (message && (message.includes('Ya existe') || message.includes('duplica'))) {
      displayMessage = message
    }

    setToastMessage(displayMessage)
    setToastType('error')
    setShowToast(true)
  }

  const showSuccess = (message: string) => {
    setToastMessage(message)
    setToastType('success')
    setShowToast(true)
  }

  return {
    showToast,
    toastMessage,
    toastType,
    handleError,
    showSuccess,
    setShowToast
  }
}