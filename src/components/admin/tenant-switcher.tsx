'use client';

import { useState, useEffect } from 'react';
import { Store } from 'lucide-react';

interface Tenant {
  id: string;
  subdomain: string;
  storeName: string;
  isActive: boolean;
}

export function TenantSwitcher() {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    fetchUserTenants();
  }, []);


  const fetchUserTenants = async () => {
    try {
      // Primero intentar obtener desde localStorage
      const userData = localStorage.getItem('user');
      console.log('userData from localStorage:', userData);
      
      if (userData) {
        const user = JSON.parse(userData);
        console.log('parsed user:', user);
        
        if (user.tenants && user.tenants.length > 0) {
          console.log('user.tenants:', user.tenants);
          const active = user.tenants.find((t: Tenant) => t.isActive);
          console.log('active tenant:', active);
          setCurrentTenant(active);
          
          // Guardar el subdominio actual
          if (active) {
            localStorage.setItem('tenant_subdomain', active.subdomain);
          }
          return;
        }
      }

      // Si no hay datos en localStorage, hacer llamada a API
      console.log('Fetching tenants from API...');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('No auth token found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/api/user/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        const active = data.find((t: Tenant) => t.isActive);
        setCurrentTenant(active);
        
        // Guardar el subdominio actual
        if (active) {
          localStorage.setItem('tenant_subdomain', active.subdomain);
        }
      } else {
        console.error('API response not ok:', response.status);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };


  return (
    <div className="relative">
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
        <Store className="w-5 h-5 text-gray-600" />
        <div className="text-left">
          <p className="text-xs text-gray-500">Tienda actual</p>
          <p className="text-sm font-medium text-gray-900">
            {currentTenant?.storeName || 'Mi tienda'}
          </p>
        </div>
      </div>

      {/* Temporalmente deshabilitado el dropdown
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <p className="text-xs text-gray-500 px-3 py-2">MIS TIENDAS</p>
            
            {tenants.map((tenant) => {
              console.log('Rendering tenant:', tenant.storeName, 'isActive:', tenant.isActive, 'loading:', loading);
              return (
                <button
                  key={tenant.id}
                  onClick={() => {
                    console.log('Tenant button clicked:', tenant.id, tenant.storeName);
                    switchTenant(tenant.id);
                  }}
                  disabled={loading || tenant.isActive}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                    tenant.isActive 
                      ? 'bg-green-50 text-green-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                <div className="flex items-center space-x-3">
                  <Store className="w-4 h-4" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{tenant.storeName}</p>
                    <p className="text-xs text-gray-500">{tenant.subdomain}.tiendagenai.com</p>
                  </div>
                </div>
                {tenant.isActive && <Check className="w-4 h-4 text-green-600" />}
              </button>
              );
            })}
            
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button 
                onClick={() => {
                  setIsOpen(false)
                  setShowCreateDialog(true)
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Crear nueva tienda</span>
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}