import { useCallback, useEffect, useState } from 'react';
import { appsApi, type CreateDeveloperAppPayload, type CreatedAppApiKey, type DeveloperApp } from '../lib/appsApi';
import { getApiErrorMessage } from '../lib/apiClient';

export function useDeveloperApps(enabled: boolean) {
  const [apps, setApps] = useState<DeveloperApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedKey, setGeneratedKey] = useState<CreatedAppApiKey | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setApps([]);
      setError('');
      setGeneratedKey(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await appsApi.getApps();
      setApps(response.apps);
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

  const createApp = async (payload: CreateDeveloperAppPayload) => {
    setIsLoading(true);
    try {
      await appsApi.createApp(payload);
      await refresh();
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async (appId: string, label: string) => {
    setIsLoading(true);
    try {
      const key = await appsApi.createApiKey(appId, label);
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
    setIsLoading(true);
    try {
      await appsApi.revokeApiKey(appId, keyId);
      await refresh();
    } catch (requestError) {
      const message = getApiErrorMessage(requestError);
      setError(message);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    apps,
    isLoading,
    error,
    generatedKey,
    clearGeneratedKey: () => setGeneratedKey(null),
    refresh,
    createApp,
    createApiKey,
    revokeApiKey
  };
}
