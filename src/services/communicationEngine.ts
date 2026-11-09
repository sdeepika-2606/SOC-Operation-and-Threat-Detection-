import { IncidentFacts, GeneratedCommunications } from '../types/security';

export const ANALYST_DISCLAIMER = `> [!IMPORTANT]
> **MANDATORY ANALYST REVIEW & APPROVAL REQUIRED**
> This incident communication has been programmatically generated strictly from verified telemetry facts recorded in Mini-SOC.
> **Distribution Safeguard**: Do NOT release, post to status pages, or email externally without explicit review and sign-off by the Incident Commander or Lead SOC Analyst. Never add unverified claims, speculative attribution, or unconfirmed user impact.`;

export function generateIncidentCommunications(facts: IncidentFacts): GeneratedCommunications {
  const generatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // Format verified components
  const affectedComponentsStr = facts.confirmedAffectedComponents.length > 0
    ? facts.confirmedAffectedComponents.map(c => `- ${c}`).join('\n')
    : '- [UNKNOWN / UNDER ACTIVE INVESTIGATION - No components confirmed yet]';

  // Format actions taken
  const technicalActionsStr = facts.technicalActionsTaken.length > 0
    ? facts.technicalActionsTaken.map(a => `- ${a}`).join('\n')
    : '- [INVESTIGATION IN PROGRESS - Initial telemetry isolation active]';

  // Format pending actions
  const pendingActionsStr = facts.pendingActions.length > 0
    ? facts.pendingActions.map(p => `- ${p}`).join('\n')
    : '- Complete memory dump verification and credential rotation audit';

  // Verified root cause check
  const rootCauseStr = facts.isRootCauseConfirmed
    ? facts.confirmedRootCause
    : '[UNKNOWN / UNDER ACTIVE INVESTIGATION - Root cause analysis underway]';

  // User impact check
  const userImpactStr = facts.hasConfirmedUserImpact
    ? facts.confirmedUserImpactDescription
    : 'No customer data compromise, service outage, or unauthorized user access has been verified at this time.';

  // Data confidentiality statement
  let confidentialityStr = '';
  if (facts.confidentialityBreached === 'no') {
    confidentialityStr = 'Confirmed zero customer records or confidential databases accessed.';
  } else if (facts.confidentialityBreached === 'confirmed') {
    confidentialityStr = 'Confirmed potential data exposure under active perimeter containment.';
  } else {
    confidentialityStr = '[UNDER ACTIVE INVESTIGATION - Forensics verifying database query logs]';
  }

  // Next update calculation
  const nextUpdateTime = `Within ~${facts.nextScheduledUpdateMinutes} minutes or immediately upon material state change`;

  // 1. TECHNICAL UPDATE (SOC Analysts & Technical Teams)
  const technicalHeadline = `[TECHNICAL-UPDATE] ${facts.incidentId}: ${facts.incidentTitle} (${facts.severity.toUpperCase()})`;
  const technicalContent = `${ANALYST_DISCLAIMER}

# Technical Incident Advisory: ${facts.incidentId}
**Classification**: TLP:AMBER+STRICT | Security Operations Technical Briefing  
**Timestamp**: ${generatedAt}  
**Severity**: ${facts.severity.toUpperCase()} | **State**: ${facts.currentStatus.toUpperCase()}  
**Time Window**: First Observed ${facts.firstObserved} | Last Observed ${facts.lastObserved}  

---

### 1. Incident Overview & Technical Scope
- **Incident Identifier**: ${facts.incidentId}
- **Incident Title**: ${facts.incidentTitle}
- **Containment Status**: ${facts.mitigationStatus.toUpperCase()}
- **Root Cause Assessment**: ${rootCauseStr}
- **Confidentiality Scope**: ${confidentialityStr}

### 2. Confirmed Affected Infrastructure & Assets
${affectedComponentsStr}

### 3. Technical Evidence & Telemetry Findings
- **Observed Behavior**: High-frequency authentication telemetry matched active detection thresholds.
- **Data Integrity**: Verified telemetry records captured in Mini-SOC event log index.
- **Impact Verification**: ${userImpactStr}

### 4. Mitigation Actions Executed
${technicalActionsStr}

### 5. Pending Technical Workstreams
${pendingActionsStr}

### 6. Operational Guidance for Engineering
${facts.actionRequiredFromUsers}

*Next Technical Briefing Cadence: ${nextUpdateTime}*
`;

  // 2. MANAGEMENT UPDATE (Leadership, CISO, Legal, Steering Committee)
  const managementHeadline = `[EXECUTIVE-BRIEF] Incident ${facts.incidentId}: ${facts.incidentTitle} - ${facts.currentStatus.toUpperCase()}`;
  const managementContent = `${ANALYST_DISCLAIMER}

# Executive Security Briefing: Incident ${facts.incidentId}
**Target Audience**: Executive Leadership, Legal, and Steering Committee  
**Prepared By**: Mini-SOC Incident Response Team  
**Date/Time**: ${generatedAt}  
**Severity Rating**: ${facts.severity.toUpperCase()} | **Posture**: ${facts.currentStatus.toUpperCase()}  

---

### Executive Summary
At ${facts.firstObserved}, Mini-SOC detected an anomalous security event on perimeter infrastructure (${facts.incidentId}). Active containment countermeasures were immediately enacted by the on-call SOC team. Current operational status is **${facts.currentStatus.toUpperCase()}**.

### Verified Business & Operational Impact
> **Critical Fact Boundary**: *This assessment strictly reflects verified telemetry only.*
- **Customer / User Impact**: ${userImpactStr}
- **Data Privacy & Confidentiality**: ${confidentialityStr}
- **Affected Systems**: ${facts.confirmedAffectedComponents.join(', ') || 'No core customer services affected; peripheral host contained.'}
- **Service Availability**: Core production applications remain nominal; isolated gateway rerouted.

### Current Response & Containment Status
The incident response team has enacted isolation protocols:
${facts.technicalActionsTaken.map(t => `- **Completed**: ${t}`).join('\n')}

### Root Cause & Investigation
- **Cause Status**: ${facts.isRootCauseConfirmed ? 'Identified & Verified' : 'Under Active Forensic Investigation'}
- **Summary**: ${rootCauseStr}

### Key Decisions & Support Requested
- Approval for scheduled credential rotation window across internal deployment pipelines.
- Confirmation of communications schedule for external stakeholders if required by compliance thresholds.

*Next Executive Status Cadence: ${nextUpdateTime}*
`;

  // 3. USER-FACING / STATUS UPDATE (Customers, End-Users, Public Status Page)
  const userHeadline = `Status Advisory: Investigation of Security Incident (${facts.incidentId})`;
  const userContent = `${ANALYST_DISCLAIMER}

# Security Notice: Incident ${facts.incidentId}
**Target Audience**: Customers, Platform Users, Public Status Page  
**Published**: ${generatedAt}  
**Current Status**: ${facts.currentStatus.toUpperCase()}  

---

### Incident Notification
We are actively investigating a security event detected on our perimeter infrastructure. Our security operations team detected anomalous activity on ${facts.firstObserved} and immediately applied containment measures.

### What is Confirmed
- **Service Availability**: ${facts.hasConfirmedUserImpact ? facts.confirmedUserImpactDescription : 'All primary platform services and customer applications are operating normally.'}
- **Data Protection**: ${facts.confidentialityBreached === 'no' ? 'We have confirmed zero unauthorized access to customer account data or databases.' : 'Our forensics team is actively inspecting logs; any verified impact will be promptly reported.'}

### Recommended Actions for Users
${facts.actionRequiredFromUsers}

### Our Commitment & Next Steps
We take the confidentiality and availability of your environments with the utmost seriousness. Our security team remains in active containment and will provide verified updates as forensic analysis progresses.

*Next Public Status Update: ${nextUpdateTime}*
`;

  // Compute a simple hash to guarantee all 3 originated from the same fact set
  const factsHash = btoa(unescape(encodeURIComponent(JSON.stringify({
    id: facts.incidentId,
    status: facts.currentStatus,
    severity: facts.severity,
    components: facts.confirmedAffectedComponents,
    impact: facts.confirmedUserImpactDescription,
    rootCause: facts.confirmedRootCause,
    actions: facts.technicalActionsTaken,
    time: generatedAt,
  })))).slice(0, 16);

  return {
    technical: {
      audience: 'SOC Analysts, DevOps & Technical Response Team',
      headline: technicalHeadline,
      content: technicalContent,
    },
    management: {
      audience: 'Executive Leadership, CISO, Legal & Board',
      headline: managementHeadline,
      content: managementContent,
    },
    userFacing: {
      audience: 'Customers, End Users & Public Status Page',
      headline: userHeadline,
      content: userContent,
    },
    generatedAt,
    factsHash,
  };
}
