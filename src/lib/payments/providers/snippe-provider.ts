import { BasePaymentProvider } from '../base-provider';
import {
  PaymentInitiateParams,
  PaymentInitiateResponse,
  PaymentCallbackResult,
  PaymentStatusResponse,
} from '../types';
import crypto from 'crypto';

const SNIPPE_BASE_URL = 'https://api.snippe.sh';

/**
 * Snippe payment provider for Tanzania mobile money collections
 * Docs: https://docs.snippe.sh/docs/2026-01-25
 */
export class SnippePaymentProvider extends BasePaymentProvider {
  get name(): string {
    return 'snippe';
  }

  /**
   * Initiate a mobile money payment via Snippe
   * POST /v1/payments
   */
  async initiate(params: PaymentInitiateParams): Promise<PaymentInitiateResponse> {
    if (!this.validatePhoneNumber(params.phoneNumber)) {
      return {
        success: false,
        providerReference: '',
        error: 'Invalid Tanzanian phone number',
      };
    }

    if (params.amount < 500) {
      return {
        success: false,
        providerReference: '',
        error: 'Minimum payment amount is 500 TZS',
      };
    }

    const normalizedPhone = this.normalizePhoneNumber(params.phoneNumber);
    // Snippe expects 255XXXXXXXXX (no + prefix)
    const snippePhone = normalizedPhone.replace('+', '');

    try {
      const response = await fetch(`${SNIPPE_BASE_URL}/v1/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_type: 'mobile',
          details: {
            amount: params.amount,
            currency: 'TZS',
          },
          phone_number: snippePhone,
          customer: {
            firstname: 'PayPerPlay',
            lastname: 'Customer',
            email: 'customer@payperplay.app',
          },
          ...(this.config.callbackUrl?.startsWith('https://') ? { webhook_url: this.config.callbackUrl } : {}),
          metadata: {
            payment_intent_id: params.reference,
            ...(params.metadata || {}),
          },
        }),
      });

      const result = await response.json();

      if (result.status !== 'success' || !result.data?.reference) {
        console.error('Snippe payment initiation failed:', result);
        return {
          success: false,
          providerReference: '',
          error: result.message || 'Payment initiation failed',
        };
      }

      console.log('Snippe payment initiated:', {
        reference: result.data.reference,
        amount: params.amount,
        phone: snippePhone,
      });

      return {
        success: true,
        providerReference: result.data.reference,
        instructions: `Check your phone (${normalizedPhone}) for the mobile money payment prompt`,
      };
    } catch (error) {
      console.error('Snippe API error:', error);
      return {
        success: false,
        providerReference: '',
        error: 'Failed to connect to payment provider',
      };
    }
  }

  /**
   * Verify and parse Snippe webhook payload
   * Verifies HMAC-SHA256 signature from X-Webhook-Signature header
   */
  verifyCallback(payload: unknown): PaymentCallbackResult {
    const data = payload as {
      type: string;
      data: {
        reference: string;
        external_reference?: string;
        status: string;
        amount: { value: number; currency: string };
        settlement?: { gross: { value: number }; fees: { value: number }; net: { value: number } };
        channel?: { type: string; provider: string };
        customer?: { phone: string; name: string; email: string };
        metadata?: Record<string, unknown>;
        completed_at?: string;
        failure_reason?: string;
      };
    };

    // Extract our internal payment_intent_id from metadata
    const paymentIntentId = (data.data?.metadata?.payment_intent_id as string) || '';

    const isCompleted = data.type === 'payment.completed' && data.data?.status === 'completed';
    const isFailed = data.type === 'payment.failed' || data.data?.status === 'failed';

    return {
      reference: paymentIntentId,
      providerReference: data.data?.reference || '',
      status: isCompleted ? 'paid' : isFailed ? 'failed' : 'pending',
      amount: data.data?.amount?.value || 0,
      currency: data.data?.amount?.currency || 'TZS',
      timestamp: data.data?.completed_at ? new Date(data.data.completed_at) : new Date(),
      metadata: {
        snippeReference: data.data?.reference,
        externalReference: data.data?.external_reference,
        settlement: data.data?.settlement,
        channel: data.data?.channel,
        failureReason: data.data?.failure_reason,
        ...(data.data?.metadata || {}),
      },
    };
  }

  /**
   * Check payment status via Snippe API
   * GET /v1/payments/{reference}
   */
  async checkStatus(providerReference: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`${SNIPPE_BASE_URL}/v1/payments/${providerReference}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      const result = await response.json();

      console.log('Snippe checkStatus response:', {
        httpStatus: response.status,
        apiStatus: result.status,
        paymentStatus: result.data?.status,
        completedAt: result.data?.completed_at,
        settlement: result.data?.settlement,
        reference: providerReference,
        fullData: JSON.stringify(result.data),
      });

      if (result.status !== 'success' || !result.data) {
        return { status: 'pending' };
      }

      const snippeStatus = result.data.status;
      const status: 'paid' | 'failed' | 'pending' =
        snippeStatus === 'completed' ? 'paid' :
        snippeStatus === 'failed' || snippeStatus === 'expired' || snippeStatus === 'voided' ? 'failed' :
        'pending';

      return {
        status,
        amount: result.data.amount?.value,
        paidAt: result.data.completed_at ? new Date(result.data.completed_at) : undefined,
      };
    } catch (error) {
      console.error('Snippe status check error:', error);
      return { status: 'pending' };
    }
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  static verifySignature(rawBody: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }
}
