'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, X } from 'lucide-react'

interface DeferredCloudinaryUploadProps {
  onImagesSelected: (files: File[]) => void
  initialImages?: string[]
  multiple?: boolean
  buttonText?: string
  maxFiles?: number
}

export function DeferredCloudinaryUpload({ 
  onImagesSelected, 
  initialImages = [],
  multiple = true,
  buttonText = 'Seleccionar Imágenes',
  maxFiles = 10
}: DeferredCloudinaryUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialImages)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (!files.length) return
    
    // Limitar cantidad de archivos
    const remainingSlots = maxFiles - selectedFiles.length
    const filesToAdd = files.slice(0, remainingSlots)
    
    // Crear URLs locales para preview (no consume ancho de banda)
    const newPreviewUrls = filesToAdd.map(file => URL.createObjectURL(file))
    
    const updatedFiles = [...selectedFiles, ...filesToAdd]
    const updatedPreviews = [...previewUrls, ...newPreviewUrls]
    
    setSelectedFiles(updatedFiles)
    setPreviewUrls(updatedPreviews)
    onImagesSelected(updatedFiles)
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    // Liberar memoria del objeto URL
    if (!previewUrls[index].startsWith('http')) {
      URL.revokeObjectURL(previewUrls[index])
    }
    
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = previewUrls.filter((_, i) => i !== index)
    
    setSelectedFiles(newFiles)
    setPreviewUrls(newPreviews)
    onImagesSelected(newFiles)
  }


  return (
    <div className="space-y-4">
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Botón para abrir selector */}
      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={selectedFiles.length >= maxFiles}
        variant="outline"
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {buttonText} ({selectedFiles.length}/{maxFiles})
      </Button>

      {/* Mostrar imágenes seleccionadas */}
      {previewUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {previewUrls.length} imagen(es) seleccionada(s):
          </p>
          <div className="grid grid-cols-4 gap-2">
            {previewUrls.map((url, index) => (
              <div key={`preview-${index}`} className="relative aspect-square group">
                <img
                  src={url}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-product.jpg'
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
                {/* Indicador si es imagen existente o nueva */}
                {url.startsWith('http') && (
                  <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-green-600 text-white text-xs rounded">
                    Guardada
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Función para subir a Cloudinary (se llamará desde el componente padre)
export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData()
  
  formData.append('file', file)
  formData.append('upload_preset', 'ml_default')
  formData.append('cloud_name', 'dwkwu8adz')
  
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/dwkwu8adz/image/upload',
    {
      method: 'POST',
      body: formData
    }
  )

  const data = await response.json()
  
  if (!response.ok) {
    console.error('Error de Cloudinary:', data)
    throw new Error(data.error?.message || 'Error al subir imagen')
  }

  return data.secure_url
}