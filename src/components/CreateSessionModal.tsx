/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bolt, 
  X, 
  Link2, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Coins,
  LoaderCircle
} from 'lucide-react';
import { Session } from '../types';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (sessionData: {
    name: string;
    serviceAddress: string;
    limit: number;
    currency: string;
    duration: string;
    expiryTime: string;
    autoMicroCharges: boolean;
    singleUse: boolean;
    iconType: 'cloud' | 'code' | 'database' | 'cpu' | 'ai' | 'video' | 'rpc';
  }) => void | Promise<void>;
  walletBalance: number;
  isSubmitting?: boolean;
}

export default function CreateSessionModal({
  isOpen,
  onClose,
  onCreateSession,
  walletBalance,
  isSubmitting = false
}: CreateSessionModalProps) {
  const [serviceName, setServiceName] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [spendingLimit, setSpendingLimit] = useState('');
  const [currency, setCurrency] = useState('USDC');
  const [expiryPreset, setExpiryPreset] = useState<'1H' | '24H' | '7D' | 'Custom'>('24H');
  const [customExpiryValue, setCustomExpiryValue] = useState(50); // Slider 1-100 mapped to days/hours
  const [autoMicroCharges, setAutoMicroCharges] = useState(true);
  const [singleUse, setSingleUse] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setServiceName('');
      setServiceAddress('');
      setSpendingLimit('');
      setExpiryPreset('24H');
      setCustomExpiryValue(50);
      setAutoMicroCharges(true);
      setSingleUse(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Resolve actual display string of expiry time based on preset or custom slider
  const getExpiryDisplay = () => {
    if (expiryPreset === '1H') return '1 Hour';
    if (expiryPreset === '24H') return '24 Hours';
    if (expiryPreset === '7D') return '7 Days';
    
    // Custom slider map (1 to 100) -> 1 hour to 30 days
    if (customExpiryValue < 10) return `${customExpiryValue + 1} Hours`;
    const days = Math.max(1, Math.round(customExpiryValue / 3.3));
    return `${days} Days`;
  };

  const handleApplyPresetLimit = (amount: number | 'max') => {
    if (amount === 'max') {
      // Keep a buffer of 5 USDC
      setSpendingLimit(Math.max(0, walletBalance - 5).toFixed(2));
    } else {
      setSpendingLimit(amount.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage('');

    // Form validation
    if (!serviceName.trim()) {
      setErrorMessage('Please enter an Application or Service Name.');
      return;
    }

    if (!serviceAddress.trim()) {
      setErrorMessage('Please provide a wallet address or ENS domain.');
      return;
    }

    // Simple Ethereum address validation helper
    const isENS = serviceAddress.endsWith('.eth');
    const isHex = serviceAddress.startsWith('0x') && serviceAddress.length === 42;
    if (!isENS && !isHex && serviceAddress.length < 5) {
      setErrorMessage('Please enter a valid Hex Address (0x...) or ENS name (e.g. app.eth).');
      return;
    }

    const limitNum = parseFloat(spendingLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setErrorMessage('Please enter a spending limit greater than 0.');
      return;
    }

    if (limitNum > walletBalance) {
      setErrorMessage(`Insufficient wallet balance. Your maximum limit can be ${walletBalance.toFixed(2)} USDC.`);
      return;
    }

    // Map a random cute system iconType for the card
    const iconTypes: Array<'cloud' | 'code' | 'database' | 'cpu' | 'ai' | 'video' | 'rpc'> = [
      'cloud', 'code', 'database', 'cpu', 'ai', 'video', 'rpc'
    ];
    // Map based on name keyword if possible, otherwise random
    let iconType: 'cloud' | 'code' | 'database' | 'cpu' | 'ai' | 'video' | 'rpc' = 'rpc';
    const lowerName = serviceName.toLowerCase();
    if (lowerName.includes('ai') || lowerName.includes('chat') || lowerName.includes('bot')) iconType = 'ai';
    else if (lowerName.includes('cloud') || lowerName.includes('lambda')) iconType = 'cloud';
    else if (lowerName.includes('data') || lowerName.includes('db') || lowerName.includes('storage')) iconType = 'database';
    else if (lowerName.includes('api') || lowerName.includes('dev')) iconType = 'code';
    else if (lowerName.includes('node') || lowerName.includes('rpc')) iconType = 'rpc';
    else if (lowerName.includes('video') || lowerName.includes('stream') || lowerName.includes('media')) iconType = 'video';
    else iconType = iconTypes[Math.floor(Math.random() * iconTypes.length)];

    try {
      await onCreateSession({
        name: serviceName.trim(),
        serviceAddress: serviceAddress.trim(),
        limit: limitNum,
        currency,
        duration: getExpiryDisplay().replace(/\s+/g, '').toLowerCase(),
        expiryTime: getExpiryDisplay(),
        autoMicroCharges,
        singleUse,
        iconType
      });
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create FiberPass session.');
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Modal Dialog container */}
      <div className="w-full max-w-[600px] bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header block */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/50 bg-surface-container/50">
          <div className="flex items-center gap-2.5">
            <Bolt className="w-6 h-6 text-primary fill-current" />
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Create Session</h2>
          </div>
          <button 
            id="modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-variant transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Modal Form body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          
          {/* Validation Error Message */}
          {errorMessage && (
            <div className="bg-error/10 border border-error/30 text-error rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Input 1: Application/Service Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="service-name">
              Service / App Name
            </label>
            <input 
              id="service-name"
              type="text" 
              placeholder="e.g. AWS Compute Node, LLM summarizer..."
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline-variant"
              required
            />
          </div>

          {/* Input 2: App/Service target address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="service-address">
              App/Service Contract Address or Name
            </label>
            <div className="relative group">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors w-4 h-4" />
              <input 
                id="service-address"
                type="text" 
                placeholder="0x... or App ENS (.eth)"
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline-variant"
                required
              />
            </div>
          </div>

          {/* Input 3: Spending Limit (Tokens) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="spending-limit">
                Spending Limit
              </label>
              <span className="font-mono text-[10px] text-outline font-semibold">
                Balance: {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
              </span>
            </div>
            
            <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <input 
                id="spending-limit"
                type="number" 
                step="any"
                min="0.01"
                placeholder="0.00"
                value={spendingLimit}
                onChange={(e) => setSpendingLimit(e.target.value)}
                className="flex-grow bg-transparent border-none py-3 px-4 text-xl font-mono text-on-surface focus:ring-0 focus:outline-none placeholder:text-outline-variant"
                required
              />
              <div className="flex items-center px-4 border-l border-outline-variant bg-surface-container h-full">
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-transparent border-none text-on-surface text-xs font-bold focus:ring-0 cursor-pointer outline-none appearance-none pr-4"
                >
                  <option value="USDC">USDC</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="flex gap-2.5 mt-1">
              <button 
                type="button" 
                onClick={() => handleApplyPresetLimit(100)}
                className="flex-1 py-1.5 rounded border border-outline-variant bg-surface-container text-on-surface-variant font-mono text-xs hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                100
              </button>
              <button 
                type="button" 
                onClick={() => handleApplyPresetLimit(500)}
                className="flex-1 py-1.5 rounded border border-outline-variant bg-surface-container text-on-surface-variant font-mono text-xs hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                500
              </button>
              <button 
                type="button" 
                onClick={() => handleApplyPresetLimit('max')}
                className="flex-1 py-1.5 rounded border border-outline-variant bg-surface-container text-on-surface-variant font-mono text-xs hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                Max Limit
              </button>
            </div>
          </div>

          {/* Input 4: Expiry Time Controls */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Expiry Time
              </label>
              <span className="font-mono text-xs font-bold text-primary">
                {getExpiryDisplay()}
              </span>
            </div>

            {/* Preset Selector */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant">
              {(['1H', '24H', '7D', 'Custom'] as const).map((preset) => (
                <button 
                  key={preset}
                  type="button"
                  onClick={() => setExpiryPreset(preset)}
                  className={`py-2 text-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    expiryPreset === preset 
                      ? 'bg-surface-variant text-on-surface border border-outline-variant/60 shadow-sm' 
                      : 'text-on-surface-variant hover:text-on-surface bg-transparent border-none'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Custom range slider representing time boundaries */}
            {expiryPreset === 'Custom' && (
              <div className="px-1 mt-1">
                <input 
                  aria-label="Custom Expiry Slider"
                  type="range" 
                  min="1" 
                  max="100" 
                  value={customExpiryValue} 
                  onChange={(e) => setCustomExpiryValue(parseInt(e.target.value))}
                  className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-1.5 font-mono text-[9px] text-outline-variant">
                  <span>Now (1h)</span>
                  <span>Max (30D)</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-outline-variant/40 my-1" />

          {/* Permissions Toggle Toggles */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Permissions
            </label>

            {/* Toggle 1: Auto charges */}
            <div 
              onClick={() => setAutoMicroCharges(!autoMicroCharges)}
              className="flex items-center justify-between p-4 border border-outline-variant rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group"
            >
              <div className="flex flex-col gap-0.5 pr-4 min-w-0">
                <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                  Automatic micro-charges
                </span>
                <span className="text-[11px] text-on-surface-variant leading-relaxed">
                  Allow continuous streaming payments up to the specified limit in the background.
                </span>
              </div>
              
              {/* Checkbox Toggle Styled Component */}
              <div 
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 border border-transparent ${
                  autoMicroCharges 
                    ? 'bg-secondary shadow-[0_0_12px_rgba(78,222,163,0.25)]' 
                    : 'bg-surface-container-highest border-outline-variant'
                }`}
              >
                <div 
                  className={`absolute top-[2px] bg-surface-container-lowest w-[18px] h-[18px] rounded-full transition-all duration-200 ${
                    autoMicroCharges ? 'left-[21px]' : 'left-[2px]'
                  }`} 
                />
              </div>
            </div>

            {/* Toggle 2: Single use */}
            <div 
              onClick={() => setSingleUse(!singleUse)}
              className="flex items-center justify-between p-4 border border-outline-variant rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer group"
            >
              <div className="flex flex-col gap-0.5 pr-4 min-w-0">
                <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                  Single-use only
                </span>
                <span className="text-[11px] text-on-surface-variant leading-relaxed">
                  Session automatically terminates and settles immediately after the first transaction.
                </span>
              </div>

              {/* Checkbox Toggle Styled Component */}
              <div 
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 border border-transparent ${
                  singleUse 
                    ? 'bg-secondary shadow-[0_0_12px_rgba(78,222,163,0.25)]' 
                    : 'bg-surface-container-highest border-outline-variant'
                }`}
              >
                <div 
                  className={`absolute top-[2px] bg-surface-container-lowest w-[18px] h-[18px] rounded-full transition-all duration-200 ${
                    singleUse ? 'left-[21px]' : 'left-[2px]'
                  }`} 
                />
              </div>
            </div>
          </div>

          {/* Footer form button */}
          <div className="mt-4 pt-4 border-t border-outline-variant bg-surface-container-lowest/40 -mx-6 -mb-6 p-6 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-surface border border-outline hover:border-white text-on-surface-variant hover:text-white transition-colors py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-on-primary hover:bg-primary-fixed py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:shadow-[0_0_20px_rgba(176,198,255,0.25)] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Creating...' : 'Create FiberPass'}</span>
              {isSubmitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
