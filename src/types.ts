/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PaymentPurpose = 'app_session' | 'subscription' | 'scheduled_release' | 'recurring_release';
export type ReleaseCadence = 'none' | 'on_demand' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecipientWallet {
  name: string;
  address?: string;
  email?: string;
  recipientTimeZone?: string;
  amount?: number;
  amountMinor?: number;
  fiberInvoice?: string;
  status?: 'awaiting_details' | 'pending' | 'processing' | 'paid' | 'failed';
  chargeAttemptId?: string;
  paidAt?: string;
  lastAttemptAt?: string;
  lastFailureCode?: string;
  lastFailureMessage?: string;
  inviteStatus?: 'not_required' | 'pending' | 'sent' | 'claimed' | 'expired' | 'send_failed';
  inviteTokenExpiresAt?: string;
  inviteSentAt?: string;
  inviteClaimedAt?: string;
  inviteLastFailure?: string;
  payoutProofId?: string;
  payoutExplorerUrl?: string;
  payoutNotifiedAt?: string;
  payoutNotificationStatus?: 'not_required' | 'pending' | 'sent' | 'failed';
  payoutNotificationFailure?: string;
}

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
  proofType?: string;
  executionLayer?: string;
  reserveStatus?: string;
  idempotencyKey?: string;
  serviceReference?: string;
  paymentRequestHash?: string;
  explorerUrl?: string;
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
  paymentPurpose?: PaymentPurpose;
  recipientName?: string;
  recipientAddress?: string;
  recipientWallets?: RecipientWallet[];
  paymentReference?: string;
  releaseCadence?: ReleaseCadence;
  nextReleaseAt?: string;
  maxChargeAmount?: number;
  maxChargeAmountMinor?: number;
  conditionSummary?: string;
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
  authProvider?: 'joyid';
  addressType?: 'ckb';
  balance: number;
  balanceMinor?: number;
  currency: string;
}

export interface RecipientClaim {
  tokenValid: boolean;
  status: 'pending' | 'claimed' | 'expired' | 'not_found';
  recipientName?: string;
  recipientEmail?: string;
  amount?: number;
  amountMinor?: number;
  currency?: string;
  payerName?: string;
  passName?: string;
  expectedPaymentAt?: string;
  expiresAt?: string;
  reference?: string;
  conditionSummary?: string;
  recipientTimeZone?: string;
}
