'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SizeList } from '@/components/admin/size/size-list'
import { CreateSizeDialog } from '@/components/admin/size/create-size-dialog'

export default function SizesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Talles</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Talle
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <SizeList />
        </CardContent>
      </Card>

      <CreateSizeDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}