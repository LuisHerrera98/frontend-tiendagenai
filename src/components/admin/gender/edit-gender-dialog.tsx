'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { genderService } from '@/lib/genders'
import { Gender } from '@/types'
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

const genderSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})

type GenderFormData = z.infer<typeof genderSchema>

interface EditGenderDialogProps {
  gender: Gender
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditGenderDialog({ gender, open, onOpenChange }: EditGenderDialogProps) {
  const queryClient = useQueryClient()
  const { showToast, toastMessage, toastType, handleError, setShowToast } = useToastError()

  const form = useForm<GenderFormData>({
    resolver: zodResolver(genderSchema),
    defaultValues: {
      name: gender.name,
    },
  })

  useEffect(() => {
    if (gender) {
      form.reset({
        name: gender.name,
      })
    }
  }, [gender, form])

  const mutation = useMutation({
    mutationFn: (name: string) => genderService.update(gender._id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genders'] })
      onOpenChange(false)
    },
    onError: (error: any) => {
      handleError(error, 'el género')
    }
  })

  const onSubmit = (data: GenderFormData) => {
    mutation.mutate(data.name)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Editar Género</DialogTitle>
          <DialogDescription>
            Modifica la información del género.
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
                    <Input {...field} placeholder="Nombre del género" autoComplete="off" />
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
                {mutation.isPending ? 'Actualizando...' : 'Actualizar Género'}
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