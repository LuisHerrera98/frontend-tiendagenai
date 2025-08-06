'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { brandService } from '@/lib/brands'
import { Brand } from '@/types'
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

const brandSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})

type BrandFormData = z.infer<typeof brandSchema>

interface EditBrandDialogProps {
  brand: Brand
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditBrandDialog({ brand, open, onOpenChange }: EditBrandDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand.name,
    },
  })

  useEffect(() => {
    if (brand) {
      form.reset({
        name: brand.name,
      })
    }
  }, [brand, form])

  const mutation = useMutation({
    mutationFn: (name: string) => brandService.update(brand._id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      onOpenChange(false)
    }
  })

  const onSubmit = (data: BrandFormData) => {
    mutation.mutate(data.name)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Editar Marca</DialogTitle>
          <DialogDescription>
            Modifica la información de la marca.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Marca</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre de la marca" autoComplete="off" />
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
                {mutation.isPending ? 'Actualizando...' : 'Actualizar Marca'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}