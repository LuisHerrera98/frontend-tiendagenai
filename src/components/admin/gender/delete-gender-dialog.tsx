'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { genderService } from '@/lib/genders'
import { Gender } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteGenderDialogProps {
  gender: Gender
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteGenderDialog({ gender, open, onOpenChange }: DeleteGenderDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => genderService.delete(gender._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genders'] })
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
          <DialogTitle>Eliminar Género</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar el género <strong className="capitalize">{gender.name}</strong>?
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