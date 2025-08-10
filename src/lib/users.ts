import { api } from './api';
import { UserRole, Permission } from '@/types/permissions';

export interface TenantUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  active: boolean;
  phone?: string;
  address?: string;
  employeeCode?: string;
  lastLogin?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  permissions?: Permission[];
  phone?: string;
  address?: string;
  employeeCode?: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  permissions?: Permission[];
  phone?: string;
  address?: string;
  employeeCode?: string;
  active?: boolean;
}

export interface PermissionsInfo {
  roles: UserRole[];
  permissions: {
    key: string;
    name: string;
    category: string;
  }[];
  defaultPermissions: Record<UserRole, Permission[]>;
}

export const userService = {
  // Obtener usuarios del tenant
  async getTenantUsers(): Promise<TenantUser[]> {
    const response = await api.get('/user/tenant-users');
    return response.data;
  },

  // Obtener un usuario específico
  async getTenantUser(userId: string): Promise<TenantUser> {
    const response = await api.get(`/user/tenant-users/${userId}`);
    return response.data;
  },

  // Crear un nuevo usuario
  async createTenantUser(data: CreateUserDto): Promise<TenantUser> {
    const response = await api.post('/user/tenant-users', data);
    return response.data;
  },

  // Actualizar un usuario
  async updateTenantUser(userId: string, data: UpdateUserDto): Promise<TenantUser> {
    const response = await api.patch(`/user/tenant-users/${userId}`, data);
    return response.data;
  },

  // Eliminar un usuario
  async deleteTenantUser(userId: string): Promise<void> {
    await api.delete(`/user/tenant-users/${userId}`);
  },

  // Obtener información de permisos disponibles
  async getPermissionsInfo(): Promise<PermissionsInfo> {
    const response = await api.get('/user/permissions');
    return response.data;
  }
};