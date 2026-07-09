/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bolt,
  CalendarClock,
  CheckCircle2,
  Cloud,
  Code,
  Cpu,
  Database,
  ExternalLink,
  Link2,
  LoaderCircle,
  MessageSquare,
  Search,
  ShieldCheck,
  Video,
  Wallet,
  X
} from 'lucide-react';
import { type CreateSessionPayload, type CreateSessionPolicy, type VerifiedApp, sessionsApi } from '../lib/sessionsApi';
import { FIBER_CKB_ADDRESS_ERROR, isFiberCkbAddress } from '../lib/fiberAddress';
import { type Session } from '../types';
import { formatCurrencyAmount } from '../lib/currency';

type FlowStep = 'details' | 'review' | 'success';
type AppMode = 'verified' | 'manual';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (sessionData: CreateSessionPayload) => void | Promise<void>;
  walletBalance: number;
  isSubmitting?: boolean;
}

const FALLBACK_POLICY: CreateSessionPolicy = {
  limits: {
    min: 0.01,
    max: 100000,
    currency: 'CKB'
  },
  expiry: {
    minMinutes: 5,
    maxDays: 30
  },
  fees: {
    platformFeeBps: 50,
    minPlatformFee: 0.01,
    estimatedNetworkFee: 0.001
  },
  verifiedApps: []
};

const LIMIT_PRESETS = [0.05, 0.1, 0.25, 0.5, 1];

function formatAmount(value: number, currency: string, maxDigits?: number): string {
  return formatCurrencyAmount(value, currency, maxDigits);
}

function toDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function dateFromNow(hours: number): string {
  return toDateTimeLocal(new Date(Date.now() + hours * 60 * 60 * 1000));
}

function formatExpiry(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid expiry';
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  onCreateSession,
  walletBalance,
  isSubmitting = false
}: CreateSessionModalProps) {
  const [step, setStep] = useState<FlowStep>('details');
  const [appMode, setAppMode] = useState<AppMode>('verified');
  const [policy, setPolicy] = useState<CreateSessionPolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState('');
  const [selectedAppId, setSelectedAppId] = useState('');
  const [appSearch, setAppSearch] = useState('');
  const [manualServiceName, setManualServiceName] = useState('');
  const [manualServiceAddress, setManualServiceAddress] = useState('');
  const [spendingLimit, setSpendingLimit] = useState('2.00');
  const [currency, setCurrency] = useState('CKB');
  const [expiryDateTime, setExpiryDateTime] = useState(dateFromNow(24));
  const [autoMicroCharges, setAutoMicroCharges] = useState(true);
  const [singleUse, setSingleUse] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successName, setSuccessName] = useState('');

  const resolvedPolicy = policy ?? FALLBACK_POLICY;
  const verifiedApps = resolvedPolicy.verifiedApps;
  const selectedApp = verifiedApps.find((app) => app.id === selectedAppId) ?? verifiedApps[0];

  const filteredApps = useMemo(() => {
    const query = appSearch.trim().toLowerCase();
    if (!query) return verifiedApps;
    return verifiedApps.filter((app) =>
      app.name.toLowerCase().includes(query) ||
      app.category.toLowerCase().includes(query) ||
      app.description.toLowerCase().includes(query)
    );
  }, [appSearch, verifiedApps]);

  const limitNum = Number.parseFloat(spendingLimit);
  const normalizedLimit = Number.isFinite(limitNum) ? limitNum : 0;
  const platformFeeEstimate = Math.max(
    resolvedPolicy.fees.minPlatformFee,
    normalizedLimit * (resolvedPolicy.fees.platformFeeBps / 10000)
  );
  const networkFeeEstimate = resolvedPolicy.fees.estimatedNetworkFee;
  const totalEstimatedReserve = normalizedLimit + platformFeeEstimate + networkFeeEstimate;

  useEffect(() => {
    if (!isOpen) return;

    setStep('details');
    setAppMode('verified');
    setPolicy(null);
    setPolicyError('');
    setSelectedAppId('');
    setAppSearch('');
    setManualServiceName('');
    setManualServiceAddress('');
    setSpendingLimit('2.00');
    setCurrency('CKB');
    setExpiryDateTime(dateFromNow(24));
    setAutoMicroCharges(true);
    setSingleUse(false);
    setErrorMessage('');
    setSuccessName('');

    let isMounted = true;
    setPolicyLoading(true);
    sessionsApi.getCreatePolicy()
      .then((nextPolicy) => {
        if (!isMounted) return;
        const firstVerifiedApp = nextPolicy.verifiedApps[0];
        setPolicy(nextPolicy);
        setCurrency(nextPolicy.limits.currency);
        setSelectedAppId(firstVerifiedApp?.id ?? '');
        setAppMode(firstVerifiedApp ? 'verified' : 'manual');
      })
      .catch((error) => {
        if (!isMounted) return;
        setPolicyError(error instanceof Error ? error.message : 'Could not load create-pass policy.');
      })
      .finally(() => {
        if (isMounted) setPolicyLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const renderAppIcon = (type: Session['iconType']) => {
    switch (type) {
      case 'cloud':
        return <Cloud className="w-4 h-4 text-primary" />;
      case 'code':
        return <Code className="w-4 h-4 text-primary" />;
      case 'database':
        return <Database className="w-4 h-4 text-primary" />;
      case 'cpu':
        return <Cpu className="w-4 h-4 text-primary" />;
      case 'ai':
        return <MessageSquare className="w-4 h-4 text-primary" />;
      case 'video':
        return <Video className="w-4 h-4 text-primary" />;
      case 'rpc':
        return <Activity className="w-4 h-4 text-primary" />;
      default:
        return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  const currentAppName = appMode === 'verified' ? selectedApp?.name ?? '' : manualServiceName.trim();
  const currentServiceAddress = appMode === 'verified' ? selectedApp?.serviceAddress ?? '' : manualServiceAddress.trim();
  const currentChargePolicy = appMode === 'verified' ? selectedApp?.chargePolicy : autoMicroCharges ? 'Manual Fiber app may charge until the pass limit is reached.' : 'Manual Fiber app can be charged once after owner action.';

  const validateDetails = (): boolean => {
    setErrorMessage('');

    if (appMode === 'verified' && !selectedApp) {
      setErrorMessage('Select a verified app or switch to manual advanced mode.');
      return false;
    }

    if (appMode === 'manual') {
      if (!manualServiceName.trim()) {
        setErrorMessage('Enter the manual app name.');
        return false;
      }

      if (!isFiberCkbAddress(manualServiceAddress)) {
        setErrorMessage(FIBER_CKB_ADDRESS_ERROR);
        return false;
      }
    }

    if (!Number.isFinite(limitNum) || limitNum < resolvedPolicy.limits.min || limitNum > resolvedPolicy.limits.max) {
      setErrorMessage('Limit must be between ' + formatAmount(resolvedPolicy.limits.min, currency) + ' and ' + formatAmount(resolvedPolicy.limits.max, currency) + '.');
      return false;
    }

    if (limitNum > walletBalance) {
      setErrorMessage('Insufficient wallet balance. Your maximum pass limit is ' + formatAmount(walletBalance, currency) + '.');
      return false;
    }

    const expiry = new Date(expiryDateTime);
    if (Number.isNaN(expiry.getTime())) {
      setErrorMessage('Choose a valid expiry date and time.');
      return false;
    }

    const minExpiry = Date.now() + resolvedPolicy.expiry.minMinutes * 60 * 1000;
    const maxExpiry = Date.now() + resolvedPolicy.expiry.maxDays * 24 * 60 * 60 * 1000;
    if (expiry.getTime() < minExpiry || expiry.getTime() > maxExpiry) {
      setErrorMessage('Expiry must be between ' + resolvedPolicy.expiry.minMinutes + ' minutes and ' + resolvedPolicy.expiry.maxDays + ' days from now.');
      return false;
    }

    return true;
  };

  const buildPayload = (): CreateSessionPayload => {
    const expiry = new Date(expiryDateTime);
    return {
      name: currentAppName,
      serviceAddress: currentServiceAddress,
      appId: appMode === 'verified' ? selectedApp?.id : 'manual',
      appUrl: appMode === 'verified' ? selectedApp?.url : undefined,
      appTrustLevel: appMode === 'verified' ? selectedApp?.trustLevel : 'manual',
      appPermissions: appMode === 'verified' ? selectedApp?.permissions : ['Charge through FiberPass API', 'Read pass status'],
      chargePolicy: currentChargePolicy,
      expiryAt: expiry.toISOString(),
      platformFeeEstimate,
      networkFeeEstimate,
      limit: normalizedLimit,
      currency,
      duration: 'until-expiry',
      expiryTime: expiry.toISOString(),
      autoMicroCharges,
      singleUse,
      iconType: appMode === 'verified' ? selectedApp?.iconType ?? 'rpc' : 'rpc'
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (step === 'details') {
      if (validateDetails()) setStep('review');
      return;
    }

    if (!validateDetails()) return;

    try {
      await onCreateSession(buildPayload());
      setSuccessName(currentAppName);
      setStep('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create FiberPass session.');
    }
  };

  const detailRows = [
    ['App', currentAppName || 'Not selected'],
    ['Limit', formatAmount(normalizedLimit, currency)],
    ['Expiry', formatExpiry(expiryDateTime)],
    ['Platform fee estimate', formatAmount(platformFeeEstimate, currency, 8)],
    ['Fiber network fee estimate', formatAmount(networkFeeEstimate, currency, 8)]
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[760px] max-h-[92vh] bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl overflow-hidden relative flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/50 bg-surface-container/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Bolt className="w-6 h-6 text-primary fill-current shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-on-surface tracking-tight">Create FiberPass</h2>
              <p className="text-xs text-on-surface-variant truncate">{step === 'review' ? 'Review pass contract' : step === 'success' ? 'Pass created' : 'App, limit, expiry, and payment policy'}</p>
            </div>
          </div>
          <button
            id="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-variant transition-colors disabled:opacity-60"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {step === 'success' ? (
          <div className="p-8 flex flex-col items-center text-center gap-5 overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl border border-secondary/30 bg-secondary/10 flex items-center justify-center text-secondary">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-on-surface">FiberPass Created</h3>
              <p className="text-sm text-on-surface-variant max-w-md">
                {successName} can now charge within the approved limit until the pass is paused, closed, revoked, depleted, or expired.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="bg-primary text-on-primary hover:bg-primary-fixed py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              View Active Passes
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            <div className="p-6 flex flex-col gap-6 overflow-y-auto">
              {(errorMessage || policyError) && (
                <div className="bg-error/10 border border-error/30 text-error rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                  {errorMessage || policyError}
                </div>
              )}

              {step === 'details' ? (
                <>
                  <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">App</label>
                      <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant w-full max-w-[280px]">
                        <button
                          type="button"
                          onClick={() => setAppMode('verified')}
                          className={appMode === 'verified' ? 'py-2 rounded-lg text-xs font-bold bg-surface-variant text-on-surface border border-outline-variant/60' : 'py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface'}
                        >
                          Verified
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppMode('manual')}
                          className={appMode === 'manual' ? 'py-2 rounded-lg text-xs font-bold bg-surface-variant text-on-surface border border-outline-variant/60' : 'py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface'}
                        >
                          Manual
                        </button>
                      </div>
                    </div>

                    {appMode === 'verified' ? (
                      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
                        <div className="flex flex-col gap-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                            <input
                              type="text"
                              placeholder={policyLoading ? 'Loading apps...' : 'Search verified Fiber apps'}
                              value={appSearch}
                              onChange={(event) => setAppSearch(event.target.value)}
                              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                            />
                          </div>

                          <div className="grid gap-2 max-h-[260px] overflow-y-auto pr-1">
                            {filteredApps.length === 0 ? (
                              <div className="border border-outline-variant border-dashed rounded-xl p-4 text-sm text-on-surface-variant">
                                {verifiedApps.length === 0 ? 'No verified Fiber apps are available yet. Use manual mode with a CKB address.' : 'No verified Fiber apps match this search.'}
                              </div>
                            ) : filteredApps.map((app) => (
                              <button
                                key={app.id}
                                type="button"
                                onClick={() => setSelectedAppId(app.id)}
                                className={(selectedApp?.id === app.id ? 'border-primary bg-primary/10 ' : 'border-outline-variant bg-surface-container ') + 'w-full text-left rounded-xl border p-4 transition-colors hover:border-primary/60'}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-9 h-9 rounded-lg border border-outline-variant bg-surface-container-highest flex items-center justify-center shrink-0">
                                    {renderAppIcon(app.iconType)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-sm text-on-surface truncate">{app.name}</span>
                                      <span className="text-[9px] uppercase tracking-wider font-bold text-secondary border border-secondary/30 rounded-full px-2 py-0.5 shrink-0">{app.trustLevel}</span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{app.description}</p>
                                    <p className="font-mono text-[10px] text-outline mt-2 truncate">{app.chargePolicy}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 flex flex-col gap-3 min-h-[220px]">
                          {selectedApp ? (
                            <>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Selected App</p>
                                  <h3 className="font-bold text-on-surface mt-1">{selectedApp.name}</h3>
                                </div>
                                <a href={selectedApp.url} target="_blank" rel="noreferrer" className="text-primary hover:text-secondary transition-colors" title="Open app URL">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                              <div className="space-y-2 text-xs text-on-surface-variant">
                                <div className="flex justify-between gap-3"><span>Category</span><span className="font-semibold text-on-surface">{selectedApp.category}</span></div>
                                <div className="flex justify-between gap-3"><span>Default charge</span><span className="font-mono text-secondary">{formatAmount(selectedApp.defaultCharge, currency, 8)}</span></div>
                                <div className="flex justify-between gap-3"><span>Fiber address</span><span className="font-mono text-[10px] text-on-surface truncate max-w-[180px]">{selectedApp.serviceAddress}</span></div>
                              </div>
                              <div className="border-t border-outline-variant/50 pt-3">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-2">Requested Permissions</p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedApp.permissions.map((permission) => (
                                    <span key={permission} className="text-[10px] rounded-full border border-outline-variant bg-surface-container-high px-2 py-1 text-on-surface-variant">
                                      {permission}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full text-sm text-on-surface-variant">Select an app to preview details.</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="manual-service-name">App Name</label>
                          <input
                            id="manual-service-name"
                            type="text"
                            placeholder="e.g. My API app"
                            value={manualServiceName}
                            onChange={(event) => setManualServiceName(event.target.value)}
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="manual-service-address">Fiber App Address</label>
                          <div className="relative">
                            <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant w-4 h-4" />
                            <input
                              id="manual-service-address"
                              type="text"
                              placeholder="ckt1... or ckb1..."
                              value={manualServiceAddress}
                              onChange={(event) => setManualServiceAddress(event.target.value)}
                              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="spending-limit">Spending Limit</label>
                        <span className="font-mono text-[10px] text-outline font-semibold">Balance: {formatAmount(walletBalance, currency)}</span>
                      </div>

                      <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                        <input
                          id="spending-limit"
                          type="number"
                          step="0.01"
                          min={resolvedPolicy.limits.min}
                          max={resolvedPolicy.limits.max}
                          value={spendingLimit}
                          onChange={(event) => setSpendingLimit(event.target.value)}
                          className="flex-grow bg-transparent border-none py-3 px-4 text-xl font-mono text-on-surface focus:ring-0 focus:outline-none placeholder:text-outline-variant"
                        />
                        <div className="flex items-center px-4 border-l border-outline-variant bg-surface-container h-full text-xs font-bold text-on-surface">
                          {currency}
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {LIMIT_PRESETS.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setSpendingLimit(amount.toFixed(2))}
                            className="py-1.5 rounded border border-outline-variant bg-surface-container text-on-surface-variant font-mono text-xs hover:border-primary hover:text-primary transition-colors cursor-pointer"
                          >
                            {amount}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-on-surface-variant">Allowed range: {formatAmount(resolvedPolicy.limits.min, currency)} to {formatAmount(resolvedPolicy.limits.max, currency)}.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="expiry-date">Expiry</label>
                        <span className="font-mono text-[10px] text-primary font-bold">{formatExpiry(expiryDateTime)}</span>
                      </div>
                      <input
                        id="expiry-date"
                        type="datetime-local"
                        value={expiryDateTime}
                        min={dateFromNow(resolvedPolicy.expiry.minMinutes / 60)}
                        max={dateFromNow(resolvedPolicy.expiry.maxDays * 24)}
                        onChange={(event) => setExpiryDateTime(event.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 px-4 text-sm font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => setExpiryDateTime(dateFromNow(1))} className="py-1.5 rounded border border-outline-variant bg-surface-container text-on-surface-variant font-mono text-xs hover:border-primary hover:text-primary">1H</button>
                        <button type="button" onClick={() => setExpiryDateTime(dateFromNow(24))} className="py-1.5 rounded border border-outline-variant bg-surface-container text-on-surface-variant font-mono text-xs hover:border-primary hover:text-primary">24H</button>
                        <button type="button" onClick={() => setExpiryDateTime(dateFromNow(24 * 7))} className="py-1.5 rounded border border-outline-variant bg-surface-container text-on-surface-variant font-mono text-xs hover:border-primary hover:text-primary">7D</button>
                      </div>
                      <p className="text-[11px] text-on-surface-variant">Maximum expiry: {resolvedPolicy.expiry.maxDays} days.</p>
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAutoMicroCharges(!autoMicroCharges)}
                      className="flex items-center justify-between p-4 border border-outline-variant rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer text-left"
                    >
                      <div className="pr-4 min-w-0">
                        <span className="font-bold text-sm text-on-surface block">Continuous charging</span>
                        <span className="text-[11px] text-on-surface-variant leading-relaxed">App can charge repeatedly until the pass limit or expiry is reached.</span>
                      </div>
                      <span className={autoMicroCharges ? 'w-11 h-6 rounded-full bg-secondary relative shrink-0' : 'w-11 h-6 rounded-full bg-surface-container-highest border border-outline-variant relative shrink-0'}>
                        <span className={autoMicroCharges ? 'absolute top-[2px] left-[21px] bg-surface-container-lowest w-[18px] h-[18px] rounded-full' : 'absolute top-[2px] left-[2px] bg-surface-container-lowest w-[18px] h-[18px] rounded-full'} />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSingleUse(!singleUse)}
                      className="flex items-center justify-between p-4 border border-outline-variant rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer text-left"
                    >
                      <div className="pr-4 min-w-0">
                        <span className="font-bold text-sm text-on-surface block">Single use</span>
                        <span className="text-[11px] text-on-surface-variant leading-relaxed">Pass settles after the first successful charge and refunds the remainder.</span>
                      </div>
                      <span className={singleUse ? 'w-11 h-6 rounded-full bg-secondary relative shrink-0' : 'w-11 h-6 rounded-full bg-surface-container-highest border border-outline-variant relative shrink-0'}>
                        <span className={singleUse ? 'absolute top-[2px] left-[21px] bg-surface-container-lowest w-[18px] h-[18px] rounded-full' : 'absolute top-[2px] left-[2px] bg-surface-container-lowest w-[18px] h-[18px] rounded-full'} />
                      </span>
                    </button>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4">
                      <Wallet className="w-4 h-4 text-primary mb-2" />
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Available Fiber Balance</p>
                      <p className="font-mono text-lg font-bold text-on-surface mt-1">{formatAmount(walletBalance, currency)}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4">
                      <ShieldCheck className="w-4 h-4 text-secondary mb-2" />
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Platform Fee Estimate</p>
                      <p className="font-mono text-lg font-bold text-on-surface mt-1">{formatAmount(platformFeeEstimate, currency, 8)}</p>
                    </div>
                    <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4">
                      <CalendarClock className="w-4 h-4 text-primary mb-2" />
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Network Fee Estimate</p>
                      <p className="font-mono text-lg font-bold text-on-surface mt-1">{formatAmount(networkFeeEstimate, currency, 8)}</p>
                    </div>
                  </section>
                </>
              ) : (
                <section className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-5">
                  <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-5 flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Review Before Authorization</p>
                      <h3 className="text-xl font-bold text-on-surface mt-1">{currentAppName}</h3>
                      <p className="font-mono text-[10px] text-on-surface-variant mt-1 break-all">{currentServiceAddress}</p>
                    </div>

                    <div className="space-y-2">
                      {detailRows.map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4 text-sm border-b border-outline-variant/30 pb-2 last:border-b-0">
                          <span className="text-on-surface-variant">{label}</span>
                          <span className="font-semibold text-on-surface text-right">{value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between gap-4 text-sm pt-2">
                        <span className="text-on-surface-variant">Estimated total impact</span>
                        <span className="font-mono font-bold text-primary text-right">{formatAmount(totalEstimatedReserve, currency, 8)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 flex flex-col gap-4">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    <div>
                      <h4 className="font-bold text-on-surface">Wallet Authorization</h4>
                      <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                        This creates a prepaid, revocable FiberPass for the selected app. The app cannot exceed the limit, charge after expiry, or charge after pause, close, or revoke.
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-2">Charge Policy</p>
                      <p className="text-sm text-on-surface">{currentChargePolicy}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-2">Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {(appMode === 'verified' ? selectedApp?.permissions ?? [] : ['Charge through FiberPass API', 'Read pass status']).map((permission) => (
                          <span key={permission} className="text-[10px] rounded-full border border-outline-variant bg-surface-container-high px-2 py-1 text-on-surface-variant">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-outline-variant bg-surface-container-lowest/40 p-6 flex flex-col sm:flex-row gap-3 shrink-0">
              {step === 'review' ? (
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  disabled={isSubmitting}
                  className="sm:w-40 bg-surface border border-outline hover:border-white text-on-surface-variant hover:text-white transition-colors py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="sm:w-40 bg-surface border border-outline hover:border-white text-on-surface-variant hover:text-white transition-colors py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting || policyLoading}
                className="flex-1 bg-primary text-on-primary hover:bg-primary-fixed py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:shadow-[0_0_20px_rgba(176,198,255,0.25)] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Creating...' : step === 'review' ? 'Authorize FiberPass' : 'Review Pass'}</span>
                {isSubmitting || policyLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
