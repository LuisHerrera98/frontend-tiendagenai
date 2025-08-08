'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { typeService } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toast } from '@/components/ui/toast'
import { useToastError } from '@/hooks/use-toast-error'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const typeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})

type TypeFormData = z.infer<typeof typeSchema>

interface CreateTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTypeDialog({ open, onOpenChange }: CreateTypeDialogProps) {
  const queryClient = useQueryClient()
  const { showToast, toastMessage, toastType, handleError, setShowToast } = useToastError()

  const form = useForm<TypeFormData>({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      name: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (name: string) => typeService.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: any) => {
      handleError(error, 'el tipo')
    }
  })

  const onSubmit = (data: TypeFormData) => {
    mutation.mutate(data.name)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Tipo</DialogTitle>
          <DialogDescription>
            Ingresa el nombre del nuevo tipo de producto (ej: OVERSIZED, SLIM).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Tipo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: OVERSIZED" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creando...' : 'Crear Tipo'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
      </Dialog>
      
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}