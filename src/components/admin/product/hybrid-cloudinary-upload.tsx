'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, X } from 'lucide-react'

declare global {
  interface Window {
    cloudinary: any
  }
}

interface HybridCloudinaryUploadProps {
  onUpload: (urls: string[]) => void
  multiple?: boolean
  buttonText?: string
  maxFiles?: number
}

export function HybridCloudinaryUpload({ 
  onUpload, 
  multiple = true,
  buttonText = 'Subir Imágenes',
  maxFiles = 10
}: HybridCloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    // Cargar el script de Cloudinary como respaldo
    if (!window.cloudinary) {
      const script = document.createElement('script')
      script.src = 'https://upload-widget.cloudinary.com/global/all.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  // Intento 1: Upload directo vía API
  const uploadDirectly = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default')

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwkwu8adz'}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )

      const data = await response.json()
      
      if (!response.ok) {
        console.log('Direct upload failed, will use widget fallback')
        return null
      }

      return data.secure_url
    } catch (error) {
      console.log('Direct upload error, falling back to widget')
      return null
    }
  }

  // Intento 2: Usar el widget como fallback
  const openWidget = (files: File[]) => {
    if (!window.cloudinary) {
      alert('El sistema de carga no está disponible. Por favor recarga la página.')
      return
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwkwu8adz',
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
        sources: ['local'],
        showAdvancedOptions: false,
        cropping: false,
        multiple: multiple,
        maxFiles: maxFiles,
        folder: 'products',
        resourceType: 'image',
        showPoweredBy: false,
        showUploadMoreButton: false,
        singleUploadAutoClose: true,
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#90A0B3',
            tabIcon: '#0078FF',
            menuIcons: '#5A616A',
            textDark: '#000000',
            textLight: '#FFFFFF',
            link: '#0078FF',
            action: '#339933',
            inactiveTabIcon: '#0E2F5A',
            error: '#F44235',
            inProgress: '#0078FF',
            complete: '#20B832',
            sourceBg: '#E4EBF1'
          }
        }
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          if (!widgetRef.current) {
            widgetRef.current = []
          }
          widgetRef.current.push(result.info.secure_url)
        }
        
        if (result && result.event === 'close') {
          if (widgetRef.current && widgetRef.current.length > 0) {
            const newUrls = [...uploadedUrls, ...widgetRef.current]
            setUploadedUrls(newUrls)
            onUpload(newUrls)
            widgetRef.current = []
          }
          setUploading(false)
        }
      }
    )

    widget.open()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (!files.length) return
    
    setUploading(true)
    
    // Intentar upload directo primero
    const uploadPromises = files.slice(0, maxFiles).map(file => uploadDirectly(file))
    const results = await Promise.all(uploadPromises)
    
    // Verificar si alguno falló
    const successfulUploads = results.filter(url => url !== null) as string[]
    
    if (successfulUploads.length === files.length) {
      // Todos se subieron exitosamente de forma directa
      const newUrls = [...uploadedUrls, ...successfulUploads]
      setUploadedUrls(newUrls)
      onUpload(newUrls)
      setUploading(false)
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else {
      // Algunos fallaron, usar widget como fallback
      console.log('Using widget fallback for upload')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      openWidget(files)
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
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
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