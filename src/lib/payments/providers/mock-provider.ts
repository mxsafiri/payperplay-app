import { BasePaymentProvider } from '../base-provider';
import {
  PaymentInitiateParams,
  PaymentInitiateResponse,
  PaymentCallbackResult,
  PaymentStatusResponse,
} from '../types';

/**
 * Mock payment provider for testing
 * Replace this with real PSP integration (Selcom, DPO, Flutterwave, etc.)
 */
export class MockPaymentProvider extends BasePaymentProvider {
  get name(): string {
    return 'mock';
  }

  async initiate(params: PaymentInitiateParams): Promise<PaymentInitiateResponse> {
    // Validate phone number
    if (!this.validatePhoneNumber(params.phoneNumber)) {
      return {
        success: false,
        providerReference: '',
        error: 'Invalid Tanzanian phone number',
      };
    }

    const normalizedPhone = this.normalizePhoneNumber(params.phoneNumber);

    // Mock: Generate a fake provider reference
    const providerReference = `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('Mock payment initiated:', {
      amount: params.amount,
      currency: params.currency,
      phone: normalizedPhone,
      reference: params.reference,
      providerReference,
    });

    // In production, this would call the PSP API
    // Example for Selcom:
    // const response = await fetch('https://api.selcommobile.com/v1/checkout', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.config.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     vendor: 'YOURVENDOR',
    //     order_id: params.reference,
    //     buyer_email: 'customer@example.com',
    //     buyer_name: 'Customer',
    //     buyer_phone: normalizedPhone,
    //     amount: params.amount,
    //     currency: params.currency,
    //     webhook: this.config.callbackUrl,
    //   }),
    // });

    return {
      success: true,
      providerReference,
      instructions: `Check your phone (${normalizedPhone}) for payment prompt`,
    };
  }

  verifyCallback(payload: unknown): PaymentCallbackResult {
    // In production, verify webhook signature/authenticity
    const data = payload as Record<string, unknown>;

    // Mock: Parse the callback
    return {
      reference: data.reference as string,
      providerReference: data.providerReference as string,
      status: data.status === 'success' ? 'paid' : 'failed',
      amount: data.amount as number,
      currency: data.currency as string,
      timestamp: new Date(),
      metadata: data.metadata as Record<string, unknown>,
    };
  }

  async checkStatus(providerReference: string): Promise<PaymentStatusResponse> {
    // In production, query PSP API for payment status
    console.log('Checking payment status:', providerReference);

    // Mock: Return pending status
    return {
      status: 'pending',
    };
  }
}
