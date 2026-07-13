import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, LoaderCircle, Plus, RefreshCw, Wallet, X } from 'lucide-react';
import { type WalletFundingConfig, type WalletFundingRequest } from '../lib/walletApi';
import { formatCurrencyAmount } from '../lib/currency';

interface LoadFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  fundingConfig: WalletFundingConfig | null;
  fundingRequests: WalletFundingRequest[];
  isLoading: boolean;
  error: string;
  onCreateFundingRequest: (amount: number) => Promise<WalletFundingRequest>;
  onConfirmFundingRequest: (fundingId: string, proofId: string) => Promise<void>;
  onSyncFunding: () => Promise<void>;
}

function formatAmount(value: number, currency: string): string {
  return formatCurrencyAmount(value, currency);
}

function formatDate(value?: string): string {
  if (!value) return '';
  return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function shortValue(value: string): string {
  if (value.length <= 18) return value;
  return value.slice(0, 10) + '...' + value.slice(-8);
}

export default function LoadFundsModal({
  isOpen,
  onClose,
  currency,
  fundingConfig,
  fundingRequests,
  isLoading,
  error,
  onCreateFundingRequest,
  onConfirmFundingRequest,
  onSyncFunding
}: LoadFundsModalProps) {
  const pendingRequests = useMemo(() => fundingRequests.filter((request) => request.status === 'pending'), [fundingRequests]);
  const [amount, setAmount] = useState('5.00');
  const [activeRequest, setActiveRequest] = useState<WalletFundingRequest | null>(null);
  const [proofId, setProofId] = useState('');
  const [localError, setLocalError] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLocalError('');
    setProofId('');
    setActiveRequest(pendingRequests[0] ?? null);
    if (fundingConfig?.minAmount) {
      setAmount(String(fundingConfig.minAmount));
    }
  }, [isOpen, pendingRequests, fundingConfig?.minAmount]);

  if (!isOpen) return null;

  const configReady = Boolean(fundingConfig?.configured && fundingConfig.depositAddress);
  const displayedRequest = activeRequest ?? pendingRequests[0] ?? null;
  const displayedError = localError || error;

  const copyText = (value: string) => {
    void navigator.clipboard?.writeText(value);
  };

  const handleCreateRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');

    const numericAmount = Number.parseFloat(amount);
    const minAmount = fundingConfig?.minAmount ?? 0.01;
    if (!Number.isFinite(numericAmount) || numericAmount < minAmount) {
      setLocalError('Enter at least ' + formatAmount(minAmount, fundingConfig?.currency ?? currency) + ' for a CKB vault cell.');
      return;
    }

    try {
      const request = await onCreateFundingRequest(numericAmount);
      setActiveRequest(request);
      setProofId('');
    } catch (requestError) {
      setLocalError(requestError instanceof Error ? requestError.message : 'Could not create funding request.');
    }
  };

  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');

    if (!displayedRequest) {
      setLocalError('Create a funding request first.');
      return;
    }

    if (!/^0x[0-9a-fA-F]{64}$/.test(proofId.trim())) {
      setLocalError('Enter a valid CKB testnet transaction hash.');
      return;
    }

    try {
      await onConfirmFundingRequest(displayedRequest.id, proofId.trim());
      onClose();
    } catch (requestError) {
      setLocalError(requestError instanceof Error ? requestError.message : 'Could not confirm funding request.');
    }
  };

  const handleSync = async () => {
    setLocalError('');
    setSyncing(true);
    try {
      await onSyncFunding();
    } catch (requestError) {
      setLocalError(requestError instanceof Error ? requestError.message : 'Could not sync CKB vault deposits.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[720px] max-h-[92vh] bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl overflow-hidden relative flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/50 bg-surface-container/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Wallet className="w-6 h-6 text-primary shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-on-surface tracking-tight">Load Vault Funds</h2>
              <p className="text-xs text-on-surface-variant truncate">Send testnet CKB to your vault, then confirm or sync the transaction.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-variant transition-colors disabled:opacity-60"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {displayedError && (
            <div className="bg-error/10 border border-error/30 text-error rounded-xl p-3 text-xs font-semibold">
              {displayedError}
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 flex flex-col gap-4">
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Vault Address</span>
                <div className="mt-2 flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2">
                  <span className="flex-1 font-mono text-xs text-on-surface truncate">
                    {fundingConfig?.depositAddress ? shortValue(fundingConfig.depositAddress) : 'Not configured'}
                  </span>
                  {fundingConfig?.depositAddress && (
                    <button type="button" onClick={() => copyText(fundingConfig.depositAddress)} className="p-1.5 text-primary hover:text-secondary" title="Copy vault address">
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Network</span>
                  <p className="font-mono text-on-surface mt-1">{fundingConfig?.network ?? 'Loading'}</p>
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Asset</span>
                  <p className="font-mono text-on-surface mt-1">{fundingConfig?.currency ?? currency}</p>
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Mode</span>
                  <p className="font-mono text-on-surface mt-1">{fundingConfig?.depositMode ?? 'treasury'}</p>
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Minimum</span>
                  <p className="font-mono text-on-surface mt-1 truncate">{formatAmount(fundingConfig?.minAmount ?? 0, fundingConfig?.currency ?? currency)}</p>
                </div>
              </div>

              {!configReady && (
                <p className="text-xs text-error rounded-lg border border-error/30 bg-error/10 px-3 py-2">
                  Backend CKB vault funding is not configured.
                </p>
              )}
            </div>

            <form onSubmit={handleCreateRequest} className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Amount
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden focus-within:border-primary">
                  <input
                    type="number"
                    step={fundingConfig?.currency === 'CKB' ? '0.00000001' : '0.01'}
                    min={fundingConfig?.minAmount ?? 0.01}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="flex-1 bg-transparent border-none py-3 px-4 text-lg font-mono text-on-surface focus:ring-0 focus:outline-none"
                  />
                  <span className="px-4 border-l border-outline-variant bg-surface-container h-full text-xs font-bold text-on-surface py-3">
                    {fundingConfig?.currency ?? currency}
                  </span>
                </div>
              </label>

              <button
                type="submit"
                disabled={isLoading || !configReady}
                className="bg-primary text-on-primary hover:bg-primary-fixed py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Request
              </button>
            </form>
          </section>

          {displayedRequest && (
            <form onSubmit={handleConfirm} className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Request</span>
                  <p className="font-mono text-on-surface mt-1 truncate">{displayedRequest.id}</p>
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Amount</span>
                  <p className="font-mono text-on-surface mt-1">{formatAmount(displayedRequest.amount, displayedRequest.currency)}</p>
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Memo</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-on-surface truncate flex-1">{displayedRequest.memo}</p>
                    <button type="button" onClick={() => copyText(displayedRequest.memo)} className="text-primary hover:text-secondary" title="Copy memo">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex flex-col gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                CKB Transaction Hash
                <input
                  value={proofId}
                  onChange={(event) => setProofId(event.target.value)}
                  placeholder="0x... committed CKB transaction hash"
                  className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-sm normal-case font-mono text-on-surface focus:outline-none focus:border-primary"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={isLoading || syncing}
                  className="bg-surface-container text-primary border border-primary/30 rounded-xl py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {syncing ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Sync Vault
                </button>
                <button
                  type="submit"
                  disabled={isLoading || syncing}
                  className="bg-secondary/15 text-secondary border border-secondary/30 rounded-xl py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Tx Hash
                </button>
              </div>
            </form>
          )}

          <section className="rounded-xl border border-outline-variant/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant/60 bg-surface-container/60 flex items-center justify-between">
              <h3 className="font-bold text-sm text-on-surface">Recent Funding</h3>
              <span className="text-[10px] text-on-surface-variant font-mono">{fundingRequests.length}</span>
            </div>
            <div className="divide-y divide-outline-variant/40 max-h-[180px] overflow-y-auto">
              {fundingRequests.length === 0 ? (
                <p className="p-4 text-sm text-on-surface-variant">No funding requests yet.</p>
              ) : fundingRequests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => {
                    if (request.status === 'pending') setActiveRequest(request);
                  }}
                  className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-surface-container/60"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{formatAmount(request.amount, request.currency)}</p>
                    <p className="font-mono text-[10px] text-on-surface-variant mt-1 truncate">{request.id} / {formatDate(request.chainConfirmedAt ?? request.confirmedAt ?? request.createdAt)}</p>
                    {(request.chainOutPoint || request.chainTxHash || request.proofId) && (
                      <p className="font-mono text-[10px] text-on-surface-variant mt-1 truncate">{request.chainOutPoint ?? request.chainTxHash ?? request.proofId}</p>
                    )}
                  </div>
                  <span className={request.status === 'confirmed' ? 'text-[10px] uppercase font-bold text-secondary' : 'text-[10px] uppercase font-bold text-primary'}>
                    {(request.depositMode ?? 'treasury') + ' / ' + request.status}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
