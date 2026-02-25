import { PaymentProvider, PaymentConfig } from './types';
import { SnippePaymentProvider } from './providers/snippe-provider';

/**
 * Payment provider factory
 * Only Snippe is supported in production.
 */
export function createPaymentProvider(config: PaymentConfig): PaymentProvider {
  const name = config.provider.toLowerCase();
  if (name !== 'snippe') {
    throw new Error(`Unsupported payment provider: ${config.provider}. Only 'snippe' is supported.`);
  }
  return new SnippePaymentProvider(config);
}

// Lazy-initialized provider instance to avoid crashing
// during Next.js build-time module evaluation.
let _provider: PaymentProvider | null = null;

export const paymentProvider: PaymentProvider = new Proxy({} as PaymentProvider, {
  get(_target, prop) {
    if (!_provider) {
      _provider = createPaymentProvider({
        provider: process.env.PAYMENT_PROVIDER || 'snippe',
        apiKey: process.env.PAYMENT_API_KEY || '',
        webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
        environment: (process.env.PAYMENT_ENVIRONMENT as 'sandbox' | 'production') || 'production',
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback`,
      });
    }
    const value = (_provider as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(_provider);
    }
    return value;
  },
});

export * from './types';
