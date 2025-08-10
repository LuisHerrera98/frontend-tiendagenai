'use client'

import { AlertCircle, Upload, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'

interface ImageGalleryViewerProps {
  images: string[]
}

export function ImageGalleryViewer({ images }: ImageGalleryViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      {images.length > 0 ? (
        <>
          <div
            className="relative w-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
            style={{ paddingBottom: '100%' }} // Mantiene aspect ratio cuadrado
          >
            <img
              src={images[selectedIndex] || images[0]}
              alt={`Producto ${selectedIndex + 1}`}
              className="absolute inset-0 w-full h-full object-contain bg-white"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.jpg'
              }}
            />
            
            {/* Número de imagen */}
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full font-medium shadow-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
          
          {/* Mini galería si hay múltiples imágenes */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={`thumb-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`relative aspect-square bg-gray-50 rounded overflow-hidden border-2 transition-all ${
                    selectedIndex === index 
                      ? 'border-blue-500 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.jpg'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
          
        </>
      ) : (
        <>
          {/* Placeholder cuando no hay imágenes */}
          <div
            className="relative w-full bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center"
            style={{ paddingBottom: '100%' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 text-center">Sin imagen</p>
            </div>
          </div>
          
        </>
      )}
    </div>
  )
}