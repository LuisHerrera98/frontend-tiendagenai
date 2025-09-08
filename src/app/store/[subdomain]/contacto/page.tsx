'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { StoreLayout } from '@/components/store/store-layout'
import { api } from '@/lib/api'
import { Mail, Phone, MapPin, Instagram, Facebook, MessageCircle, Clock } from 'lucide-react'

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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contacto</h1>
            <p className="text-gray-600">Estamos aquí para ayudarte</p>
          </div>

          {/* Card principal de contacto */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* WhatsApp como método principal */}
            {storeData.settings?.whatsapp && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Contáctanos por WhatsApp</h2>
                  <p className="text-2xl font-bold text-gray-800 mb-2">
                    {storeData.settings.whatsapp}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Respuesta rápida en horario de atención
                  </p>
                  <a
                    href={`https://wa.me/${storeData.settings.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors w-full sm:w-auto"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Abrir WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* Otros métodos de contacto */}
            <div className="border-t">
              {/* Teléfono */}
              {storeData.settings?.phone && (
                <div className="p-4 border-b hover:bg-gray-50 transition-colors">
                  <a 
                    href={`tel:${storeData.settings.phone}`}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium text-gray-900">{storeData.settings.phone}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Email */}
              {storeData.settings?.email && (
                <div className="p-4 border-b hover:bg-gray-50 transition-colors">
                  <a 
                    href={`mailto:${storeData.settings.email}`}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{storeData.settings.email}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Dirección */}
              {storeData.settings?.address && (
                <div className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="font-medium text-gray-900">{storeData.settings.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Horario de atención */}
            <div className="p-4 bg-gray-50">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <p className="text-sm">
                  Atención de Lunes a Sábado • 9:00 - 20:00
                </p>
              </div>
            </div>
          </div>

          {/* Redes sociales */}
          {(storeData.settings?.instagram || storeData.settings?.facebook) && (
            <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Síguenos en redes</h3>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {storeData.settings?.instagram && (
                  <a
                    href={`https://instagram.com/${storeData.settings.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="font-medium">@{storeData.settings.instagram.replace('@', '')}</span>
                  </a>
                )}
                {storeData.settings?.facebook && (
                  <a
                    href={storeData.settings.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Facebook className="w-5 h-5" />
                    <span className="font-medium">Facebook</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Mensaje final */}
          <div className="mt-8 text-center text-gray-600 px-4">
            <p className="text-sm">
              ¿Tienes alguna pregunta? No dudes en contactarnos.
            </p>
            <p className="text-sm">
              Estaremos encantados de ayudarte.
            </p>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}