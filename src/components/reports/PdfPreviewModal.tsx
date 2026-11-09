import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  Layers,
  ChevronDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import {
  SecurityIncident,
  SecurityAlert,
  SecurityLog,
  TimelineEvent,
  DetectionRule,
} from '../../types/security';
import { IncidentPdfReportView } from './IncidentPdfReportView';
import { AnalyticsPdfReportView } from './AnalyticsPdfReportView';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'incident' | 'analytics';
  selectedIncidentId?: string;
  incidents: SecurityIncident[];
  alerts: SecurityAlert[];
  logs: SecurityLog[];
  timelineEvents: TimelineEvent[];
  rules: DetectionRule[];
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  initialType = 'incident',
  selectedIncidentId,
  incidents,
  alerts,
  logs,
  timelineEvents,
  rules,
}) => {
  const [reportType, setReportType] = useState<'incident' | 'analytics'>(initialType);
  const [activeIncidentId, setActiveIncidentId] = useState<string>(
    selectedIncidentId || (incidents.length > 0 ? incidents[0].id : '')
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedIncidentId) {
      setActiveIncidentId(selectedIncidentId);
    } else if (incidents.length > 0 && !incidents.some(i => i.id === activeIncidentId)) {
      setActiveIncidentId(incidents[0].id);
    }
  }, [selectedIncidentId, incidents, isOpen]);

  React.useEffect(() => {
    if (initialType) {
      setReportType(initialType);
    }
  }, [initialType, isOpen]);

  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const activeIncident = incidents.find((i) => i.id === activeIncidentId) || incidents[0];

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(150, Math.max(50, prev + delta)));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printContainerRef.current) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setDownloadSuccess(null);
    setGenerationProgress('Preparing document layout...');

    try {
      const pageElements = printContainerRef.current.querySelectorAll<HTMLElement>('.pdf-page');
      if (pageElements.length === 0) {
        throw new Error('No report pages found in DOM to generate PDF.');
      }

      // Initialize jsPDF in A4 portrait: 210mm x 297mm
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const totalPages = pageElements.length;

      for (let i = 0; i < totalPages; i++) {
        const pageEl = pageElements[i];
        setGenerationProgress(`Rendering high-DPI page ${i + 1} of ${totalPages}...`);

        // Capture canvas with 2x scale for crisp text and graphics
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1024,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = 210;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage('a4', 'p');
        }

        // Add page image scaled precisely to A4 width
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(297, pdfHeight));
      }

      setGenerationProgress('Packaging PDF binary...');
      const fileName =
        reportType === 'incident' && activeIncident
          ? `Mini-SOC_Investigation_Report_${activeIncident.id}.pdf`
          : `Mini-SOC_Analytics_Executive_Report_${Date.now()}.pdf`;

      pdf.save(fileName);
      setDownloadSuccess(`Successfully downloaded ${fileName}`);
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setErrorMessage(
        err?.message || 'Failed to render PDF document. Please try native Print -> Save as PDF.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Title & Mode Selection */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wide">
                  Professional PDF Report Generator
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                  A4 FORMAT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Interactive preview with vector print &amp; high-fidelity client-side PDF compiler
              </p>
            </div>
          </div>

          {/* Report Type Selector & Incident Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setReportType('incident')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  reportType === 'incident'
                    ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Incident Dossier
              </button>
              <button
                type="button"
                onClick={() => setReportType('analytics')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  reportType === 'analytics'
                    ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                SOC Analytics
              </button>
            </div>

            {reportType === 'incident' && (
              <div className="relative">
                <select
                  value={activeIncidentId}
                  onChange={(e) => setActiveIncidentId(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                >
                  {incidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      {inc.id} ({inc.severity.toUpperCase()})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            )}
          </div>

          {/* Action Buttons: Zoom, Print, Download, Close */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5 text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => handleZoom(-15)}
                disabled={zoomLevel <= 50}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded disabled:opacity-30"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono font-medium">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => handleZoom(15)}
                disabled={zoomLevel >= 150}
                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded disabled:opacity-30"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Print directly or save via browser vector PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Vector PDF</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .PDF</span>
                </>
              )}
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status / Progress Banner */}
        {isGenerating && (
          <div className="px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-mono flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{generationProgress || 'Compiling report into downloadable PDF file...'}</span>
          </div>
        )}

        {downloadSuccess && (
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Preview Canvas with Zoom Scaling */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-200/70 dark:bg-slate-950/70 flex justify-center">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full max-w-[850px] shadow-2xl rounded-sm overflow-hidden"
          >
            <div ref={printContainerRef} className="bg-white">
              {reportType === 'incident' && activeIncident ? (
                <IncidentPdfReportView
                  incident={activeIncident}
                  alerts={alerts}
                  logs={logs}
                  timelineEvents={timelineEvents}
                  rules={rules}
                />
              ) : (
                <AnalyticsPdfReportView
                  alerts={alerts}
                  incidents={incidents}
                  logs={logs}
                  rules={rules}
                />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Metadata Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 text-[11px] font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            <span>Mini-SOC Document Generator</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>
              {reportType === 'incident'
                ? `Incident: ${activeIncident?.id || 'N/A'}`
                : 'SOC Executive Telemetry & SLA Report'}
            </span>
          </div>
          <div>
            <span>Format: ISO 216 A4 (210×297mm) • 300 DPI Rendering</span>
          </div>
        </div>
      </div>
    </div>
  );
};
