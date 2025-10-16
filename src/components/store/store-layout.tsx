'use client'

import { ReactNode } from 'react'
import { StoreHeader } from './store-header'
import { StoreFooter } from './store-footer'
import { WhatsAppButton } from './whatsapp-button'
import { FreeShippingBanner } from './free-shipping-banner'
import { Toaster } from 'react-hot-toast'
import type { StoreData } from '@/types'

interface StoreLayoutProps {
  children: ReactNode
  storeData: StoreData
}

export function StoreLayout({ children, storeData }: StoreLayoutProps) {
  // Aplicar colores personalizados si existen
  const primaryColor = storeData.customization?.primaryColor || '#000000'
  const secondaryColor = storeData.customization?.secondaryColor || '#ffffff'

  // Calculate the top offset for the main content
  const headerHeight = storeData.settings?.freeShippingEnabled ? 'top-[104px]' : 'top-[64px]'
  const paddingTop = storeData.settings?.freeShippingEnabled ? 'pt-[104px]' : 'pt-[64px]'

  return (
    <div className="min-h-screen flex flex-col relative" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <style jsx global>{`
        :root {
          --store-primary: ${primaryColor};
          --store-secondary: ${secondaryColor};
        }
      `}</style>
      
      {/* Sticky header container */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-md">
        <FreeShippingBanner 
          enabled={storeData.settings?.freeShippingEnabled}
          minAmount={storeData.settings?.freeShippingMinAmount}
          text={storeData.settings?.freeShippingText}
        />
        
        <StoreHeader storeData={storeData} />
      </div>
      
      {/* Main content with padding to account for fixed header */}
      <main className={`flex-1 ${paddingTop}`}>
        {children}
      </main>
      
      <StoreFooter storeData={storeData} />
      
      <WhatsAppButton 
        phoneNumber={storeData.settings?.whatsapp} 
        enabled={storeData.settings?.whatsappEnabled} 
      />
      
      {/* Toast notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#10b981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
    </div>
  )
}