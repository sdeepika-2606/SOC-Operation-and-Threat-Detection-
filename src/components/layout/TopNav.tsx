import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Shield,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Flame,
  User,
  LogOut,
  ExternalLink,
  Command,
  X,
} from 'lucide-react';
import { NavView } from './Sidebar';
import { SecurityAlert } from '../../types/security';

interface TopNavProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleMobileMenu: () => void;
  onGlobalSearch: (query: string) => void;
  alerts: SecurityAlert[];
}

export const TopNav: React.FC<TopNavProps> = ({
  currentView,
  onSelectView,
  theme,
  onToggleTheme,
  onToggleMobileMenu,
  onGlobalSearch,
  alerts,
}) => {
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const viewTitles: Record<NavView, { title: string; breadcrumb: string }> = {
    overview: { title: 'SOC Overview', breadcrumb: 'Operations / Overview Dashboard' },
    monitoring: { title: 'Security Monitoring', breadcrumb: 'Operations / Real-Time Telemetry' },
    logs: { title: 'Log Explorer', breadcrumb: 'Operations / Log Ingestion & Inspector' },
    threats: { title: 'Threat Detection Engine', breadcrumb: 'Triage & Response / Detection Engine' },
    alerts: { title: 'Alert Center', breadcrumb: 'Triage & Response / Alert Queue' },
    incidents: { title: 'Incident Management', breadcrumb: 'Triage & Response / Verified Incidents' },
    timeline: { title: 'Incident Timeline', breadcrumb: 'Triage & Response / Forensic Chronology' },
    communications: { title: 'Incident Communication Generator', breadcrumb: 'Triage & Response / Multi-Stakeholder Comms' },
    rules: { title: 'Detection Rules Catalog', breadcrumb: 'Engine & Auditing / Detection Rules' },
    validation: { title: 'Test & Validation Suite', breadcrumb: 'Engine & Auditing / Scenario Test Runner' },
    reports: { title: 'Reports & Analytics', breadcrumb: 'Engine & Auditing / Telemetry Reports' },
    settings: { title: 'Settings & API Config', breadcrumb: 'Engine & Auditing / Configuration' },
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onGlobalSearch(searchVal.trim());
    }
  };

  const currentInfo = viewTitles[currentView] || { title: 'Dashboard', breadcrumb: 'Mini-SOC' };
  const unreadAlerts = alerts.filter(a => a.status === 'new' || a.status === 'investigating').slice(0, 4);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 gap-3">
      {/* Left: Mobile trigger & Page Title / Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 focus:outline-hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 hidden sm:block truncate">
            {currentInfo.breadcrumb}
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
            {currentInfo.title}
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-56 lg:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search IP, alert, rule..."
            className="w-full pl-8 pr-12 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 font-mono transition-all"
          />
          {searchVal ? (
            <button
              type="button"
              onClick={() => setSearchVal('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex items-center gap-0.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-slate-400 bg-slate-200/60 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-300/40 dark:border-slate-700/60">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          )}
        </form>

        {/* Global Demo Indicator Pill */}
        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold font-mono"
          title="Operating in synthetic telemetry mode (RFC 5737 compliant). REST endpoints ready."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="whitespace-nowrap">SYNTHETIC DEMO</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            aria-label="View security notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[10px] font-mono font-bold text-white flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 z-40">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Active Alerts ({alerts.length})
                </span>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectView('alerts');
                  }}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                >
                  View All Alerts
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {unreadAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onSelectView('alerts');
                    }}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white font-mono truncate">
                        {alert.id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {alert.timestamp.slice(11, 19)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {alert.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span>IP: {alert.sourceIp}</span>
                      <span>·</span>
                      <span className="capitalize">{alert.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            aria-label="User account menu"
          >
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
              DC
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                D. Chen
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Tier-2 Lead
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 z-40">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  D. Chen (Analyst #841)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  SecOps Shift: EMEA Daylight
                </p>
              </div>

              <div className="mt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onSelectView('settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Security Clearance</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onSelectView('rules');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Rule Tuner Mode</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
