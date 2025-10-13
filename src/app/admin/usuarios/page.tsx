'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { userService, TenantUser, CreateUserDto, UpdateUserDto, PermissionsInfo } from '@/lib/users';
import { Permission, UserRole, PERMISSION_CATEGORIES, DEFAULT_PERMISSIONS } from '@/types/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserIcon, 
  ShieldCheckIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

interface PermissionAssignmentProps {
  selectedPermissions: Permission[];
  onPermissionChange: (permissions: Permission[]) => void;
}

const PermissionAssignment: React.FC<PermissionAssignmentProps> = ({
  selectedPermissions,
  onPermissionChange
}) => {
  const togglePermission = (permission: Permission) => {
    if (selectedPermissions.includes(permission)) {
      onPermissionChange(selectedPermissions.filter(p => p !== permission));
    } else {
      onPermissionChange([...selectedPermissions, permission]);
    }
  };

  const toggleCategoryPermissions = (categoryPermissions: Permission[]) => {
    const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      // Desmarcar todos los permisos de la categoría
      onPermissionChange(selectedPermissions.filter(p => !categoryPermissions.includes(p)));
    } else {
      // Marcar todos los permisos de la categoría
      const newPermissions = [...selectedPermissions];
      categoryPermissions.forEach(p => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      });
      onPermissionChange(newPermissions);
    }
  };

  return (
    <div className="space-y-6">
      {PERMISSION_CATEGORIES.map((category) => {
        const categoryPermissions = category.permissions.map(p => p.key);
        const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));
        const someSelected = categoryPermissions.some(p => selectedPermissions.includes(p));

        return (
          <div key={category.name} className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => toggleCategoryPermissions(categoryPermissions)}
                className="data-[state=checked]:bg-blue-600"
              />
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
              {category.permissions.map((permission) => (
                <div key={permission.key} className="flex items-start space-x-2">
                  <Checkbox
                    checked={selectedPermissions.includes(permission.key)}
                    onCheckedChange={() => togglePermission(permission.key)}
                    className="mt-0.5 data-[state=checked]:bg-blue-600"
                  />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 cursor-pointer">
                      {permission.label}
                    </label>
                    {permission.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {permission.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: TenantUser | null;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const { tenant } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.VENDEDOR,
    active: true
  });
  
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || UserRole.VENDEDOR,
        active: user.active !== false
      });
      setSelectedPermissions(user.permissions || []);
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: UserRole.VENDEDOR,
        active: true
      });
      setSelectedPermissions(DEFAULT_PERMISSIONS[UserRole.VENDEDOR]);
    }
    setErrors({});
    setGeneratedEmail('');
  }, [user, isOpen]);

  // Generar email automático basado en el nombre
  useEffect(() => {
    if (!isEditing && formData.name && tenant) {
      // Generar email: primer palabra del nombre sin espacios @ nombre de la tienda
      const firstWord = formData.name.split(' ')[0] || formData.name;
      const nameSlug = firstWord.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/\s+/g, '') // Remover espacios
        .replace(/[^a-z0-9]/g, ''); // Remover caracteres especiales
      
      // Usar el subdominio del tenant para el email
      const email = `${nameSlug}@${tenant.subdomain}.com`;
      setGeneratedEmail(email);
      setFormData(prev => ({ ...prev, email }));
    }
  }, [formData.name, tenant, isEditing]);

  useEffect(() => {
    // Actualizar permisos cuando cambie el rol (solo si no es personalizado)
    if (formData.role !== UserRole.CUSTOM) {
      setSelectedPermissions(DEFAULT_PERMISSIONS[formData.role] || []);
    }
  }, [formData.role]);

  // Manejar ESC key para cerrar modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!isEditing && !formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (!isEditing && formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEditing && user) {
        const updateData: UpdateUserDto = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          active: formData.active
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        if (formData.role === UserRole.CUSTOM) {
          updateData.permissions = selectedPermissions;
        }

        await userService.updateTenantUser(user._id, updateData);
      } else {
        const createData: CreateUserDto = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };

        if (formData.role === UserRole.CUSTOM) {
          createData.permissions = selectedPermissions;
        }

        await userService.createTenantUser(createData);
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
      
      // Manejar errores de validación del backend
      if (error.response?.data?.message) {
        // Si el mensaje contiene errores de validación específicos
        const message = error.response.data.message;
        
        // Verificar si es un array de errores de validación
        if (Array.isArray(message)) {
          const errorMessages = message.map((err: any) => {
            // Traducir mensajes comunes de validación
            if (typeof err === 'string') {
              if (err.includes('should not exist')) {
                // Ignorar errores de campos que no deberían existir
                return null;
              }
              return err;
            }
            return err.message || err;
          }).filter(Boolean).join(', ');
          
          setErrors({ submit: errorMessages || 'Error al guardar el usuario' });
        } else if (typeof message === 'string') {
          // Traducir mensajes de error comunes
          let translatedMessage = message;
          
          if (message.includes('should not exist')) {
            // Ignorar este tipo de errores o traducirlos
            translatedMessage = 'Error en los datos del formulario';
          } else if (message.includes('already exists')) {
            translatedMessage = 'El email ya está en uso';
          } else if (message.includes('Invalid')) {
            translatedMessage = 'Datos inválidos';
          }
          
          setErrors({ submit: translatedMessage });
        } else {
          setErrors({ submit: 'Error al guardar el usuario' });
        }
      } else {
        setErrors({ submit: 'Error al guardar el usuario. Por favor, intenta de nuevo.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: UserRole.ADMIN, label: 'Administrador' },
    { value: UserRole.VENDEDOR, label: 'Vendedor' },
    { value: UserRole.CUSTOM, label: 'Personalizado' }
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
            </h2>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Información básica</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre completo *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Juan Pérez"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email {!isEditing && '(generado automáticamente)'}</Label>
                    {!isEditing && generatedEmail && (
                      <p className="text-sm text-gray-500 mb-2">
                        Se generará el email: <span className="font-medium text-blue-600">{generatedEmail}</span>
                      </p>
                    )}
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={errors.email ? 'border-red-500' : ''}
                      disabled={!isEditing}
                      placeholder={!isEditing ? "Se generará automáticamente" : ""}
                    />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  </div>

                  <div className="relative">
                    <Label htmlFor="password">
                      {isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
                    </Label>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={errors.password ? 'border-red-500' : ''}
                      placeholder={isEditing ? "Dejar vacío para mantener la actual" : "Mínimo 6 caracteres"}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                    {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
                  </div>
                </div>
              </div>

              {/* Rol y permisos */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Rol y permisos</h3>
                
                <div>
                  <Label htmlFor="role">Rol</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.role === UserRole.CUSTOM && (
                  <div>
                    <Label>Permisos personalizados</Label>
                    <div className="mt-2 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <PermissionAssignment
                        selectedPermissions={selectedPermissions}
                        onPermissionChange={setSelectedPermissions}
                      />
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.active}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, active: checked === true }))
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                    <Label>Usuario activo</Label>
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </form>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

const UsersPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<TenantUser | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  // Verificar permisos
  if (!hasPermission(Permission.USERS_MANAGE)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso denegado
          </h2>
          <p className="text-gray-600">
            No tienes permisos para gestionar usuarios.
          </p>
        </Card>
      </div>
    );
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getTenantUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: TenantUser) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = (user: TenantUser) => {
    setDeleteUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;

    setDeletingUser(true);
    try {
      await userService.deleteTenantUser(deleteUser._id);
      await loadUsers();
      setShowDeleteDialog(false);
      setDeleteUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setDeletingUser(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canModifyUser = (targetUser: TenantUser) => {
    if (!user) return false;

    // No puedes modificarte a ti mismo
    if (targetUser._id === user.id) return false;

    // Si el target es admin principal (sin createdBy)
    const isTargetOwner = !targetUser.createdBy && targetUser.role === UserRole.ADMIN;

    if (isTargetOwner) {
      // Solo el admin principal puede modificar a otro admin principal
      // Para verificar si el usuario actual es admin principal, necesitamos buscar
      // su información completa en la lista de usuarios
      const currentUserInList = users.find(u => u._id === user.id);
      const isCurrentUserOwner = currentUserInList && !currentUserInList.createdBy && currentUserInList.role === UserRole.ADMIN;

      return isCurrentUserOwner;
    }

    return true;
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Nunca';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} días`;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      [UserRole.ADMIN]: 'bg-red-100 text-red-800',
      [UserRole.VENDEDOR]: 'bg-blue-100 text-blue-800',
      [UserRole.CUSTOM]: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.VENDEDOR]: 'Vendedor',
      [UserRole.CUSTOM]: 'Personalizado'
    };

    return (
      <Badge className={`${variants[role]} px-2 py-1 text-xs font-medium`}>
        {labels[role]}
      </Badge>
    );
  };

  const getStatusBadge = (active: boolean) => {
    return (
      <Badge className={`px-2 py-1 text-xs font-medium ${
        active 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {active ? 'Activo' : 'Inactivo'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600 mt-1">
                Administra los usuarios y sus permisos en el sistema
              </p>
            </div>
            <Button
              onClick={handleCreateUser}
              className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Crear Usuario</span>
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar usuarios</Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Tabla de usuarios */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última conexión</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.active)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatLastLogin(user.lastLogin)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          disabled={!canModifyUser(user)}
                          title={!canModifyUser(user) ? 'No puedes editar tu propio usuario' : 'Editar usuario'}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={!canModifyUser(user)}
                          title={!canModifyUser(user) ? 'No puedes eliminar tu propio usuario' : 'Eliminar usuario'}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron usuarios
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primer usuario'}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de creación/edición */}
      <UserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={selectedUser}
        onSave={loadUsers}
      />

      {/* Dialog de confirmación de eliminación */}
      {showDeleteDialog && deleteUser && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowDeleteDialog(false)} />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="relative bg-white rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <TrashIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Eliminar usuario
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  ¿Estás seguro de que deseas eliminar al usuario <strong>{deleteUser.name}</strong>? 
                  Esta acción no se puede deshacer.
                </p>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={deletingUser}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    disabled={deletingUser}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deletingUser ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;