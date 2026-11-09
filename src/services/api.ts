import {
  SecurityLog,
  DetectionRule,
  SecurityAlert,
  SecurityIncident,
  TimelineEvent,
  IncidentFacts,
  GeneratedCommunications,
} from '../types/security';
import {
  SYNTHETIC_LOGS,
  SYNTHETIC_ALERTS,
  SYNTHETIC_DETECTION_RULES,
  SYNTHETIC_INCIDENTS,
  SYNTHETIC_TIMELINE_EVENTS,
  DEFAULT_INCIDENT_FACTS,
} from '../data/syntheticData';
import { generateIncidentCommunications } from './communicationEngine';
import { runDetectionRules } from './detectionEngine';

export interface ApiStatus {
  connected: boolean;
  isDemoMode: boolean;
  endpointUrl: string;
  latencyMs?: number;
  lastChecked?: string;
  errorMessage?: string;
}

const DEFAULT_API_URL = typeof window !== 'undefined'
  ? localStorage.getItem('mini_soc_api_url') || 'http://localhost:8000/api'
  : 'http://localhost:8000/api';

class MiniSocApiService {
  private baseUrl: string = DEFAULT_API_URL;
  private isDemoMode: boolean = true;
  private cachedLogs: SecurityLog[] = [...SYNTHETIC_LOGS];
  private cachedAlerts: SecurityAlert[] = [...SYNTHETIC_ALERTS];
  private cachedRules: DetectionRule[] = [...SYNTHETIC_DETECTION_RULES];
  private cachedIncidents: SecurityIncident[] = [...SYNTHETIC_INCIDENTS];
  private cachedTimelines: TimelineEvent[] = [...SYNTHETIC_TIMELINE_EVENTS];

  constructor() {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('mini_soc_api_url');
      if (savedUrl) this.baseUrl = savedUrl;
    }
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mini_soc_api_url', url);
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getMode(): { isDemo: boolean } {
    return { isDemo: this.isDemoMode };
  }

  public async checkHealth(): Promise<ApiStatus> {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        this.isDemoMode = false;
        return {
          connected: true,
          isDemoMode: false,
          endpointUrl: this.baseUrl,
          latencyMs,
          lastChecked: new Date().toLocaleTimeString(),
        };
      }
    } catch {
      // Graceful fallback to synthetic demo mode
    }

    this.isDemoMode = true;
    return {
      connected: false,
      isDemoMode: true,
      endpointUrl: this.baseUrl,
      lastChecked: new Date().toLocaleTimeString(),
      errorMessage: 'FastAPI backend unreachable at ' + this.baseUrl + '. Operating in Synthetic Demo Mode.',
    };
  }

  public async getLogs(): Promise<SecurityLog[]> {
    return [...this.cachedLogs];
  }

  public async uploadLogs(newLogs: SecurityLog[]): Promise<{ count: number; newAlerts: SecurityAlert[] }> {
    this.cachedLogs = [...newLogs, ...this.cachedLogs];
    const detection = runDetectionRules(newLogs, this.cachedRules);
    if (detection.alerts.length > 0) {
      this.cachedAlerts = [...detection.alerts, ...this.cachedAlerts];
    }
    return {
      count: newLogs.length,
      newAlerts: detection.alerts,
    };
  }

  public async getAlerts(): Promise<SecurityAlert[]> {
    return [...this.cachedAlerts];
  }

  public async updateAlertStatus(alertId: string, status: SecurityAlert['status'], analystNotes?: string): Promise<SecurityAlert | null> {
    const idx = this.cachedAlerts.findIndex(a => a.id === alertId);
    if (idx !== -1) {
      this.cachedAlerts[idx] = {
        ...this.cachedAlerts[idx],
        status,
        analystNotes: analystNotes ? `${this.cachedAlerts[idx].analystNotes ? this.cachedAlerts[idx].analystNotes + ' | ' : ''}${analystNotes}` : this.cachedAlerts[idx].analystNotes,
      };
      return this.cachedAlerts[idx];
    }
    return null;
  }

  public async getDetectionRules(): Promise<DetectionRule[]> {
    return [...this.cachedRules];
  }

  public async updateRuleThreshold(ruleId: string, count: number, windowMinutes: number): Promise<DetectionRule | null> {
    const idx = this.cachedRules.findIndex(r => r.id === ruleId);
    if (idx !== -1) {
      this.cachedRules[idx] = {
        ...this.cachedRules[idx],
        threshold: { count, windowMinutes },
      };
      return this.cachedRules[idx];
    }
    return null;
  }

  public async getIncidents(): Promise<SecurityIncident[]> {
    return [...this.cachedIncidents];
  }

  public async getIncidentTimeline(incidentId: string): Promise<TimelineEvent[]> {
    return this.cachedTimelines.filter(t => t.incidentId === incidentId);
  }

  public async updateIncidentStatus(incidentId: string, status: SecurityIncident['status']): Promise<SecurityIncident | null> {
    const idx = this.cachedIncidents.findIndex(i => i.id === incidentId);
    if (idx !== -1) {
      this.cachedIncidents[idx] = {
        ...this.cachedIncidents[idx],
        status,
      };
      return this.cachedIncidents[idx];
    }
    return null;
  }

  public async addIncidentNote(incidentId: string, content: string, author: string): Promise<SecurityIncident | null> {
    const idx = this.cachedIncidents.findIndex(i => i.id === incidentId);
    if (idx !== -1) {
      const newNote = {
        id: `N-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        author,
        content,
      };
      this.cachedIncidents[idx] = {
        ...this.cachedIncidents[idx],
        notes: [newNote, ...this.cachedIncidents[idx].notes],
      };
      return this.cachedIncidents[idx];
    }
    return null;
  }

  public async createIncident(incidentData: Omit<SecurityIncident, 'id'>): Promise<SecurityIncident> {
    const newId = `INC-2026-00${this.cachedIncidents.length + 1}`;
    const newIncident: SecurityIncident = {
      ...incidentData,
      id: newId,
    };
    this.cachedIncidents = [newIncident, ...this.cachedIncidents];

    // Create an initial timeline event for the new incident
    const initialTimeline: TimelineEvent = {
      id: `TL-${Date.now()}`,
      incidentId: newId,
      timestamp: newIncident.firstObserved || new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      title: `Incident Recorded: ${newIncident.title}`,
      description: newIncident.summary,
      severity: newIncident.severity,
      category: 'investigation',
      status: 'confirmed',
      source: newIncident.detectionSource || 'SOC Command Center',
    };
    this.cachedTimelines = [...this.cachedTimelines, initialTimeline];

    return newIncident;
  }

  public async toggleTriageStep(incidentId: string, stepId: string): Promise<SecurityIncident | null> {
    const idx = this.cachedIncidents.findIndex(i => i.id === incidentId);
    if (idx !== -1) {
      const updatedSteps = this.cachedIncidents[idx].triageSteps.map(step =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      );
      this.cachedIncidents[idx] = {
        ...this.cachedIncidents[idx],
        triageSteps: updatedSteps,
      };
      return this.cachedIncidents[idx];
    }
    return null;
  }

  public async addTimelineEvent(event: TimelineEvent): Promise<TimelineEvent> {
    this.cachedTimelines = [...this.cachedTimelines, event];
    return event;
  }

  public async generateCommunications(facts: IncidentFacts): Promise<GeneratedCommunications> {
    return generateIncidentCommunications(facts);
  }

  public async getAnalyticsSummary() {
    const totalEvents = 148920 + (this.cachedLogs.length - SYNTHETIC_LOGS.length);
    const criticalAlerts = this.cachedAlerts.filter(a => a.severity === 'critical').length;
    const highAlerts = this.cachedAlerts.filter(a => a.severity === 'high').length;
    const activeIncidents = this.cachedIncidents.filter(i => i.status === 'active' || i.status === 'triaging' || i.status === 'contained').length;

    return {
      totalEventsAnalyzed: totalEvents,
      totalSecurityAlerts: this.cachedAlerts.length,
      criticalAlerts,
      highSeverityAlerts: highAlerts,
      activeIncidents,
      detectionRate: 99.4,
      mttdMinutes: 1.8,
      mttrMinutes: 14.2,
      isDemoMode: this.isDemoMode,
    };
  }

  public async generateIncidentPdf(incidentId: string): Promise<{
    reportId: string;
    incidentId: string;
    downloadUrl: string;
    generatedAt: string;
    sections: number;
    fileSizeBytes: number;
  }> {
    const reportId = `REP-INC-${incidentId}-${Date.now()}`;
    return {
      reportId,
      incidentId,
      downloadUrl: `${this.baseUrl}/reports/${reportId}/download`,
      generatedAt: new Date().toISOString(),
      sections: 21,
      fileSizeBytes: 248500,
    };
  }

  public async generateAnalyticsPdf(): Promise<{
    reportId: string;
    downloadUrl: string;
    generatedAt: string;
    chartsIncluded: number;
    fileSizeBytes: number;
  }> {
    const reportId = `REP-SOC-ANALYTICS-${Date.now()}`;
    return {
      reportId,
      downloadUrl: `${this.baseUrl}/reports/${reportId}/download`,
      generatedAt: new Date().toISOString(),
      chartsIncluded: 6,
      fileSizeBytes: 312400,
    };
  }

  public async downloadReport(reportId: string): Promise<Blob | null> {
    try {
      const res = await fetch(`${this.baseUrl}/reports/${reportId}/download`);
      if (res.ok) {
        return await res.blob();
      }
    } catch {
      // In demo mode, handled client-side via html2canvas + jsPDF
    }
    return null;
  }
}

export const apiService = new MiniSocApiService();
