import { apiRequest } from './apiClient';

export interface AppChargeAttempt {
  id: string;
  sessionId: string;
  appId?: string;
  apiKeyId?: string;
  amount: number;
  amountMinor?: number;
  currency: string;
  type: string;
  status: 'pending' | 'succeeded' | 'failed';
  failureCode?: string;
  failureMessage?: string;
  resultingSpent?: number;
  resultingSpentMinor?: number;
  remainingBalance?: number;
  remainingBalanceMinor?: number;
  provider?: string;
  network?: string;
  proofId?: string;
  createdAt: string;
}

export type AppApiKeyScope =
  | 'charges:create'
  | 'recipients:read'
  | 'recipients:write'
  | 'invoices:create'
  | 'payments:queue'
  | 'payments:charge';

export interface AppApiKey {
  id: string;
  appId: string;
  label: string;
  keyPrefix: string;
  status: 'active' | 'revoked';
  scopes: AppApiKeyScope[];
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreatedAppApiKey extends AppApiKey {
  secret: string;
}


export interface AutomationRecipient {
  id: string;
  appId: string;
  name: string;
  serviceAddress: string;
  addressType: string;
  externalId?: string;
  invoiceEndpoint?: string;
  status: 'active' | 'disabled';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  disabledAt?: string;
}

export interface AutomationInvoice {
  id: string;
  appId: string;
  sessionId: string;
  recipientId: string;
  batchId?: string;
  amount: number;
  amountMinor: number;
  currency: string;
  status: 'draft' | 'queued' | 'processing' | 'paid' | 'failed' | 'cancelled';
  type: string;
  description: string;
  memo: string;
  externalReference?: string;
  idempotencyKey?: string;
  fiberInvoiceHash?: string;
  hasFiberInvoice: boolean;
  dueAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationPaymentBatch {
  id: string;
  appId: string;
  sessionId: string;
  status: 'draft' | 'queued' | 'processing' | 'partial' | 'completed' | 'failed' | 'cancelled';
  description: string;
  externalReference?: string;
  idempotencyKey?: string;
  totalAmount: number;
  totalAmountMinor: number;
  currency: string;
  invoiceCount: number;
  paidCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  invoices: AutomationInvoice[];
}

export interface CreateAutomationInvoicePayload {
  sessionId: string;
  recipientId: string;
  amount: number;
  type?: string;
  description?: string;
  memo?: string;
  externalReference?: string;
  idempotencyKey?: string;
  fiberInvoice?: string;
  dueAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAutomationInvoiceBatchPayload {
  sessionId: string;
  description?: string;
  externalReference?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  invoices: Array<Omit<CreateAutomationInvoicePayload, 'sessionId'>>;
}

export interface DeveloperApp {
  id: string;
  name: string;
  serviceAddress: string;
  url: string;
  category: string;
  description: string;
  status: 'pending_verification' | 'active' | 'suspended' | 'revoked';
  createdAt: string;
  updatedAt: string;
  apiKeys: AppApiKey[];
  chargeAttempts: AppChargeAttempt[];
}

export interface CreateDeveloperAppPayload {
  name: string;
  serviceAddress: string;
  url?: string;
  category: string;
  description?: string;
}

export const appsApi = {
  getApps: () => apiRequest<{ apps: DeveloperApp[] }>('/apps'),

  createApp: (payload: CreateDeveloperAppPayload) =>
    apiRequest<DeveloperApp>('/apps', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  createApiKey: (appId: string, label: string, scopes?: AppApiKeyScope[]) =>
    apiRequest<CreatedAppApiKey>('/apps/' + encodeURIComponent(appId) + '/api-keys', {
      method: 'POST',
      body: JSON.stringify({ label, ...(scopes ? { scopes } : {}) })
    }),

  revokeApiKey: (appId: string, keyId: string) =>
    apiRequest<AppApiKey>('/apps/' + encodeURIComponent(appId) + '/api-keys/' + encodeURIComponent(keyId) + '/revoke', {
      method: 'POST',
      body: JSON.stringify({})
    }),

  getChargeAttempts: (appId: string) =>
    apiRequest<{ chargeAttempts: AppChargeAttempt[] }>('/apps/' + encodeURIComponent(appId) + '/charges'),

  getRecipients: (appId: string) =>
    apiRequest<{ recipients: AutomationRecipient[] }>('/apps/' + encodeURIComponent(appId) + '/recipients'),

  getInvoices: (appId: string, sessionId?: string) => {
    const query = sessionId ? '?sessionId=' + encodeURIComponent(sessionId) : '';
    return apiRequest<{ invoices: AutomationInvoice[] }>('/apps/' + encodeURIComponent(appId) + '/invoices' + query);
  },

  createInvoice: (appId: string, payload: CreateAutomationInvoicePayload) =>
    apiRequest<AutomationInvoice>('/apps/' + encodeURIComponent(appId) + '/invoices', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  createInvoiceBatch: (appId: string, payload: CreateAutomationInvoiceBatchPayload) =>
    apiRequest<AutomationPaymentBatch>('/apps/' + encodeURIComponent(appId) + '/invoice-batches', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
