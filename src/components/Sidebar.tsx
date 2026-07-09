/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Bolt, 
  History, 
  Settings, 
  Code2,
  HelpCircle, 
  FileText, 
  Plus, 
  LogOut, 
  Wallet,
  Globe,
  Fingerprint
} from 'lucide-react';

interface SidebarProps {
  currentTab: 'active' | 'history' | 'developer' | 'settings';
  onTabChange: (tab: 'active' | 'history' | 'developer' | 'settings') => void;
  onCreateSessionClick: () => void;
  onExitDapp: () => void;
  walletAddress: string;
  walletAuthProvider: 'joyid';
  walletAddressType: 'evm';
  walletConnected: boolean;
  onConnectWallet: () => void;
  authLoading: boolean;
}

export default function Sidebar({
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
}: SidebarProps) {
  const shortAddress = walletConnected
    ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
    : authLoading ? 'Connecting...' : 'Not Connected';
  const providerLabel = walletAuthProvider === 'joyid' ? 'JoyID' : 'Wallet';
  const addressTypeLabel = walletAddressType.toUpperCase();

  return (
    <>
      {/* Mobile Top Navbar - shown only on mobile screen widths */}
      <nav aria-label="Mobile Navigation Header" className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant px-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-2" onClick={onExitDapp}>
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-on-primary font-bold">
            <Bolt className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold text-on-surface tracking-tight text-sm">FiberPass</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            id="mobile-nav-create-btn"
            onClick={onCreateSessionClick}
            className="p-1.5 bg-primary/15 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors"
            title="Create Session"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button 
            id="mobile-nav-wallet-btn"
            onClick={walletConnected || authLoading ? undefined : onConnectWallet}
            disabled={authLoading}
            className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-high border border-outline-variant rounded-lg text-[11px] font-mono font-medium text-primary cursor-pointer"
          >
            <Fingerprint className="w-3 h-3" />
            {walletConnected ? providerLabel + ' ' + shortAddress : shortAddress}
          </button>

          <button 
            id="mobile-nav-exit-btn"
            onClick={onExitDapp}
            className="p-1.5 text-on-surface-variant hover:text-error rounded-lg"
            title="Exit dApp"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Bar for Tab Navigation */}
      <nav aria-label="Mobile Navigation Tabs" className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-low/95 backdrop-blur-md border-t border-outline-variant grid grid-cols-4 justify-center items-center z-50 px-2 pb-1">
        <button
          id="mobile-tab-active"
          onClick={() => onTabChange('active')}
          className={`flex flex-col items-center justify-center h-full gap-1 border-none bg-transparent cursor-pointer transition-colors ${
            currentTab === 'active' ? 'text-primary' : 'text-on-surface-variant'
          }`}
        >
          <Bolt className={`w-5 h-5 ${currentTab === 'active' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-semibold tracking-wider uppercase">Active</span>
        </button>

        <button
          id="mobile-tab-history"
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center justify-center h-full gap-1 border-none bg-transparent cursor-pointer transition-colors ${
            currentTab === 'history' ? 'text-primary' : 'text-on-surface-variant'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-wider uppercase">History</span>
        </button>

        <button
          id="mobile-tab-developer"
          onClick={() => onTabChange('developer')}
          className={(currentTab === 'developer' ? 'text-primary ' : 'text-on-surface-variant ') + 'flex flex-col items-center justify-center h-full gap-1 border-none bg-transparent cursor-pointer transition-colors'}
        >
          <Code2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-wider uppercase">Apps</span>
        </button>

        <button
          id="mobile-tab-settings"
          onClick={() => onTabChange('settings')}
          className={(currentTab === 'settings' ? 'text-primary ' : 'text-on-surface-variant ') + 'flex flex-col items-center justify-center h-full gap-1 border-none bg-transparent cursor-pointer transition-colors'}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-wider uppercase">Settings</span>
        </button>
      </nav>

      {/* Desktop Side Navigation */}
      <aside 
        aria-label="Desktop Side Navigation"
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant py-6 px-3 z-40 w-64 transition-all duration-300 overflow-hidden"
      >
        {/* Header User Profile & Branding */}
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 shrink-0 flex items-center justify-center text-primary">
            {walletConnected ? <Fingerprint className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-primary text-sm truncate leading-tight">
              {walletConnected ? providerLabel + ' Wallet' : 'FiberPass dApp'}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider truncate">
              {walletConnected ? addressTypeLabel + ' ' + shortAddress : shortAddress}
            </span>
          </div>
        </div>

        {/* Action Button: Create Session */}
        <div className="mb-8 px-2">
          <button 
            id="sidebar-create-btn"
            onClick={onCreateSessionClick}
            className="w-full bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-semibold text-xs tracking-wider uppercase py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(176,198,255,0.1)] hover:shadow-[0_0_20px_rgba(176,198,255,0.25)]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create Session
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main navigation links" className="flex-1 flex flex-col gap-1.5">
          <button
            id="sidebar-tab-active"
            onClick={() => onTabChange('active')}
            className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border-none bg-transparent cursor-pointer ${
              currentTab === 'active' 
                ? 'text-primary bg-primary-container/10 border-r-2 border-primary' 
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Bolt className={`w-4.5 h-4.5 shrink-0 ${currentTab === 'active' ? 'fill-current text-primary' : 'text-on-surface-variant'}`} />
            Active Sessions
          </button>

          <button
            id="sidebar-tab-history"
            onClick={() => onTabChange('history')}
            className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border-none bg-transparent cursor-pointer ${
              currentTab === 'history' 
                ? 'text-primary bg-primary-container/10 border-r-2 border-primary' 
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <History className={`w-4.5 h-4.5 shrink-0 ${currentTab === 'history' ? 'text-primary' : 'text-on-surface-variant'}`} />
            Session History
          </button>

          <button
            id="sidebar-tab-developer"
            onClick={() => onTabChange('developer')}
            className={(currentTab === 'developer' ? 'text-primary bg-primary-container/10 border-r-2 border-primary ' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface ') + 'w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border-none bg-transparent cursor-pointer'}
          >
            <Code2 className={(currentTab === 'developer' ? 'text-primary ' : 'text-on-surface-variant ') + 'w-4.5 h-4.5 shrink-0'} />
            Developer Apps
          </button>

          <button
            id="sidebar-tab-settings"
            onClick={() => onTabChange('settings')}
            className={(currentTab === 'settings' ? 'text-primary bg-primary-container/10 border-r-2 border-primary ' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface ') + 'w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border-none bg-transparent cursor-pointer'}
          >
            <Settings className={(currentTab === 'settings' ? 'text-primary ' : 'text-on-surface-variant ') + 'w-4.5 h-4.5 shrink-0'} />
            Settings
          </button>
        </nav>

        {/* Footer Support/Docs links */}
        <div className="mt-auto border-t border-outline-variant/50 pt-4 flex flex-col gap-1.5">
          <a 
            href="#how-it-works"
            onClick={onExitDapp}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors text-xs font-medium"
          >
            <Globe className="w-4 h-4" />
            Product Home
          </a>

          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); window.open('mailto:support@fiberpass.app', '_blank'); }}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors text-xs font-medium"
          >
            <HelpCircle className="w-4 h-4" />
            Help &amp; Support
          </a>

          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); alert("Docs are pre-rendered on our landing page. Learn more there!"); }}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors text-xs font-medium"
          >
            <FileText className="w-4 h-4" />
            Developer Docs
          </a>

          <button
            id="sidebar-exit-btn"
            onClick={onExitDapp}
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg text-error hover:bg-error/10 transition-colors border-none bg-transparent cursor-pointer text-xs font-semibold"
          >
            <LogOut className="w-4 h-4 shrink-0 text-error" />
            Exit dApp View
          </button>
        </div>
      </aside>
    </>
  );
}
