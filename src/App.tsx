/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { OverviewView } from './components/views/OverviewView';
import { MonitoringView } from './components/views/MonitoringView';
import { LogExplorerView } from './components/views/LogExplorerView';
import { ThreatDetectionView } from './components/views/ThreatDetectionView';
import { AlertCenterView } from './components/views/AlertCenterView';
import { IncidentManagementView } from './components/views/IncidentManagementView';
import { IncidentTimelineView } from './components/views/IncidentTimelineView';
import { CommunicationGeneratorView } from './components/views/CommunicationGeneratorView';
import { DetectionRulesView } from './components/views/DetectionRulesView';
import { TestValidationView } from './components/views/TestValidationView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { Modal } from './components/common/Modal';
import { SeverityBadge, StatusBadge } from './components/common/Badge';

import {
  SecurityLog,
  SecurityAlert,
  SecurityIncident,
  TimelineEvent,
  DetectionRule,
  IncidentFacts,
  AlertStatus,
} from './types/security';
import {
  SYNTHETIC_LOGS,
  SYNTHETIC_ALERTS,
  SYNTHETIC_INCIDENTS,
  SYNTHETIC_TIMELINE_EVENTS,
  SYNTHETIC_DETECTION_RULES,
  DEFAULT_INCIDENT_FACTS,
} from './data/syntheticData';
import { runDetectionRules } from './services/detectionEngine';
import { apiService } from './services/api';

export default function App() {
  // Theme state: dark by default (standard for SOC consoles)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mini_soc_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('mini_soc_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Navigation state
  const [currentView, setCurrentView] = useState<NavView>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core SOC Data States
  const [logs, setLogs] = useState<SecurityLog[]>(SYNTHETIC_LOGS);
  const [alerts, setAlerts] = useState<SecurityAlert[]>(SYNTHETIC_ALERTS);
  const [incidents, setIncidents] = useState<SecurityIncident[]>(SYNTHETIC_INCIDENTS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(SYNTHETIC_TIMELINE_EVENTS);
  const [rules, setRules] = useState<DetectionRule[]>(SYNTHETIC_DETECTION_RULES);

  // Transfer state for Communication Generator
  const [commsFacts, setCommsFacts] = useState<IncidentFacts>(DEFAULT_INCIDENT_FACTS);

  // Modals for inspecting raw items
  const [inspectedLog, setInspectedLog] = useState<SecurityLog | null>(null);

  // Ingestion handler for Log Explorer
  const handleUploadLogs = async (newLogs: SecurityLog[]) => {
    const result = await apiService.uploadLogs(newLogs);
    setLogs((prev) => [...newLogs, ...prev]);

    // If new alerts were triggered by the detection engine, update alerts state
    if (result.newAlerts.length > 0) {
      setAlerts((prev) => [...result.newAlerts, ...prev]);
    }
  };

  // Alert status updates
  const handleUpdateAlertStatus = async (alertId: string, status: AlertStatus, note?: string) => {
    const updated = await apiService.updateAlertStatus(alertId, status, note);
    if (updated) {
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
    }
  };

  // Escalate Alert to Confirmed Incident
  const handleEscalateToIncident = (alert: SecurityAlert) => {
    const newIncId = `INC-2026-00${incidents.length + 1}`;
    const newIncident: SecurityIncident = {
      id: newIncId,
      title: `Escalated Incident: ${alert.ruleName} from ${alert.sourceIp}`,
      severity: alert.severity,
      status: 'active',
      detectionSource: `Alert Center Escalation (${alert.id})`,
      firstObserved: alert.firstSeen,
      lastObserved: alert.lastSeen,
      assignedAnalyst: 'D. Chen (Lead SOC Analyst)',
      summary: alert.description,
      scope: `Target Host under telemetry correlation from source IP ${alert.sourceIp}.`,
      confirmedImpact: 'Preliminary telemetry triage in progress. Containment rule dispatched.',
      relatedAlertIds: [alert.id],
      supportingEvidence: alert.evidence,
      triageSteps: [
        { id: 'T_AUTO_1', task: `Enforce boundary firewall null-route on ${alert.sourceIp}`, completed: true, assignedTo: 'Edge Sec' },
        { id: 'T_AUTO_2', task: 'Revoke active authentication sessions for targeted account', completed: false, assignedTo: 'IAM Lead' },
        { id: 'T_AUTO_3', task: 'Review endpoint process memory and auth logs', completed: false, assignedTo: 'DFIR' },
      ],
      notes: [
        {
          id: `N-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          author: 'D. Chen',
          content: `Incident escalated from Alert ${alert.id} (${alert.ruleName}).`,
        },
      ],
      affectedComponents: [alert.targetUser || 'System Account', alert.sourceIp],
      indicatorsOfCompromise: [alert.sourceIp],
    };

    setIncidents([newIncident, ...incidents]);
    setCurrentView('incidents');
  };

  // Rule threshold tuner
  const handleUpdateRuleThreshold = async (ruleId: string, count: number, windowMinutes: number) => {
    const updated = await apiService.updateRuleThreshold(ruleId, count, windowMinutes);
    if (updated) {
      setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
    }
  };

  // Incident status update
  const handleUpdateIncidentStatus = async (incidentId: string, status: SecurityIncident['status']) => {
    const updated = await apiService.updateIncidentStatus(incidentId, status);
    if (updated) {
      setIncidents((prev) => prev.map((i) => (i.id === incidentId ? updated : i)));
    }
  };

  // Add Incident Note
  const handleAddIncidentNote = async (incidentId: string, content: string, author: string) => {
    const updated = await apiService.addIncidentNote(incidentId, content, author);
    if (updated) {
      setIncidents((prev) => prev.map((i) => (i.id === incidentId ? updated : i)));
    }
  };

  // Toggle Triage Step
  const handleToggleTriageStep = async (incidentId: string, stepId: string) => {
    const updated = await apiService.toggleTriageStep(incidentId, stepId);
    if (updated) {
      setIncidents((prev) => prev.map((i) => (i.id === incidentId ? updated : i)));
    }
  };

  // Create Incident
  const handleCreateIncident = async (incidentData: Omit<SecurityIncident, 'id'>) => {
    const created = await apiService.createIncident(incidentData);
    setIncidents((prev) => [created, ...prev]);
    const newTimeline = await apiService.getIncidentTimeline(created.id);
    if (newTimeline.length > 0) {
      setTimelineEvents((prev) => [...prev, ...newTimeline]);
    }
    return created;
  };

  // Transfer Incident to Communication Generator
  const handleSelectIncidentForComms = (incident: SecurityIncident) => {
    const facts: IncidentFacts = {
      incidentId: incident.id,
      incidentTitle: incident.title,
      severity: incident.severity,
      firstObserved: incident.firstObserved,
      lastObserved: incident.lastObserved,
      currentStatus: incident.status,
      confirmedAffectedComponents: [...incident.affectedComponents],
      hasConfirmedUserImpact: false,
      confirmedUserImpactDescription: incident.confirmedImpact || 'No user data access verified.',
      confirmedRootCause: incident.summary,
      isRootCauseConfirmed: true,
      technicalActionsTaken: incident.triageSteps.filter((t) => t.completed).map((t) => t.task),
      pendingActions: incident.triageSteps.filter((t) => !t.completed).map((t) => t.task),
      mitigationStatus: incident.status === 'contained' ? 'contained' : 'investigating',
      actionRequiredFromUsers: 'No immediate action required from external customers.',
      nextScheduledUpdateMinutes: 60,
      confidentialityBreached: 'no',
    };

    setCommsFacts(facts);
    setCurrentView('communications');
  };

  // Global search handler
  const handleGlobalSearch = (query: string) => {
    const q = query.toLowerCase();
    // Check if matching an alert
    const matchedAlert = alerts.find(
      (a) => a.id.toLowerCase().includes(q) || a.sourceIp.toLowerCase().includes(q)
    );
    if (matchedAlert) {
      setCurrentView('alerts');
      return;
    }

    // Check if matching an incident
    const matchedInc = incidents.find(
      (i) => i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)
    );
    if (matchedInc) {
      setCurrentView('incidents');
      return;
    }

    // Default to log explorer
    setCurrentView('logs');
  };

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Left Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          alertCount={alerts.filter((a) => a.status === 'new').length}
          incidentCount={incidents.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />
          <div className="relative z-10 w-72 h-full bg-white dark:bg-slate-950 flex flex-col shadow-2xl">
            <Sidebar
              currentView={currentView}
              onSelectView={(v) => {
                setCurrentView(v);
                setMobileMenuOpen(false);
              }}
              collapsed={false}
              onToggleCollapse={() => setMobileMenuOpen(false)}
              alertCount={alerts.filter((a) => a.status === 'new').length}
              incidentCount={incidents.length}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          currentView={currentView}
          onSelectView={setCurrentView}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onGlobalSearch={handleGlobalSearch}
          alerts={alerts}
        />

        {/* View Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentView === 'overview' && (
              <OverviewView
                logs={logs}
                alerts={alerts}
                incidents={incidents}
                theme={theme}
                onSelectView={setCurrentView}
                onSelectLog={setInspectedLog}
                onSelectAlert={(alert) => {
                  setCurrentView('alerts');
                }}
              />
            )}

            {currentView === 'monitoring' && (
              <MonitoringView
                logs={logs}
                onSelectLog={setInspectedLog}
                onInjectEvent={(log) => setLogs((prev) => [log, ...prev])}
              />
            )}

            {currentView === 'logs' && (
              <LogExplorerView
                logs={logs}
                onUploadLogs={handleUploadLogs}
                onSelectLog={setInspectedLog}
              />
            )}

            {currentView === 'threats' && (
              <ThreatDetectionView
                rules={rules}
                alerts={alerts}
                onUpdateRuleThreshold={handleUpdateRuleThreshold}
                onViewAlertsForRule={(ruleId) => setCurrentView('alerts')}
              />
            )}

            {currentView === 'alerts' && (
              <AlertCenterView
                alerts={alerts}
                onUpdateAlertStatus={handleUpdateAlertStatus}
                onEscalateToIncident={handleEscalateToIncident}
                onSelectView={setCurrentView}
              />
            )}

            {currentView === 'incidents' && (
              <IncidentManagementView
                incidents={incidents}
                onSelectIncidentForComms={handleSelectIncidentForComms}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
                onAddIncidentNote={handleAddIncidentNote}
                onToggleTriageStep={handleToggleTriageStep}
                onCreateIncident={handleCreateIncident}
                onSelectView={setCurrentView}
              />
            )}

            {currentView === 'timeline' && (
              <IncidentTimelineView
                timelineEvents={timelineEvents}
                incidents={incidents}
                onSelectAlertById={() => setCurrentView('alerts')}
              />
            )}

            {currentView === 'communications' && (
              <CommunicationGeneratorView
                incidents={incidents}
                initialFacts={commsFacts}
              />
            )}

            {currentView === 'rules' && (
              <DetectionRulesView
                rules={rules}
                onUpdateRuleThreshold={handleUpdateRuleThreshold}
              />
            )}

            {currentView === 'validation' && <TestValidationView />}

            {currentView === 'reports' && (
              <ReportsView
                alerts={alerts}
                incidents={incidents}
                logs={logs}
                rules={rules}
                timelineEvents={timelineEvents}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView theme={theme} onToggleTheme={toggleTheme} />
            )}
          </div>
        </main>
      </div>

      {/* Global Log Inspection Modal */}
      {inspectedLog && (
        <Modal
          isOpen={!!inspectedLog}
          onClose={() => setInspectedLog(null)}
          title={`Log Inspection: ${inspectedLog.id}`}
          subtitle={`${inspectedLog.eventType} from ${inspectedLog.sourceIp}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Timestamp:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{inspectedLog.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Action:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{inspectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Source IP (RFC 5737):</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">{inspectedLog.sourceIp}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Target User:</span>
                <span className="text-slate-800 dark:text-slate-200">{inspectedLog.user || 'None'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase mb-1">Details:</span>
              <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                {inspectedLog.details}
              </p>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase mb-1">Raw Telemetry JSON:</span>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] overflow-x-auto border border-slate-800">
                {JSON.stringify(inspectedLog, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
