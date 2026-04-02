import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface KpiCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color, className }) => {
  return (
    <div className={cn("bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md", className)}>
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</h3>
      </div>
    </div>
  );
};
