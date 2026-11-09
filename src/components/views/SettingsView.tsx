import React, { useState } from 'react';
import {
  Settings,
  Server,
  Sun,
  Moon,
  Bell,
  Sliders,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  FileCode,
  Info,
} from 'lucide-react';
import { apiService, ApiStatus } from '../../services/api';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ theme, onToggleTheme }) => {
  const [apiUrl, setApiUrl] = useState(apiService.getBaseUrl());
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    connected: false,
    isDemoMode: true,
    endpointUrl: apiUrl,
    lastChecked: 'Just now',
    errorMessage: 'FastAPI backend unreachable at ' + apiUrl + '. Operating in Synthetic Demo Mode.',
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotifs, setBrowserNotifs] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingApi(true);
    apiService.setBaseUrl(apiUrl);
    const status = await apiService.checkHealth();
    setApiStatus(status);
    setIsTestingApi(false);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    apiService.setBaseUrl(apiUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const restEndpoints = [
    { method: 'GET', path: '/api/health', desc: 'Heartbeat & readiness check for Python backend' },
    { method: 'GET', path: '/api/logs', desc: 'Retrieve ingested telemetry records buffer' },
    { method: 'POST', path: '/api/logs/upload', desc: 'Ingest raw JSON log arrays for detection analysis' },
    { method: 'GET', path: '/api/alerts', desc: 'List active security alerts with confidence scores' },
    { method: 'GET', path: '/api/detections/rules', desc: 'Fetch configured MITRE ATT&CK detection rules' },
    { method: 'GET', path: '/api/incidents', desc: 'List verified security incidents and containment status' },
    { method: 'GET', path: '/api/incidents/{id}/timeline', desc: 'Chronological forensic event trace for an incident' },
    { method: 'POST', path: '/api/communications/generate', desc: 'Generate multi-stakeholder factual updates' },
    { method: 'GET', path: '/api/analytics/summary', desc: 'KPI aggregates (MTTD, MTTR, event volumes)' },
    { method: 'POST', path: '/api/reports/incident/pdf', desc: 'Compile 21-section incident audit PDF dossier via ReportLab' },
    { method: 'POST', path: '/api/reports/analytics/pdf', desc: 'Generate SOC telemetry & SLA audit PDF with 6 charts' },
    { method: 'GET', path: '/api/reports/{id}/download', desc: 'Download generated binary PDF artifact' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              System Settings &amp; API Integration
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              SYNTHETIC ENGINE MODE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure backend connection endpoints, theme preferences, and review FastAPI REST contracts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API & Backend Integration Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* FastAPI Connection Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Python FastAPI Backend Connection
                </h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  apiStatus.connected
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}
              >
                {apiStatus.connected ? 'CONNECTED (LIVE)' : 'DEMO MODE (SYNTHETIC)'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When disconnected, Mini-SOC operates seamlessly using its internal browser-side synthetic detection engine. Point to your local or hosted FastAPI service to stream real telemetry.
            </p>

            <form onSubmit={handleSavePreferences} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  API Base URL Endpoint:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:8000/api"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingApi}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium shrink-0 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingApi ? 'animate-spin' : ''}`} />
                    <span>{isTestingApi ? 'Checking...' : 'Test Connection'}</span>
                  </button>
                </div>
              </div>

              {/* Status Diagnostic Card */}
              <div
                className={`p-3 rounded-lg border text-xs ${
                  apiStatus.connected
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300'
                    : 'border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {apiStatus.connected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Info className="w-4 h-4 text-amber-500" />
                  )}
                  <span>{apiStatus.connected ? 'FastAPI Connected' : 'Operating in Standby Demo Mode'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {apiStatus.errorMessage || `Successfully connected to FastAPI backend. Latency: ${apiStatus.latencyMs}ms.`}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 text-xs font-semibold"
                >
                  Save API Configuration
                </button>
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Settings Saved!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* REST API Specification Table */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  FastAPI REST Endpoint Specification
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">FastAPI Ready</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Endpoint Path</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {restEndpoints.map((ep, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                        {ep.method}
                      </td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white font-semibold">
                        {ep.path}
                      </td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                        {ep.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences & Platform Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Appearance & Notification Preferences */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              User Experience Preferences
            </h3>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Interface Theme
                </span>
                <span className="text-[11px] text-slate-500">
                  Currently active: {theme === 'dark' ? 'Dark Mode (Charcoal/Cyan)' : 'Light Mode (Clean Slate)'}
                </span>
              </div>
              <button
                onClick={onToggleTheme}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 text-slate-800 dark:text-slate-200"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Audible Alert Chimes
                </span>
                <span className="text-[11px] text-slate-500">
                  Audio tone when critical P1 alerts trigger
                </span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
            </div>

            {/* Browser Notifications */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Browser Desktop Notifications
                </span>
                <span className="text-[11px] text-slate-500">
                  Notify on background breach detections
                </span>
              </div>
              <input
                type="checkbox"
                checked={browserNotifs}
                onChange={(e) => setBrowserNotifs(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Platform Identity & Architecture Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 font-sans">
              Platform Specifications
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Application:</span>
              <span className="font-bold text-slate-900 dark:text-white">Mini-SOC Enterprise Preview</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Version:</span>
              <span className="text-slate-800 dark:text-slate-200">v1.0.0-PROD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Dataset Standard:</span>
              <span className="text-cyan-600 dark:text-cyan-400">RFC 5737 Documentation IPs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Frontend Stack:</span>
              <span className="text-slate-800 dark:text-slate-200">React 19 + TypeScript + Tailwind v4</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Chart Engine:</span>
              <span className="text-slate-800 dark:text-slate-200">Recharts 2.x High-Density</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Backend Support:</span>
              <span className="text-emerald-600 dark:text-emerald-400">FastAPI RESTful Architecture</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
