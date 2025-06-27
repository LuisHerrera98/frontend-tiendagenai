'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'testadmin'
    console.log('Admin password from env:', process.env.NEXT_PUBLIC_ADMIN_PASSWORD)
    console.log('Final admin password:', adminPassword)
    
    if (password === adminPassword) {
      document.cookie = 'admin-auth=true; path=/; max-age=86400'
      router.push('/admin/dashboard')
    } else {
      setError('Contraseña incorrecta')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="text-center text-xl sm:text-2xl font-bold text-gray-800">
            Admin Login
          </CardTitle>
          <p className="text-center text-sm text-gray-600">
            Acceso al panel de administración
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa la contraseña de administrador"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 sm:h-11"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm text-center font-medium">{error}</p>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}