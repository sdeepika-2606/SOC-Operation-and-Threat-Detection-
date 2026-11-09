import React, { useState } from 'react';
import {
  BellRing,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertOctagon,
  Eye,
  ExternalLink,
  ShieldAlert,
  Send,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { SecurityAlert, SeverityLevel, AlertStatus } from '../../types/security';
import { SeverityBadge, StatusBadge } from '../common/Badge';
import { Drawer } from '../common/Drawer';
import { NavView } from '../layout/Sidebar';

interface AlertCenterViewProps {
  alerts: SecurityAlert[];
  onUpdateAlertStatus: (alertId: string, status: AlertStatus, note?: string) => void;
  onEscalateToIncident: (alert: SecurityAlert) => void;
  onSelectView: (view: NavView) => void;
}

export const AlertCenterView: React.FC<AlertCenterViewProps> = ({
  alerts,
  onUpdateAlertStatus,
  onEscalateToIncident,
  onSelectView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [analystNote, setAnalystNote] = useState('');

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      !searchQuery ||
      alert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.sourceIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleApplyNote = () => {
    if (selectedAlert && analystNote.trim()) {
      onUpdateAlertStatus(selectedAlert.id, selectedAlert.status, analystNote.trim());
      setSelectedAlert({
        ...selectedAlert,
        analystNotes: selectedAlert.analystNotes
          ? `${selectedAlert.analystNotes} | ${analystNote.trim()}`
          : analystNote.trim(),
      });
      setAnalystNote('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Actions */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Alert Queue &amp; Triage Console
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
              {alerts.filter(a => a.status === 'new').length} UNTRIAGED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluate fired detection triggers, correlate telemetry, and triage confirmed threat vectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectView('incidents')}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
            <span>Active Incidents (2)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by Alert ID, source IP, rule..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-mono"
          >
            <option value="all">Severity: All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-mono"
          >
            <option value="all">Status: All</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alert Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono min-w-[760px]">
            <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Alert ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Detection Rule</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-cyan-300 whitespace-nowrap">
                    {alert.id}
                  </td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {alert.timestamp}
                  </td>
                  <td className="py-3 px-3 text-slate-800 dark:text-slate-200 font-medium truncate max-w-xs">
                    {alert.ruleName}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {alert.sourceIp}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <SeverityBadge severity={alert.severity} size="sm" />
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {alert.confidence}%
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <StatusBadge status={alert.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {alert.status === 'new' && (
                        <button
                          onClick={() => onUpdateAlertStatus(alert.id, 'investigating')}
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold tracking-wider uppercase border border-amber-500/20"
                          title="Assign to Investigation"
                        >
                          Investigate
                        </button>
                      )}
                      {alert.status === 'investigating' && (
                        <button
                          onClick={() => onUpdateAlertStatus(alert.id, 'resolved')}
                          className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/20"
                          title="Mark Resolved"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Slide-Over Drawer */}
      {selectedAlert && (
        <Drawer
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
          title={`Alert Details: ${selectedAlert.id}`}
          subtitle={`Triggered by ${selectedAlert.ruleName}`}
          width="xl"
        >
          <div className="space-y-6">
            {/* Header Status Bar */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <SeverityBadge severity={selectedAlert.severity} />
                <StatusBadge status={selectedAlert.status} />
              </div>
              <div className="text-right text-xs font-mono">
                <span className="text-slate-500">Confidence: </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedAlert.confidence}%
                </span>
              </div>
            </div>

            {/* Event Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Event Description
              </h4>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono">
                {selectedAlert.description}
              </p>
            </div>

            {/* Source Attribution & Target */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-mono text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Source IP (RFC 5737):</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  {selectedAlert.sourceIp}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Target Account / Handle:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedAlert.targetUser || 'Undetermined / System'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">First Seen:</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedAlert.firstSeen}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Last Seen:</span>
                <span className="text-slate-700 dark:text-slate-300">{selectedAlert.lastSeen}</span>
              </div>
            </div>

            {/* Matched Evidence Findings */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Correlated Log Evidence ({selectedAlert.evidence?.length || 0})
              </h4>
              <div className="space-y-1.5">
                {selectedAlert.evidence?.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 font-mono text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-cyan-500 shrink-0 font-bold">›</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyst Triage Notes */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Analyst Investigation Notes</span>
              </h4>

              {selectedAlert.analystNotes && (
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950 text-xs font-mono text-slate-700 dark:text-slate-300 mb-3 border border-slate-200 dark:border-slate-800">
                  {selectedAlert.analystNotes}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={analystNote}
                  onChange={(e) => setAnalystNote(e.target.value)}
                  placeholder="Append triage observation (e.g. Host isolated via perimeter null-route)..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
                <button
                  onClick={handleApplyNote}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 text-xs font-medium font-mono shrink-0"
                >
                  Save Note
                </button>
              </div>
            </div>

            {/* Escalation Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedAlert(null);
                  onEscalateToIncident(selectedAlert);
                }}
                className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Escalate to Confirmed Incident</span>
              </button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
