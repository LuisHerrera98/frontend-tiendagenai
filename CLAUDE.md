# Multi-Tenant E-commerce Platform - Frontend

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Next.js 15.3.4, TypeScript, TailwindCSS, TanStack Query
- **Backend**: NestJS con MongoDB
- **Autenticación**: JWT con localStorage (NO cookies)
- **Gestión de Estado**: React Context + TanStack Query
- **Notificaciones**: react-hot-toast
- **Gestión de Procesos**: PM2
- **CI/CD**: GitHub Actions
- **Infraestructura**: AWS EC2, Nginx con SSL

### Estructura de Dominios
- **API**: https://api.tiendagenai.com
- **Admin Panel**: https://tiendagenai.com (sin subdominio)
- **Tiendas Públicas**: https://*.tiendagenai.com (con subdominios)

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
│   │   │   ├── pedidos/       # Gestión de pedidos (NUEVO)
│   │   │   └── configuracion/ # Configuración de tienda (NUEVO)
│   │   ├── auth/              # Páginas de autenticación
│   │   │   ├── login/         # Login
│   │   │   ├── register/      # Registro con creación de tenant
│   │   │   └── verify-email/  # Verificación de email
│   │   ├── landing/           # Landing page
│   │   └── store/             # Tienda pública (NUEVO)
│   │       └── [subdomain]/   # Rutas dinámicas por subdominio
│   │           ├── page.tsx           # Página principal
│   │           ├── producto/[id]/     # Detalle de producto
│   │           ├── productos/         # Listado de productos
│   │           ├── carrito/          # Carrito de compras
│   │           ├── checkout/         # Proceso de compra
│   │           ├── pedido-confirmado/ # Confirmación de pedido
│   │           └── contacto/         # Página de contacto
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/               # Componentes de UI base
│   │   ├── admin/            # Componentes del admin
│   │   ├── product/          # Componentes de productos
│   │   └── store/            # Componentes de la tienda (NUEVO)
│   │       ├── store-layout.tsx      # Layout principal
│   │       ├── store-header.tsx      # Header con carrito
│   │       ├── store-footer.tsx      # Footer con redes sociales
│   │       └── whatsapp-button.tsx   # Botón flotante WhatsApp
│   ├── contexts/             # Contextos de React
│   │   ├── auth-context.tsx  # Contexto de autenticación
│   │   └── cart-context.tsx  # Contexto del carrito (NUEVO)
│   ├── lib/                  # Servicios y utilidades
│   │   ├── auth.ts          # Servicio de autenticación
│   │   ├── tenant.ts        # Servicio de tenants
│   │   ├── products.ts      # Servicio de productos
│   │   └── utils.ts         # Utilidades (incluye formatDate)
│   └── types/               # Definiciones de TypeScript
│       └── index.ts         # Tipos e interfaces
├── .github/workflows/       # CI/CD con GitHub Actions
│   └── deploy-frontend.yml  # Workflow de deploy
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
  ```
- **Producción**: Se genera automáticamente
  ```
  NEXT_PUBLIC_API_URL=https://api.tiendagenai.com/api
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

## 🎨 Páginas del Admin Panel

### Dashboard (`/admin/dashboard`)
- Vista general del sistema
- Métricas y estadísticas

### Productos (`/admin/productos`)
- CRUD completo de productos
- Gestión de imágenes con Cloudinary
- Stock por tallas
- Filtros avanzados

### Tallas (`/admin/tallas`) - REDISEÑADO
- Vista agrupada por categorías
- Diseño de cajitas negras compactas
- Acciones de editar/eliminar en hover
- **IMPORTANTE**: Las tallas se obtienen separadas de las categorías y se hace el match en frontend
- No depende del populate del backend

### Categorías, Marcas, Tipos, Géneros
- CRUD básico para cada entidad
- Interfaces similares con tabla y modales

### Ventas (`/admin/ventas`)
- Sistema completo de ventas y cambios
- Métricas en tiempo real
- Gestión de cambios masivos

### Pedidos (`/admin/pedidos`) - NUEVO
- Lista de pedidos con filtros por estado
- Estadísticas en tiempo real
- Vista expandible con detalles del pedido
- Cambio de estados (pendiente → confirmado → preparando → listo → entregado)
- Información del cliente y productos

### Configuración (`/admin/configuracion`) - NUEVO
- Configuración de información de contacto
- Gestión de redes sociales (Instagram, Facebook, WhatsApp)
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
- **Confirmación**: Página de pedido confirmado
- **Contacto**: Información de la tienda con formulario

### Componentes de la Tienda
- **StoreLayout**: Layout principal con header, footer y WhatsApp button
- **StoreHeader**: Navegación con contador de items en carrito
- **StoreFooter**: Información y redes sociales configurables
- **WhatsAppButton**: Botón flotante (solo visible si está configurado)

## 🔧 Componentes Importantes

### TenantSwitcher (`/components/admin/tenant-switcher.tsx`)
- Selector de tienda en el header
- Actualiza localStorage cuando se cambia de tienda
- Sincroniza con el usuario en localStorage
- **URLs corregidas**: Evita doble `/api` en las llamadas

### AdminLayout (`/app/admin/layout.tsx`)
- Verifica autenticación con `useAuth()`
- Redirige a `/auth/login` si no hay usuario
- NO usa el antiguo sistema de admin login con contraseña
- Incluye `Toaster` para notificaciones react-hot-toast

### CartContext (`/contexts/cart-context.tsx`) - NUEVO
- Manejo global del estado del carrito
- Persistencia automática en localStorage
- Métodos: addItem, removeItem, updateQuantity, clearCart
- Cálculos: getTotal, getTotalWithDiscount, getItemsCount

## 🆕 Funcionalidades Implementadas

### Sistema de Pedidos
1. **Backend**:
   - Entidad Order con estados y gestión de stock
   - Validación de stock antes de crear pedido
   - Reducción temporal de stock al crear pedido
   - Restauración de stock al cancelar pedido
   - Endpoints públicos para crear pedidos sin autenticación

2. **Frontend - Tienda**:
   - Carrito de compras con persistencia
   - Página de checkout con formulario de cliente
   - Confirmación de pedido con número único
   - Integración con WhatsApp para contacto

3. **Frontend - Admin**:
   - Gestión completa de pedidos
   - Cambio de estados con flujo definido
   - Estadísticas en tiempo real
   - Vista expandible con detalles

### Configuración de Tienda
- Gestión de información de contacto desde admin
- Configuración de redes sociales
- Personalización de colores (primario/secundario)
- Datos se muestran dinámicamente en la tienda pública

## 🐛 Solución de Problemas Comunes

### TypeScript Build Errors
- Temporalmente deshabilitado `strict` mode en `tsconfig.json`
- Creado tipo `SimpleTenant` para manejar datos parciales de tenant
- Agregado Suspense boundary para `useSearchParams()`

### Selección de Tienda al Login
- **SOLUCIONADO**: El backend ahora envía `currentTenantId` como string
- En `auth.service.ts`: Se agregó `.toString()` al currentTenantId en el JWT
- Se eliminó el `.populate()` que causaba que se incluyera el objeto completo

### Problema "Sin categoría" en Tallas
- **SOLUCIONADO**: Se obtienen categorías y tallas por separado
- Se hace el match en frontend usando un Map para búsqueda eficiente
- No depende del populate del backend

### Error 404 en `/admin/tallas`
- **SOLUCIONADO**: Se creó la página que faltaba
- Se eliminó el antiguo `/admin/login` que causaba confusión

### Variables de Entorno en Producción
- No modificar manualmente `.env.local` en el servidor
- Las variables se crean automáticamente durante el deploy
- Para cambios, actualizar el archivo `deploy-frontend.yml`

### CORS Issues
- **SOLUCIONADO**: Se agregó `X-Tenant-Id` a los headers permitidos en el backend

## 📋 Checklist de Deploy

- [ ] Verificar que el build local funcione: `npm run build`
- [ ] Confirmar URLs de API en `deploy-frontend.yml`
- [ ] Verificar secrets en GitHub Actions:
  - `EC2_HOST`: IP del servidor
  - `EC2_SSH_KEY`: Clave SSH privada
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
   - Tiendas públicas usarán subdominios (NO IMPLEMENTADO AÚN)
   - Tenant se maneja por headers `X-Tenant-Id`

2. **Autenticación**: 
   - JWT se guarda en localStorage (NO cookies)
   - Se envía como `Authorization: Bearer ${token}`
   - Verificación client-side en AdminLayout

3. **Estado Global**: 
   - AuthContext maneja usuario y tenant actual
   - TanStack Query para datos del servidor
   - localStorage para persistencia

4. **Gestión de Tallas**:
   - Se obtienen tallas y categorías por separado
   - Match se hace en frontend (más robusto)
   - Diseño visual con cajitas agrupadas por categoría

5. **Deploy Automático**: 
   - Push a `main` → GitHub Actions → Deploy automático
   - Backend y Frontend tienen workflows separados

## 🚨 Errores Comunes y Soluciones

### "Cannot read property of undefined"
- Verificar que el usuario tenga tenants asignados
- Revisar que currentTenantId sea string, no objeto

### Tallas sin categoría
- Asegurarse de que el backend esté corriendo
- Verificar que las categorías existan en la BD

### Error 401 Unauthorized
- Token expirado → Cerrar sesión y volver a iniciar
- Verificar que el token se esté enviando correctamente

### Module not found
- Instalar dependencias faltantes: `npm install react-hot-toast`
- Verificar imports y rutas de archivos

### AdminLayout no existe
- Las páginas admin NO usan `AdminLayout` como componente
- El layout está en `/app/admin/layout.tsx` automáticamente

### Cambios no se reflejan
- En producción: Esperar que termine el deploy
- En local: Verificar que el servidor esté corriendo

## 🔄 Próximas Mejoras

1. Sistema de notificaciones push
2. Dashboard con gráficos y analytics avanzados
3. Sistema de inventario automático
4. Integración con pasarelas de pago
5. PWA support para móviles
6. Sistema de facturación electrónica
7. Multi-idioma
8. Sistema de cupones y descuentos

## 📝 Notas de la Última Actualización

### Tareas Completadas:
1. ✅ Eliminado icono de Twitter del footer
2. ✅ Mejorada página de detalle con selector múltiple de talles
3. ✅ Agregado botón flotante de WhatsApp
4. ✅ Implementado sistema de configuración desde admin
5. ✅ Creado carrito de compras funcional con persistencia
6. ✅ Implementado sistema completo de pedidos (backend + frontend)
7. ✅ Creada página de gestión de pedidos en admin
8. ✅ Actualizado header (solo icono de carrito con contador)
9. ✅ Creada página de contacto con datos dinámicos del tenant

### Características Destacadas:
- **Carrito persistente**: Se mantiene entre recargas de página
- **Stock temporal**: Se reduce al crear pedido, se restaura al cancelar
- **Configuración dinámica**: Redes sociales y contacto configurables
- **Estados de pedido**: Flujo completo desde pendiente hasta entregado
- **Notificaciones**: Sistema de toast integrado con react-hot-toast