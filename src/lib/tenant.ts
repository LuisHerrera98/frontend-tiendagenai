import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Tenant {
  _id: string;
  subdomain: string;
  storeName: string;
  email: string;
  ownerName: string;
  phone?: string;
  status: 'active' | 'suspended' | 'pending_verification' | 'trial';
  plan: 'free' | 'basic' | 'premium';
  trialEndsAt?: Date;
  customization: {
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
    favicon?: string;
    bannerImage?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      whatsapp?: string;
    };
  };
  settings: {
    currency?: string;
    timezone?: string;
    language?: string;
    enableWhatsapp?: boolean;
    whatsappNumber?: string;
  };
  productCount: number;
  saleCount: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

class TenantService {
  async getCurrentTenant(): Promise<Tenant | null> {
    try {
      const response = await axios.get(`${API_URL}/tenant/current`);
      return response.data;
    } catch (error) {
      console.error('Error fetching current tenant:', error);
      return null;
    }
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant> {
    const response = await axios.get(`${API_URL}/tenant/by-subdomain/${subdomain}`);
    return response.data;
  }

  async updateCustomization(customization: Partial<Tenant['customization']>) {
    const response = await axios.put(`${API_URL}/tenant/customization`, customization);
    return response.data;
  }

  async updateSettings(settings: Partial<Tenant['settings']>) {
    const response = await axios.put(`${API_URL}/tenant/settings`, settings);
    return response.data;
  }

  extractSubdomain(hostname?: string): string | null {
    const host = hostname || window.location.hostname;
    
    // Para desarrollo local
    if (host === 'localhost' || host === '127.0.0.1') {
      // Buscar en localStorage para desarrollo
      return localStorage.getItem('dev_subdomain');
    }

    const parts = host.split('.');
    
    // Si tiene al menos 3 partes, el primero es el subdominio
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }

  setTenantHeader(tenantId: string) {
    axios.defaults.headers.common['X-Tenant-Id'] = tenantId;
  }

  clearTenantHeader() {
    delete axios.defaults.headers.common['X-Tenant-Id'];
  }
}

export const tenantService = new TenantService();