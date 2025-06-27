'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { productService } from '@/lib/products'
import { categoryService } from '@/lib/categories'
import { sizeService } from '@/lib/sizes'
import { CreateProductDto } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  brand_name: z.string().optional(),
  model_name: z.string().optional(),
  category_id: z.string().optional(),
  cost: z.number().min(0, 'El costo debe ser mayor a 0'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  discount: z.number().min(0).max(100).optional(),
  active: z.boolean(),
})

type ProductFormData = {
  name: string
  brand_name?: string
  model_name?: string
  category_id?: string
  cost: number
  price: number
  discount?: number
  active: boolean
}

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProductDialog({ open, onOpenChange }: CreateProductDialogProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({})
  const queryClient = useQueryClient()

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      brand_name: '',
      model_name: '',
      cost: 0,
      price: 0,
      discount: 0,
      active: true,
    },
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const { data: sizes } = useQuery({
    queryKey: ['sizes'],
    queryFn: sizeService.getAll,
  })

  const mutation = useMutation({
    mutationFn: ({ productData, images }: { productData: CreateProductDto; images: File[] }) => 
      productService.createProduct(productData, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onOpenChange(false)
      form.reset()
      setSelectedImages([])
      setSelectedSizes([])
      setSizeQuantities({})
    },
  })

  const onSubmit = (data: ProductFormData) => {
    console.log('Form data:', data)
    console.log('Selected sizes:', selectedSizes)
    console.log('Size quantities:', sizeQuantities)
    console.log('Selected images:', selectedImages)

    const stock = selectedSizes.map(sizeId => {
      const size = sizes?.find(s => s._id === sizeId)
      return {
        size_id: sizeId,
        size_name: size?.name || '',
        quantity: sizeQuantities[sizeId] || 0,
      }
    })

    const productData: CreateProductDto = {
      ...data,
      stock,
    }

    console.log('Product data to send:', productData)
    mutation.mutate({ productData, images: selectedImages })
  }

  const handleSizeToggle = (sizeId: string) => {
    setSelectedSizes(prev => {
      const updated = prev.includes(sizeId)
        ? prev.filter(id => id !== sizeId)
        : [...prev, sizeId]
      
      if (!prev.includes(sizeId)) {
        setSizeQuantities(prev => ({ ...prev, [sizeId]: 1 }))
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

  const handleQuantityChange = (sizeId: string, quantity: number) => {
    setSizeQuantities(prev => ({ ...prev, [sizeId]: Math.max(0, quantity) }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
          <DialogDescription>
            Completa la información del producto para agregarlo al inventario.
          </DialogDescription>
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
                      <Input {...field} placeholder="Nombre del producto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Marca del producto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="model_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Modelo del producto" />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="0" 
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Producto activo</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div>
              <Label>Imágenes del Producto</Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setSelectedImages(files.slice(0, 4))
                }}
                className="mt-1"
              />
              {selectedImages.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedImages.length} imagen(es) seleccionada(s)
                </p>
              )}
            </div>

            <div>
              <Label className="text-base font-medium">Tallas y Stock</Label>
              <div className="mt-2 space-y-3 max-h-40 overflow-y-auto">
                {sizes?.map((size) => (
                  <div key={size._id} className="flex items-center space-x-3 p-2 border rounded">
                    <Checkbox
                      checked={selectedSizes.includes(size._id)}
                      onCheckedChange={() => handleSizeToggle(size._id)}
                    />
                    <Label className="flex-1">{size.name}</Label>
                    {selectedSizes.includes(size._id) && (
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Cantidad:</Label>
                        <Input
                          type="number"
                          min="0"
                          value={sizeQuantities[size._id] || 0}
                          onChange={(e) => handleQuantityChange(size._id, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      </div>
                    )}
                  </div>
                ))}
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