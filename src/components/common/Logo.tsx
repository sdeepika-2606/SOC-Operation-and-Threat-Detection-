import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 40 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Shield Outline with subtle cybersecurity gradient */}
          <path
            d="M20 2L3 8.5V20.5C3 31.5 10.4 41.2 20 43.5C29.6 41.2 37 31.5 37 20.5V8.5L20 2Z"
            className="fill-slate-900/90 dark:fill-slate-950 stroke-cyan-500/80 dark:stroke-cyan-400"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Internal Geometric Core Grid */}
          <path
            d="M20 6V40"
            className="stroke-cyan-500/20 dark:stroke-cyan-400/20"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          {/* Active Monitoring Pulse Wave */}
          <path
            d="M8 22H14L17 14L21 30L25 18L28 22H32"
            fill="none"
            className="stroke-cyan-400 dark:stroke-cyan-300"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Pulse Node Spark */}
          <circle cx="21" cy="30" r="1.8" className="fill-blue-400" />
          <circle cx="17" cy="14" r="1.8" className="fill-cyan-300" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Mini-SOC
            </span>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              v1.0
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[190px]">
            Threat Detection &amp; Comms
          </span>
        </div>
      )}
    </div>
  );
};
