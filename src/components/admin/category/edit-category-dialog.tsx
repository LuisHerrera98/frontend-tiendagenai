'use client'

import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  parent_id: z.string().optional(),
  order: z.string().optional(),
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

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  // Filtrar categorías padre (excluyendo la categoría actual para evitar recursión)
  const parentCategories = categories?.filter(cat => !cat.parent_id && cat._id !== category?._id) || []

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      parent_id: category?.parent_id || '',
      order: category?.order ? String(category.order) : '',
    },
  })

  // Update form when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        parent_id: category.parent_id || '',
        order: category.order ? String(category.order) : ''
      })
    }
  }, [category, form])

  const mutation = useMutation({
    mutationFn: (data: CategoryFormData) => {
      const order = data.order ? parseInt(data.order) : undefined
      return categoryService.update(category!._id, data.name, data.parent_id || undefined, order && order >= 1 ? order : undefined)
    },
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
      } else if (errorData?.error === 'DUPLICATE_ORDER' || errorData?.message?.includes('Ya existe una categoría con el orden')) {
        setToastMessage(errorData?.message || 'Ya existe una categoría con ese número de orden.')
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

              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría Padre (Opcional)</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">Sin categoría padre (Categoría principal)</option>
                        {parentCategories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        placeholder="Sin orden"
                        autoComplete="off"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Número menor = aparece primero. Vacío = al final
                    </p>
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