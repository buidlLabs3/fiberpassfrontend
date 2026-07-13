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

export interface FiberNodeAlert {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action: string;
}

export interface FiberNodeReadiness {
  configured: boolean;
  reachable: boolean;
  provider: string;
  network: string;
  rpcUrl: string;
  apiKeyConfigured: boolean;
  peerIdConfigured: boolean;
  checkedAt: string;
  latencyMs?: number;
  readiness: 'ready' | 'blocked' | 'unknown';
  paymentExecution: {
    status: 'ready' | 'blocked' | 'unknown';
    canSendPayments: boolean;
    reason: string;
  };
  operator: {
    liquiditySource: 'fiber-node-operator';
    minPeers: number;
    minActiveChannels: number;
    minOutboundCapacityMinor: number;
    minOutboundCapacity: number;
  };
  alerts: FiberNodeAlert[];
  peers: {
    status: 'available' | 'unavailable' | 'error';
    method: string;
    connectedCount?: number;
    error?: string;
  };
  channels: {
    status: 'available' | 'unavailable' | 'error';
    method: string;
    count?: number;
    activeCount?: number;
    totalOutboundCapacity?: number;
    minOutboundCapacity?: number;
    error?: string;
  };
  node?: {
    peerId?: string;
    version?: string;
    chain?: string;
    addresses?: string[];
    fundingAddress?: string;
    rawKeys: string[];
  };
  error?: string;
}

export interface FiberChannelStrategy {
  network: string;
  provider: string;
  readyForLiveTest: boolean;
  configuredPrimaryPeer?: string;
  targetPeers: Array<{ peerId: string; source: 'env' | 'primary'; primary: boolean }>;
  testChannelAmount: number;
  testChannelAmountMinor: number;
  readiness: FiberNodeReadiness;
  nextActions: string[];
}

export const settingsApi = {
  getMeta: () => apiRequest<ApiMeta>('/meta', { auth: false }),
  getFiberReadiness: () => apiRequest<FiberNodeReadiness>('/fiber/node/readiness', { auth: false }),
  getFiberChannelStrategy: () => apiRequest<FiberChannelStrategy>('/fiber/channels/strategy', { auth: false })
};
