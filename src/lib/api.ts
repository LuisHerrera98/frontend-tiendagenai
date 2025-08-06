import axios from 'axios'
import Cookies from 'js-cookie'

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
  const token = Cookies.get('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Agregar tenantId si existe
  const userStr = Cookies.get('auth_user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user?.tenantId) {
        config.headers['X-Tenant-Id'] = user.tenantId
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
    const errorInfo = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      requestData: error.config?.data
    }
    console.error('API Error:', errorInfo)
    
    // Si es error 401, limpiar cookies y redirigir a login
    if (error.response?.status === 401) {
      Cookies.remove('auth_token')
      Cookies.remove('auth_user')
      window.location.href = '/auth/login'
    }
    
    // Para debugging adicional
    if (error.response) {
      console.error('Response error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      })
    } else if (error.request) {
      console.error('Request error:', error.request)
    } else {
      console.error('Setup error:', error.message)
    }
    
    return Promise.reject(error)
  }
)