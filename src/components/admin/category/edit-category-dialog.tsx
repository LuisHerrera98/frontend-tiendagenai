'use client'

import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { categoryService } from '@/lib/categories'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toast } from '@/components/ui/toast'
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

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface EditCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
}

export function EditCategoryDialog({ open, onOpenChange, category }: EditCategoryDialogProps) {
  const queryClient = useQueryClient()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
    },
  })

  // Update form when category changes
  useEffect(() => {
    if (category) {
      form.reset({ name: category.name })
    }
  }, [category, form])

  const mutation = useMutation({
    mutationFn: (data: CategoryFormData) => 
      categoryService.update(category!._id, data.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: any) => {
      // Verificar si es un error de duplicación
      const errorData = error?.response?.data
      if (errorData?.error === 'DUPLICATE_CATEGORY' || errorData?.message?.includes('Ya existe una categoría con ese nombre')) {
        setToastMessage('Ya existe una categoría con ese nombre. Por favor, elige un nombre diferente.')
      } else {
        setToastMessage('Error al actualizar la categoría. Por favor, intenta nuevamente.')
      }
      setShowToast(true)
    }
  })

  const onSubmit = (data: CategoryFormData) => {
    if (category) {
      mutation.mutate(data)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica el nombre de la categoría.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Categoría</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre de la categoría" autoComplete="off" />
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
                  {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {showToast && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}