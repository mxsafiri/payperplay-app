/**
 * nTZS Wallet-as-a-Service Client
 * Mirrors the @ntzs/sdk API using direct HTTP calls.
 * See docs: https://www.ntzs.co.tz/developers
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NtzsUser {
  id: string;
  externalId: string;
  email: string;
  phone: string | null;
  walletAddress: string | null;
  balance: number;
}

export interface NtzsUserWithBalance {
  id: string;
  externalId: string;
  email: string;
  phone: string | null;
  walletAddress: string | null;
  balanceTzs: number;
}

export interface NtzsDeposit {
  id: string;
  status: string;
  amountTzs: number;
  txHash?: string | null;
  instructions?: string;
  createdAt?: string;
}

export interface NtzsWithdrawal {
  id: string;
  status: string;
  amountTzs: number;
  txHash?: string | null;
  payoutStatus?: string;
  payoutError?: string | null;
  message?: string;
  createdAt?: string;
}

export interface NtzsTransfer {
  id: string;
  status: string;
  txHash?: string | null;
  amountTzs: number;
}

// ─── Error Class ─────────────────────────────────────────────────────────────

export class NtzsApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "NtzsApiError";
    this.status = status;
    this.body = body;
  }
}

// ─── Client ──────────────────────────────────────────────────────────────────

class NtzsClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: { apiKey: string; baseUrl: string }) {
    if (!config.apiKey) throw new Error("NTZS_API_KEY is required");
    if (!config.baseUrl) throw new Error("NTZS_BASE_URL is required");
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    const response = await fetch(url, init);
    const data = await response.json();
    if (!response.ok) {
      throw new NtzsApiError(
        (data as { error?: string }).error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }
    return data as T;
  }

  // ─── Users ──────────────────────────────────────────────────────────────

  readonly users = {
    create: (params: { externalId: string; email: string; phone?: string }): Promise<NtzsUser> => {
      return this.request<NtzsUser>("POST", "/api/v1/users", params);
    },
    get: (userId: string): Promise<NtzsUserWithBalance> => {
      return this.request<NtzsUserWithBalance>("GET", `/api/v1/users/${userId}`);
    },
    getBalance: async (userId: string): Promise<{ balanceTzs: number; walletAddress: string }> => {
      const u = await this.request<NtzsUserWithBalance>("GET", `/api/v1/users/${userId}`);
      return { balanceTzs: u.balanceTzs, walletAddress: u.walletAddress || "" };
    },
  };

  // ─── Deposits ───────────────────────────────────────────────────────────

  readonly deposits = {
    create: (params: { userId: string; amountTzs: number; phoneNumber: string }): Promise<NtzsDeposit> => {
      return this.request<NtzsDeposit>("POST", "/api/v1/deposits", params);
    },
    get: (depositId: string): Promise<NtzsDeposit> => {
      return this.request<NtzsDeposit>("GET", `/api/v1/deposits/${depositId}`);
    },
  };

  // ─── Withdrawals ────────────────────────────────────────────────────────

  readonly withdrawals = {
    create: (params: { userId: string; amountTzs: number; phoneNumber: string }): Promise<NtzsWithdrawal> => {
      return this.request<NtzsWithdrawal>("POST", "/api/v1/withdrawals", params);
    },
    get: (withdrawalId: string): Promise<NtzsWithdrawal> => {
      return this.request<NtzsWithdrawal>("GET", `/api/v1/withdrawals/${withdrawalId}`);
    },
  };

  // ─── Transfers ──────────────────────────────────────────────────────────

  readonly transfers = {
    create: (params: {
      fromUserId: string;
      toUserId: string;
      amountTzs: number;
      metadata?: Record<string, unknown>;
    }): Promise<NtzsTransfer> => {
      return this.request<NtzsTransfer>("POST", "/api/v1/transfers", params);
    },
  };
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let _client: NtzsClient | null = null;

export function getNtzsClient(): NtzsClient {
  if (!_client) {
    _client = new NtzsClient({
      apiKey: process.env.NTZS_API_KEY || "",
      baseUrl: process.env.NTZS_BASE_URL || "http://localhost:3000",
    });
  }
  return _client;
}

export { NtzsClient };
