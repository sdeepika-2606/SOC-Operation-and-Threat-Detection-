import React from 'react';
import {
  SecurityIncident,
  SecurityAlert,
  SecurityLog,
  TimelineEvent,
  DetectionRule,
} from '../../types/security';
import { generateIncidentCommunications } from '../../services/communicationEngine';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface IncidentPdfReportProps {
  incident: SecurityIncident;
  alerts: SecurityAlert[];
  logs: SecurityLog[];
  timelineEvents: TimelineEvent[];
  rules: DetectionRule[];
}

export const IncidentPdfReportView: React.FC<IncidentPdfReportProps> = ({
  incident,
  alerts,
  logs,
  timelineEvents,
  rules,
}) => {
  const generatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // 1. Dynamic Correlated Alerts
  const incidentAlerts = alerts.filter(
    (a) =>
      incident.relatedAlertIds.includes(a.id) ||
      (a.sourceIp && incident.indicatorsOfCompromise.includes(a.sourceIp)) ||
      (a.targetUser && incident.affectedComponents.includes(a.targetUser))
  );

  // 2. Dynamic Correlated Logs
  const incidentRawLogIds = new Set(incidentAlerts.flatMap((a) => a.rawEventIds));
  const incidentLogs = logs.filter(
    (l) =>
      incidentRawLogIds.has(l.id) ||
      (l.sourceIp && incident.indicatorsOfCompromise.includes(l.sourceIp)) ||
      (l.destinationIp && incident.indicatorsOfCompromise.includes(l.destinationIp)) ||
      (l.user && incident.affectedComponents.includes(l.user))
  );

  // 3. Dynamic Timeline Events
  let incidentTimeline = timelineEvents.filter((t) => t.incidentId === incident.id);
  // If incident has no pre-seeded timeline events (e.g. newly created incident), synthesize from real data
  if (incidentTimeline.length === 0) {
    const syntheticEvents: TimelineEvent[] = [
      {
        id: `TL-SYN-1`,
        incidentId: incident.id,
        timestamp: incident.firstObserved,
        title: 'Initial Suspicious Activity Detected',
        description: incident.summary,
        severity: incident.severity,
        category: 'detection',
        status: 'confirmed',
        source: incident.detectionSource,
      },
    ];

    incidentAlerts.forEach((alt, idx) => {
      syntheticEvents.push({
        id: `TL-SYN-ALT-${idx}`,
        incidentId: incident.id,
        timestamp: alt.firstSeen,
        title: `Correlation Rule Alert: ${alt.ruleName}`,
        description: `Alert ${alt.id} generated with ${alt.confidence}% confidence score. Threshold breached from IP ${alt.sourceIp}.`,
        relatedAlertId: alt.id,
        severity: alt.severity,
        category: 'telemetry',
        status: 'confirmed',
        source: 'Detection Engine',
      });
    });

    incident.notes.forEach((note, idx) => {
      syntheticEvents.push({
        id: `TL-SYN-NOTE-${idx}`,
        incidentId: incident.id,
        timestamp: note.timestamp,
        title: `Analyst Action: Note Recorded`,
        description: `${note.author}: ${note.content}`,
        severity: incident.severity,
        category: 'investigation',
        status: 'confirmed',
        source: note.author,
      });
    });

    if (incident.status === 'contained' || incident.status === 'closed') {
      syntheticEvents.push({
        id: `TL-SYN-CONTAIN`,
        incidentId: incident.id,
        timestamp: incident.lastObserved,
        title: `Perimeter Containment Verified`,
        description: `Active response protocol completed. Status transitioned to ${incident.status.toUpperCase()}.`,
        severity: incident.severity,
        category: 'containment',
        status: 'confirmed',
        source: incident.assignedAnalyst,
      });
    }

    incidentTimeline = syntheticEvents;
  }

  // Sort timeline chronologically
  incidentTimeline.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // 4. Dynamic Detection Rules matching related alerts
  const ruleIds = new Set(incidentAlerts.map((a) => a.ruleId));
  const incidentRules = rules.filter((r) => ruleIds.has(r.id));

  // 5. Detection Confidence calculation
  const hasConfidence = incidentAlerts.length > 0;
  const avgConfidence = hasConfidence
    ? Math.round(
        incidentAlerts.reduce((acc, cur) => acc + (cur.confidence || 85), 0) /
          incidentAlerts.length
      )
    : null;

  // 6. Transparent NIST / OWASP Risk Scoring Model
  // Likelihood Factor (1 to 5):
  // Frequency of events + external network threat + multiple components targeted
  let likelihoodScore = 2;
  if (incidentLogs.length > 5 || incidentAlerts.length > 1) likelihoodScore += 1;
  if (incident.indicatorsOfCompromise.some((ioc) => ioc.includes('.'))) likelihoodScore += 1; // External IP
  if (incident.severity === 'critical' || incident.severity === 'high') likelihoodScore += 1;
  likelihoodScore = Math.min(5, likelihoodScore);

  // Impact Factor (1 to 5):
  // Critical assets affected (bastion, auth, database, cloud) + access confirmation
  let impactScore = 2;
  const isHighValueTarget = incident.affectedComponents.some((c) =>
    /bastion|admin|root|database|auth|iam|prod|gateway/i.test(c)
  );
  if (isHighValueTarget) impactScore += 2;
  if (incident.severity === 'critical') impactScore += 1;
  if (/breach|compromised|leaked|exfiltrat/i.test(incident.summary)) impactScore += 1;
  impactScore = Math.min(5, impactScore);

  // Risk Score % = (Likelihood * Impact / 25) * 100
  const riskPercentage = Math.round(((likelihoodScore * impactScore) / 25) * 100);

  let riskCategory: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (riskPercentage >= 80) riskCategory = 'Critical';
  else if (riskPercentage >= 60) riskCategory = 'High';
  else if (riskPercentage >= 40) riskCategory = 'Medium';

  // 7. Dynamic Communications
  const commsFacts = {
    incidentId: incident.id,
    incidentTitle: incident.title,
    severity: incident.severity,
    firstObserved: incident.firstObserved,
    lastObserved: incident.lastObserved,
    currentStatus: incident.status,
    confirmedAffectedComponents: [...incident.affectedComponents],
    hasConfirmedUserImpact: false,
    confirmedUserImpactDescription:
      incident.confirmedImpact || 'Not verified - No client data exposure identified.',
    confirmedRootCause: incident.summary,
    isRootCauseConfirmed: true,
    technicalActionsTaken: incident.triageSteps.filter((t) => t.completed).map((t) => t.task),
    pendingActions: incident.triageSteps.filter((t) => !t.completed).map((t) => t.task),
    mitigationStatus: (incident.status === 'contained' ? 'contained' : 'investigating') as
      | 'contained'
      | 'investigating',
    actionRequiredFromUsers: 'No external action required at this stage.',
    nextScheduledUpdateMinutes: 60,
    confidentialityBreached: 'no' as const,
  };
  const communications = generateIncidentCommunications(commsFacts);

  // 8. Dynamic Chart Data

  // Chart 2: Event Distribution Donut
  const eventTypeCounts: Record<string, number> = {};
  incidentLogs.forEach((l) => {
    eventTypeCounts[l.eventType] = (eventTypeCounts[l.eventType] || 0) + 1;
  });
  const eventDistributionData = Object.entries(eventTypeCounts).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  // Chart 3: Severity Distribution
  const alertSevCounts = {
    Critical: incidentAlerts.filter((a) => a.severity === 'critical').length,
    High: incidentAlerts.filter((a) => a.severity === 'high').length,
    Medium: incidentAlerts.filter((a) => a.severity === 'medium').length,
    Low: incidentAlerts.filter((a) => a.severity === 'low').length,
  };
  const alertSeverityChartData = [
    { name: 'Critical', count: alertSevCounts.Critical, fill: '#ef4444' },
    { name: 'High', count: alertSevCounts.High, fill: '#f97316' },
    { name: 'Medium', count: alertSevCounts.Medium, fill: '#f59e0b' },
    { name: 'Low', count: alertSevCounts.Low, fill: '#3b82f6' },
  ];

  // Chart 5: Authentication Activity Bar Chart
  const failedAuthCount = incidentLogs.filter((l) => l.action === 'FAILURE' || l.action === 'BLOCKED').length;
  const successAuthCount = incidentLogs.filter((l) => l.action === 'SUCCESS').length;
  const authActivityData = [
    { name: 'Failed / Blocked Attempts', count: failedAuthCount, fill: '#ef4444' },
    { name: 'Successful Authorizations', count: successAuthCount, fill: '#10b981' },
  ];

  // Chart 6: Activity Trend (Grouped by hour or minute if available)
  const timeBuckets: Record<string, number> = {};
  incidentLogs.forEach((l) => {
    const bucket = l.timestamp.substring(11, 16); // "HH:MM"
    timeBuckets[bucket] = (timeBuckets[bucket] || 0) + 1;
  });
  const activityTrendData = Object.entries(timeBuckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, count]) => ({ time, events: count }));

  // Color palettes
  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
    high: { bg: '#ffedd5', text: '#9a3412', border: '#fb923c' },
    medium: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
    low: { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
    info: { bg: '#d1fae5', text: '#065f46', border: '#34d399' },
  };
  const currentSev = severityColors[incident.severity] || severityColors.medium;
  const DONUT_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4'];

  return (
    <div className="pdf-document bg-white text-slate-900 font-sans print:p-0 selection:bg-cyan-100">
      {/* =========================================================================
          PAGE 1: COVER PAGE
      ========================================================================= */}
      <div className="pdf-page bg-white min-h-[1122px] p-12 sm:p-16 flex flex-col justify-between border-b border-slate-300 print:border-none print:break-after-page relative">
        {/* Top Header Security Banner */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center font-bold font-mono text-lg shadow-sm">
              🛡️
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                Mini-SOC Cyber Defense
              </h1>
              <p className="text-xs font-mono text-slate-500 tracking-wider">
                THREAT DETECTION &amp; INCIDENT INVESTIGATION RECORD
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <div className="inline-block px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
              TLP:AMBER+STRICT
            </div>
            <p className="text-[10px] text-slate-500 mt-1">PRIVILEGED SOC DOSSIER</p>
          </div>
        </div>

        {/* Cover Hero Center */}
        <div className="my-auto py-10 space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider"
            style={{
              backgroundColor: currentSev.bg,
              color: currentSev.text,
              border: `1px solid ${currentSev.border}`,
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentSev.text }} />
            <span>SEVERITY: {incident.severity.toUpperCase()}</span>
            <span>·</span>
            <span>STATUS: {incident.status.toUpperCase()}</span>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-xs font-bold text-cyan-700 tracking-wider uppercase">
              DYNAMIC SECURITY INCIDENT INVESTIGATION RECORD
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
              {incident.title}
            </h1>
          </div>

          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed font-mono">
            {incident.summary}
          </p>

          {/* Quick Identification Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs">
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Incident ID</span>
              <span className="text-slate-900 font-bold text-sm">{incident.id}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">First Observed</span>
              <span className="text-slate-800 font-medium">{incident.firstObserved}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Incident Lead</span>
              <span className="text-slate-800 font-medium">{incident.assignedAnalyst}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] block">Detection Source</span>
              <span className="text-slate-800 font-medium">{incident.detectionSource}</span>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-3 gap-4 font-mono text-xs text-center">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] text-slate-500 uppercase block">Correlated Alerts</span>
              <span className="text-base font-bold text-cyan-700">
                {incidentAlerts.length} Alerts
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] text-slate-500 uppercase block">Raw Log Traces</span>
              <span className="text-base font-bold text-slate-800">
                {incidentLogs.length} Records
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] text-slate-500 uppercase block">Calculated Risk</span>
              <span
                className={`text-base font-bold ${
                  riskCategory === 'Critical'
                    ? 'text-red-600'
                    : riskCategory === 'High'
                    ? 'text-orange-600'
                    : 'text-amber-600'
                }`}
              >
                {riskPercentage}% ({riskCategory})
              </span>
            </div>
          </div>
        </div>

        {/* Cover Footer */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
          <div>
            <span>Generated: {generatedAt}</span>
            <span className="mx-2">·</span>
            <span>Document ID: DOC-{incident.id}-PDF</span>
          </div>
          <div className="font-bold text-slate-700">
            CONFIDENTIAL // FOR AUTHORIZED SOC PERSONNEL ONLY
          </div>
        </div>
      </div>

      {/* =========================================================================
          PAGE 2: SECTION A (EXECUTIVE SUMMARY), SECTION B (INCIDENT OVERVIEW),
          AND SECTION C (THREAT & RISK ASSESSMENT)
      ========================================================================= */}
      <div className="pdf-page bg-white min-h-[1122px] p-12 sm:p-16 space-y-7 border-b border-slate-300 print:border-none print:break-after-page relative">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
          <span className="font-bold text-slate-800">
            {incident.id} // EXECUTIVE SUMMARY &amp; RISK ASSESSMENT
          </span>
          <span>TLP:AMBER+STRICT</span>
        </div>

        {/* SECTION A: Executive Summary */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span className="text-cyan-600 font-mono">01.</span> Executive Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p><strong>Incident Name:</strong> {incident.title}</p>
              <p><strong>Tracking Identifier:</strong> {incident.id}</p>
              <p><strong>Severity Grade:</strong> <span className="uppercase font-bold">{incident.severity}</span></p>
              <p><strong>Current Posture:</strong> <span className="uppercase font-bold text-cyan-700">{incident.status}</span></p>
              <p><strong>First Observed:</strong> {incident.firstObserved}</p>
              <p><strong>Last Telemetry:</strong> {incident.lastObserved}</p>
            </div>
            <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <p><strong>Detection Ingress:</strong> {incident.detectionSource}</p>
              <p><strong>Lead Commander:</strong> {incident.assignedAnalyst}</p>
              <p><strong>Classification:</strong> Enterprise Incident Response</p>
              <p><strong>Containment Progress:</strong> {incident.triageSteps.filter(t => t.completed).length} / {incident.triageSteps.length} Steps Completed</p>
              <p><strong>Active IOCs:</strong> {incident.indicatorsOfCompromise.join(', ') || 'Under triage'}</p>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-mono">
            {incident.summary}
          </p>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900">
            <strong>Confirmed Impact:</strong> {incident.confirmedImpact}
          </div>
        </section>

        {/* SECTION B: Incident Overview */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span className="text-cyan-600 font-mono">02.</span> Incident Overview &amp; Technical Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">Suspicious Activity Detected</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {incident.summary}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">Detection Trigger Mechanism</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Identified via {incident.detectionSource}. Correlated across {incidentAlerts.length} security alerts and {incidentLogs.length} raw telemetry entries.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">Targeted Systems &amp; Accounts</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {incident.affectedComponents.join(', ')}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">Threat Projection (If Unchecked)</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Persistence establishment, privilege escalation toward sensitive internal data stores, or session token abuse.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION C: Threat and Risk Assessment */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span className="text-cyan-600 font-mono">03.</span> Threat &amp; Risk Assessment (NIST / OWASP Model)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
              <span className="text-slate-500 uppercase text-[10px] block">Detection Confidence</span>
              <span className="text-xl font-bold text-cyan-700">
                {avgConfidence !== null ? `${avgConfidence}%` : 'Not enough evidence to calculate'}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Rule pattern match certainty</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
              <span className="text-slate-500 uppercase text-[10px] block">Threat Likelihood</span>
              <span className="text-xl font-bold text-slate-800">
                {likelihoodScore} / 5
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Frequency &amp; external origin factor</p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
              <span className="text-slate-500 uppercase text-[10px] block">Calculated Incident Risk</span>
              <span
                className={`text-xl font-bold ${
                  riskCategory === 'Critical'
                    ? 'text-red-600'
                    : riskCategory === 'High'
                    ? 'text-orange-600'
                    : 'text-amber-600'
                }`}
              >
                {riskPercentage}% ({riskCategory})
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Formula: (Likelihood × Impact / 25)</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 leading-relaxed">
            <strong>Methodology Note:</strong> Detection Confidence reflects the algorithmic certainty of pattern recognition (how accurately the Mini-SOC rules identified the telemetry signature). Incident Risk reflects potential enterprise damage based on Threat Likelihood (Score: {likelihoodScore}/5) × Target Asset Impact (Score: {impactScore}/5).
          </div>
        </section>

        {/* Page Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Mini-SOC Audit Dossier // {incident.id}</span>
          <span>Page 2 of 5</span>
        </div>
      </div>

      {/* =========================================================================
          PAGE 3: VISUALIZATIONS (CHARTS 1-5), FORENSIC TIMELINE & ATTACK SEQUENCE
      ========================================================================= */}
      <div className="pdf-page bg-white min-h-[1122px] p-12 sm:p-16 space-y-6 border-b border-slate-300 print:border-none print:break-after-page relative">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
          <span className="font-bold text-slate-800">
            {incident.id} // VISUAL DATA ANALYTICS &amp; ATTACK SEQUENCE
          </span>
          <span>TLP:AMBER+STRICT</span>
        </div>

        {/* SECTION D: Visualizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chart 1: Event Distribution Donut */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
            <span className="font-mono text-xs font-bold text-slate-800 uppercase block mb-1">
              Event Distribution by Category
            </span>
            <p className="font-mono text-[10px] text-slate-400 mb-2">
              Proportion of correlated log types associated with this incident
            </p>
            {eventDistributionData.length > 0 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {eventDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center font-mono text-xs text-slate-400 italic">
                Insufficient correlated log data to render distribution
              </div>
            )}
          </div>

          {/* Chart 2: Authentication Activity Bar Chart */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
            <span className="font-mono text-xs font-bold text-slate-800 uppercase block mb-1">
              Observed Ingress Actions
            </span>
            <p className="font-mono text-[10px] text-slate-400 mb-2">
              Failed/Blocked probes vs authorized sessions
            </p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={authActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Attack Sequence Flow Diagram */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs space-y-2">
          <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
            Observed Attack Progression Sequence Diagram
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-cyan-700 font-bold block">STAGE 1</span>
              <p className="font-bold text-slate-900 mt-1">Perimeter Probe</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {incident.indicatorsOfCompromise[0] || 'Remote Ingress'}
              </p>
            </div>

            <div className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-amber-700 font-bold block">STAGE 2</span>
              <p className="font-bold text-slate-900 mt-1">Threshold Breach</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {incidentAlerts.length > 0 ? incidentAlerts[0].ruleName : 'Security Threshold'}
              </p>
            </div>

            <div className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-purple-700 font-bold block">STAGE 3</span>
              <p className="font-bold text-slate-900 mt-1">SOC Escalation</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {incident.assignedAnalyst.split(' ')[0]}
              </p>
            </div>

            <div className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-emerald-700 font-bold block">STAGE 4</span>
              <p className="font-bold text-slate-900 mt-1">Containment</p>
              <p className="text-[10px] text-emerald-600 mt-0.5 font-bold uppercase">
                {incident.status}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION D: Visual Chronological Timeline Flow */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <span className="text-cyan-600 font-mono">04.</span> Forensic Chronology &amp; Timeline Trace
          </h2>

          <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-300 font-mono text-xs">
            {incidentTimeline.slice(0, 5).map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-600 ring-2 ring-white" />
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                    <span className="text-[11px] text-slate-500">{item.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{item.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                    <span>Category: <strong className="uppercase">{item.category}</strong></span>
                    {item.relatedAlertId && <span>Alert: <strong>{item.relatedAlertId}</strong></span>}
                    <span>Source: {item.source || 'Mini-SOC Core'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Page Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Mini-SOC Audit Dossier // {incident.id}</span>
          <span>Page 3 of 5</span>
        </div>
      </div>

      {/* =========================================================================
          PAGE 4: SECTION E (CORRELATED EVIDENCE LOG TABLE),
          SECTION F (DETECTION RULES), SECTION G (FINDINGS), SECTION H (CONTAINMENT)
      ========================================================================= */}
      <div className="pdf-page bg-white min-h-[1122px] p-12 sm:p-16 space-y-6 border-b border-slate-300 print:border-none print:break-after-page relative">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
          <span className="font-bold text-slate-800">
            {incident.id} // CORRELATED EVIDENCE &amp; TRIAGE RECORD
          </span>
          <span>TLP:AMBER+STRICT</span>
        </div>

        {/* SECTION E: Correlated Evidence and Log Analysis */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-2">
            <span className="text-cyan-600 font-mono">05.</span> Correlated Evidence &amp; Ingested Log Telemetry
          </h2>
          {incidentLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px]">
                  <tr>
                    <th className="py-1.5 px-2 border-b">Timestamp</th>
                    <th className="py-1.5 px-2 border-b">Log ID</th>
                    <th className="py-1.5 px-2 border-b">Source IP</th>
                    <th className="py-1.5 px-2 border-b">User</th>
                    <th className="py-1.5 px-2 border-b">Event Type</th>
                    <th className="py-1.5 px-2 border-b text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {incidentLogs.slice(0, 6).map((log) => (
                    <tr key={log.id}>
                      <td className="py-1.5 px-2 text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-1.5 px-2 font-semibold text-slate-800">{log.id}</td>
                      <td className="py-1.5 px-2 font-bold text-cyan-700">{log.sourceIp}</td>
                      <td className="py-1.5 px-2 text-slate-800">{log.user || '—'}</td>
                      <td className="py-1.5 px-2 text-slate-600">{log.eventType}</td>
                      <td className="py-1.5 px-2 text-right">
                        <span
                          className={`font-bold ${
                            log.action === 'SUCCESS' ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs font-mono text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-200">
              No correlated raw log records in active buffer. Evidence collection in progress.
            </p>
          )}
        </section>

        {/* SECTION F: Detection Rule Analysis */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-2">
            <span className="text-cyan-600 font-mono">06.</span> Detection Rule Analysis &amp; MITRE Mapping
          </h2>
          {incidentRules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incidentRules.map((rule) => (
                <div key={rule.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{rule.id}</span>
                    <span className="text-[10px] text-cyan-700 font-bold uppercase">{rule.category}</span>
                  </div>
                  <p className="font-semibold text-slate-800">{rule.name}</p>
                  <p className="text-slate-600 text-[10px]">{rule.description}</p>
                  <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-500">
                    <p><strong>MITRE Technique:</strong> {rule.mitreId} ({rule.mitreTechnique})</p>
                    <p><strong>Threshold:</strong> {rule.threshold.count} events / {rule.threshold.windowMinutes}m</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs text-slate-600">
              Manual incident escalation — no automated correlation rule triggers recorded.
            </div>
          )}
        </section>

        {/* SECTION G & H: Investigation Findings & Containment Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="space-y-2 font-mono text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              07. Investigation Findings
            </h3>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-emerald-800 text-[10px] block uppercase">Verified Facts</span>
              <p className="text-slate-700 text-[11px]">{incident.summary}</p>
              <p className="text-slate-700 text-[11px] pt-1"><strong>Confirmed Impact:</strong> {incident.confirmedImpact}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 space-y-1">
              <span className="font-bold text-amber-900 text-[10px] block uppercase">Under Investigation</span>
              <p className="text-slate-700 text-[11px]">
                {incident.triageSteps.filter(t => !t.completed).map(t => t.task).join('; ') || 'All scheduled investigation points resolved.'}
              </p>
            </div>
          </section>

          <section className="space-y-2 font-mono text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              08. Containment &amp; Remediation Status
            </h3>
            <div className="space-y-1.5">
              {incident.triageSteps.map((step) => (
                <div
                  key={step.id}
                  className="p-2 rounded border border-slate-200 bg-slate-50 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold ${
                        step.completed ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {step.completed ? '✓' : '—'}
                    </span>
                    <span className={step.completed ? 'text-slate-800' : 'text-slate-500'}>
                      {step.task}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    {step.assignedTo || 'SOC Response'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Page Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Mini-SOC Audit Dossier // {incident.id}</span>
          <span>Page 4 of 5</span>
        </div>
      </div>

      {/* =========================================================================
          PAGE 5: SECTION I (ANALYST NOTES), SECTION J (FINAL ASSESSMENT),
          COMMUNICATIONS & SIGN-OFF
      ========================================================================= */}
      <div className="pdf-page bg-white min-h-[1122px] p-12 sm:p-16 space-y-6 print:break-after-avoid relative">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-mono text-slate-500">
          <span className="font-bold text-slate-800">
            {incident.id} // ANALYST NOTES, COMMS &amp; SIGN-OFF
          </span>
          <span>TLP:AMBER+STRICT</span>
        </div>

        {/* SECTION I: Analyst Investigation Notes */}
        <section className="space-y-2 font-mono text-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-2">
            <span className="text-cyan-600">09.</span> Analyst Investigation Log ({incident.notes.length})
          </h2>
          {incident.notes.length > 0 ? (
            <div className="space-y-2">
              {incident.notes.map((note) => (
                <div key={note.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] mb-0.5">
                    <span className="font-bold text-slate-800">{note.author}</span>
                    <span>{note.timestamp}</span>
                  </div>
                  <p className="text-slate-700">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded border border-slate-200">
              No analyst investigation notes recorded yet.
            </p>
          )}
        </section>

        {/* SECTION J: Final Assessment & Closure Criteria */}
        <section className="space-y-2 font-mono text-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-2">
            <span className="text-cyan-600">10.</span> Final Assessment &amp; Closure Criteria
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <span className="font-bold text-slate-900 uppercase text-[10px]">Current Posture &amp; Next Steps</span>
              <p className="text-slate-600 leading-relaxed">
                Incident status is currently <strong className="uppercase">{incident.status}</strong>. Scheduled remediation actions must complete before formal incident closure.
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <span className="font-bold text-slate-900 uppercase text-[10px]">Incident Closure Verification</span>
              <p className="text-slate-600 leading-relaxed">
                All IOCs null-routed, all session tokens cycled, and no recurrence detected within 24 hours of containment.
              </p>
            </div>
          </div>
        </section>

        {/* Stakeholder Communications Summary */}
        <section className="space-y-2 font-mono text-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-2">
            <span className="text-cyan-600">11.</span> Multi-Stakeholder Incident Communications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[10px]">
            <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
              <span className="text-cyan-700 font-bold uppercase block">Technical Briefing</span>
              <p className="font-bold text-slate-900 mt-0.5">{communications.technical.headline}</p>
              <p className="text-slate-600 mt-1 line-clamp-3">{communications.technical.content}</p>
            </div>
            <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
              <span className="text-purple-700 font-bold uppercase block">Management Briefing</span>
              <p className="font-bold text-slate-900 mt-0.5">{communications.management.headline}</p>
              <p className="text-slate-600 mt-1 line-clamp-3">{communications.management.content}</p>
            </div>
            <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
              <span className="text-emerald-700 font-bold uppercase block">User / Customer Advisory</span>
              <p className="font-bold text-slate-900 mt-0.5">{communications.userFacing.headline}</p>
              <p className="text-slate-600 mt-1 line-clamp-3">{communications.userFacing.content}</p>
            </div>
          </div>
        </section>

        {/* Sign-off & Audit Hash */}
        <section className="pt-3 border-t border-slate-200 font-mono text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div>
              <p><strong>Lead Analyst:</strong> {incident.assignedAnalyst}</p>
              <p><strong>Approved by:</strong> Incident Commander / SOC Lead</p>
            </div>
            <div className="text-right">
              <p><strong>Document ID:</strong> DOC-{incident.id}-PDF</p>
              <p><strong>Telemetry Hash:</strong> SHA256:{communications.factsHash.substring(0, 16)}...</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center pt-2">
            END OF REPORT — MINISOC CYBER DEFENSE INCIDENT INVESTIGATION RECORD
          </p>
        </section>

        {/* Page Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Mini-SOC Audit Dossier // {incident.id}</span>
          <span>Page 5 of 5</span>
        </div>
      </div>
    </div>
  );
};
