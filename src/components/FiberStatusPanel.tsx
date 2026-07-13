import { AlertTriangle, CheckCircle2, RefreshCw, RadioTower, Server, Waves } from 'lucide-react';
import { type FiberChannelStrategy, type FiberNodeReadiness } from '../lib/settingsApi';
import { formatCurrencyAmount } from '../lib/currency';

interface FiberStatusPanelProps {
  readiness: FiberNodeReadiness | null;
  strategy: FiberChannelStrategy | null;
  isLoading: boolean;
  error: string;
  onRefresh: () => void;
}

function statusClass(status?: string): string {
  if (status === 'ready' || status === 'available') return 'border-secondary/30 bg-secondary/10 text-secondary';
  if (status === 'blocked' || status === 'error') return 'border-error/30 bg-error/10 text-error';
  return 'border-primary/30 bg-primary/10 text-primary';
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 min-w-0">
      <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
      <span className="mt-1 block font-mono text-xs text-on-surface truncate">{value}</span>
    </div>
  );
}

export default function FiberStatusPanel({ readiness, strategy, isLoading, error, onRefresh }: FiberStatusPanelProps) {
  const alerts = readiness?.alerts ?? [];
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;
  const warningCount = alerts.filter((alert) => alert.severity === 'warning').length;

  return (
    <div className="bg-surface-container-low/50 border border-outline-variant rounded-2xl p-6 lg:col-span-2 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <RadioTower className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-on-surface">Fiber Network Status</h3>
            <p className="text-xs text-on-surface-variant truncate">{readiness?.rpcUrl ?? 'Checking Fiber RPC'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface hover:border-primary/50 disabled:opacity-60 flex items-center gap-2"
        >
          <RefreshCw className={'w-3.5 h-3.5 ' + (isLoading ? 'animate-spin' : '')} />
          Sync
        </button>
      </div>

      {error && <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Stat label="Execution" value={readiness?.paymentExecution.status ?? 'loading'} />
        <Stat label="Peers" value={readiness?.peers.status === 'available' ? String(readiness.peers.connectedCount ?? 0) : readiness?.peers.status ?? 'unknown'} />
        <Stat label="Channels" value={readiness?.channels.status === 'available' ? (readiness.channels.activeCount ?? 0) + ' active' : readiness?.channels.status ?? 'unknown'} />
        <Stat label="Liquidity" value={readiness?.channels.totalOutboundCapacity == null ? 'unknown' : formatCurrencyAmount(readiness.channels.totalOutboundCapacity, 'CKB')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-secondary">
            <Server className="h-4 w-4" />
            <h4 className="text-sm font-bold text-on-surface">Node</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Stat label="Reachable" value={readiness?.reachable ? 'yes' : 'no'} />
            <Stat label="Network" value={readiness?.network ?? strategy?.network ?? 'testnet'} />
            <Stat label="Version" value={readiness?.node?.version ?? 'unknown'} />
            <Stat label="Latency" value={readiness?.latencyMs == null ? 'unknown' : readiness.latencyMs + ' ms'} />
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Waves className="h-4 w-4" />
            <h4 className="text-sm font-bold text-on-surface">Channel Strategy</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Stat label="Target Peers" value={String(strategy?.targetPeers.length ?? 0)} />
            <Stat label="Test Amount" value={strategy ? formatCurrencyAmount(strategy.testChannelAmount, 'CKB') : 'unknown'} />
            <Stat label="Min Peers" value={String(readiness?.operator.minPeers ?? 1)} />
            <Stat label="Min Channels" value={String(readiness?.operator.minActiveChannels ?? 1)} />
          </div>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={'rounded-full border px-2 py-0.5 font-bold uppercase ' + statusClass(readiness?.readiness)}>{readiness?.readiness ?? 'unknown'}</span>
            <span className="text-on-surface-variant">{criticalCount} critical / {warningCount} warning</span>
          </div>
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.code} className={'rounded-lg border px-3 py-2 text-xs ' + (alert.severity === 'critical' ? 'border-error/30 bg-error/10 text-error' : 'border-primary/30 bg-primary/10 text-primary')}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold uppercase tracking-wider text-[10px]">{alert.code}</p>
                  <p className="mt-1 text-on-surface">{alert.message}</p>
                  <p className="mt-1 text-on-surface-variant">{alert.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-secondary font-semibold">
          <CheckCircle2 className="w-4 h-4 text-secondary fill-secondary/10 shrink-0" />
          Fiber node checks are passing.
        </div>
      )}
    </div>
  );
}
