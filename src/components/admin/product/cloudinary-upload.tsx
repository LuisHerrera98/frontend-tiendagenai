'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Loader2 } from 'lucide-react'

declare global {
  interface Window {
    cloudinary: any
  }
}

interface CloudinaryUploadProps {
  onUpload: (urls: string[]) => void
  uploading?: boolean
  multiple?: boolean
  buttonText?: string
  maxFiles?: number
}

export function CloudinaryUpload({ 
  onUpload, 
  uploading = false, 
  multiple = true,
  buttonText = 'Subir Imágenes',
  maxFiles = 10
}: CloudinaryUploadProps) {
  const widgetRef = useRef<any>(null)

  useEffect(() => {
    // Cargar el script de Cloudinary
    if (!window.cloudinary) {
      const script = document.createElement('script')
      script.src = 'https://upload-widget.cloudinary.com/global/all.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const openWidget = () => {
    if (!window.cloudinary) {
      console.error('Cloudinary widget not loaded')
      return
    }

    // Configuración del widget
    const widget = window.cloudinary.createUploadWidget(
      {
        // Credenciales de Cloudinary
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwkwu8adz',
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
        sources: ['local', 'url', 'camera'],
        multiple: multiple,
        maxFiles: maxFiles,
        folder: 'products',
        resourceType: 'image',
        cropping: false,
        showSkipCropButton: false,
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
        },
        text: {
          es: {
            or: 'O',
            back: 'Atrás',
            advanced: 'Avanzado',
            close: 'Cerrar',
            no_results: 'Sin resultados',
            search_placeholder: 'Buscar archivos',
            about_uw: 'Acerca del widget',
            menu: {
              files: 'Mis Archivos',
              web: 'Dirección Web',
              camera: 'Cámara',
            },
            selection_counter: {
              selected: 'Seleccionado'
            },
            actions: {
              upload: 'Subir',
              clear_all: 'Limpiar todo',
              log_out: 'Cerrar sesión'
            },
            notifications: {
              general_error: 'Se produjo un error.',
              general_prompt: 'Está seguro?',
              limit_reached: 'No se pueden seleccionar más archivos.',
              invalid_add_url: 'La URL debe ser válida.',
              invalid_public_id: 'El ID público no puede contener \\, /, ?, &, #, o %.',
              no_new_files: 'Los archivos ya fueron subidos.',
              image_purchased: 'Imagen comprada',
              video_purchased: 'Video comprado',
              purchase_failed: 'Fallo la compra. Por favor intente nuevamente.',
              service_logged_out: 'Servicio desconectado debido a error',
              great: 'Genial',
              image_acquired: 'Imagen adquirida',
              video_acquired: 'Video adquirido',
              acquisition_failed: 'Fallo la adquisición. Por favor intente nuevamente.',
            },
            uploader: {
              filesize: {
                na: 'N/A',
                b: '{{size}} Bytes',
                k: '{{size}} KB',
                m: '{{size}} MB',
                g: '{{size}} GB',
                t: '{{size}} TB',
              },
              errors: {
                file_too_large: 'El tamaño del archivo ({{size}}) excede el máximo permitido ({{allowed}})',
                max_dimensions_validation: 'Las dimensiones de la imagen ({{width}}x{{height}}) exceden el máximo permitido ({{maxWidth}}x{{maxHeight}})',
                min_dimensions_validation: 'Las dimensiones de la imagen ({{width}}x{{height}}) no alcanzan el mínimo requerido ({{minWidth}}x{{minHeight}})',
                unavailable: 'NA'
              },
              status: {
                idle: 'Inactivo',
                error: 'Error',
                uploading: 'Subiendo...',
                uploaded: 'Subido',
                aborted: 'Abortado',
                processing: 'Procesando...'
              },
              drip: {
                title: 'Arrastra archivos aquí',
                title_single: 'Arrastra archivo aquí',
                subtitle: 'o busca para seleccionar'
              }
            },
            camera: {
              capture: 'Capturar',
              cancel: 'Cancelar',
              take_pic: 'Toma una foto y súbela',
              explanation: 'Asegúrate que tu cámara está conectada y que tu navegador permite el uso de la cámara. Cuando estés listo, haz clic en Capturar.',
              camera_error: 'Fallo al acceder a la cámara',
              retry: 'Reintentar cámara',
              file_name: 'Cámara_{{time}}'
            },
            url: {
              inner_title: 'URL del archivo público:',
              input_placeholder: 'http://direccion.remota.com/imagen.jpg'
            },
            local: {
              browse: 'Buscar',
              dd_title_single: 'Arrastra y suelta tu archivo aquí',
              dd_title_multi: 'Arrastra y suelta tus archivos aquí',
              drop_title_single: 'Suelta el archivo para subirlo',
              drop_title_multiple: 'Suelta los archivos para subirlos'
            }
          }
        }
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          // Recopilar todas las URLs cuando termine
          if (!widgetRef.current) {
            widgetRef.current = []
          }
          widgetRef.current.push(result.info.secure_url)
        }
        
        if (result && result.event === 'close') {
          // Cuando se cierre el widget, enviar todas las URLs
          if (widgetRef.current && widgetRef.current.length > 0) {
            onUpload(widgetRef.current)
            widgetRef.current = []
          }
        }
      }
    )

    widget.open()
  }

  return (
    <Button
      type="button"
      onClick={openWidget}
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
  )
}