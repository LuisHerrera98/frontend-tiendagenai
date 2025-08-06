'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TypeList } from '@/components/admin/type/type-list'
import { CreateTypeDialog } from '@/components/admin/type/create-type-dialog'

export default function TiposPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tipos</h1>
          <p className="text-gray-600">Administra los tipos de productos (ej: OVERSIZED, SLIM, REGULAR)</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Tipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <TypeList />
        </CardContent>
      </Card>

      <CreateTypeDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}