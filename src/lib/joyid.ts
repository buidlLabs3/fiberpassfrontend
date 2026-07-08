import { connect, disconnect, getConnectedAddress, initConfig, signMessage, type EvmConfig } from '@joyid/evm';

let initialized = false;

function getJoyIdConfig(): EvmConfig {
  const chainId = Number(import.meta.env.VITE_FIBER_CHAIN_ID);
  const networkName = import.meta.env.VITE_FIBER_NETWORK_NAME ?? 'Fiber Network';
  const joyidAppURL = import.meta.env.VITE_JOYID_APP_URL;
  const joyidServerURL = import.meta.env.VITE_JOYID_SERVER_URL;

  return {
    name: 'FiberPass',
    ...(joyidAppURL ? { joyidAppURL } : {}),
    ...(joyidServerURL ? { joyidServerURL } : {}),
    ...(Number.isFinite(chainId) && chainId > 0
      ? {
          network: {
            name: networkName,
            chainId
          }
        }
      : {})
  };
}

function ensureJoyIdConfig(): EvmConfig {
  const config = getJoyIdConfig();
  if (!initialized) {
    initConfig(config);
    initialized = true;
  }
  return config;
}

export async function connectJoyIdWallet(): Promise<string> {
  const config = ensureJoyIdConfig();
  const connectedAddress = getConnectedAddress();
  if (connectedAddress) {
    return connectedAddress;
  }
  return connect(config);
}

export async function signJoyIdMessage(message: string, address: string): Promise<string> {
  return signMessage(message, address, ensureJoyIdConfig());
}

export function getStoredJoyIdAddress(): string | null {
  ensureJoyIdConfig();
  return getConnectedAddress();
}

export function disconnectJoyIdWallet(): void {
  disconnect();
}
