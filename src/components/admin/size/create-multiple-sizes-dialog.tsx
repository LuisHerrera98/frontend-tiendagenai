'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sizeService } from '@/lib/sizes'
import { categoryService } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect } from '@/components/ui/custom-select'
import { Toast } from '@/components/ui/toast'
import { useToastError } from '@/hooks/use-toast-error'
import { Plus, X, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateMultipleSizesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateMultipleSizesDialog({ open, onOpenChange }: CreateMultipleSizesDialogProps) {
  const [categoryId, setCategoryId] = useState('')
  const [sizeInputs, setSizeInputs] = useState<{ id: string; value: string }[]>([
    { id: '1', value: '' }
  ])
  const [errors, setErrors] = useState({ category_id: '' })
  const [result, setResult] = useState<any>(null)
  
  const queryClient = useQueryClient()
  const { showToast, toastMessage, toastType, handleError, setShowToast } = useToastError()

  const { data: allCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  // Filtrar solo categorías padre (sin parent_id)
  const categories = allCategories?.filter((cat: any) => !cat.parent_id) || []

  const mutation = useMutation({
    mutationFn: ({ categoryId, sizes }: { categoryId: string; sizes: { name: string }[] }) => 
      sizeService.createMultiple(categoryId, sizes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] })
      setResult(data)
      
      // Si se crearon todas las tallas exitosamente, cerrar el modal después de un delay
      if (data.summary.created > 0 && data.summary.errors === 0) {
        setTimeout(() => {
          onOpenChange(false)
          resetForm()
        }, 2000)
      }
    },
    onError: (error: any) => {
      handleError(error, 'las tallas')
    }
  })

  const resetForm = () => {
    setCategoryId('')
    setSizeInputs([{ id: '1', value: '' }])
    setErrors({ category_id: '' })
    setResult(null)
  }

  const handleAddInput = () => {
    const newId = Date.now().toString()
    setSizeInputs([...sizeInputs, { id: newId, value: '' }])
  }

  const handleRemoveInput = (id: string) => {
    if (sizeInputs.length > 1) {
      setSizeInputs(sizeInputs.filter(input => input.id !== id))
    }
  }

  const handleInputChange = (id: string, value: string) => {
    setSizeInputs(sizeInputs.map(input => 
      input.id === id ? { ...input, value } : input
    ))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setErrors({ category_id: '' })
    setResult(null)
    
    // Validate
    if (!categoryId) {
      setErrors({ category_id: 'La categoría es requerida' })
      return
    }
    
    // Filter empty inputs and prepare data
    const validSizes = sizeInputs
      .filter(input => input.value.trim())
      .map(input => ({ name: input.value.trim() }))
    
    if (validSizes.length === 0) {
      handleError(new Error('Debe ingresar al menos una talla'), 'las tallas')
      return
    }
    
    // Submit
    mutation.mutate({ categoryId, sizes: validSizes })
  }

  const handleClose = () => {
    onOpenChange(false)
    resetForm()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Crear Múltiples Tallas
            </DialogTitle>
            <DialogDescription className="text-gray-600 space-y-2">
              <p>Selecciona una categoría padre y agrega todas las tallas que necesites.</p>
              <p className="text-blue-600 text-sm font-medium">
                💡 Las subcategorías heredan automáticamente las tallas de su categoría padre.
              </p>
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
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Tallas
                </Label>
                <Button
                  type="button"
                  onClick={handleAddInput}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={!categoryId}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar talla
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {sizeInputs.map((input, index) => (
                  <div key={input.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={input.value}
                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                        placeholder={categoryId ? `Talla ${index + 1} (ej: S, M, L, 38, 40...)` : "Primero selecciona una categoría"}
                        className={`bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                          !categoryId ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={!categoryId}
                        autoComplete="off"
                      />
                    </div>
                    {sizeInputs.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemoveInput(input.id)}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {categoryId && (
                <p className="text-xs text-gray-500">
                  Puedes agregar múltiples tallas. Las tallas duplicadas serán omitidas automáticamente.
                </p>
              )}
            </div>

            {/* Mostrar resultado si existe */}
            {result && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Resumen de creación</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total procesadas:</span>
                    <span className="ml-2 font-medium">{result.summary.total}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Creadas exitosamente:</span>
                    <span className="ml-2 font-medium text-green-600">{result.summary.created}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Omitidas (ya existen):</span>
                    <span className="ml-2 font-medium text-yellow-600">{result.summary.skipped}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Errores:</span>
                    <span className="ml-2 font-medium text-red-600">{result.summary.errors}</span>
                  </div>
                </div>

                {result.created.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-600">Tallas creadas:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.created.map((size: any) => (
                        <span key={size._id} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          {size.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.skipped.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Tallas omitidas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.skipped.map((item: any, index: number) => (
                        <span key={index} className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                          {item.name} ({item.reason})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Errores:
                    </p>
                    <div className="space-y-1">
                      {result.errors.map((item: any, index: number) => (
                        <div key={index} className="text-xs text-red-600">
                          {item.name}: {item.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {result ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!result && (
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {mutation.isPending ? 'Creando...' : 'Crear Tallas'}
                </Button>
              )}
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