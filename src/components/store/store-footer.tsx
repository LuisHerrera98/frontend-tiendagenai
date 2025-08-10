'use client'

import Link from 'next/link'
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  email?: string  // Email del admin/dueño
  customization?: {
    primaryColor?: string
    secondaryColor?: string
    logo?: string
    socialMedia?: {
      facebook?: string
      instagram?: string
      whatsapp?: string
    }
  }
  settings?: {
    email?: string
    phone?: string
    address?: string
    whatsapp?: string
    instagram?: string
    facebook?: string
    whatsappEnabled?: boolean
  }
}

interface StoreFooterProps {
  storeData: StoreData
}

export function StoreFooter({ storeData }: StoreFooterProps) {
  // Formatear el teléfono con + si existe
  const formatPhone = (phone: string) => {
    if (!phone) return ''
    // Si ya tiene +, lo devolvemos tal cual
    if (phone.startsWith('+')) return phone
    // Si no tiene +, lo agregamos
    return `+${phone}`
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {/* Información de la tienda */}
          <div>
            <h3 className="text-white text-base font-semibold mb-1">{storeData.storeName}</h3>
            <p className="text-xs mb-2">
              Tu tienda online de confianza. Encuentra los mejores productos al mejor precio.
            </p>
            <div className="flex space-x-4">
              {(storeData.settings?.facebook || storeData.customization?.socialMedia?.facebook) && (
                <a 
                  href={storeData.settings?.facebook || storeData.customization?.socialMedia?.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {(storeData.settings?.instagram || storeData.customization?.socialMedia?.instagram) && (
                <a 
                  href={`https://instagram.com/${(storeData.settings?.instagram || storeData.customization?.socialMedia?.instagram || '').replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-white text-base font-semibold mb-1">Contacto</h4>
            <ul className="space-y-1 text-xs">
              {/* Teléfono de WhatsApp si existe y está habilitado */}
              {storeData.settings?.whatsappEnabled && storeData.settings?.whatsapp && (
                <li className="flex items-start space-x-2">
                  <Phone className="w-3 h-3 mt-0.5" />
                  <a href={`tel:${storeData.settings.whatsapp}`} className="hover:text-white">
                    {formatPhone(storeData.settings.whatsapp)}
                  </a>
                </li>
              )}
              {/* Email del admin/dueño */}
              {(storeData.email || storeData.settings?.email) && (
                <li className="flex items-start space-x-2">
                  <Mail className="w-3 h-3 mt-0.5" />
                  <a href={`mailto:${storeData.email || storeData.settings?.email}`} className="hover:text-white">
                    {storeData.email || storeData.settings?.email}
                  </a>
                </li>
              )}
              {storeData.settings?.address && (
                <li className="flex items-start space-x-2">
                  <MapPin className="w-3 h-3 mt-0.5" />
                  <span>{storeData.settings.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-3 pt-3 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} {storeData.storeName}. Todos los derechos reservados.</p>
          <p className="mt-1">
            Powered by{' '}
            <a 
              href="https://tiendagenai.com/landing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400 transition-colors"
            >
              TiendaGenAI
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}