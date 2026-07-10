import { useCallback, useEffect, useState } from 'react';
import {
  appsApi,
  type AppApiKeyScope,
  type AutomationInvoice,
  type AutomationPaymentBatch,
  type AutomationPaymentJob,
  type AutomationRecipient,
  type CreateAutomationInvoiceBatchPayload,
  type CreateAutomationInvoicePayload,
  type CreateAutomationRecipientPayload,
  type CreateDeveloperAppPayload,
  type CreatedAppApiKey,
  type DeveloperApp,
  type WebhookDelivery
} from '../lib/appsApi';
import { getApiErrorMessage } from '../lib/apiClient';

export interface DeveloperAutomationState {
  recipients: AutomationRecipient[];
  invoices: AutomationInvoice[];
  batches: AutomationPaymentBatch[];
  jobs: AutomationPaymentJob[];
  webhookDeliveries: WebhookDelivery[];
}

function emptyAutomationState(): DeveloperAutomationState {
  return { recipients: [], invoices: [], batches: [], jobs: [], webhookDeliveries: [] };
}

export function useDeveloperApps(enabled: boolean) {
  const [apps, setApps] = useState<DeveloperApp[]>([]);
  const [automationByApp, setAutomationByApp] = useState<Record<string, DeveloperAutomationState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedKey, setGeneratedKey] = useState<CreatedAppApiKey | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setApps([]);
      setAutomationByApp({});
      setError('');
      setGeneratedKey(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await appsApi.getApps();
      const automationEntries = await Promise.all(response.apps.map(async (app) => {
        const [recipients, invoices, batches, jobs, deliveries] = await Promise.all([
          appsApi.getRecipients(app.id),
          appsApi.getInvoices(app.id),
          appsApi.getInvoiceBatches(app.id),
          appsApi.getPaymentJobs(app.id),
          appsApi.getWebhookDeliveries(app.id)
        ]);
        return [app.id, {
          recipients: recipients.recipients,
          invoices: invoices.invoices,
          batches: batches.batches,
          jobs: jobs.jobs,
          webhookDeliveries: deliveries.deliveries
        }] as const;
      }));
      setApps(response.apps);
      setAutomationByApp(Object.fromEntries(automationEntries));
      setError('');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runMutation = async (operation: () => Promise<unknown>) => {
    setIsLoading(true);
    try {
      await operation();
      await refresh();
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  const createApp = async (payload: CreateDeveloperAppPayload) => {
    await runMutation(() => appsApi.createApp(payload));
  };

  const createApiKey = async (appId: string, label: string, scopes?: AppApiKeyScope[]) => {
    setIsLoading(true);
    try {
      const key = await appsApi.createApiKey(appId, label, scopes);
      setGeneratedKey(key);
      await refresh();
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeApiKey = async (appId: string, keyId: string) => {
    await runMutation(() => appsApi.revokeApiKey(appId, keyId));
  };

  const createRecipient = async (appId: string, payload: CreateAutomationRecipientPayload) => {
    await runMutation(() => appsApi.createRecipient(appId, payload));
  };

  const createInvoice = async (appId: string, payload: CreateAutomationInvoicePayload) => {
    await runMutation(() => appsApi.createInvoice(appId, payload));
  };

  const createInvoiceBatch = async (appId: string, payload: CreateAutomationInvoiceBatchPayload) => {
    await runMutation(() => appsApi.createInvoiceBatch(appId, payload));
  };

  const configureWebhook = async (appId: string, payload: { webhookUrl?: string; signingSecret?: string }) => {
    await runMutation(() => appsApi.configureWebhook(appId, payload));
  };

  return {
    apps,
    automationByApp,
    getAutomationForApp: (appId: string) => automationByApp[appId] ?? emptyAutomationState(),
    isLoading,
    error,
    generatedKey,
    clearGeneratedKey: () => setGeneratedKey(null),
    refresh,
    createApp,
    createApiKey,
    revokeApiKey,
    createRecipient,
    createInvoice,
    createInvoiceBatch,
    configureWebhook
  };
}
