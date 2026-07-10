/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Layers3, LoaderCircle, ReceiptText, RefreshCw, Send } from 'lucide-react';
import { type AutomationInvoice, type AutomationPaymentBatch } from '../lib/appsApi';
import { formatCurrencyAmount } from '../lib/currency';
import { type Session } from '../types';
import { type AutomationAppOverview } from '../hooks/useAutomationOverview';

interface AutomationViewProps {
  apps: AutomationAppOverview[];
  activeSessions: Session[];
  isLoading: boolean;
  error: string;
  pendingAction: { type: 'invoice' | 'batch'; id: string } | null;
  onQueueInvoice: (appId: string, invoiceId: string) => Promise<void>;
  onQueueBatch: (appId: string, batchId: string) => Promise<void>;
  onRefresh: () => void;
}

interface InvoiceWithApp extends AutomationInvoice {
  appName: string;
}

interface BatchWithApp extends AutomationPaymentBatch {
  appName: string;
}

function formatDate(value?: string): string {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function statusClass(status: string): string {
  if (status === 'paid' || status === 'completed') return 'border-secondary/30 bg-secondary/10 text-secondary';
  if (status === 'failed' || status === 'partial') return 'border-error/30 bg-error/10 text-error';
  if (status === 'queued' || status === 'processing') return 'border-primary/30 bg-primary/10 text-primary';
  if (status === 'cancelled') return 'border-outline-variant bg-surface-container-high text-on-surface-variant';
  return 'border-outline-variant bg-surface-container-low text-on-surface-variant';
}

function canQueueInvoice(invoice: AutomationInvoice): boolean {
  return invoice.hasFiberInvoice && (invoice.status === 'draft' || invoice.status === 'failed');
}

function canQueueBatch(batch: AutomationPaymentBatch): boolean {
  return batch.status === 'draft' || batch.status === 'failed' || batch.status === 'partial';
}

export default function AutomationView({
  apps,
  activeSessions,
  isLoading,
  error,
  pendingAction,
  onQueueInvoice,
  onQueueBatch,
  onRefresh
}: AutomationViewProps) {
  const sessionById = useMemo(() => new Map(activeSessions.map((session) => [session.id, session])), [activeSessions]);
  const invoices = useMemo<InvoiceWithApp[]>(() => apps.flatMap((entry) => entry.invoices.map((invoice) => ({ ...invoice, appName: entry.app.name }))), [apps]);
  const batches = useMemo<BatchWithApp[]>(() => apps.flatMap((entry) => entry.batches.map((batch) => ({ ...batch, appName: entry.app.name }))), [apps]);
  const pendingInvoices = invoices.filter((invoice) => ['draft', 'queued', 'processing', 'failed'].includes(invoice.status));
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');
  const failedInvoices = invoices.filter((invoice) => invoice.status === 'failed');
  const queuedValue = pendingInvoices.reduce((total, invoice) => total + invoice.amount, 0);
  const currency = invoices[0]?.currency ?? activeSessions[0]?.currency ?? 'CKB';

  return (
    <div className="w-full flex flex-col gap-8 animate-[fade-in_0.3s_ease-out]">
      <header className="border-b border-outline-variant/60 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">Automation</h1>
          <p className="text-sm text-on-surface-variant mt-1">Queued invoices, batch payouts, and worker execution state.</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
        >
          <RefreshCw className={(isLoading ? 'animate-spin ' : '') + 'w-4 h-4'} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-xs font-semibold text-error">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low/60 px-5 py-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Open Invoices</span>
          <div className="mt-2 flex items-end justify-between gap-3">
            <strong className="text-2xl text-on-surface">{pendingInvoices.length}</strong>
            <Clock3 className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low/60 px-5 py-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Queued Value</span>
          <div className="mt-2 flex items-end justify-between gap-3">
            <strong className="font-mono text-xl text-primary">{formatCurrencyAmount(queuedValue, currency, 8)}</strong>
            <Send className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low/60 px-5 py-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Paid</span>
          <div className="mt-2 flex items-end justify-between gap-3">
            <strong className="text-2xl text-secondary">{paidInvoices.length}</strong>
            <CheckCircle2 className="w-5 h-5 text-secondary" />
          </div>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low/60 px-5 py-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Failed</span>
          <div className="mt-2 flex items-end justify-between gap-3">
            <strong className="text-2xl text-error">{failedInvoices.length}</strong>
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
        </div>
      </section>

      {isLoading && apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-surface-container-low/40 rounded-xl border border-outline-variant max-w-xl mx-auto w-full my-8 space-y-4">
          <LoaderCircle className="w-10 h-10 text-primary animate-spin" />
          <h3 className="font-bold text-lg text-on-surface">Loading Automation</h3>
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-xl border border-outline-variant border-dashed p-8 text-center text-sm text-on-surface-variant">
          No developer apps have automation invoices yet.
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Layers3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-on-surface">Payment Batches</h2>
              <span className="text-[10px] font-mono text-on-surface-variant">{batches.length}</span>
            </div>

            {batches.length === 0 ? (
              <div className="rounded-xl border border-outline-variant bg-surface-container-low/40 p-5 text-sm text-on-surface-variant">No batches created yet.</div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {batches.map((batch) => {
                  const progress = batch.invoiceCount > 0 ? Math.round((batch.paidCount / batch.invoiceCount) * 100) : 0;
                  const pending = pendingAction?.type === 'batch' && pendingAction.id === batch.id;
                  return (
                    <article key={batch.id} className="rounded-xl border border-outline-variant bg-surface-container-low/50 p-5 flex flex-col gap-4">
                      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-on-surface truncate">{batch.description || 'Payment batch'}</h3>
                            <span className={'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ' + statusClass(batch.status)}>{batch.status}</span>
                          </div>
                          <p className="font-mono text-[10px] text-on-surface-variant mt-1 break-all">{batch.appName} / {batch.id}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onQueueBatch(batch.appId, batch.id)}
                          disabled={!canQueueBatch(batch) || pending}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary/15 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-primary border border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {pending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Queue Batch
                        </button>
                      </header>

                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2">
                          <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">Total</span>
                          <span className="font-mono font-bold text-on-surface">{formatCurrencyAmount(batch.totalAmount, batch.currency, 8)}</span>
                        </div>
                        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2">
                          <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">Paid</span>
                          <span className="font-mono font-bold text-secondary">{batch.paidCount}/{batch.invoiceCount}</span>
                        </div>
                        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2">
                          <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant">Failed</span>
                          <span className="font-mono font-bold text-error">{batch.failedCount}</span>
                        </div>
                      </div>

                      <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: progress + '%' }} />
                      </div>

                      {batch.lastFailureMessage && (
                        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">{batch.lastFailureCode}: {batch.lastFailureMessage}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-on-surface">Invoices</h2>
              <span className="text-[10px] font-mono text-on-surface-variant">{invoices.length}</span>
            </div>

            {invoices.length === 0 ? (
              <div className="rounded-xl border border-outline-variant bg-surface-container-low/40 p-5 text-sm text-on-surface-variant">No invoices created yet.</div>
            ) : (
              <div className="rounded-xl border border-outline-variant overflow-hidden">
                <div className="hidden lg:grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.9fr_auto] gap-3 bg-surface-container px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <span>Invoice</span>
                  <span>Session</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Updated</span>
                  <span className="text-right">Action</span>
                </div>
                <div className="divide-y divide-outline-variant/50">
                  {invoices.map((invoice) => {
                    const session = sessionById.get(invoice.sessionId);
                    const remaining = session?.remainingBalance ?? Math.max(0, (session?.limit ?? 0) - (session?.spent ?? 0));
                    const pending = pendingAction?.type === 'invoice' && pendingAction.id === invoice.id;
                    return (
                      <article key={invoice.id} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.9fr_auto] gap-3 px-4 py-4 items-center bg-surface-container-low/30">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-on-surface truncate">{invoice.description || invoice.type}</p>
                          <p className="font-mono text-[10px] text-on-surface-variant break-all">{invoice.appName} / {invoice.id}</p>
                          {invoice.lastFailureMessage && <p className="text-[11px] text-error mt-1">{invoice.lastFailureCode}: {invoice.lastFailureMessage}</p>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] text-on-surface-variant truncate">{invoice.sessionId}</p>
                          <p className="font-mono text-[10px] text-secondary">Remaining {formatCurrencyAmount(remaining, invoice.currency, 8)}</p>
                        </div>
                        <span className="font-mono text-sm font-bold text-on-surface">{formatCurrencyAmount(invoice.amount, invoice.currency, 8)}</span>
                        <span className={'w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ' + statusClass(invoice.status)}>{invoice.status}</span>
                        <span className="text-xs text-on-surface-variant">{formatDate(invoice.paidAt ?? invoice.failedAt ?? invoice.processingAt ?? invoice.queuedAt ?? invoice.updatedAt)}</span>
                        <button
                          type="button"
                          onClick={() => onQueueInvoice(invoice.appId, invoice.id)}
                          disabled={!canQueueInvoice(invoice) || pending}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/15 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-primary disabled:opacity-50 disabled:cursor-not-allowed lg:justify-self-end"
                          title={!invoice.hasFiberInvoice ? 'Fiber invoice required before queueing' : 'Queue invoice'}
                        >
                          {pending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Queue
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
