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
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Contacto</h1>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold mb-6">Información de contacto</h2>
          
          <div className="space-y-6">
            {storeData.settings?.email && (
              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a 
                    href={`mailto:${storeData.settings.email}`}
                    className="text-gray-600 hover:text-gray-800 transition"
                  >
                    {storeData.settings.email}
                  </a>
                </div>
              </div>
            )}

            {storeData.settings?.phone && (
              <div className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Teléfono</p>
                  <a 
                    href={`tel:${storeData.settings.phone}`}
                    className="text-gray-600 hover:text-gray-800 transition"
                  >
                    {storeData.settings.phone}
                  </a>
                </div>
              </div>
            )}

            {storeData.settings?.address && (
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Dirección</p>
                  <p className="text-gray-600">
                    {storeData.settings.address}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Redes sociales */}
          {(storeData.settings?.instagram || storeData.settings?.facebook) && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold mb-4">Síguenos en redes sociales</h3>
              <div className="flex gap-4">
                {storeData.settings?.instagram && (
                  <a
                    href={`https://instagram.com/${storeData.settings.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="font-medium">Instagram</span>
                  </a>
                )}
                {storeData.settings?.facebook && (
                  <a
                    href={storeData.settings.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Facebook className="w-5 h-5" />
                    <span className="font-medium">Facebook</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Mensaje de contacto directo */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              ¿Tienes alguna pregunta? No dudes en contactarnos por cualquiera de los medios indicados arriba. 
              Estaremos encantados de ayudarte.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}