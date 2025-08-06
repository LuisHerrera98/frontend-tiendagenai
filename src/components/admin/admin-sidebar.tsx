'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Ruler, 
  ShoppingCart,
  Users,
  LogOut,
  Grid3X3,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navigation = [
  { name: 'Inicio', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Categorías', href: '/admin/categorias', icon: Tags },
  { name: 'Tallas', href: '/admin/tallas', icon: Ruler },
  { name: 'Marcas', href: '/admin/marcas', icon: Users },
  { name: 'Tipos', href: '/admin/tipos', icon: Grid3X3 },
  { name: 'Géneros', href: '/admin/generos', icon: UserCheck },
  { name: 'Ventas', href: '/admin/ventas', icon: ShoppingCart },
]

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.clear()
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/auth/login'
  }

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && onClose && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-center h-16 bg-gray-900">
          <span className="text-white text-lg font-semibold">Admin Panel</span>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </>
  )
}