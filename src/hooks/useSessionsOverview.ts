import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage, getAuthToken } from '../lib/apiClient';
import { eventsApi } from '../lib/eventsApi';
import { type CreateSessionPayload, type SessionsOverview, sessionsApi } from '../lib/sessionsApi';

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

export function useSessionsOverview(enabled: boolean) {
  const [overview, setOverview] = useState<SessionsOverview | null>(null);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [error, setError] = useState('');
  const [isLive, setIsLive] = useState(false);

  const applyOverview = useCallback((nextOverview: SessionsOverview) => {
    setOverview(nextOverview);
    setStatus('success');
    setError('');
  }, []);

  const clear = useCallback(() => {
    setOverview(null);
    setStatus('idle');
    setError('');
    setIsLive(false);
  }, []);

  const handleError = useCallback((requestError: unknown) => {
    const message = getApiErrorMessage(requestError);
    setError(message);
    setStatus('error');
    return message;
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled || !getAuthToken()) {
      clear();
      return null;
    }

    setStatus('loading');
    try {
      const nextOverview = await sessionsApi.getSessions();
      applyOverview(nextOverview);
      return nextOverview;
    } catch (requestError) {
      handleError(requestError);
      return null;
    }
  }, [applyOverview, clear, enabled, handleError]);

  const runMutation = useCallback(async (operation: () => Promise<SessionsOverview>) => {
    setStatus('loading');
    try {
      const nextOverview = await operation();
      applyOverview(nextOverview);
      return nextOverview;
    } catch (requestError) {
      handleError(requestError);
      throw requestError;
    }
  }, [applyOverview, handleError]);

  useEffect(() => {
    if (!enabled || !getAuthToken()) {
      clear();
      return;
    }

    let isMounted = true;
    let source: EventSource | undefined;

    setStatus('loading');
    sessionsApi.getSessions()
      .then((nextOverview) => {
        if (isMounted) applyOverview(nextOverview);
      })
      .catch((requestError) => {
        if (isMounted) handleError(requestError);
      });

    try {
      source = eventsApi.openSessionEvents(
        (nextOverview) => {
          if (isMounted) {
            setIsLive(true);
            applyOverview(nextOverview);
          }
        },
        () => {
          if (isMounted) {
            setIsLive(false);
            setError('Live updates disconnected. Reconnecting...');
          }
        }
      );
      setIsLive(true);
    } catch (requestError) {
      handleError(requestError);
    }

    return () => {
      isMounted = false;
      setIsLive(false);
      source?.close();
    };
  }, [applyOverview, clear, enabled, handleError]);

  return {
    overview,
    activeSessions: overview?.activeSessions ?? [],
    historySessions: overview?.historySessions ?? [],
    status,
    error,
    isLive,
    isLoading: status === 'loading' && !overview,
    isRefreshing: status === 'loading' && Boolean(overview),
    clear,
    clearError: () => setError(''),
    refresh,
    createSession: (payload: CreateSessionPayload) => runMutation(() => sessionsApi.createSession(payload)),
    topUpSession: (id: string, amount = 1) => runMutation(() => sessionsApi.topUpSession(id, amount)),
    resendRecipientInvites: (id: string) => runMutation(() => sessionsApi.resendRecipientInvites(id)),
    togglePauseSession: (id: string) => runMutation(() => sessionsApi.togglePauseSession(id)),
    revokeSession: (id: string) => runMutation(() => sessionsApi.revokeSession(id)),
    closeSession: (id: string) => runMutation(() => sessionsApi.closeSession(id))
  };
}
