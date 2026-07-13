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
  Plus,
  Search,
  ShieldCheck,
  Trash2,
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
type PaymentPurpose = NonNullable<CreateSessionPayload['paymentPurpose']>;
type ReleaseCadence = NonNullable<CreateSessionPayload['releaseCadence']>;
type RecipientWalletDraft = { id: string; name: string; email: string; address: string; fiberInvoice: string; amount: string };

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (sessionData: CreateSessionPayload) => void | Promise<void>;
  walletBalance: number;
  connectedWalletAddress: string;
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

const PAYMENT_PURPOSE_OPTIONS: Array<{ value: PaymentPurpose; label: string; detail: string; icon: 'activity' | 'wallet' | 'calendar' | 'shield' }> = [
  { value: 'app_session', label: 'App or API', detail: 'Usage-based charges under one cap.', icon: 'activity' },
  { value: 'subscription', label: 'Subscription', detail: 'Recurring services like AI tools or SaaS.', icon: 'shield' },
  { value: 'scheduled_release', label: 'Invoice', detail: 'Release once on a set date.', icon: 'calendar' },
  { value: 'recurring_release', label: 'Recurring payout', detail: 'Rent, fees, contractors, or retainers.', icon: 'wallet' }
];

const CADENCE_OPTIONS: Array<{ value: ReleaseCadence; label: string }> = [
  { value: 'on_demand', label: 'On request' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

function formatAmount(value: number, currency: string, maxDigits?: number): string {
  return formatCurrencyAmount(value, currency, maxDigits);
}

function newRecipientWalletDraft(): RecipientWalletDraft {
  return { id: 'recipient-' + Math.random().toString(36).slice(2, 10), name: '', email: '', address: '', fiberInvoice: '', amount: '' };
}

function isRecipientEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function cleanRecipientWallets(wallets: RecipientWalletDraft[]): Array<{ name: string; address?: string; email?: string; fiberInvoice?: string; amount?: number }> {
  return wallets
    .map((wallet) => ({
      name: wallet.name.trim(),
      email: wallet.email.trim().toLowerCase() || undefined,
      address: wallet.address.trim() || undefined,
      fiberInvoice: wallet.fiberInvoice.trim() || undefined,
      amount: wallet.amount.trim() ? Number.parseFloat(wallet.amount) : undefined
    }))
    .filter((wallet) => wallet.name || wallet.address || wallet.email || wallet.fiberInvoice || wallet.amount != null);
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

function purposeLabel(value: PaymentPurpose): string {
  return PAYMENT_PURPOSE_OPTIONS.find((option) => option.value === value)?.label ?? 'App or API';
}

function defaultCadenceForPurpose(value: PaymentPurpose): ReleaseCadence {
  if (value === 'subscription') return 'monthly';
  if (value === 'recurring_release') return 'monthly';
  return 'none';
}

function cadenceText(value: ReleaseCadence): string {
  if (value === 'weekly') return 'weekly';
  if (value === 'monthly') return 'monthly';
  if (value === 'custom') return 'on the selected schedule';
  if (value === 'on_demand') return 'when requested';
  return 'once';
}

function renderPurposeIcon(icon: 'activity' | 'wallet' | 'calendar' | 'shield') {
  if (icon === 'wallet') return <Wallet className="w-4 h-4 text-primary" />;
  if (icon === 'calendar') return <CalendarClock className="w-4 h-4 text-primary" />;
  if (icon === 'shield') return <ShieldCheck className="w-4 h-4 text-primary" />;
  return <Activity className="w-4 h-4 text-primary" />;
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  onCreateSession,
  walletBalance,
  connectedWalletAddress,
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
  const [secondaryControllerAddress, setSecondaryControllerAddress] = useState('');
  const [spendingLimit, setSpendingLimit] = useState('2.00');
  const [currency, setCurrency] = useState('CKB');
  const [expiryDateTime, setExpiryDateTime] = useState(dateFromNow(24));
  const [paymentPurpose, setPaymentPurpose] = useState<PaymentPurpose>('app_session');
  const [recipientWallets, setRecipientWallets] = useState<RecipientWalletDraft[]>(() => [newRecipientWalletDraft()]);
  const [paymentReference, setPaymentReference] = useState('');
  const [releaseCadence, setReleaseCadence] = useState<ReleaseCadence>('none');
  const [nextReleaseDateTime, setNextReleaseDateTime] = useState(dateFromNow(24));
  const [maxChargeAmount, setMaxChargeAmount] = useState('');
  const [conditionSummary, setConditionSummary] = useState('');
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
    setSecondaryControllerAddress('');
    setSpendingLimit('2.00');
    setCurrency('CKB');
    setExpiryDateTime(dateFromNow(24));
    setPaymentPurpose('app_session');
    setRecipientWallets([newRecipientWalletDraft()]);
    setPaymentReference('');
    setReleaseCadence('none');
    setNextReleaseDateTime(dateFromNow(24));
    setMaxChargeAmount('');
    setConditionSummary('');
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

  const effectiveReleaseCadence: ReleaseCadence = paymentPurpose === 'app_session' || paymentPurpose === 'scheduled_release' ? 'none' : releaseCadence === 'none' ? defaultCadenceForPurpose(paymentPurpose) : releaseCadence;
  const maxChargeNum = Number.parseFloat(maxChargeAmount);
  const normalizedMaxCharge = Number.isFinite(maxChargeNum) && maxChargeAmount.trim() ? maxChargeNum : undefined;
  const requiresRecipient = paymentPurpose === 'subscription' || paymentPurpose === 'scheduled_release' || paymentPurpose === 'recurring_release';
  const requiresReleaseDate = paymentPurpose === 'subscription' || paymentPurpose === 'scheduled_release' || paymentPurpose === 'recurring_release';
  const cleanedRecipientWallets = cleanRecipientWallets(recipientWallets);
  const primaryRecipient = cleanedRecipientWallets[0];
  const recipientSummary = cleanedRecipientWallets.length > 1 ? cleanedRecipientWallets.length + ' recipients' : primaryRecipient?.name ?? '';
  const connectedControllerAddress = connectedWalletAddress.trim();
  const secondaryController = secondaryControllerAddress.trim();
  const currentAppName = manualServiceName.trim();
  const currentServiceAddress = secondaryController || connectedControllerAddress;
  const currentChargePolicy = (() => {
    if (paymentPurpose === 'app_session') {
      if (singleUse) return 'One payment can be made, then unused balance is returned.';
      return autoMicroCharges ? 'Payments can repeat until the pass limit or expiry is reached.' : 'Payments only run from owner-controlled actions.';
    }
    if (paymentPurpose === 'subscription') {
      return 'Subscription may auto-charge ' + (normalizedMaxCharge ? 'up to ' + formatAmount(normalizedMaxCharge, currency, 8) + ' ' : '') + cadenceText(effectiveReleaseCadence) + ' while the pass is active.';
    }
    if (paymentPurpose === 'scheduled_release') {
      return 'Reserved funds auto-release once' + (recipientSummary ? ' to ' + recipientSummary : '') + ' on schedule. Fiber invoices execute through Fiber Network; CKB addresses settle from the vault.';
    }
    return 'Reserved funds auto-release ' + cadenceText(effectiveReleaseCadence) + (recipientSummary ? ' to ' + recipientSummary : '') + '. Fiber invoices execute through Fiber Network; CKB addresses settle from the vault.';
  })();

  const paymentBehavior = singleUse ? 'single' : autoMicroCharges ? 'automatic' : 'manual';

  const handlePaymentBehaviorChange = (value: string) => {
    if (value === 'single') {
      setSingleUse(true);
      setAutoMicroCharges(true);
      return;
    }
    setSingleUse(false);
    setAutoMicroCharges(value !== 'manual');
  };

  const handlePaymentPurposeChange = (value: PaymentPurpose) => {
    setPaymentPurpose(value);
    setReleaseCadence(defaultCadenceForPurpose(value));
    setSingleUse(value === 'scheduled_release');
    setAutoMicroCharges(true);
  };

  const validateDetails = (): boolean => {
    setErrorMessage('');

    if (!currentAppName) {
      setErrorMessage('Enter a pass name.');
      return false;
    }

    if (!isFiberCkbAddress(connectedControllerAddress)) {
      setErrorMessage('Connect a valid JoyID CKB wallet before creating a pass.');
      return false;
    }

    if (secondaryController && !isFiberCkbAddress(secondaryController)) {
      setErrorMessage(FIBER_CKB_ADDRESS_ERROR);
      return false;
    }

    if (!Number.isFinite(limitNum) || limitNum < resolvedPolicy.limits.min || limitNum > resolvedPolicy.limits.max) {
      setErrorMessage('Limit must be between ' + formatAmount(resolvedPolicy.limits.min, currency) + ' and ' + formatAmount(resolvedPolicy.limits.max, currency) + '.');
      return false;
    }

    if (limitNum > walletBalance) {
      setErrorMessage('Insufficient vault balance. Your maximum pass limit is ' + formatAmount(walletBalance, currency) + '.');
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

    if (requiresRecipient) {
      if (cleanedRecipientWallets.length === 0) {
        setErrorMessage('Add at least one recipient email or CKB wallet for this payment rule.');
        return false;
      }

      const invalidDestination = cleanedRecipientWallets.find((wallet) => {
        if (!wallet.name) return true;
        if (!wallet.email && !wallet.address && !wallet.fiberInvoice) return true;
        if (wallet.email && !isRecipientEmail(wallet.email)) return true;
        if (wallet.address && !isFiberCkbAddress(wallet.address)) return true;
        if (wallet.fiberInvoice && wallet.fiberInvoice.length < 16) return true;
        return false;
      });
      if (invalidDestination) {
        if (!invalidDestination.name) setErrorMessage('Each recipient needs a label.');
        else if (!invalidDestination.email && !invalidDestination.address && !invalidDestination.fiberInvoice) setErrorMessage('Each recipient needs a Fiber invoice, email invite, or CKB wallet address.');
        else if (invalidDestination.email && !isRecipientEmail(invalidDestination.email)) setErrorMessage('Enter a valid recipient email address.');
        else if (invalidDestination.fiberInvoice && invalidDestination.fiberInvoice.length < 16) setErrorMessage('Fiber payment request is too short. Paste the full invoice/payment request.');
        else setErrorMessage(FIBER_CKB_ADDRESS_ERROR);
        return false;
      }

      const invalidAmount = cleanedRecipientWallets.find((wallet) => !Number.isFinite(wallet.amount) || !wallet.amount || wallet.amount <= 0);
      if (invalidAmount) {
        setErrorMessage('Each recipient needs a payout amount.');
        return false;
      }

      const totalRecipientAmount = cleanedRecipientWallets.reduce((total, wallet) => total + (wallet.amount ?? 0), 0);
      if (totalRecipientAmount > normalizedLimit) {
        setErrorMessage('Recipient payout amounts cannot exceed the pass limit.');
        return false;
      }

      const addresses = cleanedRecipientWallets.map((wallet) => wallet.address?.toLowerCase()).filter((value): value is string => Boolean(value));
      if (new Set(addresses).size !== addresses.length) {
        setErrorMessage('Recipient wallet addresses must be unique.');
        return false;
      }

      const fiberInvoices = cleanedRecipientWallets.map((wallet) => wallet.fiberInvoice).filter((value): value is string => Boolean(value));
      if (new Set(fiberInvoices).size !== fiberInvoices.length) {
        setErrorMessage('Fiber payment requests must be unique.');
        return false;
      }

      const emails = cleanedRecipientWallets.map((wallet) => wallet.email).filter((value): value is string => Boolean(value));
      if (new Set(emails).size !== emails.length) {
        setErrorMessage('Recipient email addresses must be unique.');
        return false;
      }
    }

    if (maxChargeAmount.trim()) {
      if (!Number.isFinite(maxChargeNum) || maxChargeNum <= 0 || maxChargeNum > normalizedLimit) {
        setErrorMessage('Per-payment cap must be greater than 0 and no more than the pass limit.');
        return false;
      }
    }

    if (requiresReleaseDate) {
      const releaseDate = new Date(nextReleaseDateTime);
      if (Number.isNaN(releaseDate.getTime())) {
        setErrorMessage('Choose a valid release date and time.');
        return false;
      }
      if (releaseDate.getTime() <= Date.now() || releaseDate.getTime() > expiry.getTime()) {
        setErrorMessage('Release date must be in the future and before the pass expiry.');
        return false;
      }
    }

    return true;
  };

  const buildPayload = (): CreateSessionPayload => {
    const expiry = new Date(expiryDateTime);
    return {
      name: currentAppName,
      serviceAddress: currentServiceAddress,
      appId: 'manual',
      appUrl: undefined,
      appTrustLevel: secondaryController ? 'secondary-controller' : 'owner-controlled',
      appPermissions: ['Spend from this pass within its rule', 'Read pass status'],
      chargePolicy: currentChargePolicy,
      paymentPurpose,
      recipientName: requiresRecipient ? primaryRecipient?.name : undefined,
      recipientAddress: requiresRecipient ? primaryRecipient?.address : undefined,
      recipientWallets: requiresRecipient ? cleanedRecipientWallets : undefined,
      paymentReference: paymentReference.trim() || undefined,
      releaseCadence: effectiveReleaseCadence,
      nextReleaseAt: requiresReleaseDate ? new Date(nextReleaseDateTime).toISOString() : undefined,
      maxChargeAmount: normalizedMaxCharge,
      conditionSummary: conditionSummary.trim() || undefined,
      expiryAt: expiry.toISOString(),
      platformFeeEstimate,
      networkFeeEstimate,
      limit: normalizedLimit,
      currency,
      duration: 'until-expiry',
      expiryTime: expiry.toISOString(),
      autoMicroCharges: paymentPurpose === 'app_session' ? autoMicroCharges : true,
      singleUse: paymentPurpose === 'scheduled_release' && cleanedRecipientWallets.length <= 1 ? true : paymentPurpose === 'app_session' ? singleUse : false,
      iconType: 'rpc'
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

  const detailRows: Array<[string, string]> = [
    ['Type', purposeLabel(paymentPurpose)],
    ['Name', currentAppName || 'Not set'],
    ['Limit', formatAmount(normalizedLimit, currency)],
    ['Expiry', formatExpiry(expiryDateTime)]
  ];

  if (requiresRecipient) {
    detailRows.push(['Recipients', cleanedRecipientWallets.length > 1 ? cleanedRecipientWallets.length + ' recipients' : primaryRecipient?.name || 'Not set']);
    detailRows.push(['Release', formatExpiry(nextReleaseDateTime)]);
  }

  if (paymentPurpose === 'subscription' || paymentPurpose === 'recurring_release') {
    detailRows.push(['Cadence', cadenceText(effectiveReleaseCadence)]);
  }

  if (normalizedMaxCharge) {
    detailRows.push(['Per-payment cap', formatAmount(normalizedMaxCharge, currency, 8)]);
  }

  detailRows.push(['Platform fee estimate', formatAmount(platformFeeEstimate, currency, 8)]);
  detailRows.push(['Controller', secondaryController ? 'Secondary address' : 'Connected wallet']);
  detailRows.push(['Fiber network fee estimate', formatAmount(networkFeeEstimate, currency, 8)]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[760px] max-h-[92vh] bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl overflow-hidden relative flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/50 bg-surface-container/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Bolt className="w-6 h-6 text-primary fill-current shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-on-surface tracking-tight">Create FiberPass</h2>
              <p className="text-xs text-on-surface-variant truncate">{step === 'review' ? 'Review payment rule' : step === 'success' ? 'Pass created' : 'Purpose, limit, schedule, and policy'}</p>
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
                {successName} is active. Payments follow the rule until the pass is paused, closed, revoked, depleted, or expired.
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
                  <section className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="manual-service-name">Pass Name</label>
                      <input
                        id="manual-service-name"
                        type="text"
                        placeholder="e.g. Netflix, Claude Code, July invoice"
                        value={manualServiceName}
                        onChange={(event) => setManualServiceName(event.target.value)}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="payment-purpose">Payment Type</label>
                      <select
                        id="payment-purpose"
                        value={paymentPurpose}
                        onChange={(event) => handlePaymentPurposeChange(event.target.value as PaymentPurpose)}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                      >
                        {PAYMENT_PURPOSE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <details className="lg:col-span-2 rounded-lg border border-outline-variant bg-surface-container/50 px-4 py-3">
                      <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Advanced access (optional)</summary>
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <input
                          type="text"
                          placeholder="Secondary CKB address"
                          value={secondaryControllerAddress}
                          onChange={(event) => setSecondaryControllerAddress(event.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-xs font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                        />
                      </div>
                    </details>
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

                  <section className="flex flex-col gap-3">
                    {paymentPurpose === 'app_session' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-outline-variant bg-surface-container/60 p-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="payment-behavior">Payment Behavior</label>
                          <select
                            id="payment-behavior"
                            value={paymentBehavior}
                            onChange={(event) => handlePaymentBehaviorChange(event.target.value)}
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                          >
                            <option value="automatic">Repeat charges</option>
                            <option value="manual">Owner-triggered only</option>
                            <option value="single">Single payment</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="payment-reference">Reference</label>
                          <input
                            id="payment-reference"
                            type="text"
                            placeholder="Plan, API key, or account id"
                            value={paymentReference}
                            onChange={(event) => setPaymentReference(event.target.value)}
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-outline-variant bg-surface-container/60 p-4">
                        {requiresRecipient && (
                          <div className="md:col-span-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Recipient Payouts</label>
                              <button
                                type="button"
                                onClick={() => setRecipientWallets((wallets) => [...wallets, newRecipientWalletDraft()])}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-high px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:border-primary/50"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add recipient
                              </button>
                            </div>

                            <div className="flex flex-col gap-2">
                              {recipientWallets.map((wallet, index) => (
                                <div key={wallet.id} className="grid grid-cols-1 md:grid-cols-[0.7fr_1fr_1fr_1fr_0.45fr_auto] gap-2 rounded-lg border border-outline-variant/70 bg-surface-container-lowest/60 p-2">
                                  <input
                                    type="text"
                                    aria-label={`Recipient wallet ${index + 1} label`}
                                    placeholder="Recipient label"
                                    value={wallet.name}
                                    onChange={(event) => setRecipientWallets((wallets) => wallets.map((item) => item.id === wallet.id ? { ...item, name: event.target.value } : item))}
                                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                                  />
                                  <input
                                    type="email"
                                    aria-label={`Recipient ${index + 1} email`}
                                    placeholder="Recipient email"
                                    value={wallet.email}
                                    onChange={(event) => setRecipientWallets((wallets) => wallets.map((item) => item.id === wallet.id ? { ...item, email: event.target.value } : item))}
                                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                                  />
                                  <input
                                    type="text"
                                    aria-label={`Recipient ${index + 1} CKB address`}
                                    placeholder="CKB address (optional)"
                                    value={wallet.address}
                                    onChange={(event) => setRecipientWallets((wallets) => wallets.map((item) => item.id === wallet.id ? { ...item, address: event.target.value } : item))}
                                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-sm font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                                  />
                                  <input
                                    type="text"
                                    aria-label={`Recipient ${index + 1} Fiber payment request`}
                                    placeholder="Fiber invoice/request (optional)"
                                    value={wallet.fiberInvoice}
                                    onChange={(event) => setRecipientWallets((wallets) => wallets.map((item) => item.id === wallet.id ? { ...item, fiberInvoice: event.target.value } : item))}
                                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-sm font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    min={resolvedPolicy.limits.min}
                                    aria-label={`Recipient ${index + 1} payout amount`}
                                    placeholder="Amount"
                                    value={wallet.amount}
                                    onChange={(event) => setRecipientWallets((wallets) => wallets.map((item) => item.id === wallet.id ? { ...item, amount: event.target.value } : item))}
                                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 text-sm font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setRecipientWallets((wallets) => wallets.length > 1 ? wallets.filter((item) => item.id !== wallet.id) : wallets)}
                                    disabled={recipientWallets.length === 1}
                                    className="h-10 w-10 rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant hover:text-error hover:border-error/40 disabled:opacity-40 disabled:hover:text-on-surface-variant disabled:hover:border-outline-variant flex items-center justify-center"
                                    title="Remove recipient"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>

                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(paymentPurpose === 'subscription' || paymentPurpose === 'recurring_release') && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="release-cadence">Cadence</label>
                            <select
                              id="release-cadence"
                              value={releaseCadence}
                              onChange={(event) => setReleaseCadence(event.target.value as ReleaseCadence)}
                              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                            >
                              {CADENCE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {requiresReleaseDate && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="release-date">Release Date</label>
                            <input
                              id="release-date"
                              type="datetime-local"
                              value={nextReleaseDateTime}
                              min={dateFromNow(resolvedPolicy.expiry.minMinutes / 60)}
                              max={expiryDateTime}
                              onChange={(event) => setNextReleaseDateTime(event.target.value)}
                              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-sm font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                            />
                          </div>
                        )}

                        {(paymentPurpose === 'subscription' || paymentPurpose === 'recurring_release') && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="max-charge">Per-Payment Cap</label>
                            <input
                              id="max-charge"
                              type="number"
                              step="0.01"
                              min={resolvedPolicy.limits.min}
                              max={normalizedLimit || resolvedPolicy.limits.max}
                              placeholder={spendingLimit || '0.00'}
                              value={maxChargeAmount}
                              onChange={(event) => setMaxChargeAmount(event.target.value)}
                              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-sm font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                            />
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="payment-reference">Reference</label>
                          <input
                            id="payment-reference"
                            type="text"
                            placeholder={paymentPurpose === 'subscription' ? 'Subscription id or plan' : 'Invoice, lease, or contract id'}
                            value={paymentReference}
                            onChange={(event) => setPaymentReference(event.target.value)}
                            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                          />
                        </div>

                        {paymentPurpose !== 'subscription' && (
                          <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="condition-summary">Condition</label>
                            <input
                              id="condition-summary"
                              type="text"
                              placeholder="e.g. Invoice approved, service completed, or rent due"
                              value={conditionSummary}
                              onChange={(event) => setConditionSummary(event.target.value)}
                              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-outline-variant"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4">
                      <Wallet className="w-4 h-4 text-primary mb-2" />
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Available Vault Balance</p>
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
                      <p className="text-[11px] text-on-surface-variant mt-1">{secondaryController ? 'Secondary access' : 'Connected wallet'}</p>
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
                        This creates a prepaid, revocable FiberPass. Payments cannot exceed the limit, run after expiry, or continue after pause, close, or revoke.
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-2">Charge Policy</p>
                      <p className="text-sm text-on-surface">{currentChargePolicy}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant mb-2">Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {['Spend from this pass within its rule', 'Read pass status'].map((permission) => (
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
