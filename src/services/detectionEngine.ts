import { SecurityLog, DetectionRule, SecurityAlert } from '../types/security';

export interface DetectionResult {
  alerts: SecurityAlert[];
  matchedRules: string[];
  processedCount: number;
}

export function runDetectionRules(logs: SecurityLog[], rules: DetectionRule[]): DetectionResult {
  const generatedAlerts: SecurityAlert[] = [];
  const matchedRuleIds = new Set<string>();

  // Filter out corrupted/empty logs
  const validLogs = logs.filter(l => l && l.sourceIp && l.sourceIp.trim() !== '' && l.eventType);

  // Group logs by sourceIp
  const byIp: Record<string, SecurityLog[]> = {};
  for (const log of validLogs) {
    if (!byIp[log.sourceIp]) {
      byIp[log.sourceIp] = [];
    }
    byIp[log.sourceIp].push(log);
  }

  // Check each rule
  for (const rule of rules) {
    if (rule.status !== 'active') continue;

    if (rule.id === 'RULE-AUTH-001') {
      // Repeated Failed Login Detection (e.g. >= 5 failures from single IP)
      for (const [ip, ipLogs] of Object.entries(byIp)) {
        const failures = ipLogs.filter(l => l.action === 'FAILURE' || l.eventType.includes('FAIL'));
        if (failures.length >= rule.threshold.count) {
          matchedRuleIds.add(rule.id);
          const first = failures[failures.length - 1] || failures[0];
          const last = failures[0];
          const alertId = `ALT-GEN-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;

          generatedAlerts.push({
            id: alertId,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            ruleId: rule.id,
            ruleName: rule.name,
            description: `Source IP ${ip} exceeded threshold with ${failures.length} failed login attempts.`,
            sourceIp: ip,
            targetUser: Array.from(new Set(failures.map(f => f.user).filter(Boolean))).join(', ') || 'unknown',
            severity: rule.severity,
            confidence: Math.min(98, 80 + failures.length * 3),
            status: 'new',
            matchedCount: failures.length,
            firstSeen: first.timestamp || 'Unknown',
            lastSeen: last.timestamp || 'Unknown',
            evidence: failures.slice(0, 5).map(f => `${f.timestamp}: Failed login for user "${f.user || 'anonymous'}"`),
            rawEventIds: failures.map(f => f.id),
          });
        }
      }
    } else if (rule.id === 'RULE-AUTH-002') {
      // Suspicious Successful Login After Multiple Failures
      for (const [ip, ipLogs] of Object.entries(byIp)) {
        const sorted = [...ipLogs]; // Assume newest first or order by index
        const successes = sorted.filter(l => l.action === 'SUCCESS' && l.category === 'authentication');
        const failures = sorted.filter(l => l.action === 'FAILURE');

        if (successes.length > 0 && failures.length >= rule.threshold.count) {
          matchedRuleIds.add(rule.id);
          const succ = successes[0];
          const alertId = `ALT-GEN-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;

          generatedAlerts.push({
            id: alertId,
            timestamp: succ.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            ruleId: rule.id,
            ruleName: rule.name,
            description: `Host accepted credentials for "${succ.user || 'svc-account'}" from ${ip} immediately following ${failures.length} failed attempts.`,
            sourceIp: ip,
            targetUser: succ.user || 'unknown',
            severity: rule.severity,
            confidence: 96,
            status: 'new',
            matchedCount: failures.length + 1,
            firstSeen: failures[failures.length - 1]?.timestamp || succ.timestamp,
            lastSeen: succ.timestamp,
            evidence: [
              `Observed ${failures.length} consecutive authentication failures`,
              `Successful login for "${succ.user}" followed within threshold window`,
              `Potential credential brute-force or compromised key sequence`,
            ],
            rawEventIds: [succ.id, ...failures.slice(0, 4).map(f => f.id)],
          });
        }
      }
    } else if (rule.id === 'RULE-AUTH-003') {
      // Correlated Multi-Account Activity (Credential Spray)
      for (const [ip, ipLogs] of Object.entries(byIp)) {
        const uniqueUsers = Array.from(new Set(ipLogs.map(l => l.user).filter(Boolean)));
        if (uniqueUsers.length >= rule.threshold.count && ipLogs.length >= 4) {
          matchedRuleIds.add(rule.id);
          const alertId = `ALT-GEN-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;

          generatedAlerts.push({
            id: alertId,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
            ruleId: rule.id,
            ruleName: rule.name,
            description: `Source IP ${ip} targeted ${uniqueUsers.length} distinct user accounts in multi-account authentication probe.`,
            sourceIp: ip,
            targetUser: uniqueUsers.slice(0, 4).join(', ') + (uniqueUsers.length > 4 ? ` (+${uniqueUsers.length - 4} more)` : ''),
            severity: rule.severity,
            confidence: 89,
            status: 'new',
            matchedCount: ipLogs.length,
            firstSeen: ipLogs[ipLogs.length - 1]?.timestamp || 'Unknown',
            lastSeen: ipLogs[0]?.timestamp || 'Unknown',
            evidence: uniqueUsers.map(u => `Targeted account: ${u}`),
            rawEventIds: ipLogs.map(l => l.id),
          });
        }
      }
    } else if (rule.id === 'RULE-NET-004') {
      // Scanner user agents
      const scannerLogs = validLogs.filter(l => {
        const ua = (l.metadata?.userAgent || l.details || '').toLowerCase();
        return ua.includes('nikto') || ua.includes('sqlmap') || ua.includes('masscan') || l.eventType === 'HTTP_REQUEST_SCAN';
      });

      if (scannerLogs.length > 0) {
        matchedRuleIds.add(rule.id);
        const alertId = `ALT-GEN-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
        generatedAlerts.push({
          id: alertId,
          timestamp: scannerLogs[0].timestamp,
          ruleId: rule.id,
          ruleName: rule.name,
          description: `Vulnerability scanner signature detected in ${scannerLogs.length} request(s).`,
          sourceIp: scannerLogs[0].sourceIp,
          targetUser: 'anonymous',
          severity: rule.severity,
          confidence: 92,
          status: 'new',
          matchedCount: scannerLogs.length,
          firstSeen: scannerLogs[scannerLogs.length - 1]?.timestamp || scannerLogs[0].timestamp,
          lastSeen: scannerLogs[0].timestamp,
          evidence: scannerLogs.slice(0, 3).map(l => `${l.timestamp}: ${l.details}`),
          rawEventIds: scannerLogs.map(l => l.id),
        });
      }
    }
  }

  return {
    alerts: generatedAlerts,
    matchedRules: Array.from(matchedRuleIds),
    processedCount: validLogs.length,
  };
}
