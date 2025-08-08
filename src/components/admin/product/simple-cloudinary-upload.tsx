'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, X } from 'lucide-react'

interface SimpleCloudinaryUploadProps {
  onUpload: (urls: string[]) => void
  multiple?: boolean
  buttonText?: string
  maxFiles?: number
}

export function SimpleCloudinaryUpload({ 
  onUpload, 
  multiple = true,
  buttonText = 'Subir Imágenes',
  maxFiles = 10
}: SimpleCloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default')
    formData.append('folder', 'products')

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwkwu8adz'}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      throw new Error('Error al subir imagen')
    }

    const data = await response.json()
    return data.secure_url
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (!files.length) return
    
    // Limitar cantidad de archivos
    const filesToUpload = files.slice(0, maxFiles)
    
    // Crear previews locales
    const newPreviews = filesToUpload.map(file => URL.createObjectURL(file))
    setPreviews(newPreviews)
    
    setUploading(true)
    
    try {
      // Subir archivos a Cloudinary
      const uploadPromises = filesToUpload.map(file => uploadToCloudinary(file))
      const urls = await Promise.all(uploadPromises)
      
      setUploadedUrls(urls)
      onUpload(urls)
      
      // Limpiar previews locales
      newPreviews.forEach(url => URL.revokeObjectURL(url))
      setPreviews([])
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Error al subir las imágenes. Por favor intenta nuevamente.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newUrls = uploadedUrls.filter((_, i) => i !== index)
    setUploadedUrls(newUrls)
    onUpload(newUrls)
  }

  return (
    <div className="space-y-4">
      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      
      {/* Botón para abrir selector */}
      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        variant="outline"
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>

      {/* Mostrar previews mientras sube */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mostrar imágenes subidas */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {uploadedUrls.map((url, index) => (
            <div key={url} className="relative aspect-square group">
              <img
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}