'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { colorService } from '@/lib/colors'
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

const colorSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})

type ColorFormData = z.infer<typeof colorSchema>

interface CreateColorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateColorDialog({ open, onOpenChange }: CreateColorDialogProps) {
  const queryClient = useQueryClient()
  const { showToast, toastMessage, toastType, handleError, setShowToast } = useToastError()

  const form = useForm<ColorFormData>({
    resolver: zodResolver(colorSchema),
    defaultValues: {
      name: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: { name: string }) => colorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: any) => {
      handleError(error, 'el color')
    }
  })

  const onSubmit = (data: ColorFormData) => {
    mutation.mutate({ name: data.name })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Color</DialogTitle>
            <DialogDescription>
              Ingresa el nombre del nuevo color.
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
                  {mutation.isPending ? 'Creando...' : 'Crear Color'}
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