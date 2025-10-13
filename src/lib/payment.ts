import { api } from './api';

export interface MercadoPagoCredentials {
  accessToken: string;
  publicKey: string;
}

export interface MercadoPagoConfig {
  enabled: boolean;
  mode: 'test' | 'production';
  hasTestCredentials: boolean;
  hasProductionCredentials: boolean;
  testPublicKey: string | null;
  productionPublicKey: string | null;
  webhookSecret: string | null;
  autoReturn: boolean;
  binaryMode: boolean;
  expirationMinutes: number;
  lastTestValidation?: Date;
  lastProdValidation?: Date;
}

export interface UpdateMercadoPagoConfigData {
  enabled?: boolean;
  mode?: 'test' | 'production';
  test?: MercadoPagoCredentials;
  production?: MercadoPagoCredentials;
  webhookSecret?: string;
  autoReturn?: boolean;
  binaryMode?: boolean;
  expirationMinutes?: number;
}

export interface ValidateCredentialsData {
  accessToken: string;
  publicKey: string;
  mode: 'test' | 'production';
}

export interface PaymentPreference {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
  mode: 'test' | 'production';
}

class PaymentService {
  async getMercadoPagoConfig(): Promise<MercadoPagoConfig> {
    const response = await api.get('/payment/mercadopago/config');
    return response.data;
  }

  async updateMercadoPagoConfig(data: UpdateMercadoPagoConfigData): Promise<any> {
    const response = await api.put('/payment/mercadopago/config', data);
    return response.data;
  }

  async validateCredentials(data: ValidateCredentialsData): Promise<any> {
    const response = await api.post('/payment/mercadopago/validate', data);
    return response.data;
  }

  async createPaymentPreference(orderId: string): Promise<PaymentPreference> {
    const response = await api.post(`/payment/preference/${orderId}`);
    return response.data;
  }

  async getPaymentStatus(orderId: string): Promise<any> {
    const response = await api.get(`/payment/status/${orderId}`);
    return response.data;
  }
}

export const paymentService = new PaymentService();