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
import { colorService } from '@/lib/colors'
import { CreateProductDto } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { CustomSelect } from '@/components/ui/custom-select'
import { X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { DeferredCloudinaryUpload, uploadToCloudinary } from './deferred-cloudinary-upload'
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

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  brand_id: z.string().optional(),
  type_id: z.string().optional(),
  category_id: z.string().optional(),
  cost: z.number().min(0, 'El costo debe ser mayor a 0'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  cashPrice: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  active: z.boolean(),
  gender_id: z.string().optional(),
  genders: z.array(z.string()).optional(),
  color_id: z.string().optional(),
  description: z.string().optional(),
  installmentText: z.string().optional(),
  withoutStock: z.boolean(),
})

type ProductFormData = {
  name: string
  brand_id?: string
  type_id?: string
  category_id?: string
  cost: number
  price: number
  cashPrice?: number
  discount?: number
  active: boolean
  gender_id?: string
  genders?: string[]
  color_id?: string
  description?: string
  installmentText?: string
  withoutStock: boolean
}

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProductDialog({ open, onOpenChange }: CreateProductDialogProps) {
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({})
  const [stockType, setStockType] = useState<'sizes' | 'unit'>('sizes')
  const [unitQuantity, setUnitQuantity] = useState<number>(0)
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
      discount: 0 as any,
      active: true,
      gender_id: '',
      genders: [],
      color_id: '',
      description: '',
      installmentText: '',
      withoutStock: false,
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

  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: colorService.getAll,
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
      setSelectedImageFiles([])
      setSelectedSizes([])
      setSizeQuantities({})
    },
    onError: (error) => {
      console.error('Error creating product:', error)
      // Aquí podrías mostrar un toast o mensaje de error al usuario
    },
  })

  const onSubmit = async (data: ProductFormData) => {
    // Primero subir las imágenes a Cloudinary
    setUploadingImages(true)
    
    try {
      const uploadedUrls: string[] = []
      
      for (const file of selectedImageFiles) {
        try {
          const url = await uploadToCloudinary(file)
          uploadedUrls.push(url)
        } catch (error) {
          console.error(`Error subiendo ${file.name}:`, error)
        }
      }
      
      if (selectedImageFiles.length > 0 && uploadedUrls.length === 0) {
        alert('No se pudieron subir las imágenes. Por favor intenta de nuevo.')
        setUploadingImages(false)
        return
      }
      
      let stock = []

      if (stockType === 'unit') {
        // Para productos por unidad, crear un solo item de stock
        stock = [{
          size_id: 'unit',
          size_name: 'unit',
          quantity: typeof unitQuantity === 'string' ? parseInt(unitQuantity) || 0 : unitQuantity || 0,
          available: true,
        }]
      } else {
        // Para productos con talles, usar el sistema actual
        stock = selectedSizes.map(sizeId => {
          const size = sizes?.find(s => s._id === sizeId)
          return {
            size_id: sizeId,
            size_name: size?.name || '',
            quantity: typeof sizeQuantities[sizeId] === 'string' ? parseInt(sizeQuantities[sizeId]) || 0 : sizeQuantities[sizeId] || 0,
            available: true,
          }
        })
      }

      const productData: CreateProductDto = {
        ...data,
        cost: typeof data.cost === 'string' ? parseFloat(data.cost) || 0 : data.cost,
        price: typeof data.price === 'string' ? parseFloat(data.price) || 0 : data.price,
        cashPrice: data.cashPrice ? (typeof data.cashPrice === 'string' ? parseFloat(data.cashPrice) || 0 : data.cashPrice) : undefined,
        discount: typeof data.discount === 'string' ? parseFloat(data.discount) || 0 : data.discount,
        stock,
        stockType,
        images: uploadedUrls,
        genders: data.genders || [],
        color_id: data.color_id,
        active: data.active !== undefined ? data.active : true, // Asegurar que active se envíe
        description: data.description,
        installmentText: data.installmentText,
        withoutStock: data.withoutStock,
      }

      mutation.mutate(productData)
    } catch (error) {
      console.error('Error al procesar el producto:', error)
      alert('Error al crear el producto')
    } finally {
      setUploadingImages(false)
    }
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
      discount: 0 as any,
      active: true,
      gender_id: '',
      genders: [],
      color_id: '',
      description: '',
      installmentText: '',
      withoutStock: false,
    })
    setSelectedImageFiles([])
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
                name="color_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <CustomSelect
                        options={[
                          { value: '', label: 'Sin color' },
                          ...(colors?.map(color => ({
                            value: color._id,
                            label: color.name
                          })) || [])
                        ]}
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Seleccionar color"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="genders"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Géneros (Selección múltiple)</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-3">
                      {['hombre', 'mujer', 'niño', 'niña'].map((gender) => (
                        <label key={gender} className="flex items-center space-x-2 cursor-pointer">
                          <Checkbox
                            checked={(field.value || []).includes(gender)}
                            onCheckedChange={(checked) => {
                              const current = field.value || []
                              const updated = checked
                                ? [...current, gender]
                                : current.filter(g => g !== gender)
                              field.onChange(updated)
                            }}
                          />
                          <span className="text-sm capitalize">{gender}</span>
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe las características del producto..."
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Esta descripción se mostrará en la página del producto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="installmentText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto de Cuotas (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: 3 cuotas sin interés"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Este texto se mostrará debajo del precio del producto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                    <FormLabel>Precio Lista (Tarjeta)</FormLabel>
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
                name="cashPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Efectivo/Transferencia</FormLabel>
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
                        placeholder="0.00 (Opcional)" 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Precio con descuento para pagos en efectivo o transferencia
                    </FormDescription>
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
                        placeholder="0" 
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

              <FormField
                control={form.control}
                name="withoutStock"
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
                      <FormLabel className="cursor-pointer">Sin stock</FormLabel>
                      <p className="text-xs text-gray-600">Mostrar como "Consultar Stock" en la tienda</p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div>
              <Label className="text-base font-medium">Imágenes del Producto</Label>
              <div className="mt-2">
                <DeferredCloudinaryUpload
                  onImagesSelected={(files) => {
                    setSelectedImageFiles(files)
                  }}
                  multiple={true}
                  maxFiles={5}
                  buttonText="Seleccionar imágenes"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Tipo de Stock</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStockType('sizes')}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    stockType === 'sizes' 
                      ? 'bg-green-50 border-green-500 text-green-700' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Por Talles/Unidad
                </button>
                <button
                  type="button"
                  onClick={() => setStockType('unit')}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    stockType === 'unit'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Por Unidades
                </button>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium flex items-center gap-2">
                {stockType === 'unit' ? 'Stock por unidades' : 'Talles y Stock por unidad'}
                {stockType === 'unit' ? (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200">
                    Por unidades
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-200">
                    Por talles/unidad
                  </Badge>
                )}
              </Label>
              <div className="mt-2 space-y-3 max-h-40 overflow-y-auto">
                {stockType === 'unit' ? (
                  <div className="flex items-center space-x-3 p-3 border rounded bg-gray-50">
                    <Label className="text-sm">Cantidad disponible:</Label>
                    <Input
                      type="number"
                      min="0"
                      value={unitQuantity || ''}
                      onChange={(e) => setUnitQuantity(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-32"
                    />
                    <span className="text-sm text-gray-500">unidades</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || uploadingImages}>
                {(uploadingImages || mutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploadingImages ? 'Subiendo imágenes...' : mutation.isPending ? 'Creando...' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}