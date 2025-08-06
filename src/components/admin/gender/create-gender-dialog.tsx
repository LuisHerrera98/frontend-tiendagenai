'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { genderService } from '@/lib/genders'
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

const genderSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})

type GenderFormData = z.infer<typeof genderSchema>

interface CreateGenderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGenderDialog({ open, onOpenChange }: CreateGenderDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<GenderFormData>({
    resolver: zodResolver(genderSchema),
    defaultValues: {
      name: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (name: string) => genderService.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genders'] })
      onOpenChange(false)
      form.reset()
    }
  })

  const onSubmit = (data: GenderFormData) => {
    mutation.mutate(data.name)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Género</DialogTitle>
          <DialogDescription>
            Ingresa el nombre del nuevo género (ej: hombre, mujer, niño, niña).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Género</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: hombre" autoComplete="off" />
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
                {mutation.isPending ? 'Creando...' : 'Crear Género'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}