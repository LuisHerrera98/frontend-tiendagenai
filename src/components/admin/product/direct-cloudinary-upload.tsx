'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, X } from 'lucide-react'

interface DirectCloudinaryUploadProps {
  onUpload: (urls: string[]) => void
  multiple?: boolean
  buttonText?: string
  maxFiles?: number
}

export function DirectCloudinaryUpload({ 
  onUpload, 
  multiple = true,
  buttonText = 'Subir Imágenes',
  maxFiles = 10
}: DirectCloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData()
    
    // Configuración correcta para upload unsigned
    formData.append('file', file)
    formData.append('upload_preset', 'ml_default')  // Este preset debe existir como "unsigned"
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (!files.length) return
    
    // Limitar cantidad de archivos
    const filesToUpload = files.slice(0, maxFiles)
    
    setUploading(true)
    
    try {
      // Subir archivos uno por uno para mejor control
      const urls: string[] = []
      
      for (const file of filesToUpload) {
        try {
          const url = await uploadToCloudinary(file)
          urls.push(url)
        } catch (error) {
          console.error(`Error subiendo ${file.name}:`, error)
          // Continuar con los demás archivos aunque uno falle
        }
      }
      
      if (urls.length > 0) {
        const newUrls = [...uploadedUrls, ...urls]
        setUploadedUrls(newUrls)
        onUpload(newUrls)
      } else {
        alert('No se pudieron subir las imágenes. Verifica que el formato sea válido.')
      }
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error general:', error)
      alert('Error al procesar las imágenes')
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
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
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

      {/* Mostrar imágenes subidas */}
      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {uploadedUrls.length} imagen(es) subida(s):
          </p>
          <div className="grid grid-cols-4 gap-2">
            {uploadedUrls.map((url, index) => (
              <div key={url} className="relative aspect-square group">
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}