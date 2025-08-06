'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { typeService } from '@/lib/types'
import { Type } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteTypeDialogProps {
  type: Type
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteTypeDialog({ type, open, onOpenChange }: DeleteTypeDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => typeService.delete(type._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] })
      onOpenChange(false)
    }
  })

  const handleDelete = () => {
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Eliminar Tipo</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar el tipo <strong>{type.name}</strong>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}