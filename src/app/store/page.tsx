'use client';

import { useEffect, useState } from 'react';
import { headers } from 'next/headers';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function StorePage() {
  const [storeName, setStoreName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Obtener el subdominio del host
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length >= 3) {
      const sub = parts[0];
      setSubdomain(sub);
      
      // Aquí cargarías los datos de la tienda desde el backend
      fetchStoreData(sub);
    }
  }, []);

  const fetchStoreData = async (subdomain: string) => {
    try {
      // Simular carga de datos - después conectarás con el backend
      setStoreName(`Tienda ${subdomain}`);
      
      // Aquí cargarías productos reales
      setProducts([
        { id: 1, name: 'Producto 1', price: 999, image: 'https://via.placeholder.com/300' },
        { id: 2, name: 'Producto 2', price: 1499, image: 'https://via.placeholder.com/300' },
        { id: 3, name: 'Producto 3', price: 799, image: 'https://via.placeholder.com/300' },
        { id: 4, name: 'Producto 4', price: 2999, image: 'https://via.placeholder.com/300' },
      ]);
    } catch (error) {
      console.error('Error loading store:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tienda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Nombre */}
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Carrito (0)
              </Button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4">
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <Button variant="outline" size="sm" className="w-full mt-2">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Carrito (0)
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">¡Bienvenido a {storeName}!</h2>
          <p className="text-xl">Encuentra los mejores productos aquí</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-8">Productos Destacados</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="aspect-square bg-gray-200">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                <p className="text-2xl font-bold text-green-600">
                  ${product.price.toLocaleString()}
                </p>
                <Button className="w-full mt-3" size="sm">
                  Agregar al carrito
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 {storeName}. Todos los derechos reservados.</p>
          <p className="text-sm text-gray-400 mt-2">
            Powered by TiendaGenAI
          </p>
        </div>
      </footer>
    </div>
  );
}