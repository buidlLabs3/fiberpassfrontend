import { type SessionsOverview } from './sessionsApi';
import { apiRequest } from './apiClient';

export type WalletFundingStatus = 'pending' | 'confirmed';

export interface WalletFundingConfig {
  currency: string;
  network: string;
  depositMode?: 'vault' | 'treasury';
  depositAddress: string;
  configured: boolean;
  vault?: {
    configured: boolean;
    address?: string;
    scriptHash?: string;
    ownerLockHashSource?: string;
  };
}

export interface WalletFundingRequest {
  id: string;
  walletAddress: string;
  amount: number;
  amountMinor: number;
  currency: string;
  network: string;
  depositMode?: string;
  depositAddress: string;
  vaultScriptHash?: string;
  vaultScriptArgs?: string;
  vaultOwnerLockHash?: string;
  vaultOwnerLockHashSource?: string;
  vaultAccountIdHash?: string;
  memo: string;
  proofId?: string;
  status: WalletFundingStatus;
  createdAt: string;
  confirmedAt?: string;
}

export interface WalletFundingOverview {
  config: WalletFundingConfig;
  requests: WalletFundingRequest[];
}

export const walletApi = {
  getWalletFunding: () => apiRequest<WalletFundingOverview>('/wallet/funding'),

  createWalletFundingRequest: (payload: { amount: number }) =>
    apiRequest<WalletFundingRequest>('/wallet/funding', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  confirmWalletFundingRequest: (fundingId: string, payload: { proofId: string }) =>
    apiRequest<SessionsOverview>('/wallet/funding/' + encodeURIComponent(fundingId) + '/confirm', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
