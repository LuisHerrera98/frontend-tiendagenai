'use client'

import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { productService } from '@/lib/products'
import { Button } from '@/components/ui/button'
import { Plus, X, Loader2, Trash2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { uploadToCloudinary } from './deferred-cloudinary-upload'
import { toast } from 'react-hot-toast'

interface ImageGalleryEditorProps {
  productId: string
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
}

export function ImageGalleryEditor({
  productId,
  images,
  onImagesChange,
  maxImages = 5
}: ImageGalleryEditorProps) {
  const [currentImages, setCurrentImages] = useState<string[]>(images)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mutation para eliminar imagen
  const deleteImageMutation = useMutation({
    mutationFn: (imageUrl: string) => 
      productService.deleteProductImage(productId, imageUrl),
    onSuccess: (data, imageUrl) => {
      const updatedImages = currentImages.filter(img => img !== imageUrl)
      setCurrentImages(updatedImages)
      onImagesChange(updatedImages)
      toast.success('Imagen eliminada correctamente')
    },
    onError: (error) => {
      console.error('Error al eliminar imagen:', error)
      toast.error('Error al eliminar la imagen')
    }
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (!files.length) return
    
    // Verificar límite
    const remainingSlots = maxImages - currentImages.length
    if (remainingSlots <= 0) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`)
      return
    }
    
    const filesToUpload = files.slice(0, remainingSlots)
    
    setUploadingImages(true)
    
    try {
      const uploadedUrls: string[] = []
      
      for (const file of filesToUpload) {
        try {
          const url = await uploadToCloudinary(file)
          uploadedUrls.push(url)
        } catch (error) {
          console.error(`Error subiendo ${file.name}:`, error)
          toast.error(`Error al subir ${file.name}`)
        }
      }
      
      if (uploadedUrls.length > 0) {
        const updatedImages = [...currentImages, ...uploadedUrls]
        setCurrentImages(updatedImages)
        onImagesChange(updatedImages)
        toast.success(`${uploadedUrls.length} imagen(es) agregada(s)`)
      }
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error al procesar imágenes:', error)
      toast.error('Error al procesar las imágenes')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleDeleteImage = (imageUrl: string) => {
    setImageToDelete(imageUrl)
  }

  const confirmDelete = () => {
    if (imageToDelete) {
      deleteImageMutation.mutate(imageToDelete)
      setImageToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Imágenes del Producto</h3>
        <span className="text-sm text-gray-500">
          {currentImages.length} / {maxImages} imágenes
        </span>
      </div>

      {/* Grid de imágenes */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Imágenes existentes */}
        {currentImages.map((image, index) => (
          <div
            key={`image-${index}`}
            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200"
          >
            <img
              src={image}
              alt={`Producto ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.jpg'
              }}
            />
            
            {/* Overlay con botón de eliminar */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleDeleteImage(image)}
                disabled={deleteImageMutation.isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-red-300"
              >
                {deleteImageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Indicador de imagen principal */}
            {index === 0 && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-black text-white text-xs rounded">
                Principal
              </div>
            )}
          </div>
        ))}

        {/* Botón para agregar más imágenes */}
        {currentImages.length < maxImages && (
          <div className="aspect-square">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploadingImages}
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages}
              className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImages ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500">Subiendo...</span>
                </>
              ) : (
                <>
                  <Plus className="h-6 w-6 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500">Agregar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Nota informativa */}
      {currentImages.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Se recomienda agregar al menos una imagen del producto
          </p>
        </div>
      )}

      {/* Dialog de confirmación */}
      <Dialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar imagen?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente la imagen del producto y de Cloudinary.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImageToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}