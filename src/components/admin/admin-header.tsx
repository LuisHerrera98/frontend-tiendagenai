'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Menu } from 'lucide-react'

interface AdminHeaderProps {
  onMenuClick?: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
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
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
            Panel de Administración
          </h1>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Ver Tienda</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}