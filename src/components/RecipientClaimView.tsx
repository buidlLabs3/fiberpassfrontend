/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, Bolt, CheckCircle2, LoaderCircle, Wallet } from 'lucide-react';
import { type RecipientClaim } from '../types';
import { formatCurrencyAmount } from '../lib/currency';
import { FIBER_CKB_ADDRESS_ERROR, isFiberCkbAddress } from '../lib/fiberAddress';
import { getApiErrorMessage } from '../lib/apiClient';
import { sessionsApi } from '../lib/sessionsApi';

interface RecipientClaimViewProps {
  token: string;
}

function formatDateTime(value?: string): string {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function amountLabel(claim: RecipientClaim | null): string {
  if (!claim || claim.amount == null || !claim.currency) return 'Not set';
  return formatCurrencyAmount(claim.amount, claim.currency, 8);
}

export default function RecipientClaimView({ token }: RecipientClaimViewProps) {
  const [claim, setClaim] = useState<RecipientClaim | null>(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    sessionsApi.getRecipientClaim(token)
      .then((nextClaim) => { if (active) setClaim(nextClaim); })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError, 'Could not load this FiberPass payment link.')); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!isFiberCkbAddress(address)) {
      setError(FIBER_CKB_ADDRESS_ERROR);
      return;
    }
    setIsSubmitting(true);
    try {
      setClaim(await sessionsApi.claimRecipientWallet(token, address.trim()));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not save recipient wallet.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isClaimable = claim?.status === 'pending';
  const isDone = claim?.status === 'claimed';
  const isUnavailable = claim?.status === 'expired' || claim?.status === 'not_found';
  const message = isDone ? 'Wallet details saved. Payment will release automatically at the scheduled time.' : isUnavailable ? (claim?.status === 'expired' ? 'This payment link has expired.' : 'This payment link was not found.') : 'Add your CKB wallet to receive this payout automatically.';

  return (
    <div className="min-h-screen bg-background text-on-surface flex items-center justify-center px-4 py-10">
      <main className="w-full max-w-2xl rounded-2xl border border-outline-variant bg-surface-container-low shadow-2xl overflow-hidden">
        <header className="border-b border-outline-variant/60 bg-surface-container px-6 py-5 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl border border-primary/30 bg-primary/10 text-primary flex items-center justify-center"><Bolt className="h-6 w-6 fill-current" /></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-primary">FiberPass</p><h1 className="text-xl font-bold text-on-surface">Payment Details</h1></div>
        </header>
        <section className="p-6 space-y-5">
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container/60 p-4 text-sm text-on-surface-variant"><LoaderCircle className="h-5 w-5 text-primary animate-spin" /> Loading payment link...</div>
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container/60 p-4">
                {isDone ? <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5" /> : isUnavailable ? <AlertCircle className="h-5 w-5 text-error mt-0.5" /> : <Wallet className="h-5 w-5 text-primary mt-0.5" />}
                <div><h2 className="font-bold text-on-surface">{claim?.recipientName ?? 'Recipient'}</h2><p className="mt-1 text-sm text-on-surface-variant leading-relaxed">{message}</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[['Payer / contractor', claim?.payerName], ['Pass', claim?.passName], ['Amount', amountLabel(claim)], ['Expected payment', formatDateTime(claim?.expectedPaymentAt)], ['Link expires', formatDateTime(claim?.expiresAt)], ['Reference', claim?.reference ?? 'Not set']].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-outline-variant bg-surface-container/60 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p><p className="mt-1 text-sm font-semibold text-on-surface break-words">{value ?? 'Not set'}</p></div>
                ))}
              </div>
              {claim?.conditionSummary && <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Condition</p><p className="mt-1 text-sm text-on-surface">{claim.conditionSummary}</p></div>}
              {error && <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs font-semibold text-error">{error}</div>}
              {isClaimable && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="recipient-wallet">CKB wallet address</label>
                  <input id="recipient-wallet" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="ckt1... or ckb1..." className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 font-mono text-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-primary hover:bg-primary-fixed disabled:opacity-70 flex items-center justify-center gap-2">{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />} Save Wallet</button>
                </form>
              )}
              <button type="button" onClick={() => { window.location.href = '/'; }} className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary hover:border-primary/50">Try FiberPass</button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
