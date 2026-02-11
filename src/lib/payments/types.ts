// Payment provider interface for Tanzania mobile money integrations
export interface PaymentProvider {
  name: string;
  
  /**
   * Initiate a mobile money payment
   * @returns Provider reference ID and optional instructions for the user
   */
  initiate(params: PaymentInitiateParams): Promise<PaymentInitiateResponse>;
  
  /**
   * Verify and parse webhook/callback payload
   * @returns Standardized payment result
   */
  verifyCallback(payload: unknown): PaymentCallbackResult;
  
  /**
   * Check payment status (for polling fallback)
   */
  checkStatus(providerReference: string): Promise<PaymentStatusResponse>;
}

export interface PaymentInitiateParams {
  amount: number;
  currency: 'TZS';
  phoneNumber: string; // Tanzanian format: 0712345678 or +255712345678
  reference: string; // Internal payment intent ID
  metadata?: Record<string, unknown>;
}

export interface PaymentInitiateResponse {
  success: boolean;
  providerReference: string;
  instructions?: string; // e.g., "Check your phone for M-Pesa prompt"
  error?: string;
}

export interface PaymentCallbackResult {
  reference: string; // Internal payment intent ID
  providerReference: string;
  status: 'paid' | 'failed' | 'pending';
  amount: number;
  currency: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface PaymentStatusResponse {
  status: 'paid' | 'failed' | 'pending';
  amount?: number;
  paidAt?: Date;
}

// Supported mobile money providers in Tanzania
export type MobileMoneyProvider = 'mpesa' | 'tigopesa' | 'airtelmoney' | 'halopesa';

export interface PaymentConfig {
  provider: string; // 'selcom', 'dpo', 'flutterwave', etc.
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
}
