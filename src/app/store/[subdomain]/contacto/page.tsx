'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { api } from '@/lib/api'
import { Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  customization?: any
  settings?: {
    email?: string
    phone?: string
    address?: string
    whatsapp?: string
    instagram?: string
    facebook?: string
  }
}

export default function ContactPage() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStoreData()
  }, [subdomain])

  const fetchStoreData = async () => {
    try {
      setLoading(true)
      const targetSubdomain = process.env.NODE_ENV === 'development' && subdomain === 'test' 
        ? localStorage.getItem('tenant_subdomain') || subdomain
        : subdomain

      const response = await api.get(`/public/store/${targetSubdomain}`)
      setStoreData(response.data)
    } catch (err) {
      console.error('Error fetching store:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <StoreLayout storeData={storeData}>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Contacto</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Información de contacto */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Información de contacto</h2>
            
            <div className="space-y-4">
              {storeData.settings?.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a 
                      href={`mailto:${storeData.settings.email}`}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {storeData.settings.email}
                    </a>
                  </div>
                </div>
              )}

              {storeData.settings?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <a 
                      href={`tel:${storeData.settings.phone}`}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {storeData.settings.phone}
                    </a>
                  </div>
                </div>
              )}

              {storeData.settings?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p className="text-gray-600">
                      {storeData.settings.address}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Redes sociales */}
            {(storeData.settings?.instagram || storeData.settings?.facebook) && (
              <>
                <h3 className="text-lg font-semibold mt-8 mb-4">Síguenos en redes sociales</h3>
                <div className="flex gap-4">
                  {storeData.settings?.instagram && (
                    <a
                      href={`https://instagram.com/${storeData.settings.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {storeData.settings?.facebook && (
                    <a
                      href={storeData.settings.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Formulario de contacto */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Envíanos un mensaje</h2>
            
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800"
              >
                Enviar mensaje
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-4">
              * Por el momento, el formulario no está activo. Por favor contáctanos por los medios indicados arriba.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}