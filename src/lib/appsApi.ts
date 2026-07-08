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

export interface AppApiKey {
  id: string;
  appId: string;
  label: string;
  keyPrefix: string;
  status: 'active' | 'revoked';
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreatedAppApiKey extends AppApiKey {
  secret: string;
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

  createApiKey: (appId: string, label: string) =>
    apiRequest<CreatedAppApiKey>('/apps/' + encodeURIComponent(appId) + '/api-keys', {
      method: 'POST',
      body: JSON.stringify({ label })
    }),

  revokeApiKey: (appId: string, keyId: string) =>
    apiRequest<AppApiKey>('/apps/' + encodeURIComponent(appId) + '/api-keys/' + encodeURIComponent(keyId) + '/revoke', {
      method: 'POST',
      body: JSON.stringify({})
    }),

  getChargeAttempts: (appId: string) =>
    apiRequest<{ chargeAttempts: AppChargeAttempt[] }>('/apps/' + encodeURIComponent(appId) + '/charges')
};
