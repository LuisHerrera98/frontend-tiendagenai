# Multi-Tenant E-commerce Platform - Frontend

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Next.js 15.3.4, TypeScript, TailwindCSS, TanStack Query
- **Backend**: NestJS con MongoDB
- **Autenticación**: JWT con localStorage (NO cookies)
- **Gestión de Estado**: React Context + TanStack Query
- **Notificaciones**: react-hot-toast
- **Imágenes**: Cloudinary (upload directo desde frontend)
- **Gestión de Procesos**: PM2
- **CI/CD**: GitHub Actions
- **Infraestructura**: AWS EC2, Nginx con SSL

### Estructura de Dominios
- **API**: https://api.tiendagenai.com
- **Admin Panel**: https://tiendagenai.com (sin subdominio)
- **Tiendas Públicas**: https://*.tiendagenai.com (con subdominios)

## 🖼️ Sistema de Imágenes con Cloudinary

### Configuración Actual
- **Upload directo desde frontend** a Cloudinary
- **NO pasa por el backend** (más rápido y eficiente)
- Las imágenes se guardan como **strings directos** (URLs), no objetos

### Credenciales de Cloudinary
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwkwu8adz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
```

### ⚠️ IMPORTANTE: Configuración del Upload Preset
Para que funcione el upload de imágenes:
1. Ir a https://console.cloudinary.com/settings/upload
2. Buscar "Upload presets"
3. Verificar que `ml_default` esté configurado como **UNSIGNED**
4. Si está como SIGNED, cambiarlo a UNSIGNED y guardar

### Componentes de Upload
- **DeferredCloudinaryUpload**: Upload diferido - selecciona archivos localmente y sube solo al confirmar
- **DirectCloudinaryUpload**: Upload directo con selector nativo de archivos (deprecado)
- **ImageGalleryViewer**: Visualizador simple de imágenes para edición de productos
- **cloudinary-transforms.ts**: Transformaciones de URL en frontend
- **cloudinary-utils.ts**: Utilidades para manejo de imágenes

### Sistema de Upload Diferido (Enero 2025)
- Las imágenes se previsualizan localmente usando `URL.createObjectURL()`
- Solo se suben a Cloudinary cuando se confirma la creación del producto
- Evita desperdicio de almacenamiento si se cancela la operación
- Muestra estado "Subiendo imágenes..." durante el upload

### Estructura de Datos de Producto
```typescript
interface Product {
  // ... otros campos
  images: string[]  // URLs directas, NO objetos con {url, publicId}
  active: boolean   // Por defecto true al crear
}
```

### Borrado de Imágenes
- **Endpoint implementado en backend**: `DELETE /api/product/image/:productId`
- El backend extrae el publicId de la URL y borra en Cloudinary
- Maneja tanto formato antiguo (objetos) como nuevo (strings)
- **Nota**: Sistema de borrado temporalmente deshabilitado en frontend (Enero 2025)

## 🔐 Sistema de Autenticación Multi-Tenant

### Flujo de Login
1. Usuario ingresa email y contraseña en `/auth/login`
2. Backend valida credenciales y retorna:
   - Token JWT (con currentTenantId como string)
   - Datos del usuario con lista de tenants
   - Tenant activo actual
3. Frontend guarda en localStorage:
   - `auth_token`: Token JWT
   - `user`: Datos del usuario (JSON)
   - `tenant_subdomain`: Subdominio del tenant activo

### Estructura de Datos

```typescript
// Usuario autenticado
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  currentTenantId?: string;  // IMPORTANTE: Debe ser string, no objeto
  tenants?: Array<{
    id: string;
    subdomain: string;
    storeName: string;
    isActive: boolean;
  }>;
}

// Tenant simplificado en el contexto
interface SimpleTenant {
  id: string;
  subdomain: string;
  storeName: string;
  isActive: boolean;
}
```

### AuthContext (`/src/contexts/auth-context.tsx`)
- Maneja estado de autenticación global
- Inicializa auth desde localStorage al cargar
- Provee funciones: login, logout, register, updateTenant
- Selecciona automáticamente el tenant activo al hacer login
- Redirige a `/auth/login` si no hay autenticación

### Sistema de Persistencia
- **IMPORTANTE**: Todo usa localStorage, NO cookies
- El servicio `auth.ts` fue migrado de js-cookie a localStorage
- El middleware de Next.js NO verifica autenticación (se hace client-side)
- Headers enviados: `Authorization: Bearer ${token}` y `X-Tenant-Id`

## 📁 Estructura del Proyecto

```
frontend-ecommerce-test/
├── src/
│   ├── app/                    # Rutas de Next.js
│   │   ├── admin/             # Panel administrativo
│   │   │   ├── dashboard/     # Dashboard principal
│   │   │   ├── productos/     # Gestión de productos
│   │   │   ├── ventas/        # Gestión de ventas
│   │   │   ├── categorias/    # Gestión de categorías
│   │   │   ├── marcas/        # Gestión de marcas
│   │   │   ├── tipos/         # Gestión de tipos
│   │   │   ├── generos/       # Gestión de géneros
│   │   │   ├── pedidos/       # Gestión de pedidos
│   │   │   └── configuracion/ # Configuración de tienda
│   │   ├── auth/              # Páginas de autenticación
│   │   │   ├── login/         # Login
│   │   │   ├── register/      # Registro con creación de tenant
│   │   │   └── verify-email/  # Verificación de email
│   │   ├── landing/           # Landing page
│   │   └── store/             # Tienda pública
│   │       └── [subdomain]/   # Rutas dinámicas por subdominio
│   │           ├── page.tsx           # Página principal
│   │           ├── producto/[id]/     # Detalle de producto
│   │           ├── productos/         # Listado de productos
│   │           ├── carrito/          # Carrito de compras
│   │           ├── checkout/         # Proceso de compra
│   │           ├── pedido-confirmado/ # Confirmación de pedido
│   │           ├── tracking/         # Seguimiento de pedidos
│   │           └── contacto/         # Página de contacto
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/               # Componentes de UI base
│   │   ├── admin/            # Componentes del admin
│   │   │   └── product/      # Componentes de productos
│   │   │       ├── direct-cloudinary-upload.tsx  # Upload directo de imágenes
│   │   │       ├── product-list.tsx             # Lista de productos
│   │   │       └── create-product-dialog.tsx    # Modal de crear producto
│   │   └── store/            # Componentes de la tienda
│   │       ├── store-layout.tsx      # Layout principal
│   │       ├── store-header.tsx      # Header con carrito (URLs corregidas)
│   │       ├── store-footer.tsx      # Footer con redes sociales
│   │       └── whatsapp-button.tsx   # Botón flotante WhatsApp
│   ├── contexts/             # Contextos de React
│   │   ├── auth-context.tsx  # Contexto de autenticación
│   │   └── cart-context.tsx  # Contexto del carrito
│   ├── lib/                  # Servicios y utilidades
│   │   ├── auth.ts          # Servicio de autenticación
│   │   ├── tenant.ts        # Servicio de tenants
│   │   ├── products.ts      # Servicio de productos
│   │   ├── cloudinary-transforms.ts  # Transformaciones de imágenes
│   │   ├── cloudinary-utils.ts      # Utilidades de Cloudinary
│   │   └── utils.ts         # Utilidades generales
│   └── types/               # Definiciones de TypeScript
│       └── index.ts         # Tipos e interfaces (images como string[])
├── .github/workflows/       # CI/CD con GitHub Actions
│   └── deploy-frontend.yml  # Workflow de deploy
├── next.config.ts          # Configuración de Next.js (CSP actualizado)
└── .env.local              # Variables de entorno (local)
```

## 🚀 Deployment

### GitHub Actions
El archivo `.github/workflows/deploy-frontend.yml` automatiza el deployment:

1. Se activa con push a `main`
2. Conecta por SSH al servidor EC2
3. Clona/actualiza el repositorio
4. Instala dependencias
5. Crea `.env.local` con URLs de producción
6. Ejecuta build de Next.js
7. Inicia la aplicación con PM2

### Variables de Entorno
- **Local**: `.env.local`
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3000/api
  NEXT_PUBLIC_DOMAIN=localhost:3001
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwkwu8adz
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
  ```
- **Producción**: Se genera automáticamente
  ```
  NEXT_PUBLIC_API_URL=https://api.tiendagenai.com/api
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwkwu8adz
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
  ```

### Comandos de Build y Deploy
```bash
# Desarrollo local
npm install
npm run dev

# Build para producción
npm run build
npm start

# Deploy (se ejecuta automáticamente con push)
git push origin main
```

### Secrets en GitHub Actions
Agregar en Settings → Secrets:
- `EC2_HOST`: IP del servidor
- `EC2_SSH_KEY`: Clave SSH privada
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: dwkwu8adz
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: ml_default

## 🎨 Páginas del Admin Panel

### Dashboard (`/admin/dashboard`)
- Vista general del sistema
- Métricas y estadísticas

### Productos (`/admin/productos`)
- CRUD completo de productos
- Upload directo de imágenes a Cloudinary
- Las imágenes se muestran desde URLs directas
- Stock por tallas
- Filtros avanzados

### Usuarios (`/admin/usuarios`) ✨ NUEVO
- Gestión completa de usuarios del tenant
- Creación con roles: ADMIN, VENDEDOR, CUSTOM
- Asignación de permisos granulares
- Estados activo/inactivo
- Búsqueda por nombre, email o código empleado
- Último login tracking
- Reset de contraseña por admin

### Tallas (`/admin/tallas`)
- Vista agrupada por categorías
- Diseño de cajitas negras compactas
- Acciones de editar/eliminar en hover
- Las tallas se obtienen separadas de las categorías y se hace el match en frontend

### Categorías, Marcas, Tipos, Géneros
- CRUD básico para cada entidad
- Interfaces similares con tabla y modales

### Ventas (`/admin/ventas`)
- Sistema completo de ventas y cambios
- Métricas en tiempo real
- Gestión de cambios masivos

### Pedidos (`/admin/pedidos`)
- Lista de pedidos con filtros por estado
- Estadísticas en tiempo real
- Vista expandible con detalles del pedido
- Cambio de estados simplificado a 4: Pendiente → Armado → Entregado (+ Cancelado)
- Información del cliente y productos
- Botones de WhatsApp/llamada cuando el pedido está listo

### Configuración (`/admin/configuracion`)
- Configuración de información de contacto
- Gestión de redes sociales (Instagram, Facebook, WhatsApp)
- Toggle para habilitar/deshabilitar botón de WhatsApp
- Personalización de colores de la tienda
- Configuración de moneda y zona horaria

## 🛍️ Tienda Pública (Store)

### Sistema de Carrito
- **CartContext**: Estado global del carrito con persistencia en localStorage
- Agregar múltiples talles del mismo producto
- Control de cantidades por talle
- Cálculo automático de descuentos y totales

### Páginas de la Tienda
- **Página principal**: Listado de productos con filtros
- **Detalle de producto**: 
  - Selector múltiple de talles y cantidades
  - Galería de imágenes con navegación
  - Información completa del producto
- **Carrito**: Vista detallada con controles de cantidad
- **Checkout**: Formulario de datos del cliente
- **Confirmación**: Página de pedido confirmado con link a tracking
- **Tracking**: Sistema de seguimiento de pedidos sin backend
- **Contacto**: Información de la tienda (sin formulario)

### Sistema de Tracking de Pedidos
- Búsqueda por número de orden
- Persistencia en localStorage
- Estados visuales con barra de progreso
- Botones de WhatsApp/llamada cuando está listo
- Funciona offline sin necesidad de backend

### Componentes de la Tienda
- **StoreLayout**: Layout principal con header, footer y WhatsApp button
- **StoreHeader**: Navegación con contador de items en carrito
  - **CORREGIDO**: Enlaces ahora usan `/store/${subdomain}/` correctamente
- **StoreFooter**: Información y redes sociales configurables (altura reducida)
- **WhatsAppButton**: Botón flotante (solo visible si está habilitado en configuración)
- **QuickBuyModal**: Modal de compra rápida con React Portal
  - Renderizado directo en `document.body` con `createPortal`
  - Overlay de pantalla completa con z-index 50
  - Selector de tallas y cantidades
  - Integración con CartContext y notificaciones

## 🔧 Componentes Importantes

### TenantSwitcher (`/components/admin/tenant-switcher.tsx`)
- Selector de tienda en el header
- Actualiza localStorage cuando se cambia de tienda
- Sincroniza con el usuario en localStorage
- URLs corregidas: Evita doble `/api` en las llamadas

### AdminLayout (`/app/admin/layout.tsx`)
- Verifica autenticación con `useAuth()`
- Redirige a `/auth/login` si no hay usuario
- NO usa el antiguo sistema de admin login con contraseña
- Incluye `Toaster` para notificaciones react-hot-toast

### CartContext (`/contexts/cart-context.tsx`)
- Manejo global del estado del carrito
- Persistencia automática en localStorage
- Métodos: addItem, removeItem, updateQuantity, clearCart
- Cálculos: getTotal, getTotalWithDiscount, getItemsCount

## 🔐 Sistema de Usuarios y Permisos (Enero 2025)

### Arquitectura de Permisos
- **Roles predefinidos**: ADMIN, VENDEDOR, CUSTOM
- **Permisos granulares**: 62 permisos diferentes organizados por categorías
- **Herencia de permisos**: Los roles tienen permisos por defecto configurables

### Flujo de Autenticación Multi-Tenant
1. **Login formato**: `username@tenant.com` (ej: jose@mitienda.com)
2. **Primera vez**: Usuario recibe email con token para configurar contraseña
3. **Recuperación**: Código de 6 dígitos enviado por email
4. **Gestión**: Admins pueden crear, editar, desactivar usuarios

### Componentes de Usuario
- **`/lib/users.ts`**: Servicio de gestión de usuarios
- **`/types/permissions.ts`**: Enums y tipos de permisos
- **`/app/admin/usuarios/page.tsx`**: UI completa de gestión
- **PermissionAssignment**: Componente para asignar permisos
- **UserModal**: Modal de creación/edición de usuarios

### Restricciones por Rol
- **ADMIN**: Acceso total al sistema
- **VENDEDOR**: 
  - ✅ Puede: Ver productos, registrar ventas, ver pedidos
  - ❌ No puede: Ver costos, modificar stock, gestionar usuarios
- **CUSTOM**: Permisos personalizados asignados manualmente

## 🆕 Funcionalidades Implementadas Recientemente

### Sistema de Categorías Jerárquicas con Herencia de Tallas (Enero 2025)

**Arquitectura:**
- Categorías padre con subcategorías (usando `parent_id`)
- Tallas solo se crean en categorías padre
- Subcategorías heredan automáticamente las tallas de su padre
- Menú jerárquico en tienda pública con expandir/colapsar

**Implementación Frontend:**

**Admin - Gestión de Tallas (`/admin/tallas`):**
- Solo muestra categorías padre en selectores
- Subtítulo explicativo: "Solo se crean tallas en categorías padre. Las subcategorías heredan las tallas automáticamente."
- Filtro de categorías padre en `create-size-dialog.tsx` y `create-multiple-sizes-dialog.tsx`
- Mensajes informativos en modales con fondo azul

**Tienda Pública - Menú Jerárquico (`store-header.tsx`):**
```typescript
// Estructura de categoría con subcategorías
interface Category {
  id: string
  name: string
  subcategories?: Category[]
}

// Expandir/colapsar con estado
const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

// Renderizado jerárquico
{hasSubcategories ? (
  <button onClick={() => toggleCategory(categoryId)}>
    <span>{category.name}</span>
    <ChevronDown className={isExpanded ? 'rotate-180' : ''} />
  </button>
) : (
  <Link href={`/productos?category=${categoryId}`}>
    {category.name}
  </Link>
)}

// Subcategorías con "Ver todo"
{isExpanded && (
  <div className="ml-4">
    <Link href={`/productos?category=${categoryId}`}>
      <span className="text-blue-600">Ver todo</span>
    </Link>
    {category.subcategories.map(subcat => (
      <Link href={`/productos?category=${subcat.id}`}>
        {subcat.name}
      </Link>
    ))}
  </div>
)}
```

**Backend API Integration:**
- `GET /public/categories-tree/:subdomain` - Árbol jerárquico completo
- `GET /size/category/:categoryId` - Devuelve tallas del padre si es subcategoría
- Filtros de productos incluyen subcategorías automáticamente

**Beneficios:**
- 🎯 Simplifica creación de tallas (una sola vez)
- 🔄 Consistencia automática entre subcategorías
- 💡 UX intuitiva: subcategorías = variaciones de estilo
- 🔒 Backend valida y rechaza tallas en subcategorías (Error 400)

### Sistema de Upload de Imágenes
1. **Upload directo a Cloudinary**:
   - Sin pasar por el backend
   - Selector nativo de archivos
   - Muestra previews mientras sube
   - Permite eliminar imágenes subidas

2. **Configuración de CSP**:
   - Content Security Policy actualizada para Cloudinary
   - Permite frames de upload-widget.cloudinary.com
   - Permisos de cámara configurados

3. **Transformaciones de imágenes**:
   - Optimización automática con q_auto
   - Diferentes tamaños para responsive
   - Formatos modernos (WebP cuando es posible)

### Sistema de Pedidos Simplificado
- Estados reducidos de 6 a 4
- Gestión automática de stock
- WhatsApp/llamada integrados para pedidos listos

### Mejoras de UI/UX
- Footer más compacto
- Imágenes de productos más pequeñas y elegantes
- Admin email y WhatsApp en contacto
- Toggle para WhatsApp button en configuración

## 🐛 Solución de Problemas Comunes

### Modal de compra rápida aparece dentro del producto (Enero 2025) ✅ SOLUCIONADO
- **PROBLEMA**: El modal "Agregar al carrito" se renderizaba dentro del ProductCard, viéndose pequeño y limitado por el contenedor padre
- **CAUSA**: Modal renderizado en el árbol DOM del componente, heredando constraints de tamaño
- **SOLUCIÓN**: Uso de React Portal (`createPortal`) para renderizar en `document.body`
  ```typescript
  import { createPortal } from 'react-dom'

  // Renderizar modal fuera del árbol del componente
  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Modal content */}
    </div>,
    document.body
  )
  ```
- **ARCHIVO ACTUALIZADO**: `/src/components/store/quick-buy-modal.tsx`
- **RESULTADO**: Modal ahora aparece como overlay de pantalla completa sobre todo el contenido

### Imágenes no se muestran en listado de productos (Enero 2025)
- **PROBLEMA**: Backend devolvía objetos vacíos `{}` en lugar de URLs
- **SOLUCIÓN**:
  1. Backend actualizado para manejar tanto strings como objetos con url/publicId
  2. Frontend cambiado de `Image` de Next.js a `img` estándar para URLs de Cloudinary
  3. Backend guarda objetos `{url, publicId}` pero devuelve strings al frontend
- **ARCHIVOS ACTUALIZADOS**:
  - `/backend/src/product/product.service.ts`: Manejo de imágenes mejorado
  - `/src/components/admin/product/product-list.tsx`: Cambio a `img` estándar
  - `/src/components/admin/product/view-product-dialog.tsx`: Lo mismo

### Productos no visibles en tienda pública
- **PROBLEMA**: Productos creados con `active: false` por defecto
- **SOLUCIÓN**: Productos ahora se crean con `active: true` por defecto

### Error de Upload a Cloudinary
- **PROBLEMA**: Upload preset configurado como SIGNED
- **SOLUCIÓN**: Cambiar a UNSIGNED en https://console.cloudinary.com/settings/upload

### Enlaces 404 en navegación de tienda
- **PROBLEMA**: Enlaces sin el prefijo `/store/${subdomain}`
- **SOLUCIÓN**: Actualizado en `store-header.tsx` todos los enlaces

### TypeScript Build Errors
- Temporalmente deshabilitado `strict` mode en `tsconfig.json`
- Creado tipo `SimpleTenant` para manejar datos parciales de tenant
- Agregado Suspense boundary para `useSearchParams()`

### Error 401 Unauthorized
- Token expirado → Cerrar sesión y volver a iniciar
- Verificar que el token se esté enviando correctamente

## 📋 Checklist de Deploy

- [ ] Verificar que el build local funcione: `npm run build`
- [ ] Confirmar URLs de API en `deploy-frontend.yml`
- [ ] Verificar secrets en GitHub Actions:
  - `EC2_HOST`: IP del servidor
  - `EC2_SSH_KEY`: Clave SSH privada
  - Variables de Cloudinary
- [ ] Configurar upload preset en Cloudinary como UNSIGNED
- [ ] Push a main para activar deploy automático
- [ ] Verificar logs en GitHub Actions
- [ ] Probar aplicación en https://tiendagenai.com

## 🔧 Mantenimiento

### Logs de PM2
```bash
pm2 logs frontend-tiendagenai
pm2 monit
```

### Reiniciar Aplicación
```bash
pm2 restart frontend-tiendagenai
pm2 reload frontend-tiendagenai
```

### Actualización Manual
```bash
cd /home/ubuntu/projects/tiendagenai/frontend-tiendagenai
git pull origin main
npm install
npm run build
pm2 restart frontend-tiendagenai
```

## 📝 Notas Importantes

1. **Multi-tenancy**: 
   - Admin panel funciona SIN subdominio (local y producción)
   - Tiendas públicas con subdominios
   - Tenant se maneja por headers `X-Tenant-Id`

2. **Autenticación**: 
   - JWT se guarda en localStorage (NO cookies)
   - Se envía como `Authorization: Bearer ${token}`
   - Verificación client-side en AdminLayout

3. **Imágenes**:
   - Upload directo a Cloudinary desde frontend
   - Se guardan como URLs strings, no objetos
   - Upload preset DEBE ser UNSIGNED
   - No se borran automáticamente (requiere backend)

4. **Estado Global**: 
   - AuthContext maneja usuario y tenant actual
   - TanStack Query para datos del servidor
   - localStorage para persistencia

5. **Deploy Automático**: 
   - Push a `main` → GitHub Actions → Deploy automático
   - Backend y Frontend tienen workflows separados

## 🔄 Próximas Mejoras

1. Endpoint en backend para borrar imágenes de Cloudinary
2. Sistema de notificaciones push
3. Dashboard con gráficos y analytics avanzados
4. Integración con pasarelas de pago
5. PWA support para móviles
6. Sistema de facturación electrónica
7. Multi-idioma
8. Sistema de cupones y descuentos

## 📝 Última Actualización: Enero 2025

### Última Corrección (Modal QuickBuy):
- ✅ **Modal de compra rápida ahora usa React Portal**
- ✅ Renderizado directo en `document.body` para overlay de pantalla completa
- ✅ Fix de UX crítico: modal ya no aparece limitado dentro del producto card
- ✅ Estado `mounted` agregado para compatibilidad con SSR de Next.js

### Cambios Principales Sistema de Usuarios:
- ✅ **Sistema completo de usuarios y permisos implementado**
- ✅ Login multi-tenant con formato user@tenant.com
- ✅ Tres roles con permisos específicos (ADMIN, VENDEDOR, CUSTOM)
- ✅ UI de gestión de usuarios en /admin/usuarios
- ✅ Recuperación de contraseña con código de 6 dígitos
- ✅ Primera vez login con configuración de contraseña
- ✅ Asignación dinámica de permisos para roles personalizados
- ✅ Botones de Ventas y Usuarios habilitados en sidebar

### Sistema Anteriormente Implementado:
- ✅ Sistema de upload directo a Cloudinary implementado
- ✅ CSP configurado para permitir widget de Cloudinary
- ✅ Tipos de datos actualizados (images como string[])
- ✅ Enlaces de navegación corregidos en store-header
- ✅ Sistema de tracking de pedidos funcional
- ✅ Toggle de WhatsApp en configuración
- ✅ Gestión de pedidos simplificada a 4 estados
- ✅ Sistema de categorías jerárquicas con herencia de tallas

### Consideraciones de Seguridad:
- ⚠️ Los vendedores NO pueden ver costos de productos
- ⚠️ Los vendedores NO pueden modificar stock
- ⚠️ Solo administradores pueden gestionar usuarios
- ⚠️ Permisos verificados tanto en frontend como backend