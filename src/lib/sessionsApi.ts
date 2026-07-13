import { type PaymentPurpose, type RecipientClaim, type RecipientWallet, type ReleaseCadence, type Session, type WalletState } from '../types';
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
  paymentPurpose?: PaymentPurpose;
  recipientName?: string;
  recipientAddress?: string;
  recipientWallets?: RecipientWallet[];
  paymentReference?: string;
  releaseCadence?: ReleaseCadence;
  nextReleaseAt?: string;
  maxChargeAmount?: number;
  conditionSummary?: string;
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

  syncDuePayouts: () =>
    apiRequest<SessionsOverview>('/sessions/payouts/sync', {
      method: 'POST',
      body: JSON.stringify({})
    }),

  topUpSession: (id: string, amount = 1) =>
    apiRequest<SessionsOverview>('/sessions/' + encodeURIComponent(id) + '/top-up', {
      method: 'POST',
      body: JSON.stringify({ amount })
    }),

  resendRecipientInvites: (id: string) =>
    apiRequest<SessionsOverview>('/sessions/' + encodeURIComponent(id) + '/recipient-invites/resend', {
      method: 'POST',
      body: JSON.stringify({})
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
    }),

  getRecipientClaim: (token: string) =>
    apiRequest<RecipientClaim>('/recipient-claims/' + encodeURIComponent(token), { auth: false }),

  claimRecipientWallet: (token: string, destination: { address?: string; fiberInvoice?: string }, timeZone?: string) =>
    apiRequest<RecipientClaim>('/recipient-claims/' + encodeURIComponent(token), {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ ...destination, timeZone })
    })
};
