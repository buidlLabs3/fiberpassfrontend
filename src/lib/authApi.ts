import { type WalletState } from '../types';
import { apiRequest } from './apiClient';

export interface AuthChallenge {
  challengeId: string;
  message: string;
  expiresAt: string;
  network: string;
}

export interface AuthVerifyPayload {
  challengeId: string;
  address: string;
  signature: string;
}

export interface AuthVerifyResponse {
  token: string;
  expiresAt: string;
  wallet: WalletState;
}

export const authApi = {
  createAuthChallenge: (address: string) =>
    apiRequest<AuthChallenge>('/auth/challenge', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ address })
    }),

  verifyAuth: (payload: AuthVerifyPayload) =>
    apiRequest<AuthVerifyResponse>('/auth/verify', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(payload)
    }),

  getCurrentWallet: () => apiRequest<{ wallet: WalletState }>('/auth/me'),

  logout: () =>
    apiRequest<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({})
    })
};
