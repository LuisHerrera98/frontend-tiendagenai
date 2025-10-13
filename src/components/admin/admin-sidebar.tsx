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
  UserCheck,
  Settings,
  ClipboardList,
  Palette,
  Shield,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { Permission, UserRole } from '@/types/permissions'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  permission?: Permission | Permission[];
  disabled?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Inicio', href: '/admin/dashboard', icon: LayoutDashboard, permission: Permission.DASHBOARD_VIEW },
  { name: 'Productos', href: '/admin/productos', icon: Package, permission: Permission.PRODUCTS_VIEW },
  { name: 'Categorías', href: '/admin/categorias', icon: Tags, permission: [Permission.CATEGORIES_VIEW, Permission.CATEGORIES_MANAGE] },
  { name: 'Tallas', href: '/admin/tallas', icon: Ruler, permission: [Permission.SIZES_VIEW, Permission.SIZES_MANAGE] },
  { name: 'Marcas', href: '/admin/marcas', icon: Users, permission: [Permission.BRANDS_VIEW, Permission.BRANDS_MANAGE] },
  { name: 'Tipos', href: '/admin/tipos', icon: Grid3X3, permission: [Permission.TYPES_VIEW, Permission.TYPES_MANAGE] },
  { name: 'Géneros', href: '/admin/generos', icon: UserCheck, permission: [Permission.GENDERS_VIEW, Permission.GENDERS_MANAGE] },
  { name: 'Colores', href: '/admin/colores', icon: Palette, permission: [Permission.COLORS_VIEW, Permission.COLORS_MANAGE] },
  { name: 'Ventas', href: '/admin/ventas', icon: ShoppingCart, permission: Permission.SALES_VIEW },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ClipboardList, permission: Permission.ORDERS_VIEW },
  { name: 'Usuarios', href: '/admin/usuarios', icon: Shield, permission: Permission.USERS_VIEW },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings, permission: Permission.SETTINGS_VIEW },
  { name: 'Mercado Pago', href: '/admin/mercadopago', icon: CreditCard, permission: Permission.SETTINGS_VIEW },
]

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { hasPermission, user, role } = useAuth()
  
  // Función para obtener el nombre del rol en español
  const getRoleName = (role: UserRole | null) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador'
      case UserRole.VENDEDOR:
        return 'Vendedor'
      case UserRole.CUSTOM:
        return 'Personalizado'
      default:
        return ''
    }
  }
  
  // Filtrar navegación según permisos
  const filteredNavigation = navigation.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  })

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
        <div className="flex flex-col items-center justify-center min-h-[80px] bg-gray-900 px-4 py-3">
          <span className="text-white text-lg font-semibold mb-2">Admin Panel</span>
          {user && (
            <div className="text-center">
              <p className="text-gray-300 text-sm font-medium">{user.name}</p>
              <p className="text-gray-400 text-xs">{getRoleName(role)}</p>
            </div>
          )}
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            const isDisabled = item.disabled
            
            if (isDisabled) {
              return (
                <div
                  key={item.name}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-not-allowed opacity-50 text-gray-500"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
              )
            }
            
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