'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User, LoginData, RegisterData } from '@/lib/auth';
import { tenantService, Tenant } from '@/lib/tenant';
import { useRouter } from 'next/navigation';

interface SimpleTenant {
  id: string;
  subdomain: string;
  storeName: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  tenant: SimpleTenant | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => void;
  updateTenant: (tenant: Partial<SimpleTenant>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<SimpleTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Inicializar el servicio de autenticación
      authService.initializeAuth();
      
      // Obtener usuario y token de localStorage (nuevo sistema)
      const authToken = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user');
      
      if (authToken && userData) {
        try {
          const user = JSON.parse(userData);
          setUser(user);
          
          // Si hay tiendas, cargar la tienda activa
          if (user.tenants && user.tenants.length > 0) {
            const activeTenant = user.tenants.find(t => t.isActive) || user.tenants[0];
            if (activeTenant) {
              setTenant(activeTenant);
              localStorage.setItem('tenant_subdomain', activeTenant.subdomain);
            }
          }
          
          // Cargar datos del tenant si hay subdomain en localStorage
          const tenantSubdomain = localStorage.getItem('tenant_subdomain');
          if (tenantSubdomain && user.tenants) {
            const activeTenant = user.tenants.find(t => t.subdomain === tenantSubdomain);
            if (activeTenant) {
              setTenant(activeTenant);
            }
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Limpiar datos corruptos
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          localStorage.removeItem('tenant_subdomain');
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData) => {
    try {
      const response = await authService.login(data);
      
      // Guardar datos del usuario en localStorage (nuevo sistema)
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Si hay tiendas, guardar el subdominio de la tienda activa
      if (response.user.tenants && response.user.tenants.length > 0) {
        const activeTenant = response.user.tenants.find(t => t.isActive) || response.user.tenants[0];
        if (activeTenant) {
          localStorage.setItem('tenant_subdomain', activeTenant.subdomain);
          setTenant(activeTenant);
        }
      }
      
      setUser(response.user);
      
      // Redirigir al dashboard normal (sin cambiar de subdominio en desarrollo)
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Limpiar localStorage
    localStorage.clear();
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    setUser(null);
    setTenant(null);
    
    // Redirigir al login
    window.location.href = '/auth/login';
  };

  const updateTenant = (updates: Partial<SimpleTenant>) => {
    if (tenant) {
      setTenant({ ...tenant, ...updates });
    }
  };

  const value = {
    user,
    tenant,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateTenant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}