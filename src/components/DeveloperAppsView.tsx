/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Code, Copy, KeyRound, LoaderCircle, Plus, RefreshCw, Send, ShieldCheck, Users, Webhook, XCircle } from 'lucide-react';
import {
  type AppApiKeyScope,
  type CreateAutomationInvoiceBatchPayload,
  type CreateAutomationInvoicePayload,
  type CreateAutomationRecipientPayload,
  type DeveloperApp
} from '../lib/appsApi';
import { FIBER_CKB_ADDRESS_ERROR, isFiberCkbAddress } from '../lib/fiberAddress';
import { formatCurrencyAmount } from '../lib/currency';
import { type DeveloperAutomationState } from '../hooks/useDeveloperApps';

const DEFAULT_KEY_SCOPES: AppApiKeyScope[] = ['charges:create', 'recipients:read', 'recipients:write', 'invoices:create', 'payments:queue'];
const ALL_KEY_SCOPES: AppApiKeyScope[] = ['charges:create', 'recipients:read', 'recipients:write', 'invoices:create', 'payments:queue', 'payments:charge'];

interface DeveloperAppsViewProps {
  apps: DeveloperApp[];
  automationByApp: Record<string, DeveloperAutomationState>;
  isLoading: boolean;
  error: string;
  generatedKey: { appId: string; secret: string; keyPrefix: string } | null;
  onCreateApp: (payload: { name: string; serviceAddress: string; url?: string; category: string; description?: string }) => Promise<void>;
  onCreateApiKey: (appId: string, label: string, scopes?: AppApiKeyScope[]) => Promise<void>;
  onRevokeApiKey: (appId: string, keyId: string) => Promise<void>;
  onCreateRecipient: (appId: string, payload: CreateAutomationRecipientPayload) => Promise<void>;
  onCreateInvoice: (appId: string, payload: CreateAutomationInvoicePayload) => Promise<void>;
  onCreateInvoiceBatch: (appId: string, payload: CreateAutomationInvoiceBatchPayload) => Promise<void>;
  onConfigureWebhook: (appId: string, payload: { webhookUrl?: string; signingSecret?: string }) => Promise<void>;
  onClearGeneratedKey: () => void;
}

function formatDate(value?: string): string {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatAmount(value: number, currency: string): string {
  return formatCurrencyAmount(value, currency, 8);
}

function statusClass(status: string): string {
  if (['succeeded', 'paid', 'completed', 'active'].includes(status)) return 'border-secondary/30 bg-secondary/10 text-secondary';
  if (['failed', 'partial', 'revoked'].includes(status)) return 'border-error/30 bg-error/10 text-error';
  if (['queued', 'processing', 'retrying', 'delivering'].includes(status)) return 'border-primary/30 bg-primary/10 text-primary';
  return 'border-outline-variant bg-surface-container-high text-on-surface-variant';
}

function parseBatchCsv(value: string) {
  return value.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [recipientId, amount, fiberInvoice, description] = line.split(',').map((part) => part.trim());
      return { recipientId, amount: Number(amount), fiberInvoice, description: description || 'Batch payout' };
    });
}

export default function DeveloperAppsView({
  apps,
  automationByApp,
  isLoading,
  error,
  generatedKey,
  onCreateApp,
  onCreateApiKey,
  onRevokeApiKey,
  onCreateRecipient,
  onCreateInvoice,
  onCreateInvoiceBatch,
  onConfigureWebhook,
  onClearGeneratedKey
}: DeveloperAppsViewProps) {
  const [name, setName] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('AI/API');
  const [description, setDescription] = useState('');
  const [keyLabels, setKeyLabels] = useState<Record<string, string>>({});
  const [keyScopes, setKeyScopes] = useState<Record<string, AppApiKeyScope[]>>({});
  const [recipientForms, setRecipientForms] = useState<Record<string, { name: string; serviceAddress: string }>>({});
  const [invoiceForms, setInvoiceForms] = useState<Record<string, { sessionId: string; recipientId: string; amount: string; fiberInvoice: string; description: string }>>({});
  const [batchForms, setBatchForms] = useState<Record<string, { sessionId: string; description: string; csv: string }>>({});
  const [webhookForms, setWebhookForms] = useState<Record<string, { webhookUrl: string; signingSecret: string }>>({});
  const [formError, setFormError] = useState('');

  const handleCreateApp = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Enter an app name.');
      return;
    }

    if (!isFiberCkbAddress(serviceAddress)) {
      setFormError(FIBER_CKB_ADDRESS_ERROR);
      return;
    }

    await onCreateApp({
      name: name.trim(),
      serviceAddress: serviceAddress.trim(),
      url: url.trim() || undefined,
      category,
      description: description.trim() || undefined
    });
    setName('');
    setServiceAddress('');
    setUrl('');
    setDescription('');
  };

  const toggleScope = (appId: string, scope: AppApiKeyScope) => {
    setKeyScopes((prev) => {
      const current = prev[appId] ?? DEFAULT_KEY_SCOPES;
      return {
        ...prev,
        [appId]: current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]
      };
    });
  };

  const handleCreateRecipient = async (appId: string) => {
    const form = recipientForms[appId] ?? { name: '', serviceAddress: '' };
    if (!form.name.trim()) {
      setFormError('Enter a recipient name.');
      return;
    }
    if (!isFiberCkbAddress(form.serviceAddress)) {
      setFormError(FIBER_CKB_ADDRESS_ERROR);
      return;
    }
    setFormError('');
    await onCreateRecipient(appId, { name: form.name.trim(), serviceAddress: form.serviceAddress.trim() });
    setRecipientForms((prev) => ({ ...prev, [appId]: { name: '', serviceAddress: '' } }));
  };

  const handleCreateInvoice = async (appId: string) => {
    const form = invoiceForms[appId] ?? { sessionId: '', recipientId: '', amount: '', fiberInvoice: '', description: '' };
    if (!form.sessionId.trim() || !form.recipientId.trim() || !Number(form.amount)) {
      setFormError('Enter session, recipient, and amount for the invoice.');
      return;
    }
    setFormError('');
    await onCreateInvoice(appId, {
      sessionId: form.sessionId.trim(),
      recipientId: form.recipientId.trim(),
      amount: Number(form.amount),
      fiberInvoice: form.fiberInvoice.trim() || undefined,
      description: form.description.trim() || undefined
    });
    setInvoiceForms((prev) => ({ ...prev, [appId]: { sessionId: form.sessionId, recipientId: '', amount: '', fiberInvoice: '', description: '' } }));
  };

  const handleCreateBatch = async (appId: string) => {
    const form = batchForms[appId] ?? { sessionId: '', description: '', csv: '' };
    const invoices = parseBatchCsv(form.csv);
    if (!form.sessionId.trim() || invoices.length === 0 || invoices.some((invoice) => !invoice.recipientId || !invoice.amount)) {
      setFormError('Batch rows must be recipientId, amount, fiberInvoice, description.');
      return;
    }
    setFormError('');
    await onCreateInvoiceBatch(appId, {
      sessionId: form.sessionId.trim(),
      description: form.description.trim() || undefined,
      invoices
    });
    setBatchForms((prev) => ({ ...prev, [appId]: { sessionId: form.sessionId, description: '', csv: '' } }));
  };

  const handleConfigureWebhook = async (app: DeveloperApp) => {
    const form = webhookForms[app.id] ?? { webhookUrl: app.webhookUrl ?? '', signingSecret: '' };
    setFormError('');
    await onConfigureWebhook(app.id, { webhookUrl: form.webhookUrl.trim() || undefined, signingSecret: form.signingSecret.trim() || undefined });
    setWebhookForms((prev) => ({ ...prev, [app.id]: { webhookUrl: form.webhookUrl, signingSecret: '' } }));
  };

  return (
    <div className="w-full flex flex-col gap-8 animate-[fade-in_0.3s_ease-out]">
      <header className="border-b border-outline-variant/60 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">Developer Apps</h1>
          <p className="text-sm text-on-surface-variant mt-1">Create app identities, issue scoped API keys, and operate automated payouts.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-primary" /> : <ShieldCheck className="w-4 h-4 text-secondary" />}
          App-scoped automation enabled
        </div>
      </header>

      {(error || formError) && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-xs font-semibold text-error">
          {formError || error}
        </div>
      )}

      {generatedKey && (
        <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-on-surface">New API Key Created</h3>
              <p className="text-xs text-on-surface-variant mt-1">This secret is shown once. Store it server-side for app charge and automation requests.</p>
            </div>
            <button type="button" onClick={onClearGeneratedKey} className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2">
            <input readOnly value={generatedKey.secret} className="flex-1 min-w-0 bg-transparent font-mono text-xs text-primary outline-none" />
            <button type="button" onClick={() => navigator.clipboard?.writeText(generatedKey.secret)} className="p-1.5 text-primary hover:text-secondary" title="Copy key">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreateApp} className="border border-outline-variant bg-surface-container-low/50 rounded-xl p-5 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:col-span-2">
          <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            App Name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Fiber AI Agent" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-sm normal-case font-normal text-on-surface focus:outline-none focus:border-primary" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Fiber App Address
            <input value={serviceAddress} onChange={(event) => setServiceAddress(event.target.value)} placeholder="ckt1... or ckb1..." className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-sm normal-case font-mono text-on-surface focus:outline-none focus:border-primary" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            URL
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://app.example" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-sm normal-case font-normal text-on-surface focus:outline-none focus:border-primary" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-sm normal-case font-semibold text-on-surface focus:outline-none focus:border-primary">
              <option>AI/API</option>
              <option>RPC</option>
              <option>Storage</option>
              <option>Media</option>
              <option>Other</option>
            </select>
          </label>
          <label className="md:col-span-2 flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Description
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Metered app charges through FiberPass" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-sm normal-case font-normal text-on-surface focus:outline-none focus:border-primary" />
          </label>
        </div>
        <button type="submit" disabled={isLoading} className="bg-primary text-on-primary hover:bg-primary-fixed py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70">
          {isLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create App
        </button>
      </form>

      <section className="grid grid-cols-1 gap-5">
        {apps.length === 0 && !isLoading ? (
          <div className="border border-outline-variant border-dashed rounded-xl p-8 text-center text-sm text-on-surface-variant">
            No developer apps yet.
          </div>
        ) : apps.map((app) => {
          const automation = automationByApp[app.id] ?? { recipients: [], invoices: [], batches: [], jobs: [], webhookDeliveries: [] };
          const recipientForm = recipientForms[app.id] ?? { name: '', serviceAddress: '' };
          const invoiceForm = invoiceForms[app.id] ?? { sessionId: '', recipientId: '', amount: '', fiberInvoice: '', description: '' };
          const batchForm = batchForms[app.id] ?? { sessionId: '', description: '', csv: '' };
          const webhookForm = webhookForms[app.id] ?? { webhookUrl: app.webhookUrl ?? '', signingSecret: '' };
          const scopes = keyScopes[app.id] ?? DEFAULT_KEY_SCOPES;

          return (
            <article key={app.id} className="border border-outline-variant bg-surface-container-low/50 rounded-xl p-5 flex flex-col gap-5">
              <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-xl text-on-surface truncate">{app.name}</h3>
                    <span className={'text-[10px] uppercase tracking-wider font-bold rounded-full border px-2 py-0.5 ' + statusClass(app.status)}>{app.status}</span>
                  </div>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-1 break-all">{app.id} / {app.serviceAddress}</p>
                  {app.description && <p className="text-sm text-on-surface-variant mt-2">{app.description}</p>}
                </div>
                <div className="flex flex-col gap-2 w-full md:w-[360px]">
                  <div className="flex gap-2">
                    <input value={keyLabels[app.id] ?? 'Automation key'} onChange={(event) => setKeyLabels(prev => ({ ...prev, [app.id]: event.target.value }))} className="min-w-0 flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary" />
                    <button type="button" onClick={() => onCreateApiKey(app.id, keyLabels[app.id] ?? 'Automation key', scopes)} disabled={isLoading || scopes.length === 0} className="bg-primary/15 text-primary border border-primary/30 rounded-lg px-3 py-2 text-xs font-bold uppercase flex items-center gap-2 disabled:opacity-70">
                      <KeyRound className="w-4 h-4" />
                      New Key
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_KEY_SCOPES.map((scope) => (
                      <button key={scope} type="button" onClick={() => toggleScope(app.id, scope)} className={(scopes.includes(scope) ? 'border-primary/40 bg-primary/15 text-primary ' : 'border-outline-variant text-on-surface-variant ') + 'rounded-full border px-2 py-1 text-[10px] font-bold'}>
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <section className="rounded-xl border border-outline-variant/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container/60 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-on-surface">API Keys</h4>
                    <span className="text-[10px] text-on-surface-variant font-mono">{app.apiKeys.length}</span>
                  </div>
                  <div className="divide-y divide-outline-variant/40">
                    {app.apiKeys.length === 0 ? (
                      <p className="p-4 text-sm text-on-surface-variant">No keys issued.</p>
                    ) : app.apiKeys.map((key) => (
                      <div key={key.id} className="p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-on-surface truncate">{key.label}</p>
                            <p className="font-mono text-[10px] text-on-surface-variant truncate">{key.keyPrefix}... / last used {formatDate(key.lastUsedAt)}</p>
                          </div>
                          <button type="button" onClick={() => onRevokeApiKey(app.id, key.id)} disabled={isLoading || key.status === 'revoked'} className="text-error border border-error/30 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase disabled:opacity-50">
                            {key.status === 'revoked' ? 'Revoked' : 'Revoke'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {key.scopes.map((scope) => <span key={scope} className="rounded-full border border-outline-variant px-2 py-0.5 text-[10px] text-on-surface-variant">{scope}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-outline-variant/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container/60 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-on-surface">Recipients</h4>
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto] gap-2">
                    <input value={recipientForm.name} onChange={(event) => setRecipientForms(prev => ({ ...prev, [app.id]: { ...recipientForm, name: event.target.value } }))} placeholder="Recipient name" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface" />
                    <input value={recipientForm.serviceAddress} onChange={(event) => setRecipientForms(prev => ({ ...prev, [app.id]: { ...recipientForm, serviceAddress: event.target.value } }))} placeholder="ckt1... recipient" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs font-mono text-on-surface" />
                    <button type="button" onClick={() => handleCreateRecipient(app.id)} disabled={isLoading} className="rounded-lg bg-primary/15 border border-primary/30 px-3 py-2 text-[10px] font-bold uppercase text-primary disabled:opacity-60">Add</button>
                  </div>
                  <div className="divide-y divide-outline-variant/40 max-h-[220px] overflow-y-auto">
                    {automation.recipients.length === 0 ? <p className="p-4 text-sm text-on-surface-variant">No recipients yet.</p> : automation.recipients.map((recipient) => (
                      <div key={recipient.id} className="p-4 min-w-0">
                        <p className="font-bold text-sm text-on-surface truncate">{recipient.name}</p>
                        <p className="font-mono text-[10px] text-on-surface-variant break-all">{recipient.id} / {recipient.serviceAddress}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-outline-variant/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container/60 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-on-surface">Create Invoice</h4>
                    <Send className="w-4 h-4 text-primary" />
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input value={invoiceForm.sessionId} onChange={(event) => setInvoiceForms(prev => ({ ...prev, [app.id]: { ...invoiceForm, sessionId: event.target.value } }))} placeholder="FiberPass session id" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs font-mono text-on-surface" />
                    <select value={invoiceForm.recipientId} onChange={(event) => setInvoiceForms(prev => ({ ...prev, [app.id]: { ...invoiceForm, recipientId: event.target.value } }))} className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface">
                      <option value="">Select recipient</option>
                      {automation.recipients.filter((recipient) => recipient.status === 'active').map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.name}</option>)}
                    </select>
                    <input value={invoiceForm.amount} onChange={(event) => setInvoiceForms(prev => ({ ...prev, [app.id]: { ...invoiceForm, amount: event.target.value } }))} placeholder="Amount CKB" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface" />
                    <input value={invoiceForm.description} onChange={(event) => setInvoiceForms(prev => ({ ...prev, [app.id]: { ...invoiceForm, description: event.target.value } }))} placeholder="Description" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface" />
                    <input value={invoiceForm.fiberInvoice} onChange={(event) => setInvoiceForms(prev => ({ ...prev, [app.id]: { ...invoiceForm, fiberInvoice: event.target.value } }))} placeholder="Fiber invoice/payment request" className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs font-mono text-on-surface" />
                    <button type="button" onClick={() => handleCreateInvoice(app.id)} disabled={isLoading} className="md:col-span-2 rounded-lg bg-primary/15 border border-primary/30 px-3 py-2 text-[10px] font-bold uppercase text-primary disabled:opacity-60">Create Invoice</button>
                  </div>
                </section>

                <section className="rounded-xl border border-outline-variant/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container/60 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-on-surface">Batch Creation</h4>
                    <span className="text-[10px] text-on-surface-variant font-mono">{automation.batches.length}</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-2">
                    <input value={batchForm.sessionId} onChange={(event) => setBatchForms(prev => ({ ...prev, [app.id]: { ...batchForm, sessionId: event.target.value } }))} placeholder="FiberPass session id" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs font-mono text-on-surface" />
                    <input value={batchForm.description} onChange={(event) => setBatchForms(prev => ({ ...prev, [app.id]: { ...batchForm, description: event.target.value } }))} placeholder="Batch description" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface" />
                    <textarea value={batchForm.csv} onChange={(event) => setBatchForms(prev => ({ ...prev, [app.id]: { ...batchForm, csv: event.target.value } }))} rows={4} placeholder="recipientId, amount, fiberInvoice, description" className="resize-y bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs font-mono text-on-surface" />
                    <button type="button" onClick={() => handleCreateBatch(app.id)} disabled={isLoading} className="rounded-lg bg-primary/15 border border-primary/30 px-3 py-2 text-[10px] font-bold uppercase text-primary disabled:opacity-60">Create Batch</button>
                  </div>
                </section>

                <section className="rounded-xl border border-outline-variant/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container/60 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-on-surface">Payment Jobs</h4>
                    <span className="text-[10px] text-on-surface-variant font-mono">{automation.jobs.length}</span>
                  </div>
                  <div className="divide-y divide-outline-variant/40 max-h-[300px] overflow-y-auto">
                    {automation.jobs.length === 0 ? <p className="p-4 text-sm text-on-surface-variant">No jobs queued.</p> : automation.jobs.map((job) => (
                      <div key={job.id} className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {job.status === 'failed' ? <AlertTriangle className="w-4 h-4 text-error" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
                            <p className="font-bold text-sm text-on-surface truncate">{job.status}</p>
                          </div>
                          <p className="font-mono text-[10px] text-on-surface-variant mt-1 break-all">{job.id} / invoice {job.invoiceId}</p>
                          <p className="font-mono text-[10px] text-on-surface-variant mt-1">Attempts {job.attempts}/{job.maxAttempts} / run {formatDate(job.runAfter)}</p>
                          {job.lastFailureMessage && <p className="text-[11px] text-error mt-1">{job.lastFailureCode}: {job.lastFailureMessage}</p>}
                        </div>
                        <span className="font-mono text-xs text-on-surface">{formatAmount(job.amount, job.currency)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-outline-variant/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container/60 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-on-surface">Webhooks</h4>
                    <Webhook className="w-4 h-4 text-primary" />
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-2">
                    <input value={webhookForm.webhookUrl} onChange={(event) => setWebhookForms(prev => ({ ...prev, [app.id]: { ...webhookForm, webhookUrl: event.target.value } }))} placeholder="https://app.example/fiberpass-webhooks" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface" />
                    <input value={webhookForm.signingSecret} onChange={(event) => setWebhookForms(prev => ({ ...prev, [app.id]: { ...webhookForm, signingSecret: event.target.value } }))} placeholder={app.webhookConfigured ? 'Leave blank to keep current signing secret' : 'Optional signing secret'} className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs font-mono text-on-surface" />
                    <button type="button" onClick={() => handleConfigureWebhook(app)} disabled={isLoading} className="rounded-lg bg-primary/15 border border-primary/30 px-3 py-2 text-[10px] font-bold uppercase text-primary disabled:opacity-60">Save Webhook</button>
                  </div>
                  <div className="divide-y divide-outline-variant/40 max-h-[220px] overflow-y-auto">
                    {automation.webhookDeliveries.length === 0 ? <p className="p-4 text-sm text-on-surface-variant">No webhook deliveries yet.</p> : automation.webhookDeliveries.map((delivery) => (
                      <div key={delivery.id} className="p-4 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-sm text-on-surface truncate">{delivery.eventType}</p>
                          <span className={'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ' + statusClass(delivery.status)}>{delivery.status}</span>
                        </div>
                        <p className="font-mono text-[10px] text-on-surface-variant mt-1 truncate">{delivery.targetId} / attempts {delivery.attempts}/{delivery.maxAttempts}</p>
                        {delivery.lastFailureMessage && <p className="text-[11px] text-error mt-1">{delivery.lastFailureCode}: {delivery.lastFailureMessage}</p>}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="xl:col-span-2 rounded-xl border border-outline-variant/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container/60 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-on-surface">Recent Charge Attempts</h4>
                    <span className="text-[10px] text-on-surface-variant font-mono">{app.chargeAttempts.length}</span>
                  </div>
                  <div className="divide-y divide-outline-variant/40 max-h-[280px] overflow-y-auto">
                    {app.chargeAttempts.length === 0 ? (
                      <p className="p-4 text-sm text-on-surface-variant">No charge attempts yet.</p>
                    ) : app.chargeAttempts.map((attempt) => (
                      <div key={attempt.id} className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {attempt.status === 'succeeded' ? <CheckCircle2 className="w-4 h-4 text-secondary" /> : <XCircle className="w-4 h-4 text-error" />}
                            <p className="font-bold text-sm text-on-surface truncate">{attempt.type}</p>
                          </div>
                          <p className="font-mono text-[10px] text-on-surface-variant mt-1 truncate">{attempt.sessionId} / {formatDate(attempt.createdAt)}</p>
                          {attempt.proofId && <p className="font-mono text-[10px] text-on-surface-variant mt-1 truncate">Proof: {attempt.proofId}</p>}
                          {attempt.failureMessage && <p className="text-[11px] text-error mt-1">{attempt.failureCode}: {attempt.failureMessage}</p>}
                        </div>
                        <span className={attempt.status === 'succeeded' ? 'font-mono text-xs text-secondary' : 'font-mono text-xs text-error'}>{formatAmount(attempt.amount, attempt.currency)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
