import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  Zap,
  ArrowUpRight,
  Eye,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '../common/StatCard';
import { SeverityBadge } from '../common/Badge';
import { SecurityLog, SecurityAlert, SecurityIncident } from '../../types/security';
import { NavView } from '../layout/Sidebar';

interface OverviewViewProps {
  logs: SecurityLog[];
  alerts: SecurityAlert[];
  incidents: SecurityIncident[];
  theme?: 'light' | 'dark';
  onSelectView: (view: NavView) => void;
  onSelectLog: (log: SecurityLog) => void;
  onSelectAlert: (alert: SecurityAlert) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  logs,
  alerts,
  incidents,
  theme = 'dark',
  onSelectView,
  onSelectLog,
  onSelectAlert,
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const isDark = theme === 'dark';

  // Realistic synthetic timeline data for Line/Area chart
  const timelineData24h = [
    { time: '00:00', normal: 4200, failed: 24, suspicious: 4 },
    { time: '03:00', normal: 3800, failed: 18, suspicious: 2 },
    { time: '06:00', normal: 5400, failed: 45, suspicious: 7 },
    { time: '09:00', normal: 9200, failed: 89, suspicious: 14 },
    { time: '12:00', normal: 11400, failed: 112, suspicious: 22 },
    { time: '15:00', normal: 10800, failed: 95, suspicious: 18 },
    { time: '18:00', normal: 7600, failed: 64, suspicious: 12 },
    { time: '21:00', normal: 5900, failed: 82, suspicious: 31 },
  ];

  const timelineData7d = [
    { time: 'Mon', normal: 42000, failed: 310, suspicious: 42 },
    { time: 'Tue', normal: 45000, failed: 280, suspicious: 36 },
    { time: 'Wed', normal: 48000, failed: 340, suspicious: 51 },
    { time: 'Thu', normal: 51000, failed: 410, suspicious: 68 },
    { time: 'Fri', normal: 49000, failed: 390, suspicious: 54 },
    { time: 'Sat', normal: 28000, failed: 190, suspicious: 29 },
    { time: 'Sun', normal: 26000, failed: 230, suspicious: 35 },
  ];

  const timelineData30d = [
    { time: 'W1', normal: 182000, failed: 1420, suspicious: 210 },
    { time: 'W2', normal: 195000, failed: 1530, suspicious: 240 },
    { time: 'W3', normal: 210000, failed: 1890, suspicious: 310 },
    { time: 'W4', normal: 198000, failed: 1640, suspicious: 280 },
  ];

  const activeTimelineData =
    timeRange === '24h' ? timelineData24h : timeRange === '7d' ? timelineData7d : timelineData30d;

  // Alerts by Severity
  const severityData = [
    { name: 'Critical', count: alerts.filter(a => a.severity === 'critical').length || 3, fill: '#ef4444' },
    { name: 'High', count: alerts.filter(a => a.severity === 'high').length || 7, fill: '#f97316' },
    { name: 'Medium', count: alerts.filter(a => a.severity === 'medium').length || 18, fill: '#f59e0b' },
    { name: 'Low', count: alerts.filter(a => a.severity === 'low').length || 10, fill: '#3b82f6' },
  ];

  // Event Distribution Donut Data
  const distributionData = [
    { name: 'Authentication', value: 58, count: '86,373', color: '#3b82f6' },
    { name: 'Network Netflow', value: 24, count: '35,740', color: '#06b6d4' },
    { name: 'System Audits', value: 12, count: '17,870', color: '#10b981' },
    { name: 'Suspicious / Anomaly', value: 6, count: '8,937', color: '#f59e0b' },
  ];

  // Top Detection Categories Horizontal Bar
  const detectionCategoryData = [
    { category: 'Brute-Force & Spray', count: 42 },
    { category: 'Compromised Auth', count: 28 },
    { category: 'Vulnerability Probes', count: 19 },
    { category: 'Privilege Escalation', count: 7 },
    { category: 'Anomalous Headers', count: 12 },
  ];

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;
  const activeIncidentsCount = incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved').length;

  // Chart styling colors based on current theme
  const chartGridColor = isDark ? '#1e293b' : '#e2e8f0';
  const chartTextColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)';
  const tooltipBorder = isDark ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(226, 232, 240, 1)';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="space-y-6">
      {/* Global Synthetic Demo Notice Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-800 dark:text-cyan-200">
          <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
          <span>
            <strong>Demonstration Platform</strong>: Operating on synthetic security telemetry (RFC 5737 compliant). All logs, alerts, and incident timelines are verified benchmark test data.
          </span>
        </div>
        <button
          onClick={() => onSelectView('communications')}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
        >
          <span>Open Comms Generator</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          label="Events Analyzed"
          value={148920}
          icon={Layers}
          accentColor="cyan"
          trend={{ value: '+14.2%', isPositive: true, period: 'vs 24h' }}
        />
        <StatCard
          label="Security Alerts"
          value={alerts.length}
          icon={ShieldAlert}
          accentColor="amber"
          trend={{ value: '+3 new', isNeutral: true, period: 'this shift' }}
          onClick={() => onSelectView('alerts')}
        />
        <StatCard
          label="Critical Alerts"
          value={criticalCount}
          icon={Flame}
          accentColor="red"
          trend={{ value: 'P1 SLA', isPositive: false, period: 'triage req.' }}
          onClick={() => onSelectView('alerts')}
        />
        <StatCard
          label="High Severity"
          value={highCount}
          icon={AlertTriangle}
          accentColor="orange"
          trend={{ value: '2 active', isNeutral: true, period: 'assigned' }}
          onClick={() => onSelectView('alerts')}
        />
        <StatCard
          label="Active Incidents"
          value={activeIncidentsCount}
          icon={Zap}
          accentColor="red"
          sublabel="INC-2026-001"
          trend={{ value: 'Contained', isPositive: true, period: 'in progress' }}
          onClick={() => onSelectView('incidents')}
        />
        <StatCard
          label="Detection Rate"
          value="99.4%"
          icon={Activity}
          accentColor="emerald"
          sublabel="MTTD 1.8m"
          trend={{ value: 'Zero miss', isPositive: true, period: 'validated' }}
          onClick={() => onSelectView('validation')}
        />
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* A. Line/Area Chart – Security Events Over Time */}
        <div className="lg:col-span-8 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Security Events Over Time
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Baseline ingestion volume vs. failed logins and anomalous activity
              </p>
            </div>

            {/* Time Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 self-start sm:self-auto">
              {(['24h', '7d', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                    timeRange === r
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72 mt-3 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="suspGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: chartTextColor }} stroke={chartGridColor} className="font-mono" />
                <YAxis
                  tick={{ fontSize: 11, fill: chartTextColor }}
                  stroke={chartGridColor}
                  className="font-mono"
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: tooltipBorder,
                    borderRadius: '8px',
                    color: tooltipText,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="normal" name="Normal Events" stroke="#3b82f6" strokeWidth={1.8} fillOpacity={1} fill="url(#normalGrad)" />
                <Area type="monotone" dataKey="failed" name="Failed Logins" stroke="#f59e0b" strokeWidth={1.8} fillOpacity={1} fill="url(#failGrad)" />
                <Area type="monotone" dataKey="suspicious" name="Suspicious Activity" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#suspGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B. Bar Chart – Alerts by Severity */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Alerts by Severity
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Active queues grouped across SOC risk tiers
            </p>
          </div>

          <div className="h-64 sm:h-72 mt-3 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTextColor }} stroke={chartGridColor} className="font-mono" />
                <YAxis tick={{ fontSize: 11, fill: chartTextColor }} stroke={chartGridColor} className="font-mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: tooltipBorder,
                    borderRadius: '8px',
                    color: tooltipText,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="count" name="Alert Count" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* C. Professional Donut Chart – Event Distribution */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Event Ingestion Distribution
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Breakdown across monitored telemetry categories
            </p>
          </div>

          <div className="h-60 sm:h-64 mt-2 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#0f172a' : '#ffffff'} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [`${val}% (${item.payload.count})`, 'Volume']}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: tooltipBorder,
                    borderRadius: '8px',
                    color: tooltipText,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Metric Callout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white leading-none">
                148.9k
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mt-1">
                Total Events
              </span>
            </div>
          </div>

          {/* Clean Segmented Legend */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-mono">
            {distributionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between pr-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300 truncate text-[11px]">{item.name}</span>
                </div>
                <span className="text-slate-500 font-bold shrink-0 text-[11px]">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* D. Horizontal Bar Chart – Top Detection Categories */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Top Threat Detection Categories
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Cumulative rule triggers mapped to MITRE ATT&amp;CK techniques
            </p>
          </div>

          <div className="h-64 sm:h-72 mt-3 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={detectionCategoryData}
                margin={{ top: 10, right: 25, left: 120, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: chartTextColor }} stroke={chartGridColor} className="font-mono" />
                <YAxis
                  dataKey="category"
                  type="category"
                  tick={{ fontSize: 11, fill: chartTextColor }}
                  stroke={chartGridColor}
                  className="font-medium"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: tooltipBorder,
                    borderRadius: '8px',
                    color: tooltipText,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="count" name="Triggers" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* E. Recent Security Events Table */}
      <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Recent Security Events
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live telemetry stream with RFC 5737 source attribution and severity
            </p>
          </div>
          <button
            onClick={() => onSelectView('logs')}
            className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open in Log Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 uppercase tracking-wider text-[10px] font-mono border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">User / Target</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {logs.slice(0, 7).map((log) => (
                <tr
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-cyan-300 whitespace-nowrap">
                    {log.sourceIp}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                    {log.eventType}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                    {log.user || '—'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <SeverityBadge severity={log.severity} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[11px] font-bold ${
                        log.action === 'SUCCESS'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : log.action === 'FAILURE'
                          ? 'text-red-600 dark:text-red-400'
                          : log.action === 'BLOCKED'
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLog(log);
                      }}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="Inspect log JSON"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
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
