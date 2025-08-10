'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'code' | 'password'>('code')

  useEffect(() => {
    // Obtener el email guardado desde la página anterior
    const savedEmail = localStorage.getItem('reset_email')
    if (savedEmail) {
      setEmail(savedEmail)
    } else {
      // Si no hay email, redirigir a forgot-password
      toast.error('Por favor, primero solicita un código de recuperación')
      router.push('/auth/forgot-password')
    }
  }, [router])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code || code.length !== 6) {
      toast.error('Por favor ingresa un código de 6 dígitos')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setStep('password')
        toast.success('Código verificado correctamente')
      } else {
        toast.error(data.message || 'Código inválido o expirado')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al verificar el código')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (!newPassword || !confirmPassword) {
      toast.error('Por favor completa todos los campos')
      return
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          code, 
          newPassword 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Contraseña actualizada exitosamente')
        // Limpiar localStorage
        localStorage.removeItem('reset_email')
        // Redirigir al login
        router.push('/auth/login')
      } else {
        toast.error(data.message || 'Error al actualizar la contraseña')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (value: string) => {
    // Solo permitir números y máximo 6 dígitos
    const numericValue = value.replace(/\D/g, '').slice(0, 6)
    setCode(numericValue)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link 
            href="/auth/forgot-password" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Link>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 'code' ? 'Verificar Código' : 'Nueva Contraseña'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === 'code' 
              ? 'Ingresa el código de 6 dígitos que enviamos a tu email'
              : 'Crea tu nueva contraseña'
            }
          </p>
          {email && (
            <p className="mt-1 text-center text-xs text-gray-500">
              Email: {email}
            </p>
          )}
        </div>

        {step === 'code' ? (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyCode}>
            <div>
              <Label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Código de verificación
              </Label>
              <div className="mt-1">
                <Input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="text-center text-2xl font-bold tracking-widest"
                  placeholder="000000"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {code.length}/6 dígitos
              </p>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full"
              >
                {isLoading ? 'Verificando...' : 'Verificar Código'}
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-green-600 hover:text-green-500"
              >
                ¿No recibiste el código? Solicitar nuevo código
              </Link>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Nueva contraseña
                </Label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar nueva contraseña
                </Label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Repite la contraseña"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600">
                  Las contraseñas no coinciden
                </p>
              )}

              {newPassword && newPassword.length < 6 && (
                <p className="text-sm text-yellow-600">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              )}
            </div>

            <div>
              <Button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}