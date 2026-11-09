import React, { useState } from 'react';
import {
  AlertOctagon,
  Flame,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  Send,
  Plus,
  ArrowRight,
  FileText,
  Activity,
  Layers,
  CheckSquare,
  Square,
  Radio,
  X,
  FileDown,
} from 'lucide-react';
import { SecurityIncident, IncidentFacts, SeverityLevel, IncidentStatus } from '../../types/security';
import { SeverityBadge, StatusBadge } from '../common/Badge';
import { NavView } from '../layout/Sidebar';

interface IncidentManagementViewProps {
  incidents: SecurityIncident[];
  onSelectIncidentForComms: (incident: SecurityIncident) => void;
  onUpdateIncidentStatus: (incidentId: string, status: SecurityIncident['status']) => void;
  onAddIncidentNote: (incidentId: string, content: string, author: string) => void;
  onToggleTriageStep?: (incidentId: string, stepId: string) => void;
  onCreateIncident?: (incidentData: Omit<SecurityIncident, 'id'>) => Promise<SecurityIncident>;
  onSelectView: (view: NavView) => void;
}

export const IncidentManagementView: React.FC<IncidentManagementViewProps> = ({
  incidents,
  onSelectIncidentForComms,
  onUpdateIncidentStatus,
  onAddIncidentNote,
  onToggleTriageStep,
  onCreateIncident,
  onSelectView,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || 'INC-2026-001');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New incident form state
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState<SeverityLevel>('high');
  const [newStatus, setNewStatus] = useState<IncidentStatus>('active');
  const [newSummary, setNewSummary] = useState('');
  const [newScope, setNewScope] = useState('');
  const [newAffected, setNewAffected] = useState('');
  const [newIocs, setNewIocs] = useState('');
  const [newLead, setNewLead] = useState('D. Chen (Lead SOC Analyst)');

  const activeIncident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const handleToggleStep = (stepId: string) => {
    if (activeIncident && onToggleTriageStep) {
      onToggleTriageStep(activeIncident.id, stepId);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIncident && newNoteContent.trim()) {
      onAddIncidentNote(activeIncident.id, newNoteContent.trim(), 'D. Chen (Shift Lead)');
      setNewNoteContent('');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    const affectedList = newAffected
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const iocList = newIocs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const newIncData: Omit<SecurityIncident, 'id'> = {
      title: newTitle.trim(),
      severity: newSeverity,
      status: newStatus,
      detectionSource: 'Manual Incident Declaration (SOC Lead)',
      firstObserved: now,
      lastObserved: now,
      assignedAnalyst: newLead || 'D. Chen (Lead SOC Analyst)',
      summary: newSummary.trim(),
      scope: newScope.trim() || 'Internal infrastructure and user authentication perimeters.',
      confirmedImpact: 'Preliminary telemetry triage initiated. No lateral traversal confirmed.',
      relatedAlertIds: [],
      supportingEvidence: ['Manual security escalation by authorized SOC commander.'],
      triageSteps: [
        { id: `T_${Date.now()}_1`, task: 'Verify source authentication logs and perimeter IP ingress', completed: true, assignedTo: 'SOC Tier 2' },
        { id: `T_${Date.now()}_2`, task: 'Revoke active IAM tokens and enforce session invalidation', completed: false, assignedTo: 'IAM Lead' },
        { id: `T_${Date.now()}_3`, task: 'Isolate affected endpoint workload / apply security group rule', completed: false, assignedTo: 'SecOps' },
      ],
      notes: [
        {
          id: `N_${Date.now()}`,
          timestamp: now,
          author: newLead || 'D. Chen',
          content: 'Incident formally created in command center. Initial containment steps scheduled.',
        },
      ],
      affectedComponents: affectedList.length > 0 ? affectedList : ['Production Gateway', 'IAM Service'],
      indicatorsOfCompromise: iocList.length > 0 ? iocList : ['198.51.100.120'],
    };

    if (onCreateIncident) {
      const created = await onCreateIncident(newIncData);
      setSelectedIncidentId(created.id);
    }
    setIsCreateModalOpen(false);
    // Reset form
    setNewTitle('');
    setNewSummary('');
    setNewScope('');
    setNewAffected('');
    setNewIocs('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Confirmed Incident Command Center
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
              {incidents.length} INCIDENTS UNDER ACTIVE RECORD
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Strict verification threshold: Detection triggers become Incidents only upon confirmed correlation and perimeter violation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Incident Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Incident</span>
          </button>

          {activeIncident && (
            <button
              onClick={() => onSelectIncidentForComms(activeIncident)}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-xs shrink-0"
            >
              <Radio className="w-4 h-4" />
              <span>Generate Comms</span>
            </button>
          )}

          <button
            onClick={() => onSelectView('reports')}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Open PDF Report Generator for this incident"
          >
            <FileDown className="w-4 h-4" />
            <span>Generate PDF Report</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split: Left Incident List / Right Detailed Incident Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Incident Queue ({incidents.length})
            </span>
            <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">Live State</span>
          </div>

          <div className="space-y-3">
            {incidents.map((incident) => {
              const isSelected = incident.id === activeIncident?.id;
              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500/50 bg-cyan-500/5 dark:bg-cyan-950/20 shadow-xs ring-1 ring-cyan-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-cyan-400">
                      {incident.id}
                    </span>
                    <SeverityBadge severity={incident.severity} size="sm" />
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 mb-2">
                    {incident.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <StatusBadge status={incident.status} size="sm" />
                    <span>{incident.assignedAnalyst.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident Detailed Workspace */}
        {activeIncident && (
          <div className="lg:col-span-8 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-6">
            {/* Header with Title and Status Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {activeIncident.id}
                  </span>
                  <SeverityBadge severity={activeIncident.severity} size="sm" />
                  <StatusBadge status={activeIncident.status} size="sm" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeIncident.title}
                </h2>
              </div>

              {/* Status Updater */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">Status:</span>
                <select
                  value={activeIncident.status}
                  onChange={(e) =>
                    onUpdateIncidentStatus(activeIncident.id, e.target.value as SecurityIncident['status'])
                  }
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="active">Active</option>
                  <option value="triaging">Triaging</option>
                  <option value="contained">Contained</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Incident Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs">
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Lead Analyst</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{activeIncident.assignedAnalyst}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">First Seen</span>
                <span className="text-slate-800 dark:text-slate-200">{activeIncident.firstObserved}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Detection Source</span>
                <span className="text-slate-800 dark:text-slate-200">{activeIncident.detectionSource}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block">Correlated Alerts</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                  {activeIncident.relatedAlertIds.length} Alerts
                </span>
              </div>
            </div>

            {/* Description & Impact */}
            <div className="space-y-3 font-mono text-xs">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] mb-1">
                  Incident Narrative Summary
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  {activeIncident.summary}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] mb-1">
                  Scope &amp; Impact
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  {activeIncident.scope} — <strong>Confirmed Impact:</strong> {activeIncident.confirmedImpact}
                </p>
              </div>
            </div>

            {/* Triage Steps Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Containment &amp; Triage Steps ({activeIncident.triageSteps.filter((t) => t.completed).length} / {activeIncident.triageSteps.length} Complete)
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Click step to toggle status</span>
              </div>

              <div className="space-y-2">
                {activeIncident.triageSteps.map((step) => {
                  return (
                    <div
                      key={step.id}
                      onClick={() => handleToggleStep(step.id)}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between text-xs font-mono transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {step.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span
                          className={`${
                            step.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200 font-medium'
                          }`}
                        >
                          {step.task}
                        </span>
                      </div>
                      {step.assignedTo && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {step.assignedTo}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Investigation Notes Feed & Append Form */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Investigation Notes ({activeIncident.notes.length})
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeIncident.notes.length === 0 ? (
                  <p className="text-xs font-mono text-slate-400 italic p-3">No analyst notes recorded yet.</p>
                ) : (
                  activeIncident.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{note.author}</span>
                        <span>{note.timestamp}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add timestamped forensic note..."
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 text-xs font-mono font-medium"
                >
                  Post Note
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create New Security Incident */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase">
                  Declare New Security Incident
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-500 uppercase text-[10px] mb-1">
                  Incident Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unauthorized Cloud SQL Proxy Access from External IP"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 uppercase text-[10px] mb-1">
                    Severity *
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as SeverityLevel)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 uppercase text-[10px] mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="triaging">Triaging</option>
                    <option value="contained">Contained</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 uppercase text-[10px] mb-1">
                  Executive Narrative Summary *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Explain what suspicious pattern occurred and the initial response taken..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 uppercase text-[10px] mb-1">
                    Affected Assets / Users
                  </label>
                  <input
                    type="text"
                    value={newAffected}
                    onChange={(e) => setNewAffected(e.target.value)}
                    placeholder="e.g. dev-admin, k8s-cluster"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 uppercase text-[10px] mb-1">
                    Source IP / IOCs
                  </label>
                  <input
                    type="text"
                    value={newIocs}
                    onChange={(e) => setNewIocs(e.target.value)}
                    placeholder="e.g. 198.51.100.89"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Create &amp; Register Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
