'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/lib/products'
import { categoryService } from '@/lib/categories'
import { sizeService } from '@/lib/sizes'
import { brandService } from '@/lib/brands'
import { typeService } from '@/lib/types'
import { genderService } from '@/lib/genders'
import { colorService } from '@/lib/colors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { ArrowLeft, Save, Trash2, X } from 'lucide-react'
import { Size } from '@/types'
import { ImageGalleryViewer } from '@/components/admin/product/image-gallery-viewer'
import { useAuth } from '@/contexts/auth-context'
import { Permission } from '@/types/permissions'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const productId = params.id as string
  const { hasPermission } = useAuth()

  // Check permissions
  const canViewCosts = hasPermission(Permission.PRODUCTS_COSTS)
  const canManageStock = hasPermission(Permission.PRODUCTS_STOCK)
  const canManageDiscounts = hasPermission(Permission.PRODUCTS_DISCOUNTS)
  const canEdit = hasPermission(Permission.PRODUCTS_EDIT)

  // If user doesn't have edit permission, make everything readonly
  const isReadOnly = !canEdit

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    type_id: '',
    brand_id: '',
    gender_id: '',
    category_id: '',
    color_id: '',
    active: true,
    discount: '0',
    stock: [] as Array<{ size_id: string; size_name: string; quantity: number; available: boolean }>,
    images: [] as string[]
  })

  // Get product data (including inactive products for admin)
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts({ showAll: true }),
  })

  const product = products?.data?.find(p => p._id === productId)

  // Get categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  })

  // Get sizes for selected category
  const { data: categorySizes } = useQuery({
    queryKey: ['sizes-for-category', formData.category_id],
    queryFn: () => sizeService.getByCategory(formData.category_id),
    enabled: !!formData.category_id,
  })

  // Get brands
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: brandService.getAll,
  })

  // Get types
  const { data: types } = useQuery({
    queryKey: ['types'],
    queryFn: typeService.getAll,
  })

  // Get genders
  const { data: genders } = useQuery({
    queryKey: ['genders'],
    queryFn: genderService.getAll,
  })

  // Get colors
  const { data: colors } = useQuery({
    queryKey: ['colors'],
    queryFn: colorService.getAll,
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => productService.updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      router.push('/admin/productos')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => productService.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      router.push('/admin/productos')
    },
  })

  // Load product data when available
  useEffect(() => {
    if (product) {
      console.log('Product stock:', product.stock) // Debug log
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        type_id: product.type_id || '',
        brand_id: product.brand_id || '',
        gender_id: product.gender_id || '',
        category_id: product.category_id || '',
        color_id: product.color_id || '',
        active: product.active ?? true,
        discount: product.discount?.toString() || '0',
        stock: product.stock || [],
        images: product.images?.map((img: any) => typeof img === 'string' ? img : img.url) || []
      })
    }
  }, [product])

  // Update stock when category sizes change - pero solo si no hemos cargado el stock inicial
  useEffect(() => {
    if (categorySizes && formData.category_id && product && product.stock) {
      console.log('Category sizes:', categorySizes) // Debug log
      console.log('Current product stock:', product.stock) // Debug log
      
      const updatedStock = categorySizes.map((size: Size) => {
        // Buscar si el producto ya tiene stock para esta talla (por size_id primero, luego por nombre)
        const existingProductStock = product.stock.find(s => 
          s.size_id === size._id || 
          s.size_name === size.name || 
          s.size_name === size.name.toUpperCase()
        )
        
        console.log(`Size ${size.name} (${size._id}) - existing stock:`, existingProductStock) // Debug log
        
        return {
          size_id: size._id, // Usar el _id del size de MongoDB
          size_name: size.name,
          quantity: existingProductStock?.quantity || 0,
          available: true
        }
      })
      
      console.log('Updated stock:', updatedStock) // Debug log
      setFormData(prev => ({ ...prev, stock: updatedStock }))
    }
  }, [categorySizes, product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updateData = {
      name: formData.name,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      type_id: formData.type_id,
      brand_id: formData.brand_id,
      gender_id: formData.gender_id,
      category_id: formData.category_id,
      color_id: formData.color_id || undefined,
      active: formData.active,
      discount: parseFloat(formData.discount),
      stock: formData.stock,
      images: formData.images
    }

    updateMutation.mutate(updateData)
  }

  const updateStockQuantity = (sizeId: string, quantity: number) => {
    console.log('updateStockQuantity called with:', { sizeId, quantity }) // Debug log
    
    setFormData(prev => {
      const updatedStock = prev.stock.map(item => {
        const isMatch = item.size_id === sizeId
        console.log(`Checking item ${item.size_id} vs ${sizeId}: ${isMatch}`) // Debug log
        return isMatch ? { ...item, quantity: Math.max(0, quantity) } : item
      })
      
      console.log('Updated stock after change:', updatedStock) // Debug log
      
      return {
        ...prev,
        stock: updatedStock
      }
    })
  }

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate()
    }
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-500">Cargando producto...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header simplificado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/productos')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Editar Producto</h1>
        </div>
        {canEdit && (
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Contenedor unificado: Imagen + Información Básica */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Información del Producto</CardTitle>
                <span className="text-sm text-gray-500">#{product.code}</span>
              </div>
              {/* Botones flotantes */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={formData.active ? 'text-green-600' : 'text-gray-500'}
                  disabled={isReadOnly}
                >
                  {formData.active ? 'Activo' : 'Inactivo'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="flex gap-6">
              {/* Imagen del producto - más pequeña */}
              <div className="flex-shrink-0 w-40">
                <ImageGalleryViewer images={formData.images} />
              </div>
              
              {/* Información básica reorganizada */}
              <div className="flex-1 space-y-3">
                {/* Primera fila: Nombre, Categoría, Marca */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="name" className="text-sm">Nombre del Producto</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre del producto"
                      className="mt-1 h-9"
                      readOnly={isReadOnly}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="text-sm">Categoría</Label>
                    <CustomSelect
                      options={[
                        { value: '', label: 'Seleccionar categoría' },
                        ...(categories?.map(category => ({
                          value: category._id,
                          label: category.name
                        })) || [])
                      ]}
                      value={formData.category_id}
                      onChange={isReadOnly ? undefined : (value) => setFormData({ ...formData, category_id: value })}
                      placeholder="Seleccionar categoría"
                      disabled={isReadOnly}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="brand" className="text-sm">Marca</Label>
                    <CustomSelect
                      options={[
                        { value: '', label: 'Seleccionar marca' },
                        ...(brands?.map(brand => ({
                          value: brand._id,
                          label: brand.name
                        })) || [])
                      ]}
                      value={formData.brand_id}
                      onChange={isReadOnly ? undefined : (value) => setFormData({ ...formData, brand_id: value })}
                      placeholder="Seleccionar marca"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                
                {/* Segunda fila: Precio, Costo (condicional), Descuento */}
                <div className={`grid gap-3 ${canViewCosts ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div>
                    <Label htmlFor="price" className="text-sm">Precio</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="mt-1 h-9"
                      readOnly={isReadOnly}
                    />
                  </div>

                  {canViewCosts && (
                    <div>
                      <Label htmlFor="cost" className="text-sm">Costo</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="0.00"
                        className="mt-1 h-9"
                        readOnly={isReadOnly}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="discount" className="text-sm">Descuento (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      placeholder="0"
                      className="mt-1 h-9"
                      readOnly={isReadOnly || !canManageDiscounts}
                    />
                  </div>
                </div>
                
                {/* Tercera fila: Tipo, Género, Color (opcionales) */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="type" className="text-sm">Tipo (Opcional)</Label>
                    <CustomSelect
                      options={[
                        { value: '', label: 'Sin tipo' },
                        ...(types?.map(type => ({
                          value: type._id,
                          label: type.name
                        })) || [])
                      ]}
                      value={formData.type_id}
                      onChange={isReadOnly ? undefined : (value) => setFormData({ ...formData, type_id: value })}
                      placeholder="Seleccionar tipo"
                      disabled={isReadOnly}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gender" className="text-sm">Género (Opcional)</Label>
                    <CustomSelect
                      options={[
                        { value: '', label: 'Sin género' },
                        ...(genders?.map(gender => ({
                          value: gender._id,
                          label: gender.name
                        })) || [])
                      ]}
                      value={formData.gender_id}
                      onChange={isReadOnly ? undefined : (value) => setFormData({ ...formData, gender_id: value })}
                      placeholder="Seleccionar género"
                      disabled={isReadOnly}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="color" className="text-sm">Color (Opcional)</Label>
                    <CustomSelect
                      options={[
                        { value: '', label: 'Sin color' },
                        ...(colors?.map(color => ({
                          value: color._id,
                          label: color.name
                        })) || [])
                      ]}
                      value={formData.color_id}
                      onChange={isReadOnly ? undefined : (value) => setFormData({ ...formData, color_id: value })}
                      placeholder="Seleccionar color"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Card de Inventario por Talla */}

          {/* Stock by Size */}
          {formData.stock.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Inventario por Talla</CardTitle>
                <p className="text-xs text-gray-600">Gestiona el stock disponible para cada talla</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formData.stock.map((stockItem, index) => (
                    <div key={stockItem.size_id || `stock-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-700">{stockItem.size_name}</span>
                          </div>
                          <span className="font-medium text-gray-700">Talla {stockItem.size_name}</span>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          stockItem.quantity > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {stockItem.quantity > 0 ? `${stockItem.quantity} unidades` : 'Sin stock'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateStockQuantity(stockItem.size_id, stockItem.quantity - 1)}
                          className="h-9 w-9 p-0 rounded-full"
                          disabled={stockItem.quantity <= 0 || isReadOnly || !canManageStock}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          value={stockItem.quantity}
                          onChange={(e) => updateStockQuantity(stockItem.size_id, parseInt(e.target.value) || 0)}
                          className="h-9 text-center font-semibold"
                          readOnly={isReadOnly || !canManageStock}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateStockQuantity(stockItem.size_id, stockItem.quantity + 1)}
                          className="h-9 w-9 p-0 rounded-full"
                          disabled={isReadOnly || !canManageStock}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  )
}