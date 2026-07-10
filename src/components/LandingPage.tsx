/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bolt, 
  Hourglass, 
  Coins, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Terminal, 
  ShieldAlert, 
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { DEVELOPER_CODE_SNIPPET } from '../data/initialData';

interface LandingPageProps {
  onLaunchDapp: () => void;
  onConnectWallet: () => void;
  walletConnected: boolean;
  walletAddress: string;
  walletAuthProvider: 'joyid';
  walletAddressType: 'ckb';
  authLoading: boolean;
}

export default function LandingPage({ 
  onLaunchDapp, 
  onConnectWallet, 
  walletConnected, 
  walletAddress,
  walletAuthProvider,
  walletAddressType,
  authLoading
}: LandingPageProps) {
  const [streamProgress, setStreamProgress] = useState(0.05);

  // Animate the payment streaming widget on the landing page
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamProgress((prev) => {
        if (prev >= 4.98) return 0.05;
        return parseFloat((prev + 0.08).toFixed(2));
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background font-sans selection:bg-primary-container selection:text-on-primary-container relative overflow-x-hidden">
      {/* Glow Backdrops */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Bolt className="w-5 h-5 text-on-primary font-bold fill-current" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-glow">
              Fiber<span className="text-primary">Pass</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex gap-8 items-center">
            <a href="#how-it-works" className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 text-sm">How it Works</a>
            <a href="#problems" className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 text-sm">Problems</a>
            <a href="#sdk" className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 text-sm">Developer SDK</a>
            <button onClick={onLaunchDapp} className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 text-sm bg-transparent border-none cursor-pointer">
              Dashboard
            </button>
          </div>

          {/* Connect Wallet Button */}
          <div className="flex items-center gap-3">
            <button 
              id="nav-connect-wallet-btn"
              onClick={walletConnected ? onLaunchDapp : onConnectWallet}
              disabled={authLoading}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-all duration-200 font-semibold text-xs tracking-wide uppercase shadow-[0_0_15px_rgba(176,198,255,0.15)] hover:shadow-[0_0_25px_rgba(176,198,255,0.3)] active:scale-98"
            >
              {authLoading
                ? 'Connecting JoyID...'
                : walletConnected
                  ? `${walletAuthProvider === 'joyid' ? 'JoyID ' : ''}${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
                  : 'Connect JoyID'
              }
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:py-40 flex items-center justify-center px-6 min-h-[85vh]">
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight leading-[1.1] md:leading-[1.15]">
            Approve once, <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-glow">
              pay continuously.
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-on-surface-variant max-w-2xl mx-auto font-normal leading-relaxed">
            FiberPass turns frictionless micropayments into seamless streaming sessions. Institutional infrastructure for high-velocity dApps.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              id="hero-launch-btn"
              onClick={onLaunchDapp} 
              className="w-full sm:w-auto bg-primary text-on-primary px-8 py-3 rounded-xl font-bold hover:bg-primary-fixed transition-all duration-300 shadow-[0_0_30px_rgba(176,198,255,0.25)] hover:shadow-[0_0_40px_rgba(176,198,255,0.45)] flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              Launch dApp
              <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="#sdk" 
              className="w-full sm:w-auto bg-surface-container-low/80 backdrop-blur-md border border-outline-variant/60 text-primary hover:text-white px-8 py-3 rounded-xl font-bold hover:bg-surface-container-high transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              Read Docs
            </a>
          </div>
        </div>
      </section>

      {/* The Micropayment Problem Section */}
      <section id="problems" className="py-24 px-6 max-w-7xl mx-auto space-y-12 border-t border-outline-variant/30">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">The Micropayment Problem</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-base md:text-lg">
            Confirming every $0.01 transaction destroys user experience and clogs the network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/50 space-y-4 hover:border-primary/40 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl bg-error-container/10 border border-error/20 flex items-center justify-center text-error">
              <Hourglass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-on-surface">UX Friction</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Constant wallet confirmations for tiny actions break user flow and immersion in your application.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/50 space-y-4 hover:border-primary/40 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl bg-tertiary-container/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-on-surface">Gas Costs</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Paying full settlement costs for every micro-interaction makes low-cost services economically unviable.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-low/50 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/50 space-y-4 hover:border-primary/40 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center text-primary-container">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-on-surface">Network Latency</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Waiting for block confirmations on every click destroys real-time interactivity for AI and gaming.
            </p>
          </div>
        </div>
      </section>

      {/* How FiberPass Works Section */}
      <section id="how-it-works" className="bg-surface-container-low/30 py-24 px-6 border-y border-outline-variant/30">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">How FiberPass Works</h2>
            <p className="text-on-surface-variant max-w-lg mx-auto">Three steps to seamless continuous streaming.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Steps line connector (Desktop only) */}
            <div className="hidden md:block absolute top-[48px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-primary/20 via-primary/50 to-secondary/20 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 bg-surface-container-low/80 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/60 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary font-bold text-lg shadow-[0_0_15px_rgba(176,198,255,0.3)]">
                1
              </div>
              <h3 className="text-xl font-bold text-on-surface">Set Limit</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                User defines a strict spending cap and time bound for the Fiber payment session.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 bg-surface-container-low/80 backdrop-blur-md p-8 rounded-2xl border border-outline-variant/60 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary font-bold text-lg shadow-[0_0_15px_rgba(176,198,255,0.3)]">
                2
              </div>
              <h3 className="text-xl font-bold text-on-surface">Grant Permission</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                A single signature authorizes the specific dApp to pull funds up to the limit without further prompts.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 bg-surface-container-low/80 backdrop-blur-md p-8 rounded-2xl border border-primary/50 flex flex-col items-center text-center space-y-4 shadow-[0_0_20px_rgba(176,198,255,0.05)]">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-[0_0_15px_rgba(176,198,255,0.5)]">
                3
              </div>
              <h3 className="text-xl font-bold text-on-surface">Stream Payments</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Value flows instantaneously in the background as the user interacts with the application.
              </p>

              {/* Live Progress Widget */}
              <div className="w-full bg-background/50 border border-outline-variant/40 rounded-xl p-3 mt-4 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
                  <span className="flex items-center gap-1.5 text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    Streaming...
                  </span>
                  <span className="text-secondary font-bold font-mono">
                    {streamProgress.toFixed(2)} / 5.00 CKB
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-150"
                    style={{ width: `${(streamProgress / 5.00) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDK Integration Section */}
      <section id="sdk" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="bg-surface-container-low/40 backdrop-blur-md rounded-2xl border border-outline-variant/50 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Text Left */}
          <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
              Built for the AI &amp; Agent Economy
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
              Integrate FiberPass with just a few lines of code. Perfect for AI agents requiring continuous API access, autonomous trading bots, and pay-per-second media streaming.
            </p>

            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 text-on-surface text-sm">
                <CheckCircle2 className="w-5 h-5 text-secondary fill-secondary/10" />
                Wallet SDKs for seamless connection
              </li>
              <li className="flex items-center gap-3 text-on-surface text-sm">
                <CheckCircle2 className="w-5 h-5 text-secondary fill-secondary/10" />
                Agentic framework adapters
              </li>
              <li className="flex items-center gap-3 text-on-surface text-sm">
                <CheckCircle2 className="w-5 h-5 text-secondary fill-secondary/10" />
                Sub-second settlement layer
              </li>
            </ul>

            <div className="pt-4">
              <button 
                onClick={onLaunchDapp}
                className="bg-surface border border-primary/40 px-5 py-2.5 rounded-lg text-primary hover:bg-primary/10 hover:border-primary hover:text-white transition-all duration-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Terminal className="w-4 h-4" />
                View Developer Docs
              </button>
            </div>
          </div>

          {/* Code Right */}
          <div className="bg-surface-container-lowest p-6 border-t md:border-t-0 md:border-l border-outline-variant/50 flex flex-col justify-center font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error/40" />
                <div className="w-3 h-3 rounded-full bg-tertiary/40" />
                <div className="w-3 h-3 rounded-full bg-secondary/40" />
              </div>
              <span className="text-[10px] text-on-surface-variant">fiberpass-client.ts</span>
            </div>
            <pre className="text-xs leading-relaxed overflow-x-auto text-on-surface-variant p-2">
              <code className="text-emerald-400">
                {DEVELOPER_CODE_SNIPPET}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant bg-surface-container-lowest/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-2xl font-bold tracking-tight text-glow">
              Fiber<span className="text-primary">Pass</span>
            </span>
            <p className="text-xs text-on-surface-variant">
              © 2026 FiberPass Infrastructure. Secure &amp; Real-time continuous micro-payments.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-on-surface-variant">
            <a href="#" className="hover:text-secondary transition-colors">Security</a>
            <a href="#" className="hover:text-secondary transition-colors">Terms</a>
            <a href="#" className="hover:text-secondary transition-colors">Privacy</a>
            <a href="#" className="hover:text-secondary transition-colors">Twitter</a>
            <a href="#" className="hover:text-secondary transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
