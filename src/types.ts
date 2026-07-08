/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TransactionLog {
  id: string;
  type: string;
  timestamp: string;
  amount: number;
  amountMinor?: number;
}

export interface ChargeAttempt {
  id: string;
  sessionId: string;
  appId?: string;
  apiKeyId?: string;
  amount: number;
  amountMinor?: number;
  currency: string;
  type: string;
  status: 'pending' | 'succeeded' | 'failed';
  failureCode?: string;
  failureMessage?: string;
  resultingSpent?: number;
  resultingSpentMinor?: number;
  remainingBalance?: number;
  remainingBalanceMinor?: number;
  provider?: string;
  network?: string;
  proofId?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  serviceAddress: string;
  appId?: string;
  appUrl?: string;
  appTrustLevel?: string;
  appPermissions?: string[];
  chargePolicy?: string;
  expiryAt?: string;
  platformFeeEstimate?: number;
  platformFeeEstimateMinor?: number;
  networkFeeEstimate?: number;
  networkFeeEstimateMinor?: number;
  spent: number;
  spentMinor?: number;
  limit: number;
  limitMinor?: number;
  remainingBalance?: number;
  remainingBalanceMinor?: number;
  currency: string;
  duration: string;
  status: 'active' | 'paused' | 'settled' | 'revoked' | 'expired';
  iconType: 'cloud' | 'code' | 'database' | 'cpu' | 'ai' | 'video' | 'rpc';
  createdAt: string;
  expiryTime: string;
  fiberProvider?: string;
  fiberNetwork?: string;
  fiberSessionId?: string;
  fiberStatus?: string;
  fiberProofId?: string;
  lastChargeProofId?: string;
  autoMicroCharges: boolean;
  singleUse: boolean;
  logs: TransactionLog[];
  chargeAttempts: ChargeAttempt[];
}

export interface WalletState {
  connected: boolean;
  address: string;
  balance: number;
  balanceMinor?: number;
  currency: string;
}
