'use client'

import { ReactNode } from 'react'
import { StoreHeader } from './store-header'
import { StoreFooter } from './store-footer'
import { WhatsAppButton } from './whatsapp-button'

interface StoreData {
  id: string
  subdomain: string
  storeName: string
  email?: string
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
    whatsappEnabled?: boolean
    instagram?: string
    facebook?: string
  }
}

interface StoreLayoutProps {
  children: ReactNode
  storeData: StoreData
}

export function StoreLayout({ children, storeData }: StoreLayoutProps) {
  // Aplicar colores personalizados si existen
  const primaryColor = storeData.customization?.primaryColor || '#000000'
  const secondaryColor = storeData.customization?.secondaryColor || '#ffffff'

  return (
    <div className="min-h-screen flex flex-col">
      <style jsx global>{`
        :root {
          --store-primary: ${primaryColor};
          --store-secondary: ${secondaryColor};
        }
      `}</style>
      
      <StoreHeader storeData={storeData} />
      
      <main className="flex-1">
        {children}
      </main>
      
      <StoreFooter storeData={storeData} />
      
      <WhatsAppButton 
        phoneNumber={storeData.settings?.whatsapp} 
        enabled={storeData.settings?.whatsappEnabled} 
      />
    </div>
  )
}