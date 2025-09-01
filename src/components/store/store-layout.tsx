'use client'

import { ReactNode } from 'react'
import { StoreHeader } from './store-header'
import { StoreFooter } from './store-footer'
import { WhatsAppButton } from './whatsapp-button'
import { FreeShippingBanner } from './free-shipping-banner'
import type { StoreData } from '@/types'

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
      
      <FreeShippingBanner 
        enabled={storeData.settings?.freeShippingEnabled}
        minAmount={storeData.settings?.freeShippingMinAmount}
        text={storeData.settings?.freeShippingText}
      />
      
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