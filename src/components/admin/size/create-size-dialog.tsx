'use client'

import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sizeService } from '@/lib/sizes'
import { categoryService } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateSizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSizeDialog({ open, onOpenChange }: CreateSizeDialogProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedCategoryName, setSelectedCategoryName] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [errors, setErrors] = useState({ name: '', category_id: '' })
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const mutation = useMutation({
    mutationFn: ({ name, category_id }: { name: string; category_id: string }) => 
      sizeService.create(name, category_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] })
      onOpenChange(false)
      // Reset form
      setName('')
      setCategoryId('')
      setSelectedCategoryName('')
      setIsDropdownOpen(false)
      setErrors({ name: '', category_id: '' })
    },
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setCategoryId(categoryId)
    setSelectedCategoryName(categoryName)
    setIsDropdownOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
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
    mutation.mutate({ name: name.trim(), category_id: categoryId })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">Crear Nuevo Talle</DialogTitle>
          <DialogDescription className="text-gray-600">
            Ingresa el nombre del nuevo talle y selecciona una categoría.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2" ref={dropdownRef}>
            <Label className="text-sm font-medium text-gray-700">
              Categoría
            </Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className={selectedCategoryName ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedCategoryName || 'Seleccionar categoría'}
                </span>
                <svg 
                  className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
                  <div className="max-h-60 overflow-auto py-1">
                    {categories?.map((category) => (
                      <button
                        key={category._id}
                        type="button"
                        onClick={() => handleCategorySelect(category._id, category.name)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              {mutation.isPending ? 'Creando...' : 'Crear Talle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}