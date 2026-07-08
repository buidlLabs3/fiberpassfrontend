import { type Session, type WalletState } from '../types';
import { apiRequest } from './apiClient';

export interface SessionsOverview {
  wallet: WalletState;
  activeSessions: Session[];
  historySessions: Session[];
}

export interface VerifiedApp {
  id: string;
  name: string;
  serviceAddress: string;
  url: string;
  category: string;
  trustLevel: 'verified' | 'reviewed' | 'manual';
  description: string;
  defaultCharge: number;
  defaultChargeMinor?: number;
  chargePolicy: string;
  iconType: Session['iconType'];
  permissions: string[];
}

export interface CreateSessionPolicy {
  limits: {
    min: number;
    minMinor?: number;
    max: number;
    maxMinor?: number;
    currency: string;
  };
  expiry: {
    minMinutes: number;
    maxDays: number;
  };
  fees: {
    platformFeeBps: number;
    minPlatformFee: number;
    minPlatformFeeMinor?: number;
    estimatedNetworkFee: number;
    estimatedNetworkFeeMinor?: number;
  };
  fiber?: {
    provider: 'rpc';
    network: string;
  };
  verifiedApps: VerifiedApp[];
}

export interface CreateSessionPayload {
  name: string;
  serviceAddress: string;
  appId?: string;
  appUrl?: string;
  appTrustLevel?: string;
  appPermissions?: string[];
  chargePolicy?: string;
  expiryAt?: string;
  platformFeeEstimate?: number;
  networkFeeEstimate?: number;
  limit: number;
  currency: string;
  duration: string;
  expiryTime: string;
  autoMicroCharges: boolean;
  singleUse: boolean;
  iconType: Session['iconType'];
}

export const sessionsApi = {
  getSessions: () => apiRequest<SessionsOverview>('/sessions'),

  getCreatePolicy: () => apiRequest<CreateSessionPolicy>('/sessions/create-policy'),

  createSession: (payload: CreateSessionPayload) =>
    apiRequest<SessionsOverview>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  topUpSession: (id: string, amount = 1) =>
    apiRequest<SessionsOverview>('/sessions/' + encodeURIComponent(id) + '/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount })
    }),

  togglePauseSession: (id: string) =>
    apiRequest<SessionsOverview>('/sessions/' + encodeURIComponent(id) + '/toggle-pause', {
      method: 'POST',
      body: JSON.stringify({})
    }),

  revokeSession: (id: string) =>
    apiRequest<SessionsOverview>('/sessions/' + encodeURIComponent(id) + '/revoke', {
      method: 'POST',
      body: JSON.stringify({})
    }),

  settleSession: (id: string) =>
    apiRequest<SessionsOverview>('/sessions/' + encodeURIComponent(id) + '/settle', {
      method: 'POST',
      body: JSON.stringify({})
    }),

  closeSession: (id: string) =>
    apiRequest<SessionsOverview>('/sessions/' + encodeURIComponent(id) + '/close', {
      method: 'POST',
      body: JSON.stringify({})
    })
};
