import { apiRequest } from './apiClient';

export interface ApiMeta {
  service: string;
  mode: 'demo' | 'product';
  demoMode: boolean;
  fiber: {
    provider: 'mock' | 'rpc';
    network: string;
    rpcConfigured: boolean;
  };
}

export const settingsApi = {
  getMeta: () => apiRequest<ApiMeta>('/meta', { auth: false })
};
