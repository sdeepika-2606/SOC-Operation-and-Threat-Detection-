export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AlertStatus = 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed';

export type IncidentStatus = 'active' | 'triaging' | 'contained' | 'resolved' | 'closed';

export type EventCategory = 'authentication' | 'network' | 'system' | 'suspicious' | 'data';

export interface SecurityLog {
  id: string;
  timestamp: string;
  sourceIp: string;
  destinationIp?: string;
  user?: string;
  eventType: string;
  category: EventCategory;
  severity: SeverityLevel;
  action: 'SUCCESS' | 'FAILURE' | 'BLOCKED' | 'SUSPICIOUS' | 'ANOMALOUS';
  details: string;
  metadata?: Record<string, any>;
  rawJson?: string;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  logicSummary: string;
  severity: SeverityLevel;
  category: string;
  mitreTechnique: string;
  mitreId: string;
  status: 'active' | 'testing' | 'disabled';
  triggerCount: number;
  lastTriggered?: string;
  threshold: {
    count: number;
    windowMinutes: number;
  };
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  ruleId: string;
  ruleName: string;
  description: string;
  sourceIp: string;
  targetUser?: string;
  severity: SeverityLevel;
  confidence: number; // 0 - 100
  status: AlertStatus;
  matchedCount: number;
  firstSeen: string;
  lastSeen: string;
  evidence: string[];
  rawEventIds: string[];
  analystNotes?: string;
}

export interface IncidentNote {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

export interface TriageStep {
  id: string;
  task: string;
  completed: boolean;
  assignedTo?: string;
}

export interface SecurityIncident {
  id: string;
  title: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  detectionSource: string;
  firstObserved: string;
  lastObserved: string;
  assignedAnalyst: string;
  summary: string;
  scope: string;
  confirmedImpact: string;
  relatedAlertIds: string[];
  supportingEvidence: string[];
  triageSteps: TriageStep[];
  notes: IncidentNote[];
  affectedComponents: string[];
  indicatorsOfCompromise: string[];
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  timestamp: string;
  title: string;
  description: string;
  relatedAlertId?: string;
  severity: SeverityLevel;
  category: 'detection' | 'containment' | 'investigation' | 'telemetry' | 'communication';
  status: 'confirmed' | 'suspected' | 'investigating';
  source?: string;
}

export interface IncidentFacts {
  incidentId: string;
  incidentTitle: string;
  severity: SeverityLevel;
  firstObserved: string;
  lastObserved: string;
  currentStatus: IncidentStatus;
  // Fact-checked boundaries
  confirmedAffectedComponents: string[];
  hasConfirmedUserImpact: boolean;
  confirmedUserImpactDescription: string;
  confirmedRootCause: string;
  isRootCauseConfirmed: boolean;
  technicalActionsTaken: string[];
  pendingActions: string[];
  mitigationStatus: 'contained' | 'mitigating' | 'investigating';
  actionRequiredFromUsers: string;
  nextScheduledUpdateMinutes: number;
  confidentialityBreached: 'no' | 'suspected' | 'under_investigation' | 'confirmed';
}

export interface GeneratedCommunications {
  technical: {
    audience: string;
    headline: string;
    content: string;
  };
  management: {
    audience: string;
    headline: string;
    content: string;
  };
  userFacing: {
    audience: string;
    headline: string;
    content: string;
  };
  generatedAt: string;
  factsHash: string;
}

export interface TestScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  inputDescription: string;
  sampleLogs: Partial<SecurityLog>[];
  expectedRuleIdTriggered?: string;
  expectedAlertTriggered: boolean;
  expectedStatus: 'should_pass' | 'should_alert' | 'should_ignore';
  actualResult?: {
    passed: boolean;
    detectedRuleId?: string;
    executionMs: number;
    logOutput: string[];
  };
}
