'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { colorService } from '@/lib/colors'
import { Color } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteColorDialogProps {
  color: Color
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteColorDialog({ color, open, onOpenChange }: DeleteColorDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => colorService.delete(color._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] })
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
          <DialogTitle>Eliminar Color</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar el color <strong>{color.name}</strong>?
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