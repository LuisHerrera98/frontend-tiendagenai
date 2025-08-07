# Multi-Tenant E-commerce Platform - Frontend

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico
- **Frontend**: Next.js 15.3.4, TypeScript, TailwindCSS
- **Backend**: NestJS con MongoDB
- **Autenticación**: JWT con contexto de tenant
- **Gestión de Procesos**: PM2
- **CI/CD**: GitHub Actions
- **Infraestructura**: AWS EC2, Nginx con SSL

### Estructura de Dominios
- **API**: https://api.tiendagenai.com
- **Admin Panel**: https://tiendagenai.com
- **Tiendas**: https://*.tiendagenai.com (subdominios por tenant)

## 🔐 Sistema de Autenticación Multi-Tenant

### Flujo de Login
1. Usuario ingresa email y contraseña
2. Backend valida credenciales y retorna:
   - Token JWT
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
  currentTenantId?: string;
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

### AuthContext
- Maneja estado de autenticación global
- Inicializa auth desde localStorage al cargar
- Provee funciones: login, logout, register, updateTenant
- Selecciona automáticamente el tenant activo al hacer login

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
│   │   │   └── generos/       # Gestión de géneros
│   │   ├── auth/              # Páginas de autenticación
│   │   │   ├── login/         # Login
│   │   │   ├── register/      # Registro con creación de tenant
│   │   │   └── verify-email/  # Verificación de email
│   │   └── landing/           # Landing page
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/               # Componentes de UI base
│   │   ├── admin/            # Componentes del admin
│   │   └── product/          # Componentes de productos
│   ├── contexts/             # Contextos de React
│   │   └── auth-context.tsx  # Contexto de autenticación
│   ├── lib/                  # Servicios y utilidades
│   │   ├── auth.ts          # Servicio de autenticación
│   │   ├── tenant.ts        # Servicio de tenants
│   │   └── products.ts      # Servicio de productos
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

## 🐛 Solución de Problemas Comunes

### TypeScript Build Errors
- Temporalmente deshabilitado `strict` mode en `tsconfig.json`
- Creado tipo `SimpleTenant` para manejar datos parciales de tenant
- Agregado Suspense boundary para `useSearchParams()`

### Selección de Tienda al Login
- Backend debe enviar `currentTenantId` como string, no objeto
- Frontend guarda `tenant_subdomain` en localStorage
- AuthContext selecciona automáticamente el tenant activo

### Variables de Entorno en Producción
- No modificar manualmente `.env.local` en el servidor
- Las variables se crean automáticamente durante el deploy
- Para cambios, actualizar el archivo `deploy-frontend.yml`

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

1. **Multi-tenancy**: Cada tienda tiene su propio subdominio
2. **Autenticación**: JWT se envía en headers, no en cookies
3. **Estado Global**: AuthContext maneja usuario y tenant actual
4. **Build Errors**: Si hay errores de TypeScript, revisar tipos en `/src/types/index.ts`
5. **Deploy Automático**: Cualquier push a `main` activa el deploy

## 🔄 Próximas Mejoras

1. Implementar sistema de caché para productos
2. Agregar PWA support
3. Optimizar imágenes con Next.js Image
4. Implementar i18n para múltiples idiomas
5. Agregar tests unitarios y de integración