'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { paymentService } from '@/lib/payment'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { Shield, CreditCard, AlertCircle, CheckCircle, XCircle, Eye, EyeOff, TestTube, Rocket } from 'lucide-react'

interface MercadoPagoConfig {
  enabled: boolean
  mode: 'test' | 'production'
  hasTestCredentials: boolean
  hasProductionCredentials: boolean
  testPublicKey: string | null
  productionPublicKey: string | null
  webhookSecret: string | null
  autoReturn: boolean
  binaryMode: boolean
  expirationMinutes: number
  lastTestValidation?: Date
  lastProdValidation?: Date
}

export default function MercadoPagoConfigPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [config, setConfig] = useState<MercadoPagoConfig>({
    enabled: false,
    mode: 'test',
    hasTestCredentials: false,
    hasProductionCredentials: false,
    testPublicKey: null,
    productionPublicKey: null,
    webhookSecret: null,
    autoReturn: true,
    binaryMode: false,
    expirationMinutes: 60,
  })
  
  const [credentials, setCredentials] = useState({
    test: {
      accessToken: '',
      publicKey: '',
    },
    production: {
      accessToken: '',
      publicKey: '',
    },
    webhookSecret: '',
  })
  
  const [showCredentials, setShowCredentials] = useState({
    testAccessToken: false,
    testPublicKey: false,
    prodAccessToken: false,
    prodPublicKey: false,
    webhookSecret: false,
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const data = await paymentService.getMercadoPagoConfig()
      setConfig(data)
    } catch (error) {
      console.error('Error fetching config:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const updateData: any = {
        enabled: config.enabled,
        mode: config.mode,
        autoReturn: config.autoReturn,
        binaryMode: config.binaryMode,
        expirationMinutes: config.expirationMinutes,
      }
      
      // Enviar credenciales de test si se han ingresado
      if (credentials.test.accessToken || credentials.test.publicKey) {
        updateData.test = {}
        if (credentials.test.accessToken) updateData.test.accessToken = credentials.test.accessToken
        if (credentials.test.publicKey) updateData.test.publicKey = credentials.test.publicKey
      }
      
      // Enviar credenciales de producción si se han ingresado
      if (credentials.production.accessToken || credentials.production.publicKey) {
        updateData.production = {}
        if (credentials.production.accessToken) updateData.production.accessToken = credentials.production.accessToken
        if (credentials.production.publicKey) updateData.production.publicKey = credentials.production.publicKey
      }
      
      // Enviar webhook secret si se ha ingresado
      if (credentials.webhookSecret) {
        updateData.webhookSecret = credentials.webhookSecret
      }
      
      await paymentService.updateMercadoPagoConfig(updateData)
      
      toast.success('Configuración guardada exitosamente')
      
      // Limpiar credenciales después de guardar
      setCredentials({
        test: { accessToken: '', publicKey: '' },
        production: { accessToken: '', publicKey: '' },
        webhookSecret: '',
      })
      
      // Recargar configuración
      await fetchConfig()
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleValidateCredentials = async (mode: 'test' | 'production') => {
    const creds = credentials[mode]
    
    if (!creds.accessToken || !creds.publicKey) {
      toast.error('Ingresa ambas credenciales para validar')
      return
    }
    
    try {
      setValidating(true)
      const response = await paymentService.validateCredentials({
        accessToken: creds.accessToken,
        publicKey: creds.publicKey,
        mode,
      })
      
      if (response.valid) {
        toast.success(`Credenciales de ${mode === 'test' ? 'prueba' : 'producción'} válidas`)
      } else {
        toast.error(response.message || 'Credenciales inválidas')
      }
    } catch (error) {
      console.error('Error validating credentials:', error)
      toast.error('Error al validar las credenciales')
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8" />
          Configuración de Mercado Pago
        </h1>
        <p className="text-gray-600 mt-2">
          Configura tu integración con Mercado Pago para aceptar pagos online
        </p>
      </div>

      {/* Estado de la configuración */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Estado de la Integración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {config.hasTestCredentials ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Test configurado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Test no configurado</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {config.hasProductionCredentials ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Producción configurado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Producción no configurado</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {config.mode === 'test' ? (
                  <>
                    <TestTube className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600 font-medium">Modo Test</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Producción</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="enabled" className="text-sm">
                  {config.enabled ? 'Habilitado' : 'Deshabilitado'}
                </Label>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            {config.lastTestValidation && (
              <p>Test validado: {new Date(config.lastTestValidation).toLocaleString()}</p>
            )}
            {config.lastProdValidation && (
              <p>Producción validado: {new Date(config.lastProdValidation).toLocaleString()}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modo de operación */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Modo de Operación</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="mode">Selecciona el modo activo</Label>
            <Select
              value={config.mode}
              onValueChange={(value: 'test' | 'production') => setConfig({ ...config, mode: value })}
            >
              <SelectTrigger id="mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">
                  <div className="flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    Test (Sandbox)
                  </div>
                </SelectItem>
                <SelectItem value="production">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Producción
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              {config.mode === 'test' 
                ? 'Los pagos se procesarán en modo de prueba (sandbox)'
                : 'Los pagos se procesarán con dinero real'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Credenciales de Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-yellow-500" />
            Credenciales de Test (Sandbox)
          </CardTitle>
          <CardDescription>
            Credenciales para realizar pruebas sin procesar pagos reales.
            <a 
              href="https://www.mercadopago.com.ar/developers/panel/app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              Obtener credenciales de test
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testAccessToken">Access Token de Test</Label>
            <div className="relative">
              <Input
                id="testAccessToken"
                type={showCredentials.testAccessToken ? 'text' : 'password'}
                value={credentials.test.accessToken}
                onChange={(e) => setCredentials({ 
                  ...credentials, 
                  test: { ...credentials.test, accessToken: e.target.value }
                })}
                placeholder={config.hasTestCredentials ? '••••••••••••••••' : 'TEST-...'}
              />
              <button
                type="button"
                onClick={() => setShowCredentials({ 
                  ...showCredentials, 
                  testAccessToken: !showCredentials.testAccessToken 
                })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCredentials.testAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="testPublicKey">Public Key de Test</Label>
            <div className="relative">
              <Input
                id="testPublicKey"
                type={showCredentials.testPublicKey ? 'text' : 'password'}
                value={credentials.test.publicKey}
                onChange={(e) => setCredentials({ 
                  ...credentials, 
                  test: { ...credentials.test, publicKey: e.target.value }
                })}
                placeholder={config.testPublicKey || 'TEST-...'}
              />
              <button
                type="button"
                onClick={() => setShowCredentials({ 
                  ...showCredentials, 
                  testPublicKey: !showCredentials.testPublicKey 
                })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCredentials.testPublicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleValidateCredentials('test')}
              disabled={validating || !credentials.test.accessToken || !credentials.test.publicKey}
            >
              {validating ? 'Validando...' : 'Validar Credenciales de Test'}
            </Button>
            {config.lastTestValidation && (
              <span className="text-sm text-green-600 self-center">
                ✓ Validado
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credenciales de Producción */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-green-500" />
            Credenciales de Producción
          </CardTitle>
          <CardDescription>
            Credenciales para procesar pagos reales. Úsalas con precaución.
            <a 
              href="https://www.mercadopago.com.ar/developers/panel/app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              Obtener credenciales de producción
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="prodAccessToken">Access Token de Producción</Label>
            <div className="relative">
              <Input
                id="prodAccessToken"
                type={showCredentials.prodAccessToken ? 'text' : 'password'}
                value={credentials.production.accessToken}
                onChange={(e) => setCredentials({ 
                  ...credentials, 
                  production: { ...credentials.production, accessToken: e.target.value }
                })}
                placeholder={config.hasProductionCredentials ? '••••••••••••••••' : 'APP_USR-...'}
              />
              <button
                type="button"
                onClick={() => setShowCredentials({ 
                  ...showCredentials, 
                  prodAccessToken: !showCredentials.prodAccessToken 
                })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCredentials.prodAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="prodPublicKey">Public Key de Producción</Label>
            <div className="relative">
              <Input
                id="prodPublicKey"
                type={showCredentials.prodPublicKey ? 'text' : 'password'}
                value={credentials.production.publicKey}
                onChange={(e) => setCredentials({ 
                  ...credentials, 
                  production: { ...credentials.production, publicKey: e.target.value }
                })}
                placeholder={config.productionPublicKey || 'APP_USR-...'}
              />
              <button
                type="button"
                onClick={() => setShowCredentials({ 
                  ...showCredentials, 
                  prodPublicKey: !showCredentials.prodPublicKey 
                })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCredentials.prodPublicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleValidateCredentials('production')}
              disabled={validating || !credentials.production.accessToken || !credentials.production.publicKey}
            >
              {validating ? 'Validando...' : 'Validar Credenciales de Producción'}
            </Button>
            {config.lastProdValidation && (
              <span className="text-sm text-green-600 self-center">
                ✓ Validado
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Secret */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Seguridad del Webhook
          </CardTitle>
          <CardDescription>
            Configura un secret para validar que las notificaciones vienen de Mercado Pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="webhookSecret">Webhook Secret (Opcional pero recomendado)</Label>
            <div className="relative">
              <Input
                id="webhookSecret"
                type={showCredentials.webhookSecret ? 'text' : 'password'}
                value={credentials.webhookSecret}
                onChange={(e) => setCredentials({ ...credentials, webhookSecret: e.target.value })}
                placeholder={config.webhookSecret ? '••••••••••••••••' : 'tu-secret-personalizado'}
              />
              <button
                type="button"
                onClick={() => setShowCredentials({ 
                  ...showCredentials, 
                  webhookSecret: !showCredentials.webhookSecret 
                })}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCredentials.webhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Este secret se usará para validar la autenticidad de los webhooks
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuración avanzada */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuración Avanzada</CardTitle>
          <CardDescription>
            Opciones adicionales para personalizar el comportamiento del checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoReturn">Retorno automático</Label>
              <p className="text-sm text-gray-500">
                Redirigir automáticamente después del pago exitoso
              </p>
            </div>
            <Switch
              id="autoReturn"
              checked={config.autoReturn}
              onCheckedChange={(checked) => setConfig({ ...config, autoReturn: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="binaryMode">Modo binario</Label>
              <p className="text-sm text-gray-500">
                Solo permite pagos aprobados o rechazados (sin pendientes)
              </p>
            </div>
            <Switch
              id="binaryMode"
              checked={config.binaryMode}
              onCheckedChange={(checked) => setConfig({ ...config, binaryMode: checked })}
            />
          </div>

          <div>
            <Label htmlFor="expirationMinutes">Tiempo de expiración (minutos)</Label>
            <Input
              id="expirationMinutes"
              type="number"
              min="30"
              max="1440"
              value={config.expirationMinutes}
              onChange={(e) => setConfig({ ...config, expirationMinutes: parseInt(e.target.value) || 60 })}
            />
            <p className="text-sm text-gray-500 mt-1">
              Tiempo máximo para completar el pago (30-1440 minutos)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Información de webhooks */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Configuración de Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Para recibir notificaciones automáticas del estado de los pagos, configura el siguiente URL en tu panel de Mercado Pago:
          </p>
          <div className="bg-gray-100 p-3 rounded-lg">
            <code className="text-sm break-all">
              {process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/payment/webhook/{user?.currentTenantId || 'TENANT_ID'}
            </code>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Eventos a configurar: Payment notifications
          </p>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={fetchConfig}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  )
}