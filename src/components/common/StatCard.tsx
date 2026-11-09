import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    period?: string;
  };
  accentColor?: 'cyan' | 'red' | 'orange' | 'amber' | 'blue' | 'emerald';
  sublabel?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  accentColor = 'cyan',
  sublabel,
  onClick,
}) => {
  const accentClasses = {
    cyan: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    red: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-4 sm:p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-all duration-200 flex flex-col justify-between min-w-0 ${
        onClick
          ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md active:scale-[0.99]'
          : ''
      }`}
    >
      <div>
        {/* Top row: Label and Icon */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase truncate"
            title={label}
          >
            {label}
          </span>
          <div className={`w-8 h-8 rounded-lg border shrink-0 flex items-center justify-center ${accentClasses[accentColor]}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Value and Sublabel */}
        <div className="mt-2.5">
          <div className="text-2xl sm:text-[26px] font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 tabular-nums leading-none truncate">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {sublabel && (
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
              {sublabel}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Trend Row (Clean & no repeated 'SYNTHETIC' clutter) */}
      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] font-mono min-w-0">
          <div className="shrink-0 flex items-center">
            {trend.isNeutral ? (
              <Minus className="w-3 h-3 text-slate-400" />
            ) : trend.isPositive ? (
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
          </div>
          <span
            className={`font-semibold shrink-0 ${
              trend.isNeutral
                ? 'text-slate-600 dark:text-slate-400'
                : trend.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {trend.value}
          </span>
          {trend.period && (
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {trend.period}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
