/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, Code, Copy, KeyRound, LoaderCircle, Plus, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { type DeveloperApp } from '../lib/appsApi';

interface DeveloperAppsViewProps {
  apps: DeveloperApp[];
  isLoading: boolean;
  error: string;
  generatedKey: { appId: string; secret: string; keyPrefix: string } | null;
  onCreateApp: (payload: { name: string; serviceAddress: string; url?: string; category: string; description?: string }) => Promise<void>;
  onCreateApiKey: (appId: string, label: string) => Promise<void>;
  onRevokeApiKey: (appId: string, keyId: string) => Promise<void>;
  onClearGeneratedKey: () => void;
}

function formatDate(value?: string): string {
  if (!value) return 'Never';
  return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatAmount(value: number, currency: string): string {
  return '$' + value.toFixed(3) + ' ' + currency;
}

export default function DeveloperAppsView({
  apps,
  isLoading,
  error,
  generatedKey,
  onCreateApp,
  onCreateApiKey,
  onRevokeApiKey,
  onClearGeneratedKey
}: DeveloperAppsViewProps) {
  const [name, setName] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('AI/API');
  const [description, setDescription] = useState('');
  const [keyLabels, setKeyLabels] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const handleCreateApp = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    const isENS = serviceAddress.endsWith('.eth');
    const isHex = serviceAddress.startsWith('0x') && serviceAddress.length === 42;
    if (!name.trim() || (!isENS && !isHex)) {
      setFormError('Enter an app name and valid app address or ENS name.');
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

  return (
    <div className="w-full flex flex-col gap-8 animate-[fade-in_0.3s_ease-out]">
      <header className="border-b border-outline-variant/60 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">Developer Apps</h1>
          <p className="text-sm text-on-surface-variant mt-1">Create app identities, issue API keys, and inspect charge attempts.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-primary" /> : <ShieldCheck className="w-4 h-4 text-secondary" />}
          App-scoped charge auth enabled
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
              <p className="text-xs text-on-surface-variant mt-1">This secret is shown once. Store it server-side for app charge requests.</p>
            </div>
            <button type="button" onClick={onClearGeneratedKey} className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2">
            <input readOnly value={generatedKey.secret} className="flex-1 bg-transparent font-mono text-xs text-primary outline-none" />
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
            App Address
            <input value={serviceAddress} onChange={(event) => setServiceAddress(event.target.value)} placeholder="0x... or app.eth" className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-sm normal-case font-mono text-on-surface focus:outline-none focus:border-primary" />
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
        ) : apps.map((app) => (
          <article key={app.id} className="border border-outline-variant bg-surface-container-low/50 rounded-xl p-5 flex flex-col gap-5">
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-xl text-on-surface truncate">{app.name}</h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold border border-secondary/30 text-secondary rounded-full px-2 py-0.5">{app.status}</span>
                </div>
                <p className="font-mono text-[10px] text-on-surface-variant mt-1 break-all">{app.id} / {app.serviceAddress}</p>
                {app.description && <p className="text-sm text-on-surface-variant mt-2">{app.description}</p>}
              </div>
              <div className="flex gap-2">
                <input value={keyLabels[app.id] ?? 'Server key'} onChange={(event) => setKeyLabels(prev => ({ ...prev, [app.id]: event.target.value }))} className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary" />
                <button type="button" onClick={() => onCreateApiKey(app.id, keyLabels[app.id] ?? 'Server key')} disabled={isLoading} className="bg-primary/15 text-primary border border-primary/30 rounded-lg px-3 py-2 text-xs font-bold uppercase flex items-center gap-2 disabled:opacity-70">
                  <KeyRound className="w-4 h-4" />
                  New Key
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="rounded-xl border border-outline-variant/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container/60 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-on-surface">API Keys</h4>
                  <span className="text-[10px] text-on-surface-variant font-mono">{app.apiKeys.length}</span>
                </div>
                <div className="divide-y divide-outline-variant/40">
                  {app.apiKeys.length === 0 ? (
                    <p className="p-4 text-sm text-on-surface-variant">No keys issued.</p>
                  ) : app.apiKeys.map((key) => (
                    <div key={key.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-on-surface truncate">{key.label}</p>
                        <p className="font-mono text-[10px] text-on-surface-variant truncate">{key.keyPrefix}... / last used {formatDate(key.lastUsedAt)}</p>
                      </div>
                      <button type="button" onClick={() => onRevokeApiKey(app.id, key.id)} disabled={isLoading || key.status === 'revoked'} className="text-error border border-error/30 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase disabled:opacity-50">
                        {key.status === 'revoked' ? 'Revoked' : 'Revoke'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant/60 overflow-hidden">
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
                        {attempt.failureMessage && <p className="text-[11px] text-error mt-1">{attempt.failureCode}: {attempt.failureMessage}</p>}
                      </div>
                      <span className={attempt.status === 'succeeded' ? 'font-mono text-xs text-secondary' : 'font-mono text-xs text-error'}>{formatAmount(attempt.amount, attempt.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
