import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  FileCode,
  Tag,
  Clock,
  Search,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { DetectionRule } from '../../types/security';
import { SeverityBadge } from '../common/Badge';

interface DetectionRulesViewProps {
  rules: DetectionRule[];
  onUpdateRuleThreshold: (ruleId: string, count: number, windowMinutes: number) => void;
}

export const DetectionRulesView: React.FC<DetectionRulesViewProps> = ({
  rules,
  onUpdateRuleThreshold,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.mitreId.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = activeCategory === 'all' || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Detection Rules Catalog &amp; Logic Specification
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
              MITRE ATT&amp;CK COMPLIANT
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rule schemas, sliding window expressions, and correlation criteria applied across incoming log streams.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>Engine Status: Active</span>
        </div>
      </div>

      {/* Rules Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rule definitions by name, ID, or MITRE technique..."
            className="w-full sm:max-w-md px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400"
          />

          <div className="text-xs font-mono text-slate-500">
            {filteredRules.length} rules matching
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Rule ID</th>
                <th className="py-3 px-4">Rule Name &amp; Description</th>
                <th className="py-3 px-4">MITRE Technique</th>
                <th className="py-3 px-4">Threshold Window</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Triggers</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-cyan-400 whitespace-nowrap">
                    {rule.id}
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="font-bold text-slate-900 dark:text-white mb-0.5">{rule.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {rule.description}
                    </p>
                    <code className="text-[10px] text-cyan-700 dark:text-cyan-300 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                      {rule.logicSummary}
                    </code>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {rule.mitreId}
                    </span>
                    <span className="text-[11px] text-slate-500">{rule.mitreTechnique}</span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      &gt;= {rule.threshold.count} events
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      within {rule.threshold.windowMinutes}m
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <SeverityBadge severity={rule.severity} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                    {rule.triggerCount}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>ACTIVE</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
