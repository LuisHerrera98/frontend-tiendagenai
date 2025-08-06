const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface CreateTenantDto {
  subdomain: string;
  storeName: string;
  email: string;
  password: string;
  ownerName: string;
  phone?: string;
}

export const verificationService = {
  async sendVerificationCode(data: CreateTenantDto) {
    const response = await fetch(`${API_URL}/auth/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al enviar código de verificación');
    }

    return response.json();
  },

  async verifyCodeAndCreateTenant(email: string, subdomain: string, code: string) {
    const response = await fetch(`${API_URL}/auth/verify-code-and-create-tenant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, subdomain, code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al verificar código');
    }

    return response.json();
  }
};