/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Bolt,
  Plus,
  Cloud,
  Code,
  Database,
  Cpu,
  Video,
  Activity,
  MessageSquare,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  CalendarClock,
  ShieldCheck,
  X,
  Wallet,
  ExternalLink
} from 'lucide-react';
import { Session } from '../types';
import { type WalletChainState } from '../lib/walletApi';
import { formatCurrencyAmount } from '../lib/currency';

function sessionPurposeLabel(session: Session): string {
  if (session.paymentPurpose === 'subscription') return 'Subscription';
  if (session.paymentPurpose === 'scheduled_release') return 'Scheduled invoice';
  if (session.paymentPurpose === 'recurring_release') return 'Recurring payout';
  return session.singleUse ? 'Single-use app pass' : 'App/API session';
}

function sessionScheduleLabel(session: Session): string {
  if (session.nextReleaseAt) return 'Next ' + new Date(session.nextReleaseAt).toLocaleString();
  return session.expiryAt ? new Date(session.expiryAt).toLocaleString() : session.expiryTime;
}

function formatDateTime(value?: string): string {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function shortValue(value?: string): string {
  if (!value) return 'Not set';
  if (value.length <= 18) return value;
  return value.slice(0, 10) + '...' + value.slice(-8);
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function recipientWalletsForSession(session: Session) {
  const wallets = session.recipientWallets ?? [];
  if (wallets.length > 0) return wallets;
  if (!session.recipientAddress) return [];
  return [{ name: session.recipientName ?? 'Recipient', address: session.recipientAddress }];
}

function recipientStatusClass(status?: string): string {
  if (status === 'paid') return 'border-secondary/30 bg-secondary/10 text-secondary';
  if (status === 'processing' || status === 'awaiting_details') return 'border-primary/30 bg-primary/10 text-primary';
  if (status === 'failed') return 'border-error/30 bg-error/10 text-error';
  return 'border-outline-variant bg-surface-container-high text-on-surface-variant';
}

function DetailRow({ label, value, mono = false }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className={(mono ? 'font-mono ' : '') + 'text-sm text-on-surface break-words'}>{value ?? 'Not set'}</span>
    </div>
  );
}

function ProofLink({ proofId, explorerUrl }: { proofId?: string; explorerUrl?: string }) {
  if (!proofId) return <>Not set</>;
  if (!explorerUrl) return <>{shortValue(proofId)}</>;
  return (
    <a href={explorerUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex max-w-full items-center gap-1 text-primary hover:text-secondary break-all">
      <span>{shortValue(proofId)}</span>
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}

function chainStatusLabel(status?: string): string {
  if (status === 'ok') return 'Live';
  if (status === 'not_configured') return 'Not configured';
  if (status === 'unavailable') return 'Unavailable';
  return 'Pending';
}

export function SessionDetailModal({ session, onClose, onResendRecipientInvites }: { session: Session; onClose: () => void; onResendRecipientInvites: (id: string) => void }) {
  const wallets = recipientWalletsForSession(session);
  const remainingBalance = session.remainingBalance ?? Math.max(0, session.limit - session.spent);
  const recentAttempts = session.chargeAttempts.slice(0, 8);
  const recentLogs = session.logs.slice(0, 8);
  const hasResendableRecipientInvites = wallets.some((wallet) => Boolean(wallet.email && !wallet.address && wallet.status !== 'paid' && wallet.inviteStatus !== 'claimed'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant/60 bg-surface-container/60 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">FiberPass Details</p>
            <h3 className="mt-1 text-xl font-bold text-on-surface truncate">{session.name}</h3>
            <p className="mt-1 font-mono text-[11px] text-on-surface-variant break-all">{session.serviceAddress}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
            title="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-5 space-y-5">
          <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-outline-variant bg-surface-container/70 p-4">
              <DetailRow label="Type" value={sessionPurposeLabel(session)} />
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container/70 p-4">
              <DetailRow label="Status" value={session.status} />
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container/70 p-4">
              <DetailRow label="Spent" value={formatCurrencyAmount(session.spent, session.currency)} mono />
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container/70 p-4">
              <DetailRow label="Remaining" value={formatCurrencyAmount(remainingBalance, session.currency)} mono />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CalendarClock className="h-4 w-4" />
                <h4 className="text-sm font-bold text-on-surface">Schedule And Policy</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow label="Policy" value={session.chargePolicy ?? sessionPurposeLabel(session)} />
                <DetailRow label="Reference" value={session.paymentReference} />
                <DetailRow label="Condition" value={session.conditionSummary} />
                <DetailRow label="Cadence" value={session.releaseCadence ?? 'none'} />
                <DetailRow label="Next Release" value={formatDateTime(session.nextReleaseAt)} />
                <DetailRow label="Expiry" value={formatDateTime(session.expiryAt ?? session.expiryTime)} />
                <DetailRow label="Per-Payment Cap" value={session.maxChargeAmount == null ? 'Not set' : formatCurrencyAmount(session.maxChargeAmount, session.currency)} mono />
                <DetailRow label="Single Use" value={yesNo(session.singleUse)} />
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 space-y-4">
              <div className="flex items-center gap-2 text-secondary">
                <ShieldCheck className="h-4 w-4" />
                <h4 className="text-sm font-bold text-on-surface">Authorization</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow label="App Id" value={session.appId ?? 'manual'} mono />
                <DetailRow label="Trust" value={session.appTrustLevel ?? 'manual'} />
                <DetailRow label="Authorized Address" value={session.serviceAddress} mono />
                <DetailRow label="App URL" value={session.appUrl} />
                <DetailRow label="Auto Charges" value={yesNo(session.autoMicroCharges)} />
                <DetailRow label="Created" value={formatDateTime(session.createdAt)} />
              </div>
              {session.appPermissions && session.appPermissions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {session.appPermissions.map((permission) => (
                    <span key={permission} className="rounded-full border border-outline-variant bg-surface-container-high px-2 py-1 text-[10px] text-on-surface-variant">
                      {permission}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {wallets.length > 0 && (
            <section className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-on-surface">Recipient Wallets</h4>
                <div className="flex items-center gap-2">
                  {hasResendableRecipientInvites && (
                    <button
                      type="button"
                      onClick={() => onResendRecipientInvites(session.id)}
                      className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20"
                    >
                      Resend Invites
                    </button>
                  )}
                  <span className="rounded-full border border-outline-variant bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{wallets.length}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {wallets.map((wallet, index) => (
                  <article key={(wallet.address ?? wallet.email ?? 'recipient') + '-' + index} className="rounded-lg border border-outline-variant/70 bg-surface-container-lowest/50 p-3">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-on-surface">{wallet.name}</span>
                          <span className={'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ' + recipientStatusClass(wallet.status)}>{wallet.status ?? 'pending'}</span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-on-surface-variant break-all">{wallet.address || 'Awaiting wallet details'}</p>
                        {wallet.email && <p className="mt-1 text-[11px] text-on-surface-variant break-all">Email: {wallet.email}</p>}
                        {wallet.inviteStatus && wallet.inviteStatus !== 'not_required' && <p className="mt-1 text-[11px] text-on-surface-variant">Invite: {wallet.inviteStatus}{wallet.inviteTokenExpiresAt ? ' / expires ' + formatDateTime(wallet.inviteTokenExpiresAt) : ''}</p>}
                        {wallet.fiberInvoice && (
                          <div className="mt-2 rounded-md border border-outline-variant/50 bg-surface-container/60 p-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Payment Request</span>
                            <p className="mt-1 font-mono text-[10px] text-outline break-all">{wallet.fiberInvoice}</p>
                          </div>
                        )}
                        {wallet.inviteLastFailure && <p className="mt-2 text-xs text-error">Invite: {wallet.inviteLastFailure}</p>}
                        {wallet.lastFailureMessage && <p className="mt-2 text-xs text-error">{wallet.lastFailureCode}: {wallet.lastFailureMessage}</p>}
                        {wallet.payoutNotificationFailure && <p className="mt-2 text-xs text-error">Receipt email: {wallet.payoutNotificationFailure}</p>}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:min-w-[520px]">
                        <DetailRow label="Amount" value={wallet.amount == null ? 'Not set' : formatCurrencyAmount(wallet.amount, session.currency)} mono />
                        <DetailRow label="Last Attempt" value={formatDateTime(wallet.lastAttemptAt)} />
                        <DetailRow label="Paid At" value={formatDateTime(wallet.paidAt)} />
                        <DetailRow label="Attempt" value={shortValue(wallet.chargeAttemptId)} mono />
                        <DetailRow label="Tx Hash" value={<ProofLink proofId={wallet.payoutProofId} explorerUrl={wallet.payoutExplorerUrl} />} mono />
                        <DetailRow label="Receipt Email" value={wallet.payoutNotificationStatus ?? (wallet.email ? 'pending' : 'not required')} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 space-y-4">
              <h4 className="text-sm font-bold text-on-surface">Fiber State</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow label="Provider" value={session.fiberProvider ?? 'rpc'} />
                <DetailRow label="Network" value={session.fiberNetwork} />
                <DetailRow label="Fiber Status" value={session.fiberStatus ?? 'pending'} />
                <DetailRow label="Fiber Session" value={shortValue(session.fiberSessionId)} mono />
                <DetailRow label="Proof" value={shortValue(session.fiberProofId)} mono />
                <DetailRow label="Last Charge" value={shortValue(session.lastChargeProofId)} mono />
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 space-y-4">
              <h4 className="text-sm font-bold text-on-surface">Fees And Limits</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow label="Limit" value={formatCurrencyAmount(session.limit, session.currency)} mono />
                <DetailRow label="Spent" value={formatCurrencyAmount(session.spent, session.currency)} mono />
                <DetailRow label="Remaining" value={formatCurrencyAmount(remainingBalance, session.currency)} mono />
                <DetailRow label="Platform Fee" value={formatCurrencyAmount(session.platformFeeEstimate ?? 0, session.currency, 8)} mono />
                <DetailRow label="Network Fee" value={formatCurrencyAmount(session.networkFeeEstimate ?? 0, session.currency, 8)} mono />
                <DetailRow label="Currency" value={session.currency} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-on-surface">Recent Charge Attempts</h4>
                <span className="font-mono text-[10px] text-on-surface-variant">{session.chargeAttempts.length}</span>
              </div>
              {recentAttempts.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No charge attempts yet.</p>
              ) : recentAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest/40 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-on-surface truncate">{attempt.type}</span>
                    <span className="font-mono text-on-surface">{formatCurrencyAmount(attempt.amount, attempt.currency, 8)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-on-surface-variant">
                    <span>{attempt.status}</span>
                    <span>{formatDateTime(attempt.createdAt)}</span>
                    {attempt.proofId && <span><ProofLink proofId={attempt.proofId} explorerUrl={attempt.explorerUrl} /></span>}
                    {attempt.failureMessage && <span className="text-error">{attempt.failureCode}: {attempt.failureMessage}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-on-surface">Activity Log</h4>
                <span className="font-mono text-[10px] text-on-surface-variant">{session.logs.length}</span>
              </div>
              {recentLogs.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No activity yet.</p>
              ) : recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest/40 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface truncate">{log.type}</p>
                    <p className="text-[10px] text-on-surface-variant">{log.timestamp}</p>
                  </div>
                  <span className="font-mono text-on-surface">{formatCurrencyAmount(log.amount, session.currency, 8)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

interface DashboardViewProps {
  activeSessions: Session[];
  walletBalance: number;
  walletCurrency: string;
  totalActivePassValue: number;
  walletChain?: WalletChainState | null;
  fundingLoading?: boolean;
  onSyncWalletFunding: () => void;
  isLoading?: boolean;
  pendingSessionAction?: { id: string; action: 'top-up' | 'resend-invites' | 'pause' | 'revoke' | 'close' } | null;
  onTopUpSession: (id: string) => void;
  onResendRecipientInvites: (id: string) => void;
  onTogglePauseSession: (id: string) => void;
  onRevokeSession: (id: string) => void;
  onCloseSession: (id: string) => void;
  onCreateSessionClick: () => void;
  onLoadFundsClick: () => void;
}

export default function DashboardView({
  activeSessions,
  walletBalance,
  walletCurrency,
  totalActivePassValue,
  walletChain = null,
  fundingLoading = false,
  onSyncWalletFunding,
  isLoading = false,
  pendingSessionAction = null,
  onTopUpSession,
  onResendRecipientInvites,
  onTogglePauseSession,
  onRevokeSession,
  onCloseSession,
  onCreateSessionClick,
  onLoadFundsClick
}: DashboardViewProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const selectedSession = useMemo(
    () => activeSessions.find((session) => session.id === selectedSessionId) ?? null,
    [activeSessions, selectedSessionId]
  );

  const openSessionDetails = (id: string) => {
    setSelectedSessionId(id);
  };

  const handleSessionKeyDown = (event: React.KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openSessionDetails(id);
    }
  };

  const vaultBalance = walletChain?.vault;

  const renderSessionIcon = (type: string) => {
    switch (type) {
      case 'cloud':
        return <Cloud className="w-5 h-5 text-primary" />;
      case 'code':
        return <Code className="w-5 h-5 text-primary" />;
      case 'database':
        return <Database className="w-5 h-5 text-primary" />;
      case 'cpu':
        return <Cpu className="w-5 h-5 text-primary" />;
      case 'ai':
        return <MessageSquare className="w-5 h-5 text-primary" />;
      case 'video':
        return <Video className="w-5 h-5 text-primary" />;
      case 'rpc':
        return <Activity className="w-5 h-5 text-primary" />;
      default:
        return <Activity className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-outline-variant/60 pb-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">Dashboard</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1 bg-surface-container-low px-5 py-3 border border-outline-variant rounded-xl shadow-md min-w-[180px]">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">FiberPass Available</span>
              <span className="font-mono text-xl font-semibold text-primary">
                {formatCurrencyAmount(walletBalance, walletCurrency)}
              </span>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onLoadFundsClick}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Load Funds
                </button>
                <button
                  type="button"
                  onClick={onSyncWalletFunding}
                  disabled={fundingLoading}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={(fundingLoading ? 'animate-spin ' : '') + 'w-3.5 h-3.5'} />
                  Sync
                </button>
              </div>
            </div>


            <div className="flex flex-col gap-1 bg-surface-container-low px-5 py-3 border border-outline-variant rounded-xl shadow-md min-w-[180px]">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Vault Balance</span>
              <span className="font-mono text-xl font-semibold text-secondary">
                {formatCurrencyAmount(vaultBalance?.amount ?? 0, vaultBalance?.currency ?? walletCurrency)}
              </span>
              <span className="text-[10px] text-on-surface-variant">{chainStatusLabel(vaultBalance?.status)} · logged-in vault · {vaultBalance?.liveCellCount ?? 0} cells</span>
            </div>

            <div className="flex flex-col gap-1 bg-surface-container-low px-5 py-3 border border-outline-variant rounded-xl shadow-md min-w-[180px]">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Active Pass Limits</span>
              <span className="font-mono text-xl font-semibold text-secondary">
                {formatCurrencyAmount(totalActivePassValue, walletCurrency)}
              </span>
              <span className="text-[10px] text-on-surface-variant">Reserved from FiberPass available balance</span>
            </div>
          </div>
        </div>

        <button
          id="dashboard-header-create-btn"
          onClick={onCreateSessionClick}
          className="bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container transition-all duration-200 rounded-lg py-2.5 px-5 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(176,198,255,0.15)] hover:shadow-[0_0_25px_rgba(176,198,255,0.3)] active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Create New Pass
        </button>
      </header>


      <section className="flex flex-col gap-6 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
            <Bolt className="w-4 h-4 fill-current" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">Active Sessions</h2>
          <span className="bg-surface-container-highest border border-outline-variant text-[10px] text-on-surface-variant font-bold px-2 py-0.5 rounded-full uppercase ml-1 tracking-wider">
            {activeSessions.length} active
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-low/40 backdrop-blur-md rounded-2xl border border-outline-variant max-w-xl mx-auto w-full my-8 space-y-4">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-on-surface">Loading Sessions</h3>
              <p className="text-sm text-on-surface-variant max-w-xs">Fetching your authenticated FiberPass state.</p>
            </div>
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-low/40 backdrop-blur-md rounded-2xl border border-outline-variant border-dashed max-w-xl mx-auto w-full my-8 space-y-4">
            <AlertCircle className="w-12 h-12 text-outline-variant" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-on-surface">No Active Sessions</h3>
              <p className="text-sm text-on-surface-variant max-w-xs">
                Create a new secure micropayment session limit to begin streaming continuous payments instantly.
              </p>
            </div>
            <button
              id="empty-state-create-btn"
              onClick={onCreateSessionClick}
              className="bg-primary/20 hover:bg-primary/35 text-primary border border-primary/30 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              Set Limit &amp; Start
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSessions.map((session) => {
              const spentPercentage = session.limit > 0 ? Math.min((session.spent / session.limit) * 100, 100) : 0;
              const remainingBalance = session.remainingBalance ?? Math.max(0, session.limit - session.spent);
              const isPaused = session.status === 'paused';
              const pendingAction = pendingSessionAction?.id === session.id ? pendingSessionAction.action : null;
              const isActionPending = Boolean(pendingAction);
              const pauseButtonClass = (isPaused ? 'text-secondary ' : 'text-on-surface ') +
                'flex items-center justify-center gap-1 bg-surface-container border border-outline-variant hover:bg-surface-variant transition-all duration-200 rounded-lg py-2 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed';

              return (
                <article
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openSessionDetails(session.id)}
                  onKeyDown={(event) => handleSessionKeyDown(event, session.id)}
                  className="bg-surface-container-low/80 backdrop-blur-md border border-outline-variant rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden group hover:border-primary/40 transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer focus:outline-none focus:border-primary/60"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-all duration-500" />

                  <header className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isPaused ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-outline shadow-[0_0_8px_rgba(140,144,161,0.5)] shrink-0" title="Paused" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.6)] animate-pulse shrink-0" title="Active Streaming" />
                      )}

                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors duration-200 truncate">
                          {session.name}
                        </h3>
                        <p className="text-[10px] text-on-surface-variant font-mono truncate">{session.appId ?? session.serviceAddress}</p>
                      </div>
                    </div>

                    <div className="p-1.5 bg-surface-container-highest border border-outline-variant/60 rounded-lg shrink-0">
                      {renderSessionIcon(session.iconType)}
                    </div>
                  </header>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-on-surface-variant font-medium">Spent</span>
                      <div className="font-mono text-xs text-right">
                        <span className="text-on-surface font-bold">{formatCurrencyAmount(session.spent, session.currency)}</span>
                        <span className="text-outline"> / {formatCurrencyAmount(session.limit, session.currency)}</span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className={(isPaused ? 'bg-outline-variant ' : 'bg-gradient-to-r from-primary to-secondary ') + 'h-full rounded-full shadow-[0_0_8px_rgba(176,198,255,0.4)] transition-all duration-300'}
                        style={{ width: spentPercentage + '%' }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                      <span>{sessionPurposeLabel(session)}</span>
                      <span className="font-mono">{spentPercentage.toFixed(1)}% spent</span>
                    </div>

                    <div className="flex justify-between items-center rounded-lg border border-outline-variant/50 bg-surface-container-high/40 px-3 py-2 text-[11px]">
                      <span className="text-on-surface-variant font-semibold uppercase tracking-wider">Remaining</span>
                      <span className="font-mono text-secondary font-bold">{formatCurrencyAmount(remainingBalance, session.currency)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-on-surface-variant">
                      <span className="truncate">{session.chargePolicy ?? sessionPurposeLabel(session)}</span>
                      <span className="font-mono text-right truncate">{sessionScheduleLabel(session)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-on-surface-variant">
                      <span className="truncate">Fiber: {session.fiberStatus ?? 'pending'}</span>
                      <span className="font-mono text-right truncate">{session.lastChargeProofId ?? session.fiberProofId ?? session.fiberProvider ?? 'no proof yet'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-outline-variant/40">
                    <button
                      onClick={(event) => { event.stopPropagation(); onTopUpSession(session.id); }}
                      disabled={isActionPending}
                      className="bg-surface-container hover:bg-primary/10 border border-outline-variant hover:border-primary/40 text-primary transition-all duration-200 rounded-lg py-2 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      title={"Top up session with 1.00 " + walletCurrency}
                    >
                      {pendingAction === 'top-up' ? 'Topping...' : 'Top Up'}
                    </button>

                    <button
                      onClick={(event) => { event.stopPropagation(); onTogglePauseSession(session.id); }}
                      disabled={isActionPending}
                      className={pauseButtonClass}
                      title={isPaused ? 'Resume stream' : 'Pause stream'}
                    >
                      {pendingAction === 'pause' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Updating
                        </>
                      ) : isPaused ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          Pause
                        </>
                      )}
                    </button>

                    <button
                      onClick={(event) => { event.stopPropagation(); onCloseSession(session.id); }}
                      disabled={isActionPending}
                      className="flex items-center justify-center gap-1 bg-surface-container text-secondary hover:bg-secondary/10 border border-secondary/20 hover:border-secondary/40 transition-all duration-200 rounded-lg py-2 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Close and settle session"
                    >
                      {pendingAction === 'close' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {pendingAction === 'close' ? 'Closing' : 'Close'}
                    </button>

                    <button
                      onClick={(event) => { event.stopPropagation(); onRevokeSession(session.id); }}
                      disabled={isActionPending}
                      className="flex items-center justify-center gap-1 bg-surface-container text-error hover:bg-error/10 border border-error/20 hover:border-error/40 transition-all duration-200 rounded-lg py-2 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Revoke and settle session"
                    >
                      {pendingAction === 'revoke' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      {pendingAction === 'revoke' ? 'Revoking' : 'Revoke'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedSession && (
        <SessionDetailModal session={selectedSession} onClose={() => setSelectedSessionId(null)} onResendRecipientInvites={onResendRecipientInvites} />
      )}
    </div>
  );
}
