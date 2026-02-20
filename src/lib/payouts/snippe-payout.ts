const SNIPPE_BASE_URL = 'https://api.snippe.sh';

export interface PayoutParams {
  amount: number;
  recipientPhone: string; // Tanzanian format
  recipientName: string;
  narration?: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PayoutResponse {
  success: boolean;
  reference?: string;
  externalReference?: string;
  fees?: number;
  total?: number;
  error?: string;
}

export interface PayoutFeeResponse {
  fee: number;
  total: number;
}

export interface PayoutStatusResponse {
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  failureReason?: string;
}

/**
 * Normalize phone to 255XXXXXXXXX format (no + prefix)
 */
function normalizePhone(phone: string): string {
  let n = phone.replace(/[\s\-+]/g, '');
  if (n.startsWith('0')) {
    n = '255' + n.substring(1);
  }
  if (!n.startsWith('255')) {
    n = '255' + n;
  }
  return n;
}

/**
 * Calculate payout fee before sending
 * GET /v1/payouts/fee?amount=X
 */
export async function calculatePayoutFee(amount: number): Promise<PayoutFeeResponse> {
  const apiKey = process.env.PAYMENT_API_KEY;
  if (!apiKey) throw new Error('PAYMENT_API_KEY not configured');

  const response = await fetch(`${SNIPPE_BASE_URL}/v1/payouts/fee?amount=${amount}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  const result = await response.json();

  if (result.status !== 'success' || !result.data) {
    throw new Error(result.message || 'Failed to calculate payout fee');
  }

  return {
    fee: result.data.fees?.value || 0,
    total: result.data.total?.value || amount,
  };
}

/**
 * Send a payout to a mobile money account
 * POST /v1/payouts/send
 */
export async function sendPayout(params: PayoutParams): Promise<PayoutResponse> {
  const apiKey = process.env.PAYMENT_API_KEY;
  if (!apiKey) throw new Error('PAYMENT_API_KEY not configured');

  const phone = normalizePhone(params.recipientPhone);

  try {
    const webhookUrl = params.webhookUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payouts/callback`;

    const response = await fetch(`${SNIPPE_BASE_URL}/v1/payouts/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        channel: 'mobile',
        recipient_phone: phone,
        recipient_name: params.recipientName,
        narration: params.narration || 'PayPerPlay creator withdrawal',
        ...(webhookUrl?.startsWith('https://') ? { webhook_url: webhookUrl } : {}),
        metadata: params.metadata || {},
      }),
    });

    const result = await response.json();

    if (result.status !== 'success' || !result.data?.reference) {
      console.error('Snippe payout failed:', result);
      return {
        success: false,
        error: result.message || 'Payout initiation failed',
      };
    }

    console.log('Snippe payout initiated:', {
      reference: result.data.reference,
      amount: params.amount,
      phone,
      fees: result.data.fees?.value,
      total: result.data.total?.value,
    });

    return {
      success: true,
      reference: result.data.reference,
      externalReference: result.data.external_reference,
      fees: result.data.fees?.value,
      total: result.data.total?.value,
    };
  } catch (error) {
    console.error('Snippe payout API error:', error);
    return {
      success: false,
      error: 'Failed to connect to payout provider',
    };
  }
}

/**
 * Check payout status
 * GET /v1/payouts/{reference}
 */
export async function checkPayoutStatus(reference: string): Promise<PayoutStatusResponse> {
  const apiKey = process.env.PAYMENT_API_KEY;
  if (!apiKey) throw new Error('PAYMENT_API_KEY not configured');

  try {
    const response = await fetch(`${SNIPPE_BASE_URL}/v1/payouts/${reference}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    const result = await response.json();

    if (result.status !== 'success' || !result.data) {
      return { status: 'pending' };
    }

    return {
      status: result.data.status as PayoutStatusResponse['status'],
      failureReason: result.data.failure_reason,
    };
  } catch (error) {
    console.error('Snippe payout status error:', error);
    return { status: 'pending' };
  }
}
