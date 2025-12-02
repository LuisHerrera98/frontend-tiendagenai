'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { categoryService } from '@/lib/categories'
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

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCategoryDialog({ open, onOpenChange }: CreateCategoryDialogProps) {
  const queryClient = useQueryClient()
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  // Filtrar solo categorías padre para el selector
  const parentCategories = categories?.filter(cat => !cat.parent_id) || []

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      parent_id: '',
      order: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CategoryFormData) => {
      const order = data.order ? parseInt(data.order) : undefined
      return categoryService.create(data.name, data.parent_id || undefined, order && order >= 1 ? order : undefined)
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
        setToastMessage('Error al crear la categoría. Por favor, intenta nuevamente.')
      }
      setShowToast(true)
    }
  })

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Crear Nueva Categoría</DialogTitle>
            <DialogDescription>
              Ingresa el nombre de la nueva categoría.
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
                  {mutation.isPending ? 'Creando...' : 'Crear Categoría'}
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