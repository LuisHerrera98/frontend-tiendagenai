import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Loading component para mostrar mientras carga
const LoadingComponent = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
  </div>
)

// Componentes Admin - Lazy loaded
export const ProductList = dynamic(
  () => import('@/components/admin/product/product-list').then(mod => mod.ProductList),
  { 
    loading: LoadingComponent,
    ssr: false 
  }
)

// ProductForm not yet implemented
// export const ProductForm = dynamic(
//   () => import('@/components/admin/product/product-form').then(mod => mod.ProductForm),
//   { 
//     loading: LoadingComponent,
//     ssr: false 
//   }
// )

export const ViewProductDialog = dynamic(
  () => import('@/components/admin/product/view-product-dialog').then(mod => mod.ViewProductDialog),
  { 
    loading: () => null,
    ssr: false 
  }
)

// Componentes Store - Con SSR para SEO
export const ProductCatalog = dynamic(
  () => import('@/components/store/product-catalog').then(mod => mod.ProductCatalog),
  { 
    loading: LoadingComponent,
    ssr: true // Importante para SEO
  }
)

// CartDrawer not yet implemented
// export const CartDrawer = dynamic(
//   () => import('@/components/store/cart-drawer').then(mod => mod.CartDrawer),
//   { 
//     loading: () => null,
//     ssr: false 
//   }
// )

// Modales y Diálogos - No necesitan SSR
export const EditCategoryDialog = dynamic(
  () => import('@/components/admin/category/edit-category-dialog').then(mod => mod.EditCategoryDialog),
  { 
    loading: () => null,
    ssr: false 
  }
)

export const EditBrandDialog = dynamic(
  () => import('@/components/admin/brand/edit-brand-dialog').then(mod => mod.EditBrandDialog),
  { 
    loading: () => null,
    ssr: false 
  }
)

export const EditTypeDialog = dynamic(
  () => import('@/components/admin/type/edit-type-dialog').then(mod => mod.EditTypeDialog),
  { 
    loading: () => null,
    ssr: false 
  }
)

// Charts y componentes pesados (not yet implemented)
// export const SalesChart = dynamic(
//   () => import('@/components/admin/dashboard/sales-chart').then(mod => mod.SalesChart),
//   { 
//     loading: LoadingComponent,
//     ssr: false 
//   }
// )

// Cloudinary Upload Widget
export const CloudinaryUpload = dynamic(
  () => import('@/components/admin/product/cloudinary-upload').then(mod => mod.CloudinaryUpload),
  { 
    loading: () => null,
    ssr: false 
  }
)