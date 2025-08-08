'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { Store, Mail, Phone, MapPin, Instagram, Facebook, MessageCircle, Palette, Save } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ConfigurationPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantData, setTenantData] = useState<any>(null)
  
  const [storeInfo, setStoreInfo] = useState({
    storeName: '',
    email: '',
    phone: '',
    ownerName: ''
  })
  
  const [settings, setSettings] = useState({
    email: '',
    phone: '',
    address: '',
    whatsapp: '',
    whatsappEnabled: false,
    instagram: '',
    facebook: '',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires'
  })
  
  const [customization, setCustomization] = useState({
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    socialMedia: {
      facebook: '',
      instagram: '',
      whatsapp: ''
    }
  })

  useEffect(() => {
    fetchTenantData()
  }, [])

  const fetchTenantData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const response = await api.get('/tenant/current', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.data) {
        setTenantData(response.data)
        
        // Cargar información básica
        setStoreInfo({
          storeName: response.data.storeName || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          ownerName: response.data.ownerName || ''
        })
        
        // Cargar settings
        if (response.data.settings) {
          setSettings({
            ...settings,
            ...response.data.settings
          })
        }
        
        // Cargar customization
        if (response.data.customization) {
          setCustomization({
            ...customization,
            ...response.data.customization,
            socialMedia: {
              ...customization.socialMedia,
              ...response.data.customization.socialMedia
            }
          })
        }
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('auth_token')
      
      // Guardar settings
      await api.put('/tenant/settings', settings, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Id': tenantData._id
        }
      })
      
      // Guardar customization
      await api.put('/tenant/customization', customization, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Id': tenantData._id
        }
      })
      
      toast.success('Configuración guardada exitosamente')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold mb-8">Configuración de la Tienda</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información básica */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Store className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Información Básica</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="storeName">Nombre de la Tienda</Label>
                <Input
                  id="storeName"
                  value={storeInfo.storeName}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="ownerName">Propietario</Label>
                <Input
                  id="ownerName"
                  value={storeInfo.ownerName}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="storeEmail">Email de la Tienda</Label>
                <Input
                  id="storeEmail"
                  value={storeInfo.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div>
                <Label htmlFor="subdomain">Subdominio</Label>
                <Input
                  id="subdomain"
                  value={tenantData?.subdomain || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </Card>

          {/* Información de contacto */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Phone className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Información de Contacto</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="contactEmail">Email de Contacto</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.value})}
                  placeholder="contacto@tutienda.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({...settings, phone: e.target.value})}
                  placeholder="+54 11 1234-5678"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({...settings, address: e.target.value})}
                  placeholder="Av. Ejemplo 123, CABA"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="whatsapp" className="text-base font-medium">WhatsApp</Label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.whatsappEnabled}
                      onChange={(e) => setSettings({...settings, whatsappEnabled: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {settings.whatsappEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </label>
                </div>
                <Input
                  id="whatsapp"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({...settings, whatsapp: e.target.value})}
                  placeholder="5491112345678"
                  disabled={!settings.whatsappEnabled}
                  className={!settings.whatsappEnabled ? 'bg-gray-50 opacity-60' : ''}
                />
                <p className="text-xs text-gray-500">Incluir código de país sin el símbolo +</p>
              </div>
            </div>
          </Card>

          {/* Redes sociales */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Instagram className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Redes Sociales</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={settings.instagram}
                  onChange={(e) => setSettings({...settings, instagram: e.target.value})}
                  placeholder="@tutienda"
                />
              </div>
              
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={settings.facebook}
                  onChange={(e) => setSettings({...settings, facebook: e.target.value})}
                  placeholder="https://facebook.com/tutienda"
                />
              </div>
            </div>
          </Card>

          {/* Personalización */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Personalización</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="primaryColor">Color Primario</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={customization.primaryColor}
                    onChange={(e) => setCustomization({...customization, primaryColor: e.target.value})}
                    className="w-20 h-10"
                  />
                  <Input
                    value={customization.primaryColor}
                    onChange={(e) => setCustomization({...customization, primaryColor: e.target.value})}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="secondaryColor">Color Secundario</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={customization.secondaryColor}
                    onChange={(e) => setCustomization({...customization, secondaryColor: e.target.value})}
                    className="w-20 h-10"
                  />
                  <Input
                    value={customization.secondaryColor}
                    onChange={(e) => setCustomization({...customization, secondaryColor: e.target.value})}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Botón de guardar */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
    </div>
  )
}