'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/lib/products'
import { categoryService } from '@/lib/categories'
import { sizeService } from '@/lib/sizes'
import { brandService } from '@/lib/brands'
import { typeService } from '@/lib/types'
import { genderService } from '@/lib/genders'
import { colorService } from '@/lib/colors'
import { Product, ProductStock } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { CustomSelect } from '@/components/ui/custom-select'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    cashPrice: '',
    listPricePercentage: '25',
    type_id: '',
    brand_id: '',
    gender_id: '',
    color_id: '',
    category_id: '',
    active: true,
    discount: '',
    description: '',
    installmentText: '',
    withoutStock: false,
  })
  const [productSizes, setProductSizes] = useState<{[key: string]: {name: string, quantity: number, selected: boolean}}>({})

  const queryClient = useQueryClient()

  const handleSizeToggle = (sizeId: string) => {
    const size = sizes?.find(s => s._id === sizeId)
    if (!size) return

    setProductSizes(prev => {
      const newSizes = { ...prev }
      const existingStock = product?.stock?.find(s => s.size_id === sizeId)
      
      if (newSizes[sizeId]) {
        // If it's in productSizes, remove it (but only if it doesn't have existing stock)
        if (!existingStock || existingStock.quantity === 0) {
          delete newSizes[sizeId]
        } else {
          // If it has existing stock, keep it but mark as not manually selected
          newSizes[sizeId] = {
            name: size.name,
            quantity: existingStock.quantity,
            selected: false
          }
        }
      } else {
        // Add size with existing quantity or 0
        newSizes[sizeId] = {
          name: size.name,
          quantity: existingStock?.quantity || 0,
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

  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: colorService.getAll,
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
        cashPrice: product.cashPrice?.toString() || '',
        listPricePercentage: product.listPricePercentage?.toString() || '25',
        type_id: product.type_id || '',
        brand_id: product.brand_id || '',
        category_id: product.category_id || '',
        active: product.active ?? true,
        discount: product.discount?.toString() || '0',
        gender_id: product.gender_id || '',
        color_id: product.color_id || '',
        description: product.description || '',
        installmentText: product.installmentText || '',
        withoutStock: product.withoutStock ?? false,
      })
      
      // Set existing stock data ONLY on initial load
      if (product.stock && product.stock.length > 0) {
        const initialSizes: {[key: string]: {name: string, quantity: number, selected: boolean}} = {}

        // Para productos tipo unit, usar configuración especial
        if (product.stockType === 'unit') {
          initialSizes['unit'] = {
            name: 'unit',
            quantity: product.stock[0]?.quantity || 0,
            selected: true
          }
        } else {
          // Para productos con talles, procesar normalmente
          product.stock.forEach(s => {
            initialSizes[s.size_id] = {
              name: s.size_name,
              quantity: s.quantity,
              selected: true
            }
          })
        }
        setProductSizes(initialSizes)
      } else {
        setProductSizes({})
      }
    }
  }, [product?._id]) // Only run when product ID changes, not on every product update

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [product?._id])

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
  }, [formData.category_id, sizes])

  // Auto-calculate price from cashPrice and listPricePercentage
  useEffect(() => {
    const cashPriceNum = parseFloat(formData.cashPrice) || 0
    const percentageNum = parseFloat(formData.listPricePercentage) || 25

    if (cashPriceNum > 0) {
      const calculatedPrice = Math.round(cashPriceNum * (1 + percentageNum / 100))
      setFormData(prev => ({ ...prev, price: calculatedPrice.toString() }))
    }
  }, [formData.cashPrice, formData.listPricePercentage])

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
      cashPrice: formData.cashPrice ? parseFloat(formData.cashPrice) : undefined,
      listPricePercentage: parseFloat(formData.listPricePercentage) || 25,
      type_id: formData.type_id,
      brand_id: formData.brand_id,
      category_id: formData.category_id,
      active: formData.active,
      discount: parseFloat(formData.discount),
      gender_id: formData.gender_id,
      color_id: formData.color_id,
      stock: stockArray,
      description: formData.description,
      installmentText: formData.installmentText,
      withoutStock: formData.withoutStock,
    }

    updateMutation.mutate({ id: product._id, data: updateData })
  }

  const nextImage = () => {
    if (product?.images && currentImageIndex < product.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 p-1 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">Editar Producto</DialogTitle>
          <p className="text-sm text-gray-600">Modifica los datos del producto</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Images Section - Left Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-0">
                <Label className="text-base font-medium mb-3 block">Imágenes del Producto</Label>
                <div className="space-y-4">
                  {/* Main Image Display */}
                  <div className="relative bg-gray-50 rounded-lg overflow-hidden aspect-square">
                    {product?.images && product.images.length > 0 ? (
                      <>
                        <img
                          src={product.images[currentImageIndex]}
                          alt={product.name}
                          className="w-full h-full object-contain p-4"
                        />
                        {product.images.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-md transition-all"
                              disabled={currentImageIndex === 0}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-1.5 rounded-full shadow-md transition-all"
                              disabled={currentImageIndex === product.images.length - 1}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <span>Sin imagen</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Image Thumbnails */}
                  {product?.images && product.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {product.images.map((image, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentImageIndex 
                              ? 'border-blue-500 shadow-md' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Image count indicator */}
                  {product?.images && product.images.length > 0 && (
                    <div className="text-center text-sm text-gray-500">
                      Imagen {currentImageIndex + 1} de {product.images.length}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields - Right Side */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="cashPrice">Precio Efectivo</Label>
              <Input
                id="cashPrice"
                type="number"
                step="0.01"
                value={formData.cashPrice}
                onChange={(e) => setFormData({ ...formData, cashPrice: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">Precio para pagos en efectivo o transferencia</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="listPricePercentage">% Recargo Lista</Label>
              <Input
                id="listPricePercentage"
                type="number"
                min="0"
                max="100"
                value={formData.listPricePercentage}
                onChange={(e) => setFormData({ ...formData, listPricePercentage: e.target.value })}
              />
              <p className="text-xs text-gray-500">Porcentaje sobre precio efectivo</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio Lista (Tarjeta)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Calculado automáticamente</p>
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

            <div className="space-y-2">
              <Label htmlFor="color_id">Color</Label>
              <CustomSelect
                options={[
                  { value: '', label: 'Sin color' },
                  ...(colors?.map(color => ({
                    value: color._id,
                    label: color.name
                  })) || [])
                ]}
                value={formData.color_id}
                onChange={(value) => setFormData({ ...formData, color_id: value })}
                placeholder="Seleccionar color"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe las características del producto..."
                className="resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500">Esta descripción se mostrará en la página del producto</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="installmentText">Texto de Cuotas (Opcional)</Label>
              <Input
                id="installmentText"
                value={formData.installmentText}
                onChange={(e) => setFormData({ ...formData, installmentText: e.target.value })}
                placeholder="Ej: 3 cuotas sin interés"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">Este texto se mostrará debajo del precio del producto</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Estado del Producto</Label>
              <div className="bg-gray-50 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Determina si el producto está visible en la tienda</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      formData.active ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {formData.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-row items-start space-x-3 p-3 border rounded bg-gray-50">
                <Checkbox
                  id="withoutStock"
                  checked={formData.withoutStock}
                  onCheckedChange={(checked) => setFormData({ ...formData, withoutStock: !!checked })}
                  className="h-5 w-5 mt-0.5"
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="withoutStock" className="cursor-pointer">Sin stock</Label>
                  <p className="text-xs text-gray-600">Mostrar como "Consultar Stock" en la tienda</p>
                </div>
              </div>
            </div>
              </div>
            </div>
          </div>

          {/* Sizes and Stock Management - Full Width */}
          <div className="space-y-4 mt-6 pt-6 border-t">
            <Label className="text-base font-medium">
              {product?.stockType === 'unit' ? 'Stock por unidades' : 'Talles y Stock'}
              {product?.stockType === 'unit' ? (
                <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200">
                  Por unidades
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0 h-5 bg-green-50 text-green-700 border-green-200">
                  Por talles/unidad
                </Badge>
              )}
            </Label>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {product?.stockType === 'unit' ? (
                // Para productos tipo unit, solo mostrar campo de cantidad
                <div className="flex items-center space-x-3 p-3 border rounded bg-gray-50">
                  <Label className="text-sm">Cantidad disponible:</Label>
                  <Input
                    type="number"
                    min="0"
                    value={productSizes['unit']?.quantity !== undefined ? productSizes['unit'].quantity : (product?.stock?.[0]?.quantity || 0)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const newQuantity = value === '' ? 0 : parseInt(value);
                      setProductSizes({
                        'unit': {
                          name: 'unit',
                          quantity: isNaN(newQuantity) ? 0 : Math.max(0, newQuantity),
                          selected: true
                        }
                      });
                    }}
                    placeholder="0"
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">unidades</span>
                </div>
              ) : !formData.category_id ? (
                <p className="text-sm text-gray-500 p-4 text-center border rounded bg-gray-50">
                  Selecciona una categoría para ver los talles disponibles
                </p>
              ) : sizes?.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 text-center border rounded bg-gray-50">
                  No hay talles disponibles para esta categoría
                </p>
              ) : (
                sizes?.map((size) => {
                  // Check if this size has stock in the product
                  const existingStock = product?.stock?.find(s => s.size_id === size._id)
                  const hasExistingStock = existingStock && existingStock.quantity > 0
                  
                  // Check if size is in productSizes (either from initial load or user selection)
                  const isInProductSizes = !!productSizes[size._id]
                  const isSelected = isInProductSizes || hasExistingStock
                  
                  // Get the current quantity
                  const currentQuantity = productSizes[size._id]?.quantity !== undefined
                    ? productSizes[size._id].quantity
                    : (existingStock?.quantity || 0)
                  
                  return (
                    <div 
                      key={size._id} 
                      className={`flex items-center p-3 border rounded-lg transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-green-50 border-green-300 shadow-sm' 
                          : 'bg-white hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => handleSizeToggle(size._id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSizeToggle(size._id)}
                        className="h-5 w-5 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 flex items-center justify-between ml-3">
                        <Label className={`cursor-pointer select-none ${
                          isSelected ? 'font-medium text-gray-900' : 'text-gray-700'
                        }`}>
                          {size.name}
                        </Label>
                        <div className="flex items-center gap-2">
                          {isInProductSizes ? (
                            <div className="flex items-center gap-2">
                              <Label className="text-sm text-gray-600">Cantidad:</Label>
                              <Input
                                type="number"
                                min="0"
                                value={productSizes[size._id]?.quantity || ''}
                                onChange={(e) => handleQuantityChange(size._id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="0"
                                className="w-20 h-8"
                              />
                            </div>
                          ) : (
                            <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium text-gray-700">
                              {currentQuantity || 0}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
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