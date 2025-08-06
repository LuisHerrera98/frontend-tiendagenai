'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clientCreditService } from '@/lib/client-credits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, CreditCard, User, Calendar, DollarSign } from 'lucide-react'

interface CreditSearchProps {
  onCreditsFound: (totalCredits: number, document: string) => void
  selectedCredits: number
  onClearCredits: () => void
}

export function CreditSearch({ onCreditsFound, selectedCredits, onClearCredits }: CreditSearchProps) {
  const [searchDocument, setSearchDocument] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const { data: credits, refetch } = useQuery({
    queryKey: ['client-credits', searchDocument],
    queryFn: () => clientCreditService.getActiveCredits(searchDocument),
    enabled: false, // Solo buscar cuando se presione el botón
  })

  const handleSearch = async () => {
    if (!searchDocument.trim()) return
    
    setIsSearching(true)
    try {
      await refetch()
    } finally {
      setIsSearching(false)
    }
  }

  const totalCredits = credits?.reduce((sum, credit) => sum + credit.amount, 0) || 0

  const handleApplyCredits = () => {
    if (totalCredits > 0) {
      onCreditsFound(totalCredits, searchDocument)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="w-5 h-5 text-green-600" />
          Buscar Créditos del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="search-document" className="text-sm font-medium">
              Documento o Teléfono
            </Label>
            <Input
              id="search-document"
              type="text"
              placeholder="Ej: 12345678 o 1234567890"
              value={searchDocument}
              onChange={(e) => setSearchDocument(e.target.value)}
              onKeyPress={handleKeyPress}
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleSearch}
              disabled={!searchDocument.trim() || isSearching}
              className="bg-green-600 hover:bg-green-700"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </div>

        {/* Resultados */}
        {credits && credits.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="font-medium text-green-800">
                  Cliente: {credits[0]?.client_name || searchDocument}
                </p>
                <p className="text-sm text-green-600">
                  {credits.length} crédito(s) disponible(s)
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">
                  ${totalCredits.toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-green-600">Total disponible</p>
              </div>
            </div>

            {/* Lista de créditos */}
            <div className="max-h-40 overflow-y-auto space-y-2">
              {credits.map((credit) => (
                <div key={credit._id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">${credit.amount.toLocaleString('es-AR')}</p>
                    <p className="text-xs text-gray-600 truncate">{credit.reason}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {new Date(credit.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Aplicar créditos */}
            <div className="flex gap-2">
              <Button 
                onClick={handleApplyCredits}
                disabled={selectedCredits > 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Aplicar Todos los Créditos
              </Button>
              {selectedCredits > 0 && (
                <Button 
                  variant="outline"
                  onClick={onClearCredits}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Quitar Créditos
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Sin créditos */}
        {credits && credits.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No se encontraron créditos para este cliente</p>
          </div>
        )}

        {/* Créditos aplicados */}
        {selectedCredits > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-800">Créditos aplicados:</span>
              <span className="text-lg font-bold text-blue-700">
                -${selectedCredits.toLocaleString('es-AR')}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Cliente: {searchDocument}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}