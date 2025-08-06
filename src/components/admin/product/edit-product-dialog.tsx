'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/lib/products'
import { categoryService } from '@/lib/categories'
import { sizeService } from '@/lib/sizes'
import { brandService } from '@/lib/brands'
import { typeService } from '@/lib/types'
import { genderService } from '@/lib/genders'
import { Product, ProductStock } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface EditProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

export function EditProductDialog({ open, onOpenChange, product }: EditProductDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    type_id: '',
    brand_id: '',
    gender_id: '',
    category_id: '',
    active: true,
    discount: '',
  })
  const [productSizes, setProductSizes] = useState<{[key: string]: {name: string, quantity: number, selected: boolean}}>({})

  const queryClient = useQueryClient()

  const handleSizeToggle = (sizeId: string) => {
    const size = sizes?.find(s => s._id === sizeId)
    if (!size) return

    setProductSizes(prev => {
      const newSizes = { ...prev }
      
      if (newSizes[sizeId]) {
        // Remove size
        delete newSizes[sizeId]
      } else {
        // Add size with default quantity
        newSizes[sizeId] = {
          name: size.name,
          quantity: 1,
          selected: true
        }
      }
      
      return newSizes
    })
  }

  const handleQuantityChange = (sizeId: string, value: string) => {
    console.log('handleQuantityChange called with sizeId:', sizeId, 'value:', value)
    const numericValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0)
    
    setProductSizes(prev => {
      console.log('Previous productSizes:', prev)
      const newSizes = {
        ...prev,
        [sizeId]: {
          ...prev[sizeId],
          quantity: numericValue
        }
      }
      console.log('New productSizes:', newSizes)
      return newSizes
    })
  }

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  const { data: sizes } = useQuery({
    queryKey: ['sizes', formData.category_id],
    queryFn: () => formData.category_id ? sizeService.getByCategory(formData.category_id) : [],
    enabled: !!formData.category_id,
  })

  const { data: brands, isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getAll,
  })

  const { data: types, isLoading: typesLoading, error: typesError } = useQuery({
    queryKey: ['types'],
    queryFn: typeService.getAll,
  })

  const { data: genders, isLoading: gendersLoading, error: gendersError } = useQuery({
    queryKey: ['genders'],
    queryFn: genderService.getAll,
  })

  // Debug logging
  console.log('Brands:', brands, 'Loading:', brandsLoading, 'Error:', brandsError)
  console.log('Types:', types, 'Loading:', typesLoading, 'Error:', typesError)
  console.log('Genders:', genders, 'Loading:', gendersLoading, 'Error:', gendersError)

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onOpenChange(false)
    },
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        type_id: product.type_id || '',
        brand_id: product.brand_id || '',
        category_id: product.category_id || '',
        active: product.active ?? true,
        discount: product.discount?.toString() || '0',
        gender_id: product.gender_id || ''
      })
      
      // Set existing stock data ONLY on initial load
      if (product.stock && product.stock.length > 0) {
        const initialSizes: {[key: string]: {name: string, quantity: number, selected: boolean}} = {}
        product.stock.forEach(s => {
          initialSizes[s.size_id] = {
            name: s.size_name,
            quantity: s.quantity,
            selected: true
          }
        })
        setProductSizes(initialSizes)
      } else {
        setProductSizes({})
      }
    }
  }, [product?._id]) // Only run when product ID changes, not on every product update

  // Clean up invalid sizes when category changes
  useEffect(() => {
    if (!sizes || !formData.category_id) return
    
    const allAvailableSizes = sizes.map(s => s._id)
    
    setProductSizes(prev => {
      const cleanedSizes = { ...prev }
      Object.keys(cleanedSizes).forEach(sizeId => {
        if (!allAvailableSizes.includes(sizeId)) {
          delete cleanedSizes[sizeId]
        }
      })
      return cleanedSizes
    })
  }, [formData.category_id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    // Create stock array from productSizes
    const stockArray: ProductStock[] = Object.entries(productSizes).map(([sizeId, sizeData]) => ({
      size_id: sizeId,
      size_name: sizeData.name,
      quantity: sizeData.quantity,
      available: true
    }))

    const updateData = {
      name: formData.name,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      type_id: formData.type_id,
      brand_id: formData.brand_id,
      category_id: formData.category_id,
      active: formData.active,
      discount: parseFloat(formData.discount),
      gender_id: formData.gender_id,
      stock: stockArray
    }

    updateMutation.mutate({ id: product._id, data: updateData })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">Editar Producto</DialogTitle>
          <p className="text-sm text-gray-600">Modifica los datos del producto</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Seleccionar categoría' },
                  ...(categories?.map(category => ({
                    value: category._id,
                    label: category.name
                  })) || [])
                ]}
                value={formData.category_id}
                onChange={(value) => setFormData({ ...formData, category_id: value })}
                placeholder="Seleccionar categoría"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_id">Marca</Label>
              <CustomSelect
                options={[
                  { value: '', label: brandsLoading ? 'Cargando marcas...' : 'Seleccionar marca' },
                  ...(brands?.map(brand => ({
                    value: brand._id,
                    label: brand.name
                  })) || [])
                ]}
                value={formData.brand_id}
                onChange={(value) => setFormData({ ...formData, brand_id: value })}
                placeholder="Seleccionar marca"
                disabled={brandsLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type_id">Tipo</Label>
              <CustomSelect
                options={[
                  { value: '', label: typesLoading ? 'Cargando tipos...' : 'Seleccionar tipo' },
                  ...(types?.map(type => ({
                    value: type._id,
                    label: type.name
                  })) || [])
                ]}
                value={formData.type_id}
                onChange={(value) => setFormData({ ...formData, type_id: value })}
                placeholder="Seleccionar tipo"
                disabled={typesLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Costo</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Descuento (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender_id">Género</Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Seleccionar género' },
                  ...(genders?.map(gender => ({
                    value: gender._id,
                    label: gender.name
                  })) || [])
                ]}
                value={formData.gender_id}
                onChange={(value) => setFormData({ ...formData, gender_id: value })}
                placeholder="Seleccionar género"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <Label htmlFor="active" className="text-sm font-medium">Estado del Producto</Label>
                  <p className="text-xs text-gray-600">Determina si el producto está visible en la tienda</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${formData.active ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sizes and Stock Management */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Talles y Stock</Label>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {!formData.category_id ? (
                <p className="text-sm text-gray-500 p-4 text-center border rounded bg-gray-50">
                  Selecciona una categoría para ver los talles disponibles
                </p>
              ) : sizes?.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 text-center border rounded bg-gray-50">
                  No hay talles disponibles para esta categoría
                </p>
              ) : (
                sizes?.map((size) => (
                  <div key={size._id} className={`flex items-start space-x-3 p-3 border rounded transition-colors ${productSizes[size._id] ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'}`}>
                    <Checkbox
                      checked={!!productSizes[size._id]}
                      onCheckedChange={() => handleSizeToggle(size._id)}
                      className="h-5 w-5 mt-0.5"
                    />
                    <Label className="flex-1 cursor-pointer leading-relaxed" onClick={() => handleSizeToggle(size._id)}>{size.name}</Label>
                    {productSizes[size._id] && (
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Cantidad:</Label>
                        <Input
                          type="number"
                          min="0"
                          value={productSizes[size._id]?.quantity || ''}
                          onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                          onChange={(e) => handleQuantityChange(size._id, e.target.value)}
                          placeholder="0"
                          className="w-20"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="pt-6 border-t space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="px-6">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? (
                <>
                  <span className="mr-2">Guardando...</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}