import { Session, WalletState } from '../types';

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

export interface AuthChallenge {
  challengeId: string;
  message: string;
  expiresAt: string;
  network: string;
}

export interface AuthVerifyResponse {
  token: string;
  expiresAt: string;
  wallet: WalletState;
}

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'fiberpass:auth-token';

function readAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

function writeAuthToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearAuthToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth = true, ...requestOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(requestOptions.headers).entries())
  };

  const token = readAuthToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }
    const message = data?.error?.message ?? `FiberPass API request failed with ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const fiberPassApi = {
  getAuthToken: readAuthToken,
  setAuthToken: writeAuthToken,
  clearAuthToken,

  createAuthChallenge: (address: string) =>
    request<AuthChallenge>('/auth/challenge', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ address })
    }),

  verifyAuth: (payload: { challengeId: string; address: string; signature: string }) =>
    request<AuthVerifyResponse>('/auth/verify', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(payload)
    }),

  getCurrentWallet: () => request<{ wallet: WalletState }>('/auth/me'),

  logout: () =>
    request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({})
    }).finally(clearAuthToken),

  getSessions: () => request<SessionsOverview>('/sessions'),

  createSession: (payload: CreateSessionPayload) =>
    request<SessionsOverview>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  topUpSession: (id: string, amount = 1) =>
    request<SessionsOverview>(`/sessions/${encodeURIComponent(id)}/top-up`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    }),

  togglePauseSession: (id: string) =>
    request<SessionsOverview>(`/sessions/${encodeURIComponent(id)}/toggle-pause`, {
      method: 'POST',
      body: JSON.stringify({})
    }),

  revokeSession: (id: string) =>
    request<SessionsOverview>(`/sessions/${encodeURIComponent(id)}/revoke`, {
      method: 'POST',
      body: JSON.stringify({})
    }),

  openSessionEvents: (onOverview: (overview: SessionsOverview) => void, onError: () => void) => {
    const token = readAuthToken();
    if (!token) {
      throw new Error('Connect with JoyID before opening live updates.');
    }

    const source = new EventSource(`${API_URL}/events?token=${encodeURIComponent(token)}`);
    source.addEventListener('overview', (event) => {
      onOverview(JSON.parse((event as MessageEvent).data) as SessionsOverview);
    });
    source.onerror = onError;
    return source;
  }
};
