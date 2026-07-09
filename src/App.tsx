/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Bolt, 
  Wallet, 
  Coins, 
  LogOut, 
  Key, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Settings,
  RefreshCw,
  TrendingUp,
  Sliders
} from 'lucide-react';

import { WalletState } from './types';
import { fiberPassApi, getApiErrorMessage, type ApiMeta, type CreateSessionPayload } from './lib/api';
import { type WalletFundingConfig, type WalletFundingRequest } from './lib/walletApi';
import { connectJoyIdWallet, disconnectJoyIdWallet, getStoredJoyIdAddress, signJoyIdMessage } from './lib/joyid';
import { useDeveloperApps } from './hooks/useDeveloperApps';
import { useSessionsOverview } from './hooks/useSessionsOverview';

// Subcomponents imports
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import HistoryView from './components/HistoryView';
import CreateSessionModal from './components/CreateSessionModal';
import DeveloperAppsView from './components/DeveloperAppsView';
import LoadFundsModal from './components/LoadFundsModal';

export default function App() {
  // Navigation states
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'developer' | 'settings'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  // Wallet and balance state
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: '',
    authProvider: 'joyid',
    addressType: 'ckb',
    balance: 0,
    balanceMinor: 0,
    currency: 'CKB'
  });

  const [apiError, setApiError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [createSessionLoading, setCreateSessionLoading] = useState(false);
  const [pendingSessionAction, setPendingSessionAction] = useState<{ id: string; action: 'top-up' | 'pause' | 'revoke' | 'close' } | null>(null);
  const [fundingConfig, setFundingConfig] = useState<WalletFundingConfig | null>(null);
  const [fundingRequests, setFundingRequests] = useState<WalletFundingRequest[]>([]);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingError, setFundingError] = useState('');

  const sessions = useSessionsOverview(currentView === 'app' && wallet.connected);
  const developerApps = useDeveloperApps(currentView === 'app' && wallet.connected && activeTab === 'developer');
  const activeSessions = sessions.activeSessions;
  const historySessions = sessions.historySessions;

  // Settings view details
  const [apiMeta, setApiMeta] = useState<ApiMeta | null>(null);
  const [metaError, setMetaError] = useState('');
  const [autoSettleTime, setAutoSettleTime] = useState('2 hours');

  useEffect(() => {
    let active = true;
    fiberPassApi.getMeta()
      .then((meta) => {
        if (active) {
          setApiMeta(meta);
          setMetaError('');
        }
      })
      .catch((error) => {
        if (active) setMetaError(getApiErrorMessage(error, 'Could not load API runtime metadata.'));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sessions.overview) return;

    setWallet(prev => ({
      ...sessions.overview.wallet,
      connected: prev.connected || sessions.overview.wallet.connected
    }));
    setApiError('');
  }, [sessions.overview]);

  const handleApiError = (error: unknown) => {
    const message = getApiErrorMessage(error);
    setApiError(message);
    alert(message);
  };

  const loadWalletFunding = useCallback(async () => {
    if (!wallet.connected) {
      setFundingConfig(null);
      setFundingRequests([]);
      setFundingError('');
      return null;
    }

    setFundingLoading(true);
    try {
      const fundingOverview = await fiberPassApi.getWalletFunding();
      setFundingConfig(fundingOverview.config);
      setFundingRequests(fundingOverview.requests);
      setFundingError('');
      return fundingOverview;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Could not load wallet funding state.');
      setFundingError(message);
      return null;
    } finally {
      setFundingLoading(false);
    }
  }, [wallet.connected]);

  useEffect(() => {
    if (currentView === 'app' && wallet.connected) {
      void loadWalletFunding();
    } else {
      setFundingConfig(null);
      setFundingRequests([]);
      setFundingError('');
    }
  }, [currentView, loadWalletFunding, wallet.connected]);

  // Connect with JoyID and establish a verified FiberPass API session
  const handleConnectWallet = async () => {
    if (authLoading) return false;

    setAuthLoading(true);
    setApiError('');

    try {
      await fiberPassApi.getMeta();
      const address = await connectJoyIdWallet();
      const challenge = await fiberPassApi.createAuthChallenge(address);
      const signature = await signJoyIdMessage(challenge.message, address);
      const auth = await fiberPassApi.verifyAuth({
        challengeId: challenge.challengeId,
        address,
        signature
      });

      fiberPassApi.setAuthToken(auth.token);
      sessions.clear();
      setWallet(auth.wallet);
      return true;
    } catch (error) {
      disconnectJoyIdWallet();
      fiberPassApi.clearAuthToken();
      sessions.clear();
      const message = getApiErrorMessage(error, 'JoyID authentication failed.');
      setApiError(message);
      alert(message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // Switch to application dashboard view
  const handleLaunchDapp = async () => {
    if (!wallet.connected) {
      const connected = await handleConnectWallet();
      if (!connected) return;
    }
    setCurrentView('app');
  };

  // Return to landing page
  const handleExitDapp = () => {
    setCurrentView('landing');
  };

  useEffect(() => {
    const token = fiberPassApi.getAuthToken();
    const storedAddress = getStoredJoyIdAddress();

    if (storedAddress) {
      setWallet(prev => ({
        ...prev,
        connected: Boolean(token),
        address: storedAddress,
        authProvider: 'joyid',
        addressType: 'ckb'
      }));
    }

    if (!token) return;

    let isMounted = true;
    fiberPassApi.getCurrentWallet()
      .then(({ wallet }) => {
        if (isMounted) setWallet(wallet);
      })
      .catch(() => {
        fiberPassApi.clearAuthToken();
        disconnectJoyIdWallet();
        if (isMounted) {
          setWallet(prev => ({ ...prev, connected: false, address: '' }));
          sessions.clear();
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic calculations: Total Active Pass Value (sum of active session limits)
  const totalActivePassValue = useMemo(() => {
    return activeSessions.reduce((acc, session) => {
      // Exclude paused sessions from count if preferred, but usually we sum total allocated limits
      return acc + session.limit;
    }, 0);
  }, [activeSessions]);

  // Create a new session
  const handleCreateSession = async (sessionData: CreateSessionPayload) => {
    setCreateSessionLoading(true);
    try {
      await sessions.createSession(sessionData);
    } catch (error) {
      handleApiError(error);
      throw error;
    } finally {
      setCreateSessionLoading(false);
    }
  };

  const runSessionAction = async (
    id: string,
    action: 'top-up' | 'pause' | 'revoke' | 'close',
    operation: () => Promise<unknown>
  ) => {
    setPendingSessionAction({ id, action });
    try {
      await operation();
    } catch (error) {
      handleApiError(error);
    } finally {
      setPendingSessionAction(null);
    }
  };

  const handleCreateFundingRequest = async (amount: number) => {
    setFundingLoading(true);
    try {
      const request = await fiberPassApi.createWalletFundingRequest({ amount });
      setFundingRequests(prev => [request, ...prev.filter(item => item.id !== request.id)]);
      setFundingError('');
      return request;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Could not create wallet funding request.');
      setFundingError(message);
      throw new Error(message);
    } finally {
      setFundingLoading(false);
    }
  };

  const handleConfirmFundingRequest = async (fundingId: string, proofId: string) => {
    setFundingLoading(true);
    try {
      await fiberPassApi.confirmWalletFundingRequest(fundingId, { proofId });
      await sessions.refresh();
      await loadWalletFunding();
      setFundingError('');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Could not confirm wallet funding.');
      setFundingError(message);
      throw new Error(message);
    } finally {
      setFundingLoading(false);
    }
  };

  const handleSyncWalletFunding = async () => {
    setFundingLoading(true);
    try {
      const fundingOverview = await fiberPassApi.syncWalletFunding();
      setFundingConfig(fundingOverview.config);
      setFundingRequests(fundingOverview.requests);
      await sessions.refresh();
      setFundingError('');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Could not sync CKB vault deposits.');
      setFundingError(message);
      throw new Error(message);
    } finally {
      setFundingLoading(false);
    }
  };

  // Top Up an active session (Allocate +$1.00)
  const handleTopUpSession = async (id: string) => {
    await runSessionAction(id, 'top-up', () => sessions.topUpSession(id, 1));
  };

  // Pause / Resume continuous billing triggers
  const handleTogglePauseSession = async (id: string) => {
    await runSessionAction(id, 'pause', () => sessions.togglePauseSession(id));
  };

  // Revoke session completely (instantly terminates, remaining balance settled back to wallet)
  const handleRevokeSession = async (id: string) => {
    if (!window.confirm('Revoke this FiberPass now? Remaining balance will be returned and future charges will be blocked.')) return;
    await runSessionAction(id, 'revoke', () => sessions.revokeSession(id));
  };

  const handleCloseSession = async (id: string) => {
    if (!window.confirm('Close and settle this FiberPass now? Remaining balance will be returned to your wallet.')) return;
    await runSessionAction(id, 'close', () => sessions.closeSession(id));
  };

  const visibleError = apiError || sessions.error;

  return (
    <div className="bg-background text-on-background min-h-screen">
      {/* 1. Marketing / Landing Page View */}
      {currentView === 'landing' && (
        <LandingPage 
          onLaunchDapp={handleLaunchDapp}
          onConnectWallet={handleConnectWallet}
          walletConnected={wallet.connected}
          walletAddress={wallet.address}
          walletAuthProvider={wallet.authProvider ?? 'joyid'}
          walletAddressType={wallet.addressType ?? 'ckb'}
          authLoading={authLoading}
        />
      )}

      {/* 2. Interactive dApp Console Dashboard View */}
      {currentView === 'app' && (
        <div className="flex min-h-screen selection:bg-primary-container selection:text-on-primary-container relative">
          
          {/* Left Navigation Rail (fixed) */}
          <Sidebar 
            currentTab={activeTab}
            onTabChange={setActiveTab}
            onCreateSessionClick={() => setIsModalOpen(true)}
            onExitDapp={handleExitDapp}
            walletAddress={wallet.address}
            walletAuthProvider={wallet.authProvider ?? 'joyid'}
            walletAddressType={wallet.addressType ?? 'ckb'}
            walletConnected={wallet.connected}
            onConnectWallet={handleConnectWallet}
            authLoading={authLoading}
          />

          {/* Main Context Stage */}
          <main className="flex-grow pt-24 pb-24 md:py-8 px-6 md:pl-72 max-w-7xl mx-auto w-full flex flex-col">
            {visibleError && (
              <div className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-xs font-semibold text-error">
                {visibleError}
              </div>
            )}
            
            {/* Active Sessions Tab */}
            {activeTab === 'active' && (
              <DashboardView 
                activeSessions={activeSessions}
                walletBalance={wallet.balance}
                walletCurrency={wallet.currency}
                totalActivePassValue={totalActivePassValue}
                isLoading={sessions.isLoading}
                pendingSessionAction={pendingSessionAction}
                onTopUpSession={handleTopUpSession}
                onTogglePauseSession={handleTogglePauseSession}
                onRevokeSession={handleRevokeSession}
                onCloseSession={handleCloseSession}
                onCreateSessionClick={() => setIsModalOpen(true)}
                onLoadFundsClick={() => setIsFundingModalOpen(true)}
              />
            )}

            {/* Session History Tab */}
            {activeTab === 'history' && (
              <HistoryView historySessions={historySessions} isLoading={sessions.isLoading} />
            )}

            {/* Developer Apps Tab */}
            {activeTab === 'developer' && (
              <DeveloperAppsView
                apps={developerApps.apps}
                isLoading={developerApps.isLoading}
                error={developerApps.error}
                generatedKey={developerApps.generatedKey}
                onCreateApp={developerApps.createApp}
                onCreateApiKey={developerApps.createApiKey}
                onRevokeApiKey={developerApps.revokeApiKey}
                onClearGeneratedKey={developerApps.clearGeneratedKey}
              />
            )}

            {/* Custom Settings Tab */}
            {activeTab === 'settings' && (
              <div className="w-full flex flex-col gap-8 animate-[fade-in_0.3s_ease-out]">
                <header className="border-b border-outline-variant/60 pb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">System Settings</h1>
                  <p className="text-sm text-on-surface-variant mt-1">Configure your local FiberPass client keys and routing policies.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* Panel 1: Developer API Keys */}
                  <div className="bg-surface-container-low/50 border border-outline-variant rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Key className="w-4.5 h-4.5" />
                      </div>
                      <h3 className="font-bold text-on-surface">Developer API Credentials</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Secret Handling</span>
                        <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                          FiberPass never displays app secrets in settings. App API keys are generated once inside Developer Apps and should be stored server-side only.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('developer')}
                        className="w-full bg-primary/15 text-primary border border-primary/30 rounded-xl py-2.5 px-4 text-xs font-bold uppercase tracking-wider hover:bg-primary/25 transition-colors"
                      >
                        Open Developer Apps
                      </button>
                    </div>
                  </div>

                  {/* Panel 2: Routing Policy Configuration */}
                  <div className="bg-surface-container-low/50 border border-outline-variant rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
                        <Sliders className="w-4.5 h-4.5" />
                      </div>
                      <h3 className="font-bold text-on-surface">Payment Flow Policies</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Fiber Network</span>
                          <span className="font-mono text-xs text-on-surface">{apiMeta?.fiber.network ?? 'Loading...'}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Provider</span>
                          <span className="font-mono text-xs text-on-surface">{apiMeta ? apiMeta.fiber.provider.toUpperCase() : 'Loading...'}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Mode</span>
                          <span className="font-mono text-xs text-on-surface">{apiMeta?.mode ?? 'product'}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">RPC</span>
                          <span className="font-mono text-xs text-on-surface">{apiMeta?.fiber.rpcConfigured ? 'configured' : 'not configured'}</span>
                        </div>
                      </div>

                      {metaError && (
                        <p className="text-xs text-error rounded-lg border border-error/30 bg-error/10 px-3 py-2">{metaError}</p>
                      )}

                      {/* Auto close session duration */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Auto-Reconciliation Sweep</span>
                        <select 
                          value={autoSettleTime}
                          onChange={(e) => setAutoSettleTime(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="30 mins">Settle inactive after 30 mins</option>
                          <option value="2 hours">Settle inactive after 2 hours</option>
                          <option value="24 hours">Settle inactive after 24 hours</option>
                          <option value="never">Keep session active indefinitely</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Panel 3: Security checklist (Full Column) */}
                  <div className="bg-surface-container-low/50 border border-outline-variant rounded-2xl p-6 lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-secondary" />
                      <h3 className="font-bold text-on-surface">Cryptographic Safeguard Controls</h3>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      FiberPass sessions are authorized through JoyID, tracked with exact minor-unit accounting, and routed through the configured Fiber provider. Pause, revoke, top up, and settlement actions are audited by the backend.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-secondary font-semibold pt-1">
                      <CheckCircle2 className="w-4 h-4 text-secondary fill-secondary/10 shrink-0" />
                      JoyID authentication, app-scoped API keys, charge attempt ledgers, and Fiber provider routing are enabled.
                    </div>
                  </div>

                </div>
              </div>
            )}

          </main>

          {/* 3. Modal Form popup */}
          <CreateSessionModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreateSession={handleCreateSession}
            walletBalance={wallet.balance}
            isSubmitting={createSessionLoading}
          />

          <LoadFundsModal
            isOpen={isFundingModalOpen}
            onClose={() => setIsFundingModalOpen(false)}
            currency={wallet.currency}
            fundingConfig={fundingConfig}
            fundingRequests={fundingRequests}
            isLoading={fundingLoading}
            error={fundingError}
            onCreateFundingRequest={handleCreateFundingRequest}
            onConfirmFundingRequest={handleConfirmFundingRequest}
            onSyncFunding={handleSyncWalletFunding}
          />

        </div>
      )}
    </div>
  );
}
