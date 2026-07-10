/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Bolt,
  Code2,
  Fingerprint,
  History,
  LogOut,
  Plus,
  ReceiptText,
  Settings,
  Wallet
} from 'lucide-react';

type AppTab = 'active' | 'history' | 'automation' | 'developer' | 'settings';

interface AppNavigationProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onCreateSessionClick: () => void;
  onExitDapp: () => void;
  walletAddress: string;
  walletAuthProvider: 'joyid';
  walletAddressType: 'ckb';
  walletConnected: boolean;
  onConnectWallet: () => void;
  authLoading: boolean;
}

const tabs: Array<{ id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'active', label: 'Active', icon: Bolt },
  { id: 'history', label: 'History', icon: History },
  { id: 'automation', label: 'Automation', icon: ReceiptText },
  { id: 'developer', label: 'Apps', icon: Code2 },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function AppNavigation({
  currentTab,
  onTabChange,
  onCreateSessionClick,
  onExitDapp,
  walletAddress,
  walletAuthProvider,
  walletAddressType,
  walletConnected,
  onConnectWallet,
  authLoading
}: AppNavigationProps) {
  const shortAddress = walletConnected && walletAddress
    ? `${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 6)}`
    : authLoading ? 'Connecting' : 'Connect JoyID';
  const providerLabel = walletAuthProvider === 'joyid' ? 'JoyID' : 'Wallet';
  const addressTypeLabel = walletAddressType.toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onExitDapp}
            className="flex min-w-0 items-center gap-3 rounded-lg text-left text-on-surface transition-colors hover:text-primary"
            aria-label="Open FiberPass home"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary text-on-primary shadow-[0_0_20px_rgba(176,198,255,0.16)]">
              <Bolt className="h-5 w-5 fill-current" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-black tracking-tight sm:text-lg">FiberPass</span>
              <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">CKB prepaid payment sessions</span>
            </span>
          </button>

          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={walletConnected || authLoading ? undefined : onConnectWallet}
              disabled={authLoading || walletConnected}
              className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-default sm:max-w-[280px]"
              title={walletConnected ? walletAddress : 'Connect JoyID wallet'}
            >
              {walletConnected ? <Fingerprint className="h-4 w-4 shrink-0 text-primary" /> : <Wallet className="h-4 w-4 shrink-0 text-primary" />}
              <span className="min-w-0 truncate">
                {walletConnected ? `${providerLabel} ${addressTypeLabel} ${shortAddress}` : shortAddress}
              </span>
            </button>

            <button
              type="button"
              onClick={onCreateSessionClick}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container sm:px-4"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span className="hidden min-[380px]:inline">Create Pass</span>
            </button>

            <button
              type="button"
              onClick={onExitDapp}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant transition-colors hover:border-error/40 hover:text-error"
              aria-label="Exit dApp view"
              title="Exit dApp view"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav aria-label="FiberPass sections" className="grid grid-cols-2 sm:grid-cols-5 gap-1 rounded-xl border border-outline-variant bg-surface-container-low p-1 sm:gap-2 sm:p-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={(selected
                  ? 'border-primary/40 bg-primary/15 text-primary shadow-[0_0_18px_rgba(176,198,255,0.08)] '
                  : 'border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface ') +
                  'flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors sm:gap-2 sm:text-xs'}
                aria-current={selected ? 'page' : undefined}
              >
                <Icon className={(tab.id === 'active' && selected ? 'fill-current ' : '') + 'h-4 w-4 shrink-0'} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
