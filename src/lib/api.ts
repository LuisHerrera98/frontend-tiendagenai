import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

console.log('Environment variable:', process.env.NEXT_PUBLIC_API_URL)
console.log('Final API URL:', API_URL)

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos timeout
})

// Request interceptor
api.interceptors.request.use((config) => {
  // Agregar token de autenticación si existe
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Agregar tenantId si existe
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user?.currentTenantId) {
        config.headers['X-Tenant-Id'] = user.currentTenantId
      }
    } catch (error) {
      console.error('Error parsing user:', error)
    }
  }

  // Solo log para requests importantes o de debugging
  if (config.url?.includes('/sell/register')) {
    console.log('Sale request:', config.method?.toUpperCase(), config.url)
  }
  if (config.url?.includes('/exchange')) {
    console.log('Exchange request:', config.method?.toUpperCase(), config.url)
    console.log('Exchange data:', config.data)
  }
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Solo log para responses importantes
    if (response.config.url?.includes('/sell/register')) {
      console.log('Sale registered successfully')
    }
    return response
  },
  (error) => {
    // Si es error 401, limpiar localStorage y redirigir a login
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('tenant_subdomain')
      window.location.href = '/auth/login'
    }
    
    // Solo loguear errores que no sean controlados (400) o que sean críticos
    const isControlledError = error.response?.status === 400 && 
                             (error.response?.data?.error || 
                              error.response?.data?.message);
    
    // Siempre loguear errores 403 (Forbidden) para debugging
    if (error.response?.status === 403) {
      console.error('Error 403 - Forbidden:', {
        url: error.config?.url,
        headers: error.config?.headers,
        data: error.response?.data
      });
    }
    
    // Solo loguear si no es un error controlado o si estamos en modo debug
    if (!isControlledError && error.response?.status !== 403) {
      const errorInfo = {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      }
      console.error('API Error:', errorInfo)
      
      // Para debugging adicional de errores no controlados
      if (error.response && error.response.status >= 500) {
        console.error('Server error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        })
      }
    }
    
    return Promise.reject(error)
  }
)