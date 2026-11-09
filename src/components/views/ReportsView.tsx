import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle,
  Calendar,
  Layers,
  Share2,
  FileDown,
  Printer,
  ChevronRight,
  ShieldAlert,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import {
  SecurityAlert,
  SecurityIncident,
  SecurityLog,
  TimelineEvent,
  DetectionRule,
} from '../../types/security';
import { SYNTHETIC_DETECTION_RULES, SYNTHETIC_TIMELINE_EVENTS } from '../../data/syntheticData';
import { PdfPreviewModal } from '../reports/PdfPreviewModal';

interface ReportsViewProps {
  alerts: SecurityAlert[];
  incidents: SecurityIncident[];
  logs: SecurityLog[];
  rules?: DetectionRule[];
  timelineEvents?: TimelineEvent[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  alerts,
  incidents,
  logs,
  rules = SYNTHETIC_DETECTION_RULES,
  timelineEvents = SYNTHETIC_TIMELINE_EVENTS,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // PDF Preview Modal state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfReportType, setPdfReportType] = useState<'incident' | 'analytics'>('incident');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents.length > 0 ? incidents[0].id : 'INC-2026-001'
  );

  const handleOpenPdfModal = (type: 'incident' | 'analytics', incidentId?: string) => {
    setPdfReportType(type);
    if (incidentId) setSelectedIncidentId(incidentId);
    setIsPdfModalOpen(true);
  };

  const handleExportStandardReport = (format: 'json' | 'csv' | 'md') => {
    const reportData = {
      title: 'Mini-SOC Security Operations & Threat Detection Executive Summary',
      generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      summary: {
        totalEventsAnalyzed: 148920,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
        highAlerts: alerts.filter((a) => a.severity === 'high').length,
        activeIncidents: incidents.length,
        mttdMinutes: 1.8,
        mttrMinutes: 14.2,
      },
      incidents: incidents.map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        status: i.status,
        firstObserved: i.firstObserved,
        assignedAnalyst: i.assignedAnalyst,
      })),
      alerts: alerts.slice(0, 10).map((a) => ({
        id: a.id,
        rule: a.ruleName,
        sourceIp: a.sourceIp,
        severity: a.severity,
        confidence: a.confidence,
      })),
    };

    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      content = JSON.stringify(reportData, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'csv') {
      const rows = [
        ['Metric', 'Value'],
        ['Total Events Analyzed', '148920'],
        ['Total Alerts', alerts.length.toString()],
        ['Critical Alerts', alerts.filter((a) => a.severity === 'critical').length.toString()],
        ['Active Incidents', incidents.length.toString()],
        ['MTTD (Minutes)', '1.8'],
        ['MTTR (Minutes)', '14.2'],
      ];
      content = rows.map((r) => r.join(',')).join('\n');
      mimeType = 'text/csv';
      ext = 'csv';
    } else {
      content = `# Mini-SOC Security Operations Report
**Generated**: ${reportData.generatedAt}  
**Classification**: TLP:AMBER | Internal Security Briefing  

---

## Executive Telemetry Metrics
- **Total Security Events Processed**: 148,920
- **Total Alerts Fired**: ${alerts.length}
- **Critical Alerts**: ${alerts.filter((a) => a.severity === 'critical').length}
- **Mean Time to Detect (MTTD)**: 1.8 minutes
- **Mean Time to Respond (MTTR)**: 14.2 minutes

## Active Incidents
${incidents
  .map(
    (i) =>
      `### ${i.id}: ${i.title}
- **Severity**: ${i.severity.toUpperCase()}
- **Status**: ${i.status.toUpperCase()}
- **Lead**: ${i.assignedAnalyst}
- **First Observed**: ${i.firstObserved}
- **Summary**: ${i.summary}
`
  )
  .join('\n')}
`;
      mimeType = 'text/markdown';
      ext = 'md';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mini-soc-security-report-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Exported report as .${ext.toUpperCase()}`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Reports &amp; Analytics
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
              AUDIT READY
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
              PDF ENGINE LOADED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Export comprehensive telemetry audits, incident resolution benchmarks, and communication timelines.
          </p>
        </div>

        {/* Export Action Buttons: Markdown, CSV, JSON, and PDF */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportStandardReport('md')}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-300 transition-colors"
            title="Download report in Markdown format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown</span>
          </button>
          <button
            onClick={() => handleExportStandardReport('csv')}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-300 transition-colors"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExportStandardReport('json')}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-medium flex items-center gap-1.5 text-slate-700 dark:text-slate-300 transition-colors"
            title="Export raw JSON structure"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => handleOpenPdfModal('incident')}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            title="Open interactive PDF Report Generator & Download"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>PDF – Professional Report</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* =========================================================================
          FEATURED: DEDICATED PDF REPORT GENERATION SECTION
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Incident Investigation Report (PDF) */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-colors group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wide">
                    Incident Investigation Report
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                    PDF DOSSIER // 21 AUDIT SECTIONS
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                TLP:AMBER
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Complete, authoritative investigation record for the selected security incident. Includes
              executive summary, network IOCs, evidence log traces, MITRE ATT&CK mapping, timeline
              milestones, technical notes, and 3-audience communications.
            </p>

            {/* Select Incident Selector */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                Target Incident for PDF Generation:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {incidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      {inc.id} — {inc.title} ({inc.severity.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section Badges */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                21 Audit Sections
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                MITRE ATT&amp;CK Rules
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Evidence Log Table
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Chronological Timeline
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Multi-Audience Comms
              </span>
            </div>
          </div>

          <button
            onClick={() => handleOpenPdfModal('incident', selectedIncidentId)}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Generate Incident Investigation PDF</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        </div>

        {/* Card 2: SOC Analytics Report (PDF) */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-colors group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wide">
                    SOC Analytics Report
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    PDF TELEMETRY &amp; SLA AUDIT // 6 CHARTS
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                EXECUTIVE BRIEF
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Comprehensive analytics dossier summarizing 148,920+ security events, MTTD / MTTR metrics,
              event category distribution, alert severity breakdowns, detection rule triggers, and regression
              testing performance.
            </p>

            {/* Quick Metrics preview in card */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Analyzed</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">148,920</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">MTTD</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">1.8 min</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">MTTR</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">14.2 min</p>
              </div>
            </div>

            {/* Visual Badges */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Chart A: Events Over Time
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Chart B: Severity Bars
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Chart C: Category Donut
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Chart D: Rule Triggers
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                Chart E &amp; F: SLA Metrics
              </span>
            </div>
          </div>

          <button
            onClick={() => handleOpenPdfModal('analytics')}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Generate SOC Analytics PDF</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        </div>
      </div>

      {/* SLA Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-slate-500 uppercase text-[10px]">MTTD (Mean Time to Detect)</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">1.8 min</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Within 5m target SLA</span>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-slate-500 uppercase text-[10px]">MTTR (Mean Time to Respond)</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">14.2 min</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Within 30m target SLA</span>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-slate-500 uppercase text-[10px]">Active Correlation Rules</span>
          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
            {rules.length} Rules
          </p>
          <span className="text-[11px] text-slate-500">100% test coverage</span>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-slate-500 uppercase text-[10px]">Audited Comms Hash Matches</span>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">100%</p>
          <span className="text-[11px] text-slate-500">Zero unverified leakage</span>
        </div>
      </div>

      {/* Report Preview Panel */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            Security Incident Audit Digest Preview
          </h3>
          <span className="text-xs font-mono text-slate-500">
            CONFIDENTIAL // FOR AUTHORIZED AUDITORS ONLY
          </span>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {incidents.map((inc, idx) => (
            <div
              key={inc.id}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {idx + 1}. {inc.id}: {inc.title}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {inc.severity}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400">
                    {inc.status}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenPdfModal('incident', inc.id)}
                  className="text-[11px] text-rose-600 hover:text-rose-500 dark:text-rose-400 font-bold flex items-center gap-1 shrink-0"
                >
                  <span>Generate PDF Dossier</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                {inc.summary}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                <span>Lead: {inc.assignedAnalyst}</span>
                <span>First Seen: {inc.firstObserved}</span>
                <span>Affected: {inc.affectedComponents.join(', ')}</span>
                <span>IOCs: {inc.indicatorsOfCompromise.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive PDF Preview & Generation Modal */}
      <PdfPreviewModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        initialType={pdfReportType}
        selectedIncidentId={selectedIncidentId}
        incidents={incidents}
        alerts={alerts}
        logs={logs}
        timelineEvents={timelineEvents}
        rules={rules}
      />
    </div>
  );
};
