# Frontend E-commerce - Next.js

## Regla Critica
**NUNCA iniciar el servidor** (`npm run dev`) a menos que el usuario lo solicite.

## Stack
- Next.js 15 + TypeScript + TailwindCSS
- TanStack Query + React Context
- shadcn/ui + Lucide icons
- Puerto: 3001

## Deploy
```bash
npm run build && git add . && git commit -m "cambios" && git push
```

## Dominios
- **API**: https://api.tiendagenai.com
- **Admin**: https://tiendagenai.com (sin subdominio)
- **Tiendas**: https://*.tiendagenai.com (subdominios)

## Autenticacion
- JWT en localStorage (NO cookies)
- Headers: `Authorization: Bearer ${token}` + `X-Tenant-Id`
- Login multi-tenant: `user@tenant.com`

## Cloudinary (Upload Directo)
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwkwu8adz
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default  # DEBE ser UNSIGNED
```
- Upload diferido: preview local, sube al confirmar
- Imagenes como `string[]` (URLs directas)

## Sistema de Precios
- **cashPrice**: Precio efectivo (INPUT)
- **price**: Precio lista (CALCULADO = cashPrice * 1.25)
- **Ganancia**: cashPrice - cost

## Estructura del Proyecto
```
src/
  app/
    admin/           # Panel administrativo
      dashboard/     # Metricas
      productos/     # CRUD productos
      ventas/        # Ventas y cambios
      categorias/    # Jerarquico
      usuarios/      # Gestion usuarios
      configuracion/ # Tienda, redes
    auth/            # Login, register, 2FA
    store/[subdomain]/ # Tienda publica
  components/
    ui/              # shadcn/ui base
    admin/           # Componentes admin
    store/           # Componentes tienda
  contexts/
    auth-context.tsx # Auth global
    cart-context.tsx # Carrito
  lib/               # Servicios API
  types/             # TypeScript
```

## Paginas Admin
| Ruta | Funcionalidad |
|------|---------------|
| `/admin/productos` | CRUD, imagenes Cloudinary, stock por talles |
| `/admin/ventas` | Registro, cambios masivos, metricas |
| `/admin/usuarios` | Roles (ADMIN/VENDEDOR/CUSTOM), permisos |
| `/admin/categorias` | Jerarquico con herencia de talles |
| `/admin/configuracion` | Tienda, redes, WhatsApp toggle |

## Tienda Publica (`/store/[subdomain]`)
- Listado productos con filtros
- Detalle con selector de talles
- Carrito persistente (localStorage)
- Checkout + Confirmacion
- Tracking de pedidos

## Componentes Clave
| Componente | Ubicacion | Uso |
|------------|-----------|-----|
| `QuickBuyModal` | store/ | Modal compra rapida (React Portal) |
| `StoreHeader` | store/ | Navegacion con carrito |
| `TenantSwitcher` | admin/ | Selector de tienda |
| `DeferredCloudinaryUpload` | admin/product/ | Upload diferido |

## Categorias Jerarquicas
- Solo tallas en categorias padre
- Subcategorias heredan automaticamente
- Menu expandible con "Ver todo"

## Roles y Permisos
| Rol | Acceso |
|-----|--------|
| ADMIN | Todo |
| VENDEDOR | Ver productos, registrar ventas. Sin: costos, stock, usuarios |
| CUSTOM | 62 permisos asignables |

## Patrones UI/UX
- Mobile-first responsive
- Loading/error/empty states
- Confirmaciones para acciones destructivas
- Toast notifications (react-hot-toast)
- Fondos: verde (nuevas), gris (anuladas), blanco (normales)

## Variables de Entorno
```env
# Local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_DOMAIN=localhost:3001

# Produccion (generado en deploy)
NEXT_PUBLIC_API_URL=https://api.tiendagenai.com/api
```

## Notas Importantes
- TypeScript strict mode deshabilitado temporalmente
- Imagenes con `<img>` estandar (no Next/Image para Cloudinary)
- Estados pedidos: Pendiente -> Armado -> Entregado (+ Cancelado)

## Version: 2.22.0
