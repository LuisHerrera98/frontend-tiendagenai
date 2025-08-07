'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Store, Loader2 } from 'lucide-react';
import { tenantService } from '@/lib/tenant';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, tenant } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // Cargar información del tenant por subdominio
    const loadTenant = async () => {
      const subdomain = tenantService.extractSubdomain();
      if (subdomain && !tenant) {
        try {
          const tenantData = await tenantService.getTenantBySubdomain(subdomain);
          setCurrentTenant(tenantData);
        } catch (error) {
          console.error('Error loading tenant:', error);
        }
      } else if (tenant) {
        setCurrentTenant(tenant);
      }
    };

    loadTenant();
  }, [tenant]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data as any);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Email o contraseña incorrectos';
      setError('root', { message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Store className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">
            {currentTenant ? `Ingresar a ${currentTenant.storeName}` : 'Iniciar sesión'}
          </CardTitle>
          <CardDescription>
            Accede a tu panel de administración
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                {...register('email')}
                id="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
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
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{errors.root.message}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>

            <div className="text-center space-y-2">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              
              {!currentTenant && (
                <p className="text-sm text-gray-600">
                  ¿No tienes una tienda?{' '}
                  <Link href="/auth/register" className="font-medium text-green-600 hover:text-green-500">
                    Crea una gratis
                  </Link>
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}