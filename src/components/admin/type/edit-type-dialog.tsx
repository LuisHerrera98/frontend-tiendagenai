'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { typeService } from '@/lib/types'
import { Type } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface EditTypeDialogProps {
  type: Type
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTypeDialog({ type, open, onOpenChange }: EditTypeDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<TypeFormData>({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      name: type.name,
    },
  })

  useEffect(() => {
    if (type) {
      form.reset({
        name: type.name,
      })
    }
  }, [type, form])

  const mutation = useMutation({
    mutationFn: (name: string) => typeService.update(type._id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] })
      onOpenChange(false)
    }
  })

  const onSubmit = (data: TypeFormData) => {
    mutation.mutate(data.name)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Editar Tipo</DialogTitle>
          <DialogDescription>
            Modifica la información del tipo.
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
                    <Input {...field} placeholder="Nombre del tipo" autoComplete="off" />
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
                {mutation.isPending ? 'Actualizando...' : 'Actualizar Tipo'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}