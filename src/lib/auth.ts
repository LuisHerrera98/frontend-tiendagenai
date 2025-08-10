import axios from 'axios';
import { Permission } from '@/types/permissions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: Permission[];
  tenantId?: string;
  currentTenantId?: string;
  tenants?: Array<{
    id: string;
    subdomain: string;
    storeName: string;
    isActive: boolean;
  }>;
  phone?: string;
  address?: string;
  employeeCode?: string;
  active?: boolean;
  lastLogin?: string;
  createdBy?: string;
}

export interface RegisterData {
  subdomain: string;
  storeName: string;
  email: string;
  password: string;
  ownerName: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
  tenantId?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'user';

  async register(data: RegisterData) {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    const { access_token, user } = response.data;
    
    // Guardar token y usuario en localStorage
    this.setToken(access_token);
    this.setUser(user);
    
    // Configurar axios para futuras peticiones
    this.setAuthHeader(access_token);
    
    return response.data;
  }

  async verifyEmail(token: string) {
    const response = await axios.get(`${API_URL}/auth/verify-email?token=${token}`);
    return response.data;
  }

  async requestPasswordReset(email: string, tenantId?: string) {
    const response = await axios.post(`${API_URL}/auth/request-password-reset`, {
      email,
      tenantId
    });
    return response.data;
  }

  async resetPassword(token: string, newPassword: string) {
    const response = await axios.post(`${API_URL}/auth/reset-password`, {
      token,
      newPassword
    });
    return response.data;
  }

  async checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean }> {
    const response = await axios.get(`${API_URL}/auth/check-subdomain/${subdomain}`);
    return response.data;
  }

  logout() {
    // Limpiar localStorage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('tenant_subdomain');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/';
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setUser(user: User) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  setAuthHeader(token?: string | null) {
    const authToken = token || this.getToken();
    if (authToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  initializeAuth() {
    const token = this.getToken();
    if (token) {
      this.setAuthHeader(token);
    }
  }
}

export const authService = new AuthService();