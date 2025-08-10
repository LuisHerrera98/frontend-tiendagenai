'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { colorService } from '@/lib/colors'
import { Color } from '@/types'
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

const colorSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})

type ColorFormData = z.infer<typeof colorSchema>

interface EditColorDialogProps {
  color: Color
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditColorDialog({ color, open, onOpenChange }: EditColorDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<ColorFormData>({
    resolver: zodResolver(colorSchema),
    defaultValues: {
      name: color.name,
    },
  })

  useEffect(() => {
    if (color) {
      form.reset({
        name: color.name,
      })
    }
  }, [color, form])

  const mutation = useMutation({
    mutationFn: (data: { name: string }) => colorService.update(color._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] })
      onOpenChange(false)
    }
  })

  const onSubmit = (data: ColorFormData) => {
    mutation.mutate({ name: data.name })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Editar Color</DialogTitle>
          <DialogDescription>
            Modifica la información del color.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Color</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre del color" autoComplete="off" />
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
                {mutation.isPending ? 'Actualizando...' : 'Actualizar Color'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}