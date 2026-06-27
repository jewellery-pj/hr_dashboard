import React from 'react';
import { LucideIcon } from 'lucide-react';

type HeaderGradient = 'indigo' | 'rose' | 'orange' | 'emerald' | 'purple' | 'amber';

const GRADIENTS: Record<HeaderGradient, string> = {
  indigo: 'from-slate-900 via-indigo-900 to-slate-800',
  rose: 'from-slate-900 via-rose-900 to-slate-800',
  orange: 'from-slate-900 via-orange-900 to-slate-800',
  emerald: 'from-slate-900 via-emerald-900 to-slate-800',
  purple: 'from-slate-900 via-purple-900 to-slate-800',
  amber: 'from-slate-900 via-amber-900 to-slate-800',
};

export interface MetricPill {
  value: string | number;
  label: string;
  accentClass?: string;
}

export function OperationalShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6 animate-in fade-in duration-500">{children}</div>;
}

export function OperationalHeader({
  eyebrow,
  title,
  subtitle,
  metrics,
  gradient = 'indigo',
  alert,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  metrics: MetricPill[];
  gradient?: HeaderGradient;
  alert?: React.ReactNode;
}) {
  return (
    <div className={`bg-gradient-to-br ${GRADIENTS[gradient]} rounded-2xl p-6 md:p-8 text-white shadow-xl`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">{eyebrow}</p>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-white/60 mt-2">{subtitle}</p>}
        </div>
        {metrics.length > 0 && (
          <div className={`grid gap-2 flex-shrink-0 ${metrics.length >= 4 ? 'grid-cols-2 sm:grid-cols-4' : `grid-cols-${Math.min(metrics.length, 3)}`}`} style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, minmax(0, 1fr))` }}>
            {metrics.map(m => (
              <div key={m.label} className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center min-w-[88px]">
                <p className={`text-2xl font-black tabular-nums ${m.accentClass || ''}`}>{m.value}</p>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wide mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {alert && <div className="mt-5">{alert}</div>}
    </div>
  );
}

export function OperationalAlert({ children, tone = 'rose' }: { children: React.ReactNode; tone?: 'rose' | 'amber' | 'indigo' }) {
  const tones = {
    rose: 'bg-rose-500/25 border-rose-400/30 text-rose-100',
    amber: 'bg-amber-500/25 border-amber-400/30 text-amber-100',
    indigo: 'bg-indigo-500/25 border-indigo-400/30 text-indigo-100',
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function OperationalSection({
  title,
  subtitle,
  icon: Icon,
  children,
  headerAction,
  className = '',
  bodyClassName = 'p-6',
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />}
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        {headerAction}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

export function OperationalFilters({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">{children}</div>
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">{label}</label>
      {children}
    </div>
  );
}

export const filterSelectClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

export const filterInputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

export function OperationalTableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto -mx-6 px-6">{children}</div>;
}

export function OperationalTable({ children }: { children: React.ReactNode }) {
  return <table className="w-full">{children}</table>;
}

export function OperationalThead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-slate-200">{children}</tr>
    </thead>
  );
}

export function OperationalTh({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th className={`px-4 py-3 ${alignClass} text-[11px] font-bold text-slate-400 uppercase tracking-widest`}>
      {children}
    </th>
  );
}

export function OperationalOwnership({ items }: { items: { icon?: LucideIcon; label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-2 text-xs text-slate-500">
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1.5">
          {item.icon && <item.icon className="w-3.5 h-3.5" />}
          <strong className="text-slate-700">{item.label}:</strong> {item.value}
        </span>
      ))}
    </div>
  );
}
