'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductListWithSidebar } from '@/components/admin/product/product-list-with-sidebar'
import { CreateProductDialog } from '@/components/admin/product/create-product-dialog'
import { useAuth } from '@/contexts/auth-context'
import { Permission } from '@/types/permissions'

export default function ProductsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { hasPermission } = useAuth()
  const canCreateProducts = hasPermission(Permission.PRODUCTS_CREATE)

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold">Productos</h1>
        {canCreateProducts && (
          <Button onClick={() => setShowCreateDialog(true)} className="bg-black hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ProductListWithSidebar />
      </div>

      {canCreateProducts && (
        <CreateProductDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  )
}