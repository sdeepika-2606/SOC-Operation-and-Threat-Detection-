import React from 'react';
import { SeverityLevel, AlertStatus, IncidentStatus } from '../../types/security';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const configs: Record<SeverityLevel, { bg: string; text: string; border: string; label: string }> = {
    critical: {
      bg: 'bg-red-500/10 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-500/30 dark:border-red-800/60',
      label: 'CRITICAL',
    },
    high: {
      bg: 'bg-orange-500/10 dark:bg-orange-950/40',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-500/30 dark:border-orange-800/60',
      label: 'HIGH',
    },
    medium: {
      bg: 'bg-amber-500/10 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30 dark:border-amber-800/60',
      label: 'MEDIUM',
    },
    low: {
      bg: 'bg-blue-500/10 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-500/30 dark:border-blue-800/60',
      label: 'LOW',
    },
    info: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30 dark:border-emerald-800/60',
      label: 'NORMAL',
    },
  };

  const c = configs[severity] || configs.info;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold tracking-wider rounded border ${c.bg} ${c.text} ${c.border} ${sizeClasses} whitespace-nowrap`}
    >
      {c.label}
    </span>
  );
};

interface StatusBadgeProps {
  status: AlertStatus | IncidentStatus | 'confirmed' | 'suspected';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<string, { bg: string; text: string; border: string; label: string }> = {
    new: {
      bg: 'bg-cyan-500/10 dark:bg-cyan-950/40',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-500/30',
      label: 'NEW',
    },
    acknowledged: {
      bg: 'bg-slate-500/10 dark:bg-slate-800/50',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-400/30 dark:border-slate-700',
      label: 'ACKNOWLEDGED',
    },
    investigating: {
      bg: 'bg-amber-500/10 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30',
      label: 'INVESTIGATING',
    },
    resolved: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      label: 'RESOLVED',
    },
    dismissed: {
      bg: 'bg-slate-500/10 dark:bg-slate-800/30',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-500/20',
      label: 'DISMISSED',
    },
    active: {
      bg: 'bg-red-500/10 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-500/30',
      label: 'ACTIVE',
    },
    triaging: {
      bg: 'bg-orange-500/10 dark:bg-orange-950/40',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-500/30',
      label: 'TRIAGING',
    },
    contained: {
      bg: 'bg-purple-500/10 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-500/30',
      label: 'CONTAINED',
    },
    closed: {
      bg: 'bg-slate-500/10 dark:bg-slate-800/50',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-500/20',
      label: 'CLOSED',
    },
    confirmed: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      label: 'VERIFIED',
    },
    suspected: {
      bg: 'bg-amber-500/10 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30',
      label: 'SUSPECTED',
    },
  };

  const c = configs[status] || configs.new;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium tracking-wide rounded border ${c.bg} ${c.text} ${c.border} ${sizeClasses} whitespace-nowrap`}
    >
      {c.label}
    </span>
  );
};
