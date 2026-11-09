import React, { useState, useRef } from 'react';
import {
  Upload,
  Search,
  Download,
  Filter,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { SecurityLog } from '../../types/security';
import { SeverityBadge } from '../common/Badge';

interface LogExplorerViewProps {
  logs: SecurityLog[];
  onUploadLogs: (newLogs: SecurityLog[]) => void;
  onSelectLog: (log: SecurityLog) => void;
}

export const LogExplorerView: React.FC<LogExplorerViewProps> = ({
  logs,
  onUploadLogs,
  onSelectLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.sourceIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user && log.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;

    return matchesSearch && matchesSeverity && matchesAction;
  });

  const handleCopyJson = (log: SecurityLog, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const logArray: any[] = Array.isArray(parsed) ? parsed : [parsed];

        // Normalize uploaded logs
        const validLogs: SecurityLog[] = logArray.map((item, idx) => ({
          id: item.id || `UPLOAD-${Date.now()}-${idx}`,
          timestamp: item.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          sourceIp: item.sourceIp || item.ip || item.client_ip || '198.51.100.1',
          destinationIp: item.destinationIp || item.dest_ip,
          user: item.user || item.username || item.account,
          eventType: item.eventType || item.event_type || 'INGESTED_EVENT',
          category: item.category || 'authentication',
          severity: item.severity || 'medium',
          action: item.action || (item.status === 'success' ? 'SUCCESS' : 'FAILURE'),
          details: item.details || item.message || JSON.stringify(item),
          metadata: item.metadata || {},
          rawJson: JSON.stringify(item, null, 2),
        }));

        onUploadLogs(validLogs);
        setUploadSuccess(`Successfully parsed and ingested ${validLogs.length} security log entries.`);
      } catch (err: any) {
        setUploadError(`Failed to parse JSON file: ${err.message}. Please upload valid JSON array.`);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mini-soc-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const headers = ['id', 'timestamp', 'sourceIp', 'user', 'eventType', 'category', 'severity', 'action', 'details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.sourceIp}"`,
      `"${l.user || ''}"`,
      `"${l.eventType}"`,
      `"${l.category}"`,
      `"${l.severity}"`,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mini-soc-logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Preset injector for demo testing
  const handleInjectSampleAttack = () => {
    const attackLogs: SecurityLog[] = [
      {
        id: `LOG-ATTACK-${Date.now()}-1`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        sourceIp: '198.51.100.99',
        destinationIp: '192.0.2.10',
        user: 'root',
        eventType: 'AUTH_FAILURE',
        category: 'authentication',
        severity: 'high',
        action: 'FAILURE',
        details: 'Simulated brute-force attack probe #1',
      },
      {
        id: `LOG-ATTACK-${Date.now()}-2`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        sourceIp: '198.51.100.99',
        destinationIp: '192.0.2.10',
        user: 'admin',
        eventType: 'AUTH_FAILURE',
        category: 'authentication',
        severity: 'high',
        action: 'FAILURE',
        details: 'Simulated brute-force attack probe #2',
      },
      {
        id: `LOG-ATTACK-${Date.now()}-3`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        sourceIp: '198.51.100.99',
        destinationIp: '192.0.2.10',
        user: 'operator',
        eventType: 'AUTH_FAILURE',
        category: 'authentication',
        severity: 'high',
        action: 'FAILURE',
        details: 'Simulated brute-force attack probe #3',
      },
      {
        id: `LOG-ATTACK-${Date.now()}-4`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        sourceIp: '198.51.100.99',
        destinationIp: '192.0.2.10',
        user: 'svc-deploy',
        eventType: 'AUTH_FAILURE',
        category: 'authentication',
        severity: 'high',
        action: 'FAILURE',
        details: 'Simulated brute-force attack probe #4',
      },
      {
        id: `LOG-ATTACK-${Date.now()}-5`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        sourceIp: '198.51.100.99',
        destinationIp: '192.0.2.10',
        user: 'svc-deploy',
        eventType: 'AUTH_SUCCESS',
        category: 'authentication',
        severity: 'critical',
        action: 'SUCCESS',
        details: 'Simulated breach: Successful login after failures sequence',
      },
    ];

    onUploadLogs(attackLogs);
    setUploadSuccess('Injected 5 attack probe logs from 198.51.100.99. Check Alert Center for new detections!');
  };

  return (
    <div className="space-y-6">
      {/* Upload & Drag-and-drop workspace */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`p-6 rounded-xl border-2 border-dashed transition-all text-center ${
          dragOver
            ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-950/20'
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          accept=".json,application/json"
          className="hidden"
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Upload JSON Security Logs
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Drag and drop JSON log array here, or click to browse. Logs will be analyzed through the detection engine in real time.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 text-xs font-semibold transition-colors"
            >
              Select JSON File
            </button>
            <button
              onClick={handleInjectSampleAttack}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-500" />
              <span>Inject Sample Attack Burst</span>
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-center gap-2 max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center gap-2 max-w-lg mx-auto">
            <Check className="w-4 h-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by IP, user, event type, or details..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Severity & Action Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-mono"
          >
            <option value="all">Severity: All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info / Normal</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-mono"
          >
            <option value="all">Action: All</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
            <option value="BLOCKED">Blocked</option>
            <option value="SUSPICIOUS">Suspicious</option>
          </select>

          {/* Export Buttons */}
          <div className="flex items-center gap-1 border-l pl-2 border-slate-200 dark:border-slate-800">
            <button
              onClick={handleExportJson}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono flex items-center gap-1"
              title="Download Filtered Logs as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono flex items-center gap-1"
              title="Download Filtered Logs as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Log Table with Expandable Row JSON Inspection */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>SHOWING {filteredLogs.length} OF {logs.length} RECORDED LOGS</span>
          <span>RFC 5737 SYNTHETIC COMPLIANT</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              No matching log records found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or upload a new JSON log batch to populate the telemetry index.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono min-w-[760px]">
              <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Log ID</th>
                  <th className="py-2.5 px-3">Source IP</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3 text-right">Raw JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-slate-50/80 dark:bg-slate-800/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-semibold whitespace-nowrap">
                          {log.id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-cyan-300 whitespace-nowrap">
                          {log.sourceIp}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {log.user || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {log.eventType}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <SeverityBadge severity={log.severity} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`font-bold text-[11px] ${
                              log.action === 'SUCCESS'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : log.action === 'FAILURE'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => handleCopyJson(log, e)}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Copy Raw Log JSON"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Detail Box */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-950/50">
                          <td colSpan={9} className="p-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  Structured Event Details:
                                </span>
                                <button
                                  onClick={(e) => handleCopyJson(log, e)}
                                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{copiedId === log.id ? 'Copied' : 'Copy JSON'}</span>
                                </button>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {log.details}
                              </p>
                              <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] overflow-x-auto border border-slate-800">
                                {JSON.stringify(log, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
