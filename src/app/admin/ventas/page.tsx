import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestión de Ventas</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No hay ventas registradas</p>
            <p className="text-sm text-gray-400">Las ventas aparecerán aquí cuando se realicen desde la tienda</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}