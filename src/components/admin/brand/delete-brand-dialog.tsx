'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { brandService } from '@/lib/brands'
import { Brand } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteBrandDialogProps {
  brand: Brand
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteBrandDialog({ brand, open, onOpenChange }: DeleteBrandDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => brandService.delete(brand._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
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
          <DialogTitle>Eliminar Marca</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar la marca <strong>{brand.name}</strong>?
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