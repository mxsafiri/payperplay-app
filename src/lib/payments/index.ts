import { PaymentProvider, PaymentConfig } from './types';
import { SnippePaymentProvider } from './providers/snippe-provider';

/**
 * Payment provider factory
 * Only Snippe is supported in production.
 */
export function createPaymentProvider(config: PaymentConfig): PaymentProvider {
  switch (config.provider.toLowerCase()) {
    case 'snippe':
      return new SnippePaymentProvider(config);
    default:
      throw new Error(`Unsupported payment provider: ${config.provider}. Only 'snippe' is supported.`);
  }
}

// Export default provider instance
export const paymentProvider = createPaymentProvider({
  provider: process.env.PAYMENT_PROVIDER || 'snippe',
  apiKey: process.env.PAYMENT_API_KEY || '',
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
  environment: (process.env.PAYMENT_ENVIRONMENT as 'sandbox' | 'production') || 'production',
  callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
});

export * from './types';
