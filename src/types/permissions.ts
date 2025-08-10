export enum UserRole {
  ADMIN = 'admin',
  VENDEDOR = 'vendedor',
  CUSTOM = 'custom'
}

export enum Permission {
  // Productos
  PRODUCTS_VIEW = 'products.view',
  PRODUCTS_EDIT = 'products.edit',
  PRODUCTS_CREATE = 'products.create',
  PRODUCTS_DELETE = 'products.delete',
  PRODUCTS_COSTS = 'products.costs',
  PRODUCTS_STOCK = 'products.stock',
  PRODUCTS_DISCOUNTS = 'products.discounts',
  
  // Ventas
  SALES_VIEW = 'sales.view',
  SALES_CREATE = 'sales.create',
  SALES_EDIT = 'sales.edit',
  SALES_DELETE = 'sales.delete',
  SALES_STATS = 'sales.stats',
  
  // Pedidos
  ORDERS_VIEW = 'orders.view',
  ORDERS_MANAGE = 'orders.manage',
  
  // Categorías
  CATEGORIES_VIEW = 'categories.view',
  CATEGORIES_MANAGE = 'categories.manage',
  
  // Tallas
  SIZES_VIEW = 'sizes.view',
  SIZES_MANAGE = 'sizes.manage',
  
  // Marcas
  BRANDS_VIEW = 'brands.view',
  BRANDS_MANAGE = 'brands.manage',
  
  // Tipos
  TYPES_VIEW = 'types.view',
  TYPES_MANAGE = 'types.manage',
  
  // Géneros
  GENDERS_VIEW = 'genders.view',
  GENDERS_MANAGE = 'genders.manage',
  
  // Colores
  COLORS_VIEW = 'colors.view',
  COLORS_MANAGE = 'colors.manage',
  
  // Usuarios
  USERS_VIEW = 'users.view',
  USERS_MANAGE = 'users.manage',
  
  // Configuración
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_MANAGE = 'settings.manage',
  
  // Dashboard
  DASHBOARD_VIEW = 'dashboard.view',
}

export interface PermissionCategory {
  name: string;
  permissions: {
    key: Permission;
    label: string;
    description?: string;
  }[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: 'Productos',
    permissions: [
      { key: Permission.PRODUCTS_VIEW, label: 'Ver productos' },
      { key: Permission.PRODUCTS_CREATE, label: 'Crear productos' },
      { key: Permission.PRODUCTS_EDIT, label: 'Editar productos' },
      { key: Permission.PRODUCTS_DELETE, label: 'Eliminar productos' },
      { key: Permission.PRODUCTS_COSTS, label: 'Ver costos', description: 'Permite ver los costos de los productos' },
      { key: Permission.PRODUCTS_STOCK, label: 'Gestionar stock', description: 'Permite modificar el stock de productos' },
      { key: Permission.PRODUCTS_DISCOUNTS, label: 'Gestionar descuentos', description: 'Permite aplicar descuentos a productos' },
    ]
  },
  {
    name: 'Ventas',
    permissions: [
      { key: Permission.SALES_VIEW, label: 'Ver ventas' },
      { key: Permission.SALES_CREATE, label: 'Crear ventas' },
      { key: Permission.SALES_EDIT, label: 'Editar ventas' },
      { key: Permission.SALES_DELETE, label: 'Eliminar ventas' },
      { key: Permission.SALES_STATS, label: 'Ver estadísticas', description: 'Permite ver estadísticas y ganancias' },
    ]
  },
  {
    name: 'Pedidos',
    permissions: [
      { key: Permission.ORDERS_VIEW, label: 'Ver pedidos' },
      { key: Permission.ORDERS_MANAGE, label: 'Gestionar pedidos' },
    ]
  },
  {
    name: 'Catálogo',
    permissions: [
      { key: Permission.CATEGORIES_VIEW, label: 'Ver categorías' },
      { key: Permission.CATEGORIES_MANAGE, label: 'Gestionar categorías' },
      { key: Permission.SIZES_VIEW, label: 'Ver tallas' },
      { key: Permission.SIZES_MANAGE, label: 'Gestionar tallas' },
      { key: Permission.BRANDS_VIEW, label: 'Ver marcas' },
      { key: Permission.BRANDS_MANAGE, label: 'Gestionar marcas' },
      { key: Permission.TYPES_VIEW, label: 'Ver tipos' },
      { key: Permission.TYPES_MANAGE, label: 'Gestionar tipos' },
      { key: Permission.GENDERS_VIEW, label: 'Ver géneros' },
      { key: Permission.GENDERS_MANAGE, label: 'Gestionar géneros' },
      { key: Permission.COLORS_VIEW, label: 'Ver colores' },
      { key: Permission.COLORS_MANAGE, label: 'Gestionar colores' },
    ]
  },
  {
    name: 'Administración',
    permissions: [
      { key: Permission.USERS_VIEW, label: 'Ver usuarios' },
      { key: Permission.USERS_MANAGE, label: 'Gestionar usuarios', description: 'Crear, editar y eliminar usuarios' },
      { key: Permission.SETTINGS_VIEW, label: 'Ver configuración' },
      { key: Permission.SETTINGS_MANAGE, label: 'Gestionar configuración' },
      { key: Permission.DASHBOARD_VIEW, label: 'Ver dashboard' },
    ]
  }
];

export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission), // Todos los permisos
  
  [UserRole.VENDEDOR]: [
    Permission.PRODUCTS_VIEW,
    Permission.SALES_VIEW,
    Permission.SALES_CREATE,
    Permission.ORDERS_VIEW,
    Permission.CATEGORIES_VIEW,
    Permission.SIZES_VIEW,
    Permission.BRANDS_VIEW,
    Permission.TYPES_VIEW,
    Permission.GENDERS_VIEW,
    Permission.COLORS_VIEW,
    Permission.DASHBOARD_VIEW,
  ],
  
  [UserRole.CUSTOM]: [] // Sin permisos por defecto
};