import { apiRequest } from './apiClient';

export interface ApiMeta {
  service: string;
  mode: 'product';
  fiber: {
    provider: 'rpc';
    network: string;
    rpcConfigured: boolean;
  };
}

export const settingsApi = {
  getMeta: () => apiRequest<ApiMeta>('/meta', { auth: false })
};
