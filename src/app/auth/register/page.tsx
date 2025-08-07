'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle, Store, Loader2 } from 'lucide-react';
import { authService } from '@/lib/auth';
import { verificationService, CreateTenantDto } from '@/lib/verification';
import { VerificationModal } from '@/components/auth/verification-modal';

const registerSchema = z.object({
  subdomain: z.string()
    .min(3, 'El subdominio debe tener al menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  storeName: z.string().min(3, 'El nombre de la tienda debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  ownerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingData, setPendingData] = useState<CreateTenantDto | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const subdomain = watch('subdomain');

  // Verificar disponibilidad del subdominio
  React.useEffect(() => {
    const checkSubdomain = async () => {
      if (!subdomain || subdomain.length < 3) {
        setSubdomainAvailable(null);
        return;
      }

      setCheckingSubdomain(true);
      try {
        const result = await authService.checkSubdomainAvailability(subdomain);
        setSubdomainAvailable(result.available);
      } catch (error) {
        console.error('Error checking subdomain:', error);
        // En caso de error de red (Brave), asumir que está disponible para no bloquear
        setSubdomainAvailable(true);
      } finally {
        setCheckingSubdomain(false);
      }
    };

    const timeoutId = setTimeout(checkSubdomain, 500);
    return () => clearTimeout(timeoutId);
  }, [subdomain]);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const result = await verificationService.sendVerificationCode(data as any);
      setPendingData(data as any);
      setShowVerificationModal(true);
    } catch (error: any) {
      setError('root', { message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = async (token: string, userData: any) => {
    // Guardar token en cookie para autenticación
    document.cookie = `auth_token=${token}; path=/; max-age=86400`;
    
    // Guardar datos del usuario y tiendas
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Si hay tiendas, guardar el subdominio de la actual
    if (userData.tenants && userData.tenants.length > 0) {
      const activeTenant = userData.tenants.find(t => t.isActive) || userData.tenants[0];
      localStorage.setItem('tenant_subdomain', activeTenant.subdomain);
    }
    
    // Redirigir al panel admin (sin subdominio)
    window.location.href = '/admin/dashboard';
  };

  const handleResendCode = async () => {
    if (!pendingData) return;
    await verificationService.sendVerificationCode(pendingData);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">¡Registro exitoso!</CardTitle>
            <CardDescription className="mt-2">
              Hemos enviado un email de verificación a tu correo.
              Por favor, revisa tu bandeja de entrada para activar tu tienda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Si no recibes el email en los próximos minutos, revisa tu carpeta de spam.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Store className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Crea tu tienda online</CardTitle>
          <CardDescription>
            Comienza gratis y vende en minutos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="subdomain">Dirección de tu tienda</Label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <Input
                  {...register('subdomain')}
                  id="subdomain"
                  type="text"
                  placeholder="mitienda"
                  className="rounded-r-none"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  .tiendagenai.com
                </span>
              </div>
              {errors.subdomain && (
                <p className="mt-1 text-sm text-red-600">{errors.subdomain.message}</p>
              )}
              {checkingSubdomain && (
                <p className="mt-1 text-sm text-gray-500">Verificando disponibilidad...</p>
              )}
              {subdomainAvailable === false && (
                <p className="mt-1 text-sm text-red-600">Este subdominio ya está en uso</p>
              )}
              {subdomainAvailable === true && (
                <p className="mt-1 text-sm text-green-600">¡Subdominio disponible!</p>
              )}
            </div>

            <div>
              <Label htmlFor="storeName">Nombre de tu tienda</Label>
              <Input
                {...register('storeName')}
                id="storeName"
                type="text"
                placeholder="Mi Tienda Online"
              />
              {errors.storeName && (
                <p className="mt-1 text-sm text-red-600">{errors.storeName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="ownerName">Tu nombre completo</Label>
              <Input
                {...register('ownerName')}
                id="ownerName"
                type="text"
                placeholder="Juan Pérez"
              />
              {errors.ownerName && (
                <p className="mt-1 text-sm text-red-600">{errors.ownerName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                {...register('email')}
                id="email"
                type="email"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                {...register('password')}
                id="password"
                type="password"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                {...register('phone')}
                id="phone"
                type="tel"
                placeholder="+54 11 1234-5678"
              />
            </div>

            {errors.root && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{errors.root.message}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || subdomainAvailable === false}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Enviando código...' : 'Enviar código de verificación'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              ¿Ya tienes una tienda?{' '}
              <Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500">
                Inicia sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Modal de verificación */}
      {pendingData && (
        <VerificationModal
          email={pendingData.email}
          subdomain={pendingData.subdomain}
          isOpen={showVerificationModal}
          onSuccess={handleVerificationSuccess}
          onBack={() => setShowVerificationModal(false)}
          onResendCode={handleResendCode}
        />
      )}
    </div>
  );
}