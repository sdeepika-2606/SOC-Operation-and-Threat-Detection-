import React from 'react';
import {
  LayoutDashboard,
  Activity,
  FileText,
  ShieldAlert,
  BellRing,
  AlertOctagon,
  GitCommit,
  Radio,
  Sliders,
  FlaskConical,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { LucideIcon } from 'lucide-react';

export type NavView =
  | 'overview'
  | 'monitoring'
  | 'logs'
  | 'threats'
  | 'alerts'
  | 'incidents'
  | 'timeline'
  | 'communications'
  | 'rules'
  | 'validation'
  | 'reports'
  | 'settings';

interface NavItem {
  id: NavView;
  label: string;
  icon: LucideIcon;
  badge?: string;
  count?: number;
  alert?: boolean;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  alertCount?: number;
  incidentCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  alertCount = 38,
  incidentCount = 2,
}) => {
  const navSections: NavSection[] = [
    {
      title: 'Operations',
      items: [
        { id: 'overview' as NavView, label: 'Overview', icon: LayoutDashboard },
        { id: 'monitoring' as NavView, label: 'Security Monitoring', icon: Activity, badge: 'LIVE' },
        { id: 'logs' as NavView, label: 'Log Explorer', icon: FileText },
      ],
    },
    {
      title: 'Triage & Response',
      items: [
        { id: 'threats' as NavView, label: 'Threat Detection', icon: ShieldAlert },
        { id: 'alerts' as NavView, label: 'Alert Center', icon: BellRing, count: alertCount },
        { id: 'incidents' as NavView, label: 'Incident Management', icon: AlertOctagon, count: incidentCount, alert: true },
        { id: 'timeline' as NavView, label: 'Incident Timeline', icon: GitCommit },
        { id: 'communications' as NavView, label: 'Communication Generator', icon: Radio, highlight: true },
      ],
    },
    {
      title: 'Engine & Auditing',
      items: [
        { id: 'rules' as NavView, label: 'Detection Rules', icon: Sliders },
        { id: 'validation' as NavView, label: 'Test & Validation', icon: FlaskConical },
        { id: 'reports' as NavView, label: 'Reports & Analytics', icon: BarChart3 },
        { id: 'settings' as NavView, label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <Logo size="md" showText={!collapsed} />
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-cyan-500/15 dark:text-cyan-300 dark:border dark:border-cyan-500/30 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-white dark:text-cyan-400'
                        : item.highlight
                        ? 'text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                    }`}
                  />

                  {!collapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {!collapsed && item.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.alert
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}

                  {!collapsed && item.highlight && !item.count && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                      CORE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Security Status Badge */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div
          className={`p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 flex items-center ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
        >
          <div className="relative shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  Engine Active
                </span>
                <span className="text-[9px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
                  Demo
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                FastAPI: Standby Mode
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
