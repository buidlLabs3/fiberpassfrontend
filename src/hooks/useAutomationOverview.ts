import { useCallback, useEffect, useMemo, useState } from 'react';
import { appsApi, type AutomationInvoice, type AutomationPaymentBatch, type DeveloperApp } from '../lib/appsApi';
import { getApiErrorMessage } from '../lib/apiClient';

export interface AutomationAppOverview {
  app: DeveloperApp;
  invoices: AutomationInvoice[];
  batches: AutomationPaymentBatch[];
}

export function useAutomationOverview(enabled: boolean) {
  const [apps, setApps] = useState<AutomationAppOverview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'invoice' | 'batch'; id: string } | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setApps([]);
      setError('');
      setPendingAction(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await appsApi.getApps();
      const automationApps = await Promise.all(response.apps.map(async (app) => {
        const [invoiceResponse, batchResponse] = await Promise.all([
          appsApi.getInvoices(app.id),
          appsApi.getInvoiceBatches(app.id)
        ]);
        return { app, invoices: invoiceResponse.invoices, batches: batchResponse.batches };
      }));
      setApps(automationApps);
      setError('');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load automation payments.'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const queueInvoice = async (appId: string, invoiceId: string) => {
    setPendingAction({ type: 'invoice', id: invoiceId });
    try {
      await appsApi.queueInvoice(appId, invoiceId);
      await refresh();
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Could not queue invoice payment.');
      setError(message);
      throw requestError;
    } finally {
      setPendingAction(null);
    }
  };

  const queueBatch = async (appId: string, batchId: string) => {
    setPendingAction({ type: 'batch', id: batchId });
    try {
      await appsApi.queueInvoiceBatch(appId, batchId);
      await refresh();
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Could not queue payment batch.');
      setError(message);
      throw requestError;
    } finally {
      setPendingAction(null);
    }
  };

  const invoices = useMemo(() => apps.flatMap((entry) => entry.invoices.map((invoice) => ({ ...invoice, appName: entry.app.name }))), [apps]);
  const batches = useMemo(() => apps.flatMap((entry) => entry.batches.map((batch) => ({ ...batch, appName: entry.app.name }))), [apps]);

  return {
    apps,
    invoices,
    batches,
    isLoading,
    error,
    pendingAction,
    refresh,
    queueInvoice,
    queueBatch
  };
}
