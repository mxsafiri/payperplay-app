import { PaymentProvider, PaymentConfig } from './types';
import { MockPaymentProvider } from './providers/mock-provider';
import { SnippePaymentProvider } from './providers/snippe-provider';

/**
 * Payment provider factory
 */
export function createPaymentProvider(config: PaymentConfig): PaymentProvider {
  switch (config.provider.toLowerCase()) {
    case 'snippe':
      return new SnippePaymentProvider(config);
    case 'mock':
      return new MockPaymentProvider(config);
    default:
      throw new Error(`Unsupported payment provider: ${config.provider}`);
  }
}

// Export default provider instance
export const paymentProvider = createPaymentProvider({
  provider: process.env.PAYMENT_PROVIDER || 'mock',
  apiKey: process.env.PAYMENT_API_KEY || '',
  apiSecret: process.env.PAYMENT_API_SECRET,
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
  environment: (process.env.PAYMENT_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
});

export * from './types';
