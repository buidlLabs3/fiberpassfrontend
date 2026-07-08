/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bolt, 
  Wallet, 
  Coins, 
  LogOut, 
  Key, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Clock,
  Settings,
  RefreshCw,
  TrendingUp,
  Sliders
} from 'lucide-react';

import { Session, WalletState } from './types';
import { fiberPassApi, SessionsOverview } from './lib/api';
import { connectJoyIdWallet, disconnectJoyIdWallet, getStoredJoyIdAddress, signJoyIdMessage } from './lib/joyid';
import { 
  INITIAL_ACTIVE_SESSIONS, 
  INITIAL_HISTORY_SESSIONS 
} from './data/initialData';

// Subcomponents imports
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import HistoryView from './components/HistoryView';
import CreateSessionModal from './components/CreateSessionModal';

export default function App() {
  // Navigation states
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'settings'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Wallet and balance state
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: '',
    balance: 1240.50,
    currency: 'USDC'
  });

  // Sessions list states
  const [activeSessions, setActiveSessions] = useState<Session[]>(INITIAL_ACTIVE_SESSIONS);
  const [historySessions, setHistorySessions] = useState<Session[]>(INITIAL_HISTORY_SESSIONS);

  const [apiError, setApiError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Settings view details
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [customNetwork, setCustomNetwork] = useState('Fiber Network Testnet');
  const [gasThreshold, setGasThreshold] = useState('15 gwei');
  const [autoSettleTime, setAutoSettleTime] = useState('2 hours');

  const applyOverview = (overview: SessionsOverview) => {
    setWallet(prev => ({
      ...overview.wallet,
      connected: prev.connected || overview.wallet.connected
    }));
    setActiveSessions(overview.activeSessions);
    setHistorySessions(overview.historySessions);
    setApiError('');
  };

  const handleApiError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'FiberPass API request failed.';
    setApiError(message);
    alert(message);
  };

  // Connect with JoyID and establish a verified FiberPass API session
  const handleConnectWallet = async () => {
    if (authLoading) return false;

    setAuthLoading(true);
    setApiError('');

    try {
      const address = await connectJoyIdWallet();
      const challenge = await fiberPassApi.createAuthChallenge(address);
      const signature = await signJoyIdMessage(challenge.message, address);
      const auth = await fiberPassApi.verifyAuth({
        challengeId: challenge.challengeId,
        address,
        signature
      });

      fiberPassApi.setAuthToken(auth.token);
      setWallet(auth.wallet);
      return true;
    } catch (error) {
      disconnectJoyIdWallet();
      fiberPassApi.clearAuthToken();
      const message = error instanceof Error ? error.message : 'JoyID authentication failed.';
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
        address: storedAddress
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
  const handleCreateSession = async (sessionData: {
    name: string;
    serviceAddress: string;
    limit: number;
    currency: string;
    duration: string;
    expiryTime: string;
    autoMicroCharges: boolean;
    singleUse: boolean;
    iconType: 'cloud' | 'code' | 'database' | 'cpu' | 'ai' | 'video' | 'rpc';
  }) => {
    try {
      applyOverview(await fiberPassApi.createSession(sessionData));
    } catch (error) {
      handleApiError(error);
    }
  };

  // Top Up an active session (Allocate +$1.00)
  const handleTopUpSession = async (id: string) => {
    try {
      applyOverview(await fiberPassApi.topUpSession(id, 1));
    } catch (error) {
      handleApiError(error);
    }
  };

  // Pause / Resume continuous billing triggers
  const handleTogglePauseSession = async (id: string) => {
    try {
      applyOverview(await fiberPassApi.togglePauseSession(id));
    } catch (error) {
      handleApiError(error);
    }
  };

  // Revoke session completely (instantly terminates, remaining balance settled back to wallet)
  const handleRevokeSession = async (id: string) => {
    try {
      applyOverview(await fiberPassApi.revokeSession(id));
    } catch (error) {
      handleApiError(error);
    }
  };

  // Load API state and stream live micropayment updates
  useEffect(() => {
    if (currentView !== 'app' || !fiberPassApi.getAuthToken()) return;

    let isMounted = true;

    const syncSessions = async () => {
      try {
        const overview = await fiberPassApi.getSessions();
        if (isMounted) applyOverview(overview);
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : 'FiberPass API is unavailable.';
          setApiError(message);
        }
      }
    };

    syncSessions();

    const source = fiberPassApi.openSessionEvents(
      (overview) => {
        if (isMounted) applyOverview(overview);
      },
      () => {
        if (isMounted) setApiError('Live updates disconnected. Reconnecting...');
      }
    );

    return () => {
      isMounted = false;
      source.close();
    };
  }, [currentView]);

  return (
    <div className="bg-background text-on-background min-h-screen">
      {/* 1. Marketing / Landing Page View */}
      {currentView === 'landing' && (
        <LandingPage 
          onLaunchDapp={handleLaunchDapp}
          onConnectWallet={handleConnectWallet}
          walletConnected={wallet.connected}
          walletAddress={wallet.address}
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
            walletConnected={wallet.connected}
            onConnectWallet={handleConnectWallet}
            authLoading={authLoading}
          />

          {/* Main Context Stage */}
          <main className="flex-grow pt-24 pb-24 md:py-8 px-6 md:pl-72 max-w-7xl mx-auto w-full flex flex-col">
            {apiError && (
              <div className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-xs font-semibold text-error">
                {apiError}
              </div>
            )}
            
            {/* Active Sessions Tab */}
            {activeTab === 'active' && (
              <DashboardView 
                activeSessions={activeSessions}
                walletBalance={wallet.balance}
                totalActivePassValue={totalActivePassValue}
                onTopUpSession={handleTopUpSession}
                onTogglePauseSession={handleTogglePauseSession}
                onRevokeSession={handleRevokeSession}
                onCreateSessionClick={() => setIsModalOpen(true)}
              />
            )}

            {/* Session History Tab */}
            {activeTab === 'history' && (
              <HistoryView historySessions={historySessions} />
            )}

            {/* Custom Settings Tab */}
            {activeTab === 'settings' && (
              <div className="w-full flex flex-col gap-8 animate-[fade-in_0.3s_ease-out]">
                <header className="border-b border-outline-variant/60 pb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">System Settings</h1>
                  <p className="text-sm text-on-surface-variant mt-1">Configure your local FiberPass client keys and routing policies.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  
                  {/* Panel 1: Developer Access Keys */}
                  <div className="bg-surface-container-low/50 border border-outline-variant rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Key className="w-4.5 h-4.5" />
                      </div>
                      <h3 className="font-bold text-on-surface">Client SDK API Credentials</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Fiber Access Key (FIBER_KEY)</span>
                        <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden px-4 py-2.5">
                          <input 
                            type={apiKeyVisible ? "text" : "password"} 
                            value="fb_live_7a3d24e930fca6823eb9118501dae"
                            readOnly
                            className="flex-grow bg-transparent border-none text-xs font-mono text-primary outline-none focus:ring-0 select-all"
                          />
                          <button 
                            type="button"
                            onClick={() => setApiKeyVisible(!apiKeyVisible)}
                            className="p-1 text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                          >
                            {apiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-on-surface-variant leading-relaxed">
                          Do not expose this key client-side. Keep it safe in server environment secrets.
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Default Web3 Provider RPC</span>
                        <input 
                          type="text" 
                          value="https://rpc.testnet.fiber.network"
                          readOnly
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 text-xs font-mono text-on-surface focus:outline-none"
                        />
                      </div>
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
                      {/* Network Select */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Target Settlement Chain</span>
                        <select 
                          value={customNetwork}
                          onChange={(e) => setCustomNetwork(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="Fiber Network Testnet">Fiber Network Testnet</option>
                          <option value="Fiber Network Mainnet">Fiber Network Mainnet</option>
                          <option value="Base L2">Base L2 fallback settlement</option>
                          <option value="Ethereum Mainnet">Ethereum Mainnet (L1 direct)</option>
                        </select>
                      </div>

                      {/* Gas Limit Trigger */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Max Gas Price Threshold</span>
                        <select 
                          value={gasThreshold}
                          onChange={(e) => setGasThreshold(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-4 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="15 gwei">15 Gwei (Strictly Economic)</option>
                          <option value="30 gwei">30 Gwei (Standard Balance)</option>
                          <option value="75 gwei">75 Gwei (High Priority)</option>
                          <option value="unlimited">Unlimited (Instant at all costs)</option>
                        </select>
                      </div>

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
                      FiberPass sessions employ standard client-side state encapsulation. Sessions are stored in transient memory registers, authorized through JoyID, and terminated securely back into your core wallet whenever revoked or exhausted. There are zero custodial smart contract deposits, keeping your capital 100% self-custodial at all times.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-secondary font-semibold pt-1">
                      <CheckCircle2 className="w-4 h-4 text-secondary fill-secondary/10 shrink-0" />
                      JoyID authentication and Fiber Network session routing are enabled for this demo.
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
          />

        </div>
      )}
    </div>
  );
}
