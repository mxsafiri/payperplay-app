import {
  PaymentProvider,
  PaymentInitiateParams,
  PaymentInitiateResponse,
  PaymentCallbackResult,
  PaymentStatusResponse,
  PaymentConfig,
} from './types';

/**
 * Base implementation for payment providers
 * Extend this class when integrating specific PSPs (Selcom, DPO, Flutterwave, etc.)
 */
export abstract class BasePaymentProvider implements PaymentProvider {
  protected config: PaymentConfig;

  constructor(config: PaymentConfig) {
    this.config = config;
  }

  abstract get name(): string;

  /**
   * Normalize phone number to international format
   * Converts 0712345678 to +255712345678
   */
  protected normalizePhoneNumber(phone: string): string {
    // Remove spaces and dashes
    let normalized = phone.replace(/[\s-]/g, '');

    // If starts with 0, replace with +255
    if (normalized.startsWith('0')) {
      normalized = '+255' + normalized.substring(1);
    }

    // If doesn't start with +, add +255
    if (!normalized.startsWith('+')) {
      normalized = '+255' + normalized;
    }

    return normalized;
  }

  /**
   * Validate Tanzanian phone number
   */
  protected validatePhoneNumber(phone: string): boolean {
    const normalized = this.normalizePhoneNumber(phone);
    // Tanzania numbers: +255 followed by 9 digits
    return /^\+255\d{9}$/.test(normalized);
  }

  abstract initiate(params: PaymentInitiateParams): Promise<PaymentInitiateResponse>;
  abstract verifyCallback(payload: unknown): PaymentCallbackResult;
  abstract checkStatus(providerReference: string): Promise<PaymentStatusResponse>;
}
