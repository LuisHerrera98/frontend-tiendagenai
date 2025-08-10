'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorList } from '@/components/admin/color/color-list'
import { CreateColorDialog } from '@/components/admin/color/create-color-dialog'

export default function ColorsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Colores</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Color
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Colores</CardTitle>
        </CardHeader>
        <CardContent>
          <ColorList />
        </CardContent>
      </Card>

      <CreateColorDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}