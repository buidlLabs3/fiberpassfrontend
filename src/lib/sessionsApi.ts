import { type Session, type WalletState } from '../types';
import { apiRequest } from './apiClient';

export interface SessionsOverview {
  wallet: WalletState;
  activeSessions: Session[];
  historySessions: Session[];
}

export interface CreateSessionPayload {
  name: string;
  serviceAddress: string;
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
    })
};
