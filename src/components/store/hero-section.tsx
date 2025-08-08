'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: {
    banner?: string
    primaryColor?: string
  }
}

interface HeroSectionProps {
  storeData: StoreData
}

export function HeroSection({ storeData }: HeroSectionProps) {
  const bannerUrl = storeData.customization?.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=600&fit=crop'
  
  return (
    <section className="relative h-[500px] overflow-hidden">
      {/* Imagen de fondo */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bannerUrl})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Contenido */}
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Bienvenido a {storeData.storeName}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Descubre nuestra increíble colección de productos seleccionados especialmente para ti
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/productos"
              className="inline-flex items-center px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              Ver Productos
              <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="/ofertas"
              className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition"
            >
              Ver Ofertas
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}