'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { productService } from '@/lib/products'
import { categoryService } from '@/lib/categories'
import { sizeService } from '@/lib/sizes'
import { brandService } from '@/lib/brands'
import { typeService } from '@/lib/types'
import { genderService } from '@/lib/genders'
import { CreateProductDto } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomSelect } from '@/components/ui/custom-select'
import { X } from 'lucide-react'
import Image from 'next/image'
import { SimpleCloudinaryUpload } from './simple-cloudinary-upload'
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

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  brand_id: z.string().optional(),
  type_id: z.string().optional(),
  category_id: z.string().optional(),
  cost: z.number().min(0, 'El costo debe ser mayor a 0'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  discount: z.number().min(0).max(100).optional(),
  active: z.boolean(),
  gender_id: z.string().optional(),
})

type ProductFormData = {
  name: string
  brand_id?: string
  type_id?: string
  category_id?: string
  cost: number
  price: number
  discount?: number
  active: boolean
  gender_id?: string
}

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProductDialog({ open, onOpenChange }: CreateProductDialogProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({})
  const queryClient = useQueryClient()

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      brand_id: '',
      type_id: '',
      category_id: '',
      cost: '' as any,
      price: '' as any,
      discount: '' as any,
      active: true,
      gender_id: '',
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const selectedCategoryId = form.watch('category_id')
  
  const { data: sizes } = useQuery({
    queryKey: ['sizes', selectedCategoryId],
    queryFn: () => selectedCategoryId ? sizeService.getByCategory(selectedCategoryId) : [],
    enabled: !!selectedCategoryId,
  })

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getAll,
  })

  const { data: types } = useQuery({
    queryKey: ['types'],
    queryFn: typeService.getAll,
  })

  const { data: genders } = useQuery({
    queryKey: ['genders'],
    queryFn: genderService.getAll,
  })

  // Limpiar talles seleccionados cuando cambie la categoría
  useEffect(() => {
    setSelectedSizes([])
    setSizeQuantities({})
  }, [selectedCategoryId])

  const mutation = useMutation({
    mutationFn: (productData: CreateProductDto) => 
      productService.createProduct(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onOpenChange(false)
      form.reset()
      setImageUrls([])
      setSelectedSizes([])
      setSizeQuantities({})
    },
    onError: (error) => {
      console.error('Error creating product:', error)
      // Aquí podrías mostrar un toast o mensaje de error al usuario
    },
  })

  const onSubmit = (data: ProductFormData) => {
    const stock = selectedSizes.map(sizeId => {
      const size = sizes?.find(s => s._id === sizeId)
      return {
        size_id: sizeId,
        size_name: size?.name || '',
        quantity: typeof sizeQuantities[sizeId] === 'string' ? parseInt(sizeQuantities[sizeId]) || 0 : sizeQuantities[sizeId] || 0,
        available: true,
      }
    })

    const productData: CreateProductDto = {
      ...data,
      cost: typeof data.cost === 'string' ? parseFloat(data.cost) || 0 : data.cost,
      price: typeof data.price === 'string' ? parseFloat(data.price) || 0 : data.price,
      discount: typeof data.discount === 'string' ? parseFloat(data.discount) || 0 : data.discount,
      stock,
      images: imageUrls,
    }
    
    mutation.mutate(productData)
  }

  const handleSizeToggle = (sizeId: string) => {
    setSelectedSizes(prev => {
      const updated = prev.includes(sizeId)
        ? prev.filter(id => id !== sizeId)
        : [...prev, sizeId]
      
      if (!prev.includes(sizeId)) {
        setSizeQuantities(prev => ({ ...prev, [sizeId]: '' as any }))
      } else {
        setSizeQuantities(prev => {
          const updated = { ...prev }
          delete updated[sizeId]
          return updated
        })
      }
      
      return updated
    })
  }

  const handleQuantityChange = (sizeId: string, value: string) => {
    setSizeQuantities(prev => ({ ...prev, [sizeId]: Math.max(0, parseInt(value) || 0) }))
  }

  const handleClearForm = () => {
    form.reset({
      name: '',
      brand_id: '',
      type_id: '',
      category_id: '',
      cost: '' as any,
      price: '' as any,
      discount: '' as any,
      active: true,
      gender_id: '',
    })
    setImageUrls([])
    setSelectedSizes([])
    setSizeQuantities({})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Crear Producto</DialogTitle>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleClearForm}
              className="text-gray-600 hover:text-gray-800"
            >
              Limpiar campos
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre del producto" autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Seleccionar marca' },
                          ...(brands?.map(brand => ({
                            value: brand._id,
                            label: brand.name
                          })) || [])
                        ]}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Seleccionar marca"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Seleccionar tipo' },
                          ...(types?.map(type => ({
                            value: type._id,
                            label: type.name
                          })) || [])
                        ]}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Seleccionar tipo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Selecciona una categoría' },
                          ...(categories?.map(category => ({
                            value: category._id,
                            label: category.name
                          })) || [])
                        ]}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Selecciona una categoría"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Género</FormLabel>
                    <FormControl>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Seleccionar género' },
                          ...(genders?.map(gender => ({
                            value: gender._id,
                            label: gender.name
                          })) || [])
                        ]}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Seleccionar género"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field}
                        onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? '' : parseFloat(value) || 0)
                        }}
                        placeholder="0.00" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field}
                        onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? '' : parseFloat(value) || 0)
                        }}
                        placeholder="0.00" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descuento (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100"
                        {...field}
                        onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? '' : parseFloat(value) || 0)
                        }}
                        placeholder="0%" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded bg-gray-50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="h-5 w-5 mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">Producto activo</FormLabel>
                    <p className="text-xs text-gray-600">El producto estará visible en la tienda</p>
                  </div>
                </FormItem>
              )}
            />

            <div>
              <Label className="text-base font-medium">Imágenes del Producto</Label>
              <div className="mt-2">
                <SimpleCloudinaryUpload
                  onUpload={(urls) => {
                    setImageUrls(urls)
                  }}
                  multiple={true}
                  maxFiles={5}
                  buttonText={imageUrls.length > 0 ? "Agregar más imágenes" : "Subir imágenes"}
                />
                {imageUrls.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {imageUrls.length} imagen(es) subida(s):
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square relative overflow-hidden rounded-lg border">
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="150px"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrls(prev => prev.filter((_, i) => i !== index))
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Tallas y Stock</Label>
              <div className="mt-2 space-y-3 max-h-40 overflow-y-auto">
                {!selectedCategoryId ? (
                  <p className="text-sm text-gray-500 p-4 text-center border rounded bg-gray-50">
                    Selecciona una categoría para ver las tallas disponibles
                  </p>
                ) : sizes?.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 text-center border rounded bg-gray-50">
                    No hay tallas disponibles para esta categoría
                  </p>
                ) : (
                  sizes?.map((size) => (
                    <div key={size._id} className={`flex items-start space-x-3 p-3 border rounded transition-colors ${selectedSizes.includes(size._id) ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'}`}>
                      <Checkbox
                        checked={selectedSizes.includes(size._id)}
                        onCheckedChange={() => handleSizeToggle(size._id)}
                        className="h-5 w-5 mt-0.5"
                      />
                      <Label className="flex-1 cursor-pointer leading-relaxed" onClick={() => handleSizeToggle(size._id)}>{size.name}</Label>
                      {selectedSizes.includes(size._id) && (
                        <div className="flex items-center space-x-2">
                          <Label className="text-sm">Cantidad:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={sizeQuantities[size._id] || ''}
                            onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                            onChange={(e) => handleQuantityChange(size._id, e.target.value)}
                            placeholder="1"
                            className="w-20"
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creando...' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}