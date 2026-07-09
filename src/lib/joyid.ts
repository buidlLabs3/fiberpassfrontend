import { connect, initConfig, signChallenge, type CkbDappConfig, type SignChallengeResponseData } from '@joyid/ckb';

export type JoyIdSignaturePayload = SignChallengeResponseData;

const JOYID_ADDRESS_KEY = 'fiberpass:joyid-ckb-address';
let initialized = false;

function getJoyIdConfig(): CkbDappConfig {
  const joyidAppURL = import.meta.env.VITE_JOYID_APP_URL;
  const joyidServerURL = import.meta.env.VITE_JOYID_SERVER_URL;
  const rpcURL = import.meta.env.VITE_CKB_RPC_URL;
  const configuredNetwork = (import.meta.env.VITE_FIBER_NETWORK_NAME ?? import.meta.env.VITE_FIBER_NETWORK ?? 'testnet').toLowerCase();
  const network = configuredNetwork.includes('main') ? 'mainnet' : 'testnet';

  return {
    name: 'FiberPass',
    network,
    ...(rpcURL ? { rpcURL } : {}),
    ...(joyidAppURL ? { joyidAppURL } : {}),
    ...(joyidServerURL ? { joyidServerURL } : {})
  };
}

function ensureJoyIdConfig(): CkbDappConfig {
  const config = getJoyIdConfig();
  if (!initialized) {
    initConfig(config);
    initialized = true;
  }
  return config;
}

function storage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export async function connectJoyIdWallet(): Promise<string> {
  const connection = await connect(ensureJoyIdConfig());
  storage()?.setItem(JOYID_ADDRESS_KEY, connection.address);
  return connection.address;
}

export async function signJoyIdMessage(message: string, address: string): Promise<JoyIdSignaturePayload> {
  return signChallenge(message, address, ensureJoyIdConfig());
}

export function getStoredJoyIdAddress(): string | null {
  ensureJoyIdConfig();
  return storage()?.getItem(JOYID_ADDRESS_KEY) ?? null;
}

export function disconnectJoyIdWallet(): void {
  storage()?.removeItem(JOYID_ADDRESS_KEY);
}
