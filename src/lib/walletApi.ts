import { type SessionsOverview } from './sessionsApi';
import { apiRequest } from './apiClient';

export type WalletFundingStatus = 'pending' | 'confirmed';

export interface WalletFundingConfig {
  currency: string;
  network: string;
  depositAddress: string;
  configured: boolean;
}

export interface WalletFundingRequest {
  id: string;
  walletAddress: string;
  amount: number;
  amountMinor: number;
  currency: string;
  network: string;
  depositAddress: string;
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
