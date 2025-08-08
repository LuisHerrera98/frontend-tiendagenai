'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toast } from '@/components/ui/toast'
import { useToastError } from '@/hooks/use-toast-error'
import { Store, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from 'react-hot-toast'
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
  FormDescription,
} from '@/components/ui/form'

const tenantSchema = z.object({
  storeName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  subdomain: z.string()
    .min(3, 'El subdominio debe tener al menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo se permiten letras minúsculas, números y guiones'),
  phone: z.string().optional(),
})

type TenantFormData = z.infer<typeof tenantSchema>

interface CreateTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: any) => void
}

export function CreateTenantDialog({ open, onOpenChange, onSuccess }: CreateTenantDialogProps) {
  const { showToast, toastMessage, toastType, setShowToast } = useToastError()
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [checkingSubdomain, setCheckingSubdomain] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [subdomainMessage, setSubdomainMessage] = useState('')

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      storeName: '',
      subdomain: '',
      phone: '',
    },
  })

  const subdomain = form.watch('subdomain')
  const debouncedSubdomain = useDebounce(subdomain, 500)

  // Verificar disponibilidad del subdominio
  useEffect(() => {
    if (debouncedSubdomain && debouncedSubdomain.length >= 3) {
      setCheckingSubdomain(true)
      api.post('/user/check-subdomain', { subdomain: debouncedSubdomain })
        .then(response => {
          setSubdomainAvailable(response.data.available)
          setSubdomainMessage(response.data.message)
          if (!response.data.available) {
            form.setError('subdomain', {
              type: 'manual',
              message: response.data.message,
            })
          } else {
            form.clearErrors('subdomain')
          }
        })
        .catch(() => {
          setSubdomainAvailable(null)
          setSubdomainMessage('')
        })
        .finally(() => {
          setCheckingSubdomain(false)
        })
    } else {
      setSubdomainAvailable(null)
      setSubdomainMessage('')
    }
  }, [debouncedSubdomain, form])

  const mutation = useMutation({
    mutationFn: async (data: TenantFormData) => {
      const response = await api.post('/user/create-tenant', data)
      return response.data
    },
    onSuccess: (data) => {
      // Actualizar el token con el nuevo JWT
      localStorage.setItem('auth_token', data.access_token)
      
      // Actualizar el usuario en localStorage con las nuevas tiendas
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        user.tenants = data.tenants
        user.currentTenantId = data.tenant.id
        localStorage.setItem('user', JSON.stringify(user))
      }
      
      // Guardar el nuevo subdominio activo
      localStorage.setItem('tenant_subdomain', data.tenant.subdomain)
      
      setSuccessMessage('¡Tienda creada exitosamente!')
      setShowSuccessToast(true)
      
      // Cerrar el modal y recargar después de un breve delay
      setTimeout(() => {
        onOpenChange(false)
        form.reset()
        if (onSuccess) {
          onSuccess(data)
        } else {
          window.location.reload()
        }
      }, 1500)
    },
    onError: (error: any) => {
      console.error('Error creating tenant:', error)
      const errorData = error?.response?.data
      if (errorData?.message?.includes('subdominio ya está en uso')) {
        form.setError('subdomain', {
          type: 'manual',
          message: 'Este subdominio ya está en uso. Por favor, elige otro.',
        })
      } else if (error?.response?.status === 404) {
        toast.error('Error: El servidor no está respondiendo correctamente. Por favor, verifica que el backend esté actualizado.')
      } else {
        toast.error(errorData?.message || 'Error al crear la tienda. Por favor, intenta nuevamente.')
      }
    }
  })

  const onSubmit = (data: TenantFormData) => {
    mutation.mutate(data)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Crear Nueva Tienda
            </DialogTitle>
            <DialogDescription>
              Configura los datos de tu nueva tienda online
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Tienda</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Mi Tienda Online" 
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subdominio</FormLabel>
                    <FormControl>
                      <div className="flex items-center relative">
                        <Input 
                          {...field} 
                          placeholder="mitienda" 
                          autoComplete="off"
                          className="rounded-r-none pr-10"
                          onChange={(e) => {
                            // Convertir a minúsculas automáticamente
                            field.onChange(e.target.value.toLowerCase())
                          }}
                        />
                        {checkingSubdomain && (
                          <Loader2 className="absolute right-[140px] w-4 h-4 animate-spin text-gray-400" />
                        )}
                        {!checkingSubdomain && subdomainAvailable === true && subdomain.length >= 3 && (
                          <CheckCircle className="absolute right-[140px] w-4 h-4 text-green-500" />
                        )}
                        {!checkingSubdomain && subdomainAvailable === false && (
                          <XCircle className="absolute right-[140px] w-4 h-4 text-red-500" />
                        )}
                        <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-600">
                          .tiendagenai.com
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {subdomainAvailable === true && subdomain.length >= 3 ? (
                        <span className="text-green-600">{subdomainMessage}</span>
                      ) : (
                        'Este será el enlace de tu tienda'
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="+54 11 1234-5678" 
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={mutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending || checkingSubdomain || (subdomain.length >= 3 && subdomainAvailable === false)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Tienda'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {showToast && (
        <Toast
          message={toastMessage || 'Error al crear la tienda. Por favor, intenta nuevamente.'}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
      
      {showSuccessToast && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </>
  )
}