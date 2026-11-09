import React, { useState } from 'react';
import {
  Clock,
  GitCommit,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  ArrowDown,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TimelineEvent, SecurityIncident } from '../../types/security';
import { SeverityBadge, StatusBadge } from '../common/Badge';

interface IncidentTimelineViewProps {
  timelineEvents: TimelineEvent[];
  incidents: SecurityIncident[];
  onSelectAlertById?: (alertId: string) => void;
}

export const IncidentTimelineView: React.FC<IncidentTimelineViewProps> = ({
  timelineEvents,
  incidents,
  onSelectAlertById,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('INC-2026-001');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredEvents = timelineEvents.filter((ev) => {
    const matchesIncident = ev.incidentId === selectedIncidentId;
    const matchesCategory = categoryFilter === 'all' || ev.category === categoryFilter;
    return matchesIncident && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Incident Switcher */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Forensic Incident Chronology
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
              TIME-CORRELATED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Step-by-step reconstruction of unauthorized activity, detection triggers, and containment milestones.
          </p>
        </div>

        {/* Incident Select & Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.id} - {inc.title.slice(0, 32)}...
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Category: All</option>
            <option value="telemetry">Telemetry</option>
            <option value="detection">Detection</option>
            <option value="containment">Containment</option>
            <option value="investigation">Investigation</option>
          </select>
        </div>
      </div>

      {/* Vertical Connected Timeline */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-500 mb-8">
          <span>TIMELINE FOR {selectedIncidentId}</span>
          <span>{filteredEvents.length} VERIFIED CHRONOLOGICAL NODES</span>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800">
          {filteredEvents.map((event, idx) => {
            const isExpanded = expandedEventId === event.id;

            // Status node color
            const nodeColors = {
              critical: 'bg-red-500 ring-4 ring-red-500/20',
              high: 'bg-orange-500 ring-4 ring-orange-500/20',
              medium: 'bg-amber-500 ring-4 ring-amber-500/20',
              low: 'bg-blue-500 ring-4 ring-blue-500/20',
              info: 'bg-emerald-500 ring-4 ring-emerald-500/20',
            };

            return (
              <div key={event.id} className="relative group">
                {/* Node Dot */}
                <div
                  className={`absolute -left-[30px] sm:-left-[35px] top-1.5 w-3 h-3 rounded-full ${
                    nodeColors[event.severity] || nodeColors.info
                  } transition-transform group-hover:scale-125`}
                />

                {/* Event Card */}
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isExpanded
                      ? 'border-cyan-500/40 bg-slate-50/80 dark:bg-slate-800/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-cyan-300">
                        {event.timestamp}
                      </span>
                      <SeverityBadge severity={event.severity} size="sm" />
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {event.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={event.status} size="sm" />
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-1">
                    {event.description}
                  </p>

                  {/* Expanded Forensic Metadata */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Event Node ID:</span>
                        <span className="text-slate-800 dark:text-slate-200">{event.id}</span>
                      </div>
                      {event.source && (
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Telemetry Source:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">{event.source}</span>
                        </div>
                      )}
                      {event.relatedAlertId && (
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Correlated Alert:</span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold">{event.relatedAlertId}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
