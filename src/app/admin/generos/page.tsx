'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GenderList } from '@/components/admin/gender/gender-list'
import { CreateGenderDialog } from '@/components/admin/gender/create-gender-dialog'

export default function GenerosPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Géneros</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Género
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Géneros</CardTitle>
        </CardHeader>
        <CardContent>
          <GenderList />
        </CardContent>
      </Card>

      <CreateGenderDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}