import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Pause,
  RefreshCw,
  Radio,
  Server,
  Zap,
  ShieldCheck,
  ShieldAlert,
  ArrowDownCircle,
  Filter,
} from 'lucide-react';
import { SecurityLog } from '../../types/security';
import { SeverityBadge } from '../common/Badge';

interface MonitoringViewProps {
  logs: SecurityLog[];
  onSelectLog: (log: SecurityLog) => void;
  onInjectEvent: (log: SecurityLog) => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  logs,
  onSelectLog,
  onInjectEvent,
}) => {
  const [isStreaming, setIsStreaming] = useState(true);
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('all');
  const [streamBuffer, setStreamBuffer] = useState<SecurityLog[]>(logs);
  const [eps, setEps] = useState<number>(34);

  // Simulated live event ticker when streaming is active
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // Fluctuate EPS realistically
      setEps(Math.floor(28 + Math.random() * 15));

      // Occasionally generate a synthetic event
      const shouldGenerate = Math.random() > 0.4;
      if (shouldGenerate) {
        const docIps = ['198.51.100.42', '198.51.100.88', '203.0.113.19', '192.0.2.140', '192.0.2.210'];
        const users = ['deploy-bot', 's.miller', 'backup_svc', 'admin', 'operator', 'anonymous'];
        const isSuspicious = Math.random() > 0.75;
        const randomIp = docIps[Math.floor(Math.random() * docIps.length)];
        const randomUser = users[Math.floor(Math.random() * users.length)];

        const newEvent: SecurityLog = {
          id: `LOG-${Math.floor(88402 + Math.random() * 9000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          sourceIp: randomIp,
          destinationIp: '192.0.2.10',
          user: randomUser,
          eventType: isSuspicious ? 'AUTH_FAILURE' : 'AUTH_SUCCESS',
          category: isSuspicious ? 'suspicious' : 'authentication',
          severity: isSuspicious ? 'high' : 'info',
          action: isSuspicious ? 'FAILURE' : 'SUCCESS',
          details: isSuspicious
            ? `Simulated failed login attempt for ${randomUser} from ${randomIp}`
            : `Routine access token issued to ${randomUser}`,
          metadata: { simulated: true, latencyMs: Math.floor(12 + Math.random() * 40) },
        };

        setStreamBuffer((prev) => [newEvent, ...prev.slice(0, 49)]);
      }
    }, 2400);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const filteredLogs = streamBuffer.filter((l) => {
    if (eventCategoryFilter === 'all') return true;
    if (eventCategoryFilter === 'suspicious') return l.category === 'suspicious' || l.action === 'FAILURE';
    if (eventCategoryFilter === 'auth') return l.category === 'authentication';
    return l.category === eventCategoryFilter;
  });

  const normalCount = streamBuffer.filter((l) => l.action === 'SUCCESS').length;
  const suspCount = streamBuffer.filter((l) => l.action === 'FAILURE' || l.action === 'SUSPICIOUS').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with streaming controls */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Telemetry Ingestion Pipeline
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                SYNTHETIC STREAM
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Processing simulated syslog, auth.log, and network netflow events
            </p>
          </div>
        </div>

        {/* Stream Toggle & Simulation Stats */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              isStreaming
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Feed</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Feed</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monitoring Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>THROUGHPUT</span>
            <Server className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {isStreaming ? eps : 0}
            </span>
            <span className="text-xs font-mono text-slate-500">events / sec</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Buffer health: 100% nominal</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>NORMAL TRAFFIC</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {normalCount}
            </span>
            <span className="text-xs font-mono text-slate-500">verified</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Authorized tokens &amp; VPNs</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>SUSPICIOUS / FAILED</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 tabular-nums">
              {suspCount}
            </span>
            <span className="text-xs font-mono text-slate-500">flagged</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Evaluated by detection engine</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>DROPPED / CORRUPTED</span>
            <ArrowDownCircle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              0
            </span>
            <span className="text-xs font-mono text-slate-500">packets</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Zero packet loss</p>
        </div>
      </div>

      {/* Real-time Stream Table */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Incoming Event Telemetry Stream
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredLogs.length} events buffered)
            </span>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'suspicious', label: 'Suspicious / Failed' },
              { id: 'auth', label: 'Authentication' },
              { id: 'network', label: 'Network' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setEventCategoryFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  eventCategoryFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stream Table */}
        <div className="overflow-x-auto mt-4 max-h-[500px]">
          <table className="w-full text-left text-xs font-mono min-w-[760px]">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 uppercase text-[10px] sticky top-0 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Event ID</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-semibold whitespace-nowrap">
                    {log.id}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-cyan-300 whitespace-nowrap">
                    {log.sourceIp}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {log.user || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {log.eventType}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`font-bold text-[11px] ${
                        log.action === 'SUCCESS'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : log.action === 'FAILURE'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
