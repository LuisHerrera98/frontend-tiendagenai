// Rate limiter simple en memoria
// Para producción, usar Redis o una solución más robusta

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 5 intentos en 15 minutos por defecto
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
    
    // Limpiar entradas expiradas cada minuto
    if (typeof window === 'undefined') { // Solo en servidor
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 60 * 1000)
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.attempts.entries()) {
      if (entry.resetTime < now) {
        this.attempts.delete(key)
      }
    }
  }

  check(identifier: string): { allowed: boolean; remainingAttempts: number; resetTime: number } {
    const now = Date.now()
    const entry = this.attempts.get(identifier)

    if (!entry || entry.resetTime < now) {
      // Nueva ventana de tiempo
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return {
        allowed: true,
        remainingAttempts: this.maxAttempts - 1,
        resetTime: now + this.windowMs
      }
    }

    if (entry.count >= this.maxAttempts) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: entry.resetTime
      }
    }

    // Incrementar contador
    entry.count++
    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - entry.count,
      resetTime: entry.resetTime
    }
  }

  reset(identifier: string) {
    this.attempts.delete(identifier)
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.attempts.clear()
  }
}

// Diferentes limitadores para diferentes acciones
export const loginLimiter = new RateLimiter(5, 15 * 60 * 1000) // 5 intentos en 15 minutos
export const apiLimiter = new RateLimiter(100, 60 * 1000) // 100 requests por minuto
export const uploadLimiter = new RateLimiter(10, 5 * 60 * 1000) // 10 uploads en 5 minutos

// Hook para usar en componentes
import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

export function useRateLimiter(limiter: RateLimiter, identifier?: string) {
  const [isLimited, setIsLimited] = useState(false)

  const checkLimit = useCallback((customIdentifier?: string) => {
    const id = customIdentifier || identifier || 'default'
    const result = limiter.check(id)
    
    if (!result.allowed) {
      const minutesRemaining = Math.ceil((result.resetTime - Date.now()) / 60000)
      toast.error(`Demasiados intentos. Intenta de nuevo en ${minutesRemaining} minutos.`)
      setIsLimited(true)
      return false
    }
    
    if (result.remainingAttempts <= 2) {
      toast(`Te quedan ${result.remainingAttempts} intentos.`, {
        icon: '⚠️',
      })
    }
    
    setIsLimited(false)
    return true
  }, [limiter, identifier])

  const resetLimit = useCallback((customIdentifier?: string) => {
    const id = customIdentifier || identifier || 'default'
    limiter.reset(id)
    setIsLimited(false)
  }, [limiter, identifier])

  return { checkLimit, resetLimit, isLimited }
}