'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sizeService } from '@/lib/sizes'
import { categoryService } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect } from '@/components/ui/custom-select'
import { Toast } from '@/components/ui/toast'
import { useToastError } from '@/hooks/use-toast-error'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface EditSizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  size: any | null
}

export function EditSizeDialog({ open, onOpenChange, size }: EditSizeDialogProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [errors, setErrors] = useState({ name: '', category_id: '' })
  
  const queryClient = useQueryClient()
  const { showToast, toastMessage, toastType, handleError, setShowToast } = useToastError()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const mutation = useMutation({
    mutationFn: ({ id, name, category_id }: { id: string; name: string; category_id: string }) => 
      sizeService.update(id, name, category_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] })
      onOpenChange(false)
      // Reset form
      setName('')
      setCategoryId('')
      setErrors({ name: '', category_id: '' })
    },
    onError: (error: any) => {
      handleError(error, 'la talla')
    }
  })

  // Load size data when size prop changes
  useEffect(() => {
    if (size) {
      setName(size.name || '')
      setCategoryId(size.category_id || '')
    }
  }, [size])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!size) return
    
    // Reset errors
    setErrors({ name: '', category_id: '' })
    
    // Validate
    let hasErrors = false
    const newErrors = { name: '', category_id: '' }
    
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido'
      hasErrors = true
    }
    
    if (!categoryId) {
      newErrors.category_id = 'La categoría es requerida'
      hasErrors = true
    }
    
    if (hasErrors) {
      setErrors(newErrors)
      return
    }
    
    // Submit
    mutation.mutate({ id: size._id, name: name.trim(), category_id: categoryId })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">Editar Talle</DialogTitle>
          <DialogDescription className="text-gray-600">
            Modifica el nombre del talle y su categoría.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Categoría
            </Label>
            <CustomSelect
              options={[
                { value: '', label: 'Seleccionar categoría' },
                ...(categories?.map(category => ({
                  value: category._id,
                  label: category.name
                })) || [])
              ]}
              value={categoryId}
              onChange={(value) => setCategoryId(value)}
              placeholder="Seleccionar categoría"
            />
            {errors.category_id && (
              <p className="text-sm text-red-600">{errors.category_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre del Talle
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={categoryId ? "Ej: S, M, L, XL, 38, 40..." : "Primero selecciona una categoría"}
              className={`bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                !categoryId ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!categoryId}
              autoComplete="off"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
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