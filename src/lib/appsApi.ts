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
  proofType?: string;
  executionLayer?: string;
  reserveStatus?: string;
  idempotencyKey?: string;
  serviceReference?: string;
  paymentRequestHash?: string;
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
  chargeAttemptId?: string;
  paymentJobId?: string;
  dueAt?: string;
  queuedAt?: string;
  processingAt?: string;
  paidAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  lastFailureCode?: string;
  lastFailureMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationPaymentJob {
  id: string;
  appId: string;
  sessionId: string;
  invoiceId: string;
  recipientId: string;
  batchId?: string;
  amount: number;
  amountMinor: number;
  currency: string;
  status: 'queued' | 'locked' | 'processing' | 'succeeded' | 'retrying' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  runAfter: string;
  lockedAt?: string;
  lockedBy?: string;
  startedAt?: string;
  succeededAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  lastFailureCode?: string;
  lastFailureMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  appId: string;
  eventType: string;
  targetType: string;
  targetId: string;
  status: 'queued' | 'delivering' | 'succeeded' | 'retrying' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  runAfter: string;
  deliveredAt?: string;
  failedAt?: string;
  responseStatus?: number;
  lastFailureCode?: string;
  lastFailureMessage?: string;
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
  queuedAt?: string;
  processingAt?: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  lastFailureCode?: string;
  lastFailureMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  invoices: AutomationInvoice[];
}

export interface CreateAutomationRecipientPayload {
  name: string;
  serviceAddress: string;
  externalId?: string;
  invoiceEndpoint?: string;
  metadata?: Record<string, unknown>;
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
  webhookUrl?: string;
  webhookConfigured: boolean;
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

  createRecipient: (appId: string, payload: CreateAutomationRecipientPayload) =>
    apiRequest<AutomationRecipient>('/apps/' + encodeURIComponent(appId) + '/recipients', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  configureWebhook: (appId: string, payload: { webhookUrl?: string; signingSecret?: string }) =>
    apiRequest<DeveloperApp>('/apps/' + encodeURIComponent(appId) + '/webhook', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getWebhookDeliveries: (appId: string) =>
    apiRequest<{ deliveries: WebhookDelivery[] }>('/apps/' + encodeURIComponent(appId) + '/webhook-deliveries'),

  getInvoices: (appId: string, sessionId?: string) => {
    const query = sessionId ? '?sessionId=' + encodeURIComponent(sessionId) : '';
    return apiRequest<{ invoices: AutomationInvoice[] }>('/apps/' + encodeURIComponent(appId) + '/invoices' + query);
  },

  getInvoiceBatches: (appId: string, sessionId?: string) => {
    const query = sessionId ? '?sessionId=' + encodeURIComponent(sessionId) : '';
    return apiRequest<{ batches: AutomationPaymentBatch[] }>('/apps/' + encodeURIComponent(appId) + '/invoice-batches' + query);
  },

  getPaymentJobs: (appId: string, sessionId?: string) => {
    const query = sessionId ? '?sessionId=' + encodeURIComponent(sessionId) : '';
    return apiRequest<{ jobs: AutomationPaymentJob[] }>('/apps/' + encodeURIComponent(appId) + '/payment-jobs' + query);
  },

  queueInvoice: (appId: string, invoiceId: string) =>
    apiRequest<AutomationInvoice>('/apps/' + encodeURIComponent(appId) + '/invoices/' + encodeURIComponent(invoiceId) + '/queue', {
      method: 'POST',
      body: JSON.stringify({})
    }),

  queueInvoiceBatch: (appId: string, batchId: string) =>
    apiRequest<AutomationPaymentBatch>('/apps/' + encodeURIComponent(appId) + '/invoice-batches/' + encodeURIComponent(batchId) + '/queue', {
      method: 'POST',
      body: JSON.stringify({})
    }),

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
