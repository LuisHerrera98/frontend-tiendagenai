'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { verificationService } from '@/lib/verification';

interface VerificationModalProps {
  email: string;
  subdomain: string;
  isOpen: boolean;
  onSuccess: (token: string, userData: any) => void;
  onBack: () => void;
  onResendCode: () => void;
}

export function VerificationModal({
  email,
  subdomain,
  isOpen,
  onSuccess,
  onBack,
  onResendCode
}: VerificationModalProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Countdown para reenvío
  useEffect(() => {
    if (!isOpen) return;
    
    setCountdown(60);
    setCanResend(false);
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await verificationService.verifyCodeAndCreateTenant(email, subdomain, code);
      onSuccess(result.access_token, result.user);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    try {
      await onResendCode();
      setCountdown(60);
      setCanResend(false);
      setError('');
      
      // Reiniciar countdown
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setError('Error al reenviar código');
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verifica tu email</CardTitle>
          <CardDescription>
            Hemos enviado un código de 6 dígitos a:<br />
            <span className="font-medium text-gray-900">{email}</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <Label htmlFor="code">Código de verificación</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={handleCodeChange}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                autoComplete="one-time-code"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Ingresa el código de 6 dígitos
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying || code.length !== 6}
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isVerifying ? 'Verificando...' : 'Crear mi tienda'}
              </Button>

              <div className="text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Reenviar código
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Reenviar código en {countdown}s
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onBack}
                className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver al formulario
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}