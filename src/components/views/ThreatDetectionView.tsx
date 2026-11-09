import React, { useState } from 'react';
import {
  ShieldAlert,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
} from 'lucide-react';
import { DetectionRule, SecurityAlert } from '../../types/security';
import { SeverityBadge } from '../common/Badge';
import { Drawer } from '../common/Drawer';

interface ThreatDetectionViewProps {
  rules: DetectionRule[];
  alerts: SecurityAlert[];
  onUpdateRuleThreshold: (ruleId: string, count: number, windowMinutes: number) => void;
  onViewAlertsForRule: (ruleId: string) => void;
}

export const ThreatDetectionView: React.FC<ThreatDetectionViewProps> = ({
  rules,
  alerts,
  onUpdateRuleThreshold,
  onViewAlertsForRule,
}) => {
  const [selectedRule, setSelectedRule] = useState<DetectionRule | null>(null);
  const [editingThreshold, setEditingThreshold] = useState<{ count: number; windowMinutes: number } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleOpenRule = (rule: DetectionRule) => {
    setSelectedRule(rule);
    setEditingThreshold({ ...rule.threshold });
    setSaveSuccess(false);
  };

  const handleSaveThreshold = () => {
    if (selectedRule && editingThreshold) {
      onUpdateRuleThreshold(selectedRule.id, editingThreshold.count, editingThreshold.windowMinutes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informational Guidance Notice */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Active Threat Detection Engine
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
              5 RULES LOADED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rules continuously correlate telemetry windows. <strong>Important</strong>: Rule triggers represent <em>potential detections</em> which require investigation before escalating to a confirmed Security Incident.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Database className="w-4 h-4 text-cyan-500" />
          <span>FASTAPI READY: GET /api/detections/rules</span>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rules.map((rule) => {
          const matchedAlerts = alerts.filter((a) => a.ruleId === rule.id);

          return (
            <div
              key={rule.id}
              onClick={() => handleOpenRule(rule)}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Rule Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-cyan-400">
                      {rule.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                      {rule.name}
                    </h3>
                  </div>
                  <SeverityBadge severity={rule.severity} size="sm" />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {rule.description}
                </p>

                {/* Logic Summary Code Pill */}
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 mb-4">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                    Detection Logic:
                  </span>
                  <code className="text-[11px] font-mono text-slate-800 dark:text-cyan-300 block truncate">
                    {rule.logicSummary}
                  </code>
                </div>

                {/* MITRE ATT&CK Mapping */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono py-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span>MITRE ATT&amp;CK:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {rule.mitreId} ({rule.mitreTechnique})
                  </span>
                </div>
              </div>

              {/* Bottom Triggers & Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {rule.triggerCount + matchedAlerts.length}
                  </span>
                  <span className="text-slate-500">Triggers recorded</span>
                </div>

                <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  <span>Configure</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over Rule Detail Drawer */}
      {selectedRule && (
        <Drawer
          isOpen={!!selectedRule}
          onClose={() => setSelectedRule(null)}
          title={selectedRule.name}
          subtitle={`Rule Definition & Threshold Tuner (${selectedRule.id})`}
          width="xl"
        >
          <div className="space-y-6">
            {/* Rule Header Metadata */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rule ID:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedRule.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Severity:</span>
                <SeverityBadge severity={selectedRule.severity} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">MITRE Technique:</span>
                <span className="text-slate-900 dark:text-white">{selectedRule.mitreId} - {selectedRule.mitreTechnique}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total System Triggers:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{selectedRule.triggerCount}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Rule Operational Objective
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedRule.description}
              </p>
            </div>

            {/* Threshold Configuration Controls */}
            {editingThreshold && (
              <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Correlation Threshold Tuning
                    </h4>
                  </div>
                  {saveSuccess && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Threshold Updated!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1">
                      Event Match Count:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={editingThreshold.count}
                      onChange={(e) =>
                        setEditingThreshold({
                          ...editingThreshold,
                          count: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1">
                      Sliding Window (Minutes):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={editingThreshold.windowMinutes}
                      onChange={(e) =>
                        setEditingThreshold({
                          ...editingThreshold,
                          windowMinutes: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveThreshold}
                  className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold transition-colors"
                >
                  Apply &amp; Re-evaluate Live Buffer
                </button>
              </div>
            )}

            {/* Matched Alerts for this Rule */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Alerts Fired by this Rule
                </h4>
                <button
                  onClick={() => {
                    setSelectedRule(null);
                    onViewAlertsForRule(selectedRule.id);
                  }}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>View in Alert Center</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {alerts
                  .filter((a) => a.ruleId === selectedRule.id)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">{alert.id}</span>
                        <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Source: {alert.sourceIp}</span>
                        <span>Confidence: {alert.confidence}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
