/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Cloud, 
  Code, 
  Database, 
  Cpu, 
  Video, 
  Activity, 
  MessageSquare,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Receipt,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { Session } from '../types';
import { formatCurrencyAmount } from '../lib/currency';

interface HistoryViewProps {
  historySessions: Session[];
  isLoading?: boolean;
}

function shortValue(value?: string): string {
  if (!value) return 'Not set';
  if (value.length <= 18) return value;
  return value.slice(0, 10) + '...' + value.slice(-8);
}

function ProofLink({ proofId, explorerUrl }: { proofId?: string; explorerUrl?: string }) {
  if (!proofId) return <>Not set</>;
  if (!explorerUrl) return <>{shortValue(proofId)}</>;
  return (
    <a href={explorerUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-primary hover:text-secondary">
      <span>{shortValue(proofId)}</span>
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}

export default function HistoryView({ historySessions, isLoading = false }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    historySessions[0]?.id || ''
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Filter history records based on search query and status dropdown
  const filteredSessions = historySessions.filter((session) => {
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          session.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          session.serviceAddress.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatusFilter === 'all' || session.status === selectedStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get active selected session
  const selectedSession = historySessions.find((s) => s.id === selectedSessionId) || historySessions[0];

  const handleExportCSV = (session: Session) => {
    if (!session) return;
    
    // Construct CSV string from the session ledger shown in the API response.
    const csvHeaders = "Log ID,Action,Timestamp,Charged Amount (" + session.currency + ")\n";
    const csvRows = session.logs.map(log =>
      `"${log.id}","${log.type}","${log.timestamp}","${formatCurrencyAmount(log.amount, session.currency, 8)}"`
    ).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + csvHeaders + csvRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fiberpass_session_${session.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'settled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/10 text-secondary text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            Settled
          </span>
        );
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-error/30 bg-error/10 text-error text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            Revoked
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-outline/30 bg-outline/10 text-outline text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  const renderSessionIcon = (type: string) => {
    switch (type) {
      case 'cloud':
        return <Cloud className="w-4 h-4 text-primary" />;
      case 'code':
        return <Code className="w-4 h-4 text-primary" />;
      case 'database':
        return <Database className="w-4 h-4 text-primary" />;
      case 'cpu':
        return <Cpu className="w-4 h-4 text-primary" />;
      case 'ai':
        return <MessageSquare className="w-4 h-4 text-primary" />;
      case 'video':
        return <Video className="w-4 h-4 text-primary" />;
      case 'rpc':
        return <Activity className="w-4 h-4 text-primary" />;
      default:
        return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/60 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">Session History</h1>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
            Review settled, revoked, and expired payment streams.
          </p>
        </div>

        {/* Filters and Searches */}
        <div className="flex flex-wrap gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-lg py-1.5 pl-10 pr-4 text-sm font-sans focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none w-full sm:w-60 transition-all placeholder:text-outline-variant"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 pr-8 text-xs font-semibold uppercase tracking-wider text-on-surface hover:border-primary transition-all cursor-pointer focus:ring-1 focus:ring-primary focus:outline-none appearance-none"
            >
              <option value="all">ALL STATUSES</option>
              <option value="settled">SETTLED</option>
              <option value="revoked">REVOKED</option>
              <option value="expired">EXPIRED</option>
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline w-3.5 h-3.5 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start flex-1">
        
        {/* Left Side: Sessions Data Table (Spans 2 columns) */}
        <div className="xl:col-span-2 bg-surface-container-low/50 backdrop-blur-md rounded-2xl border border-outline-variant/60 flex flex-col h-full min-h-[500px] overflow-hidden shadow-md">
          <div className="p-5 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low/20">
            <h3 className="text-base font-bold text-primary tracking-tight">All Historical Streams</h3>
            <span className="font-mono text-[10px] font-bold text-on-surface-variant px-2.5 py-1 bg-surface-container-highest border border-outline-variant rounded-full tracking-wider uppercase">
              {filteredSessions.length} Records
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto flex-grow">
            {isLoading ? (
              <div className="p-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                Loading session history...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant text-sm">
                {historySessions.length === 0 ? 'No session history yet.' : 'No matching sessions found. Try clearing your filters or search terms.'}
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-surface-container-low/40 sticky top-0 backdrop-blur-md border-b border-outline-variant">
                  <tr>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">App/Service</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Spent</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Duration</th>
                    <th className="p-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-sm font-sans">
                  {filteredSessions.map((session) => {
                    const isSelected = selectedSession?.id === session.id;
                    return (
                      <tr 
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`transition-colors cursor-pointer hover:bg-surface-container-high/60 ${
                          isSelected ? 'bg-primary/5 border-l-2 border-primary' : ''
                        }`}
                      >
                        {/* Service name & icon */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                              {renderSessionIcon(session.iconType)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface">{session.name}</span>
                              <span className="font-mono text-[10px] text-on-surface-variant truncate w-40 sm:w-auto">
                                {session.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Spent */}
                        <td className="p-4 font-mono font-medium text-secondary">
                          {formatCurrencyAmount(session.spent, session.currency)}
                        </td>

                        {/* Duration */}
                        <td className="p-4 text-on-surface-variant text-xs">
                          {session.duration}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {renderStatusBadge(session.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Detailed View Panel (Spans 1 column) */}
        {isLoading ? (
          <div className="xl:col-span-1 bg-surface-container-low/50 backdrop-blur-md rounded-2xl border border-outline-variant/60 p-6 flex flex-col justify-center items-center h-full min-h-[400px]">
            <RefreshCw className="w-10 h-10 text-primary mb-3 animate-spin" />
            <p className="text-sm text-on-surface-variant font-medium text-center">
              Loading ledger details...
            </p>
          </div>
        ) : selectedSession ? (
          <div className="xl:col-span-1 bg-surface-container-low/50 backdrop-blur-md rounded-2xl border border-primary/20 relative overflow-hidden flex flex-col h-full shadow-lg">
            {/* Upper Blue Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

            {/* Panel Header */}
            <div className="p-6 border-b border-outline-variant/50 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-container/10 border border-primary/30 flex items-center justify-center text-primary">
                  {renderSessionIcon(selectedSession.iconType)}
                </div>
                {renderStatusBadge(selectedSession.status)}
              </div>
              <h3 className="text-xl font-bold text-on-surface tracking-tight">
                {selectedSession.name}
              </h3>
              <p className="font-mono text-[10px] text-on-surface-variant mt-1.5 flex items-center gap-1.5 select-all">
                ID: {selectedSession.id}
                <ExternalLink className="w-3 h-3 text-outline hover:text-primary cursor-pointer" />
              </p>
              <p className="font-mono text-[10px] text-on-surface-variant mt-1 truncate">
                Fiber: {selectedSession.fiberStatus ?? 'unknown'} / {selectedSession.fiberProofId ?? selectedSession.lastChargeProofId ?? 'no proof yet'}
              </p>
            </div>

            {/* Financial Details Box */}
            <div className="p-6 flex flex-col gap-3.5 border-b border-outline-variant/50 relative z-10 bg-surface-container-low/30">
              <div className="flex justify-between items-end text-xs">
                <span className="text-on-surface-variant font-medium uppercase tracking-wider text-[10px]">Total Authorized</span>
                <span className="font-mono font-semibold text-on-surface">{formatCurrencyAmount(selectedSession.limit, selectedSession.currency)}</span>
              </div>
              
              <div className="flex justify-between items-end text-xs">
                <span className="text-on-surface-variant font-medium uppercase tracking-wider text-[10px]">Actual Settle Spent</span>
                <span className="font-mono font-bold text-secondary text-base">
                  {formatCurrencyAmount(selectedSession.spent, selectedSession.currency)}
                </span>
              </div>

              {/* Progress Bar (Spending Limit) */}
              <div className="mt-2">
                <div className="flex justify-between mb-1.5 text-[10px] font-medium text-on-surface-variant">
                  <span>Utilization</span>
                  <span className="font-mono">
                    {(selectedSession.limit > 0 ? Math.min((selectedSession.spent / selectedSession.limit) * 100, 100) : 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" 
                    style={{ width: `${selectedSession.limit > 0 ? Math.min((selectedSession.spent / selectedSession.limit) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Transaction Log list */}
            <div className="flex-1 p-6 relative z-10 flex flex-col min-h-[220px]">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-primary" />
                Transaction Log ({selectedSession.logs.length})
              </h4>

              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[280px] pr-1">
                {selectedSession.logs.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-6">No micro-charges recorded.</p>
                ) : (
                  selectedSession.logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="flex justify-between items-center py-2 border-b border-outline-variant/20 hover:bg-surface-container-high/30 px-1.5 rounded-lg transition-colors group"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                          {log.type}
                        </span>
                        <span className="font-mono text-[9px] text-on-surface-variant mt-0.5">
                          {log.timestamp}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-secondary text-xs shrink-0 pl-2">
                        +{formatCurrencyAmount(log.amount, selectedSession.currency, 8)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Charge Attempts */}
            <div className="p-6 border-t border-outline-variant/50 relative z-10 flex flex-col gap-3">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-primary" />
                Charge Attempts ({selectedSession.chargeAttempts?.length ?? 0})
              </h4>

              {(selectedSession.chargeAttempts?.length ?? 0) === 0 ? (
                <p className="text-xs text-on-surface-variant py-2">No app charge attempts recorded.</p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {selectedSession.chargeAttempts.map((attempt) => (
                    <div key={attempt.id} className="rounded-lg border border-outline-variant/40 bg-surface-container/50 p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={attempt.status === 'succeeded' ? 'w-1.5 h-1.5 rounded-full bg-secondary shrink-0' : 'w-1.5 h-1.5 rounded-full bg-error shrink-0'} />
                          <span className="font-semibold text-xs text-on-surface truncate">{attempt.type}</span>
                        </div>
                        <p className="font-mono text-[9px] text-on-surface-variant mt-1 truncate">{new Date(attempt.createdAt).toLocaleString()}</p>
                        {attempt.proofId && (
                          <p className="font-mono text-[9px] text-on-surface-variant mt-1 truncate">Proof: <ProofLink proofId={attempt.proofId} explorerUrl={attempt.explorerUrl} /></p>
                        )}
                        {attempt.failureMessage && (
                          <p className="text-[10px] text-error mt-1 leading-relaxed">{attempt.failureCode}: {attempt.failureMessage}</p>
                        )}
                      </div>
                      <span className={attempt.status === 'succeeded' ? 'font-mono font-semibold text-secondary text-xs shrink-0' : 'font-mono font-semibold text-error text-xs shrink-0'}>
                        {attempt.status === 'succeeded' ? '+' : ''}{formatCurrencyAmount(attempt.amount, attempt.currency, 8)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-6 border-t border-outline-variant/50 bg-surface-container-low/40 backdrop-blur-sm relative z-10 flex gap-3">
              <button 
                onClick={() => handleExportCSV(selectedSession)}
                className="flex-1 bg-surface border border-outline hover:border-primary text-on-surface hover:text-primary transition-all duration-200 font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV Ledger
              </button>
            </div>
          </div>
        ) : (
          <div className="xl:col-span-1 bg-surface-container-low/50 backdrop-blur-md rounded-2xl border border-outline-variant/60 p-6 flex flex-col justify-center items-center h-full min-h-[400px]">
            <Clock className="w-10 h-10 text-outline-variant mb-3 animate-pulse" />
            <p className="text-sm text-on-surface-variant font-medium text-center">
              Select a history record to inspect details.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
