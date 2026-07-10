/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  Wallet
} from 'lucide-react';
import { Session } from '../types';
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

interface DashboardViewProps {
  activeSessions: Session[];
  walletBalance: number;
  walletCurrency: string;
  totalActivePassValue: number;
  isLoading?: boolean;
  pendingSessionAction?: { id: string; action: 'top-up' | 'pause' | 'revoke' | 'close' } | null;
  onTopUpSession: (id: string) => void;
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
  isLoading = false,
  pendingSessionAction = null,
  onTopUpSession,
  onTogglePauseSession,
  onRevokeSession,
  onCloseSession,
  onCreateSessionClick,
  onLoadFundsClick
}: DashboardViewProps) {
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

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1 bg-surface-container-low px-5 py-3 border border-outline-variant rounded-xl shadow-md min-w-[160px]">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Wallet Balance</span>
              <span className="font-mono text-xl font-semibold text-primary">
                {formatCurrencyAmount(walletBalance, walletCurrency)}
              </span>
              <button
                type="button"
                onClick={onLoadFundsClick}
                className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-secondary transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                Load Funds
              </button>
            </div>

            <div className="flex flex-col gap-1 bg-surface-container-low px-5 py-3 border border-outline-variant rounded-xl shadow-md min-w-[160px]">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Active Pass Limits</span>
              <span className="font-mono text-xl font-semibold text-secondary">
                {formatCurrencyAmount(totalActivePassValue, walletCurrency)}
              </span>
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
                  className="bg-surface-container-low/80 backdrop-blur-md border border-outline-variant rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden group hover:border-primary/40 transition-all duration-300 shadow-md hover:shadow-lg"
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
                      onClick={() => onTopUpSession(session.id)}
                      disabled={isActionPending}
                      className="bg-surface-container hover:bg-primary/10 border border-outline-variant hover:border-primary/40 text-primary transition-all duration-200 rounded-lg py-2 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      title={"Top up session with 1.00 " + walletCurrency}
                    >
                      {pendingAction === 'top-up' ? 'Topping...' : 'Top Up'}
                    </button>

                    <button
                      onClick={() => onTogglePauseSession(session.id)}
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
                      onClick={() => onCloseSession(session.id)}
                      disabled={isActionPending}
                      className="flex items-center justify-center gap-1 bg-surface-container text-secondary hover:bg-secondary/10 border border-secondary/20 hover:border-secondary/40 transition-all duration-200 rounded-lg py-2 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Close and settle session"
                    >
                      {pendingAction === 'close' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {pendingAction === 'close' ? 'Closing' : 'Close'}
                    </button>

                    <button
                      onClick={() => onRevokeSession(session.id)}
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
    </div>
  );
}
