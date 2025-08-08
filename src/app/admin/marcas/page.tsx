'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BrandList } from '@/components/admin/brand/brand-list'
import { CreateBrandDialog } from '@/components/admin/brand/create-brand-dialog'

export default function BrandsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Marcas</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Marca
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marcas</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandList />
        </CardContent>
      </Card>

      <CreateBrandDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}