'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sizeService } from '@/lib/sizes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trash2 } from 'lucide-react'

interface DeleteSizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  size: any | null
}

export function DeleteSizeDialog({ open, onOpenChange, size }: DeleteSizeDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string) => sizeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] })
      onOpenChange(false)
    },
  })

  const handleDelete = () => {
    if (size) {
      mutation.mutate(size._id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">Eliminar Talle</DialogTitle>
              <DialogDescription className="text-gray-600">
                Esta acción no se puede deshacer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              ¿Estás seguro de que quieres eliminar el talle <strong>"{size?.name}"</strong>?
            </p>
            <p className="text-xs text-red-600 mt-2">
              Este talle será eliminado permanentemente y no podrá ser recuperado.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDelete}
            disabled={mutation.isPending}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {mutation.isPending ? 'Eliminando...' : 'Eliminar Talle'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}