'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Menu, Store, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TenantSwitcher } from './tenant-switcher'

interface AdminHeaderProps {
  onMenuClick?: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [subdomain, setSubdomain] = useState<string>('')
  
  useEffect(() => {
    // Función para actualizar el subdominio
    const updateSubdomain = () => {
      const tenantSubdomain = localStorage.getItem('tenant_subdomain')
      console.log('Admin Header - tenant_subdomain from localStorage:', tenantSubdomain)
      setSubdomain(tenantSubdomain || '')
    }
    
    // Obtener el subdominio inicial
    updateSubdomain()
    
    // Escuchar cambios en localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'tenant_subdomain') {
        updateSubdomain()
      }
    }
    
    // Escuchar también eventos personalizados para cambios dentro de la misma pestaña
    const handleTenantChange = () => {
      updateSubdomain()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('tenantChanged', handleTenantChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('tenantChanged', handleTenantChange)
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/auth/login'
  }

  const getStoreUrl = () => {
    // En desarrollo
    if (window.location.hostname.includes('localhost') || window.location.hostname.includes('tiendagenai.local')) {
      return `http://${subdomain}.tiendagenai.local:3001`
    }
    // En producción
    return `https://${subdomain}.tiendagenai.com`
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="md:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          {/* Selector de tiendas */}
          <TenantSwitcher />
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {subdomain && (
            <a 
              href={getStoreUrl()} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 border-green-200">
                <Store className="w-4 h-4 sm:mr-2 text-green-600" />
                <span className="hidden sm:inline text-green-700">Ver Mi Tienda</span>
              </Button>
            </a>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  )
}