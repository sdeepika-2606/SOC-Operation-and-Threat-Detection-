import React, { useState } from 'react';
import {
  Radio,
  Copy,
  Check,
  Download,
  RefreshCw,
  Columns,
  FileCode,
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle,
  FileText,
  UserCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { IncidentFacts, GeneratedCommunications, SecurityIncident } from '../../types/security';
import { generateIncidentCommunications } from '../../services/communicationEngine';
import { DEFAULT_INCIDENT_FACTS } from '../../data/syntheticData';
import { SeverityBadge, StatusBadge } from '../common/Badge';

interface CommunicationGeneratorViewProps {
  incidents: SecurityIncident[];
  initialFacts?: IncidentFacts;
}

export const CommunicationGeneratorView: React.FC<CommunicationGeneratorViewProps> = ({
  incidents,
  initialFacts,
}) => {
  const [facts, setFacts] = useState<IncidentFacts>(initialFacts || DEFAULT_INCIDENT_FACTS);
  const [generatedComms, setGeneratedComms] = useState<GeneratedCommunications>(() =>
    generateIncidentCommunications(initialFacts || DEFAULT_INCIDENT_FACTS)
  );

  // Active view tab: 'technical' | 'management' | 'userFacing' | 'sideBySide'
  const [activeTab, setActiveTab] = useState<'technical' | 'management' | 'userFacing' | 'sideBySide'>('sideBySide');

  // Editable drafts for each version
  const [technicalText, setTechnicalText] = useState(generatedComms.technical.content);
  const [managementText, setManagementText] = useState(generatedComms.management.content);
  const [userFacingText, setUserFacingText] = useState(generatedComms.userFacing.content);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Handler to regenerate all three updates from the CURRENT verified facts
  const handleRegenerate = () => {
    const fresh = generateIncidentCommunications(facts);
    setGeneratedComms(fresh);
    setTechnicalText(fresh.technical.content);
    setManagementText(fresh.management.content);
    setUserFacingText(fresh.userFacing.content);
  };

  // Preload facts from existing Incident
  const handlePreloadIncident = (incId: string) => {
    const inc = incidents.find((i) => i.id === incId);
    if (!inc) return;

    const newFacts: IncidentFacts = {
      incidentId: inc.id,
      incidentTitle: inc.title,
      severity: inc.severity,
      firstObserved: inc.firstObserved,
      lastObserved: inc.lastObserved,
      currentStatus: inc.status,
      confirmedAffectedComponents: [...inc.affectedComponents],
      hasConfirmedUserImpact: false,
      confirmedUserImpactDescription: inc.confirmedImpact || 'No user data access confirmed.',
      confirmedRootCause: inc.summary,
      isRootCauseConfirmed: true,
      technicalActionsTaken: inc.triageSteps.filter((t) => t.completed).map((t) => t.task),
      pendingActions: inc.triageSteps.filter((t) => !t.completed).map((t) => t.task),
      mitigationStatus: inc.status === 'contained' ? 'contained' : 'investigating',
      actionRequiredFromUsers: 'No action required from external users at this time.',
      nextScheduledUpdateMinutes: 60,
      confidentialityBreached: 'no',
    };

    setFacts(newFacts);
    const fresh = generateIncidentCommunications(newFacts);
    setGeneratedComms(fresh);
    setTechnicalText(fresh.technical.content);
    setManagementText(fresh.management.content);
    setUserFacingText(fresh.userFacing.content);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExportMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Principle & Safeguards Banner */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Multi-Stakeholder Incident Communication Generator
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                STRICT VERIFIED BOUNDARY
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Generates <strong>Technical</strong>, <strong>Management</strong>, and <strong>User-Facing</strong> updates derived from the <em>same verified fact set</em>. Never invents user impact, recovery status, or unverified attribution.
            </p>
          </div>
        </div>

        {/* Incident Preload Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-slate-500">Load Incident:</span>
          <select
            value={facts.incidentId}
            onChange={(e) => handlePreloadIncident(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.id} ({inc.severity.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Left Column = Verified Facts Editor | Right Column = Generated Outputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Incident Facts Input Form */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Verified Incident Fact Set
              </h3>
              <p className="text-[11px] text-slate-500">
                Ground truth telemetry inputs
              </p>
            </div>
            <button
              onClick={handleRegenerate}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Incident Title */}
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Incident Identifier &amp; Title:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={facts.incidentId}
                  onChange={(e) => setFacts({ ...facts, incidentId: e.target.value })}
                  className="w-28 px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                />
                <input
                  type="text"
                  value={facts.incidentTitle}
                  onChange={(e) => setFacts({ ...facts, incidentTitle: e.target.value })}
                  className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-bold"
                />
              </div>
            </div>

            {/* Severity & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Severity Rating:</label>
                <select
                  value={facts.severity}
                  onChange={(e) => setFacts({ ...facts, severity: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Response Posture:</label>
                <select
                  value={facts.currentStatus}
                  onChange={(e) => setFacts({ ...facts, currentStatus: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                >
                  <option value="active">Active Triage</option>
                  <option value="contained">Contained</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Confirmed Affected Components */}
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Confirmed Affected Components (Comma-separated):
              </label>
              <textarea
                rows={2}
                value={facts.confirmedAffectedComponents.join(', ')}
                onChange={(e) =>
                  setFacts({
                    ...facts,
                    confirmedAffectedComponents: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                placeholder="prod-bastion-01, svc-deployer credentials"
              />
            </div>

            {/* User Impact Boundary Toggle */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={facts.hasConfirmedUserImpact}
                  onChange={(e) =>
                    setFacts({ ...facts, hasConfirmedUserImpact: e.target.checked })
                  }
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Confirmed Customer / End-User Impact
                </span>
              </label>
              {facts.hasConfirmedUserImpact ? (
                <textarea
                  rows={2}
                  value={facts.confirmedUserImpactDescription}
                  onChange={(e) =>
                    setFacts({ ...facts, confirmedUserImpactDescription: e.target.value })
                  }
                  placeholder="Detail verified customer impact..."
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  Guaranteed safe default: "No customer data compromise or service outage verified."
                </p>
              )}
            </div>

            {/* Root Cause Assessment */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-500">Root Cause Vector:</label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={facts.isRootCauseConfirmed}
                    onChange={(e) =>
                      setFacts({ ...facts, isRootCauseConfirmed: e.target.checked })
                    }
                  />
                  <span>Verified Confirmed</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={facts.confirmedRootCause}
                onChange={(e) => setFacts({ ...facts, confirmedRootCause: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                placeholder="Brute-force password exploration coupled with exposed key..."
              />
            </div>

            {/* Technical Actions Taken */}
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Technical Actions Taken (one per line):
              </label>
              <textarea
                rows={3}
                value={facts.technicalActionsTaken.join('\n')}
                onChange={(e) =>
                  setFacts({
                    ...facts,
                    technicalActionsTaken: e.target.value.split('\n').filter(Boolean),
                  })
                }
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
              />
            </div>

            {/* Required User Action & Cadence */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Actions Required from Users:
                </label>
                <input
                  type="text"
                  value={facts.actionRequiredFromUsers}
                  onChange={(e) =>
                    setFacts({ ...facts, actionRequiredFromUsers: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Next Cadence (Minutes):
                </label>
                <input
                  type="number"
                  value={facts.nextScheduledUpdateMinutes}
                  onChange={(e) =>
                    setFacts({
                      ...facts,
                      nextScheduledUpdateMinutes: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Generated Communications Display & Editors */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* View Mode Tabs */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setActiveTab('sideBySide')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'sideBySide'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                onClick={() => setActiveTab('technical')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'technical'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Technical Brief
              </button>
              <button
                onClick={() => setActiveTab('management')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'management'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Management Brief
              </button>
              <button
                onClick={() => setActiveTab('userFacing')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'userFacing'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                User Advisory
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-500">
              Facts Hash: <strong className="text-slate-800 dark:text-slate-200">{generatedComms.factsHash}</strong>
            </span>
          </div>

          {/* Tab 1: SIDE-BY-SIDE 3-COLUMN VIEW */}
          {activeTab === 'sideBySide' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Technical Column */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">
                      Technical
                    </span>
                    <button
                      onClick={() => handleCopy(technicalText, 'tech')}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copiedKey === 'tech' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-1 mb-3">
                    Audience: SOC, DevOps, SecOps
                  </p>
                  <textarea
                    rows={16}
                    value={technicalText}
                    onChange={(e) => setTechnicalText(e.target.value)}
                    className="w-full p-2.5 text-[11px] font-mono leading-relaxed rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>
                <button
                  onClick={() => handleExportMarkdown(technicalText, `${facts.incidentId}-technical-update`)}
                  className="mt-3 w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Markdown</span>
                </button>
              </div>

              {/* Management Column */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
                      Management
                    </span>
                    <button
                      onClick={() => handleCopy(managementText, 'mgmt')}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copiedKey === 'mgmt' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-1 mb-3">
                    Audience: CISO, Leadership, Legal
                  </p>
                  <textarea
                    rows={16}
                    value={managementText}
                    onChange={(e) => setManagementText(e.target.value)}
                    className="w-full p-2.5 text-[11px] font-mono leading-relaxed rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>
                <button
                  onClick={() => handleExportMarkdown(managementText, `${facts.incidentId}-executive-update`)}
                  className="mt-3 w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Markdown</span>
                </button>
              </div>

              {/* User-Facing Column */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                      User-Facing
                    </span>
                    <button
                      onClick={() => handleCopy(userFacingText, 'user')}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copiedKey === 'user' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-1 mb-3">
                    Audience: Customers &amp; Public Status
                  </p>
                  <textarea
                    rows={16}
                    value={userFacingText}
                    onChange={(e) => setUserFacingText(e.target.value)}
                    className="w-full p-2.5 text-[11px] font-mono leading-relaxed rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>
                <button
                  onClick={() => handleExportMarkdown(userFacingText, `${facts.incidentId}-status-update`)}
                  className="mt-3 w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Markdown</span>
                </button>
              </div>
            </div>
          )}

          {/* Focused Tab Views */}
          {activeTab !== 'sideBySide' && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {activeTab === 'technical'
                      ? 'Technical Incident Advisory'
                      : activeTab === 'management'
                      ? 'Executive Management Briefing'
                      : 'Public Customer Advisory'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {activeTab === 'technical'
                      ? 'Target: Incident Response & Engineering Teams'
                      : activeTab === 'management'
                      ? 'Target: C-Suite, Board & Legal Counsel'
                      : 'Target: End-Users & Status Page'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleCopy(
                        activeTab === 'technical'
                          ? technicalText
                          : activeTab === 'management'
                          ? managementText
                          : userFacingText,
                        'focused'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-medium flex items-center gap-1.5"
                  >
                    {copiedKey === 'focused' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'focused' ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleExportMarkdown(
                        activeTab === 'technical'
                          ? technicalText
                          : activeTab === 'management'
                          ? managementText
                          : userFacingText,
                        `${facts.incidentId}-${activeTab}`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 text-xs font-mono font-medium flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>
                </div>
              </div>

              {/* Editable Content Window */}
              <textarea
                rows={18}
                value={
                  activeTab === 'technical'
                    ? technicalText
                    : activeTab === 'management'
                    ? managementText
                    : userFacingText
                }
                onChange={(e) => {
                  if (activeTab === 'technical') setTechnicalText(e.target.value);
                  else if (activeTab === 'management') setManagementText(e.target.value);
                  else setUserFacingText(e.target.value);
                }}
                className="w-full p-4 font-mono text-xs leading-relaxed rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
