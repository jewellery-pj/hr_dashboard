import React, { useMemo, useState } from 'react';
import {
  Users,
  TrendingDown,
  ShieldCheck,
  UserPlus,
  AlertTriangle,
  ArrowRight,
  UserCog,
  Gauge,
  Activity,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
} from 'lucide-react';
import { Candidate, Resignation, Manpower } from '../data/mockData';

interface ChairmanSummaryProps {
  candidates: Candidate[];
  resignations: Resignation[];
  manpower: Manpower[];
}

type Status = 'green' | 'red' | 'yellow';
type TrendDir = 'up' | 'down' | 'flat';

interface KpiRow {
  kpi: string;
  current: string;
  target: string;
  status: Status;
  trend: TrendDir;
  trendValue: string;
  icon: React.ElementType;
  category: string;
}

function getStatus(value: number, target: number, higherIsBetter: boolean): Status {
  if (higherIsBetter) {
    if (value >= target) return 'green';
    if (value >= target * 0.8) return 'yellow';
    return 'red';
  } else {
    if (value <= target) return 'green';
    if (value <= target * 1.5) return 'yellow';
    return 'red';
  }
}

export const ChairmanSummary: React.FC<ChairmanSummaryProps> = ({ candidates, resignations, manpower }) => {
  const stats = useMemo(() => {
    const totalStaff = manpower.reduce((s, m) => s + (m.actual || 0), 0);
    const totalBudgeted = manpower.reduce((s, m) => s + (m.budgeted || 0), 0);
    const totalVacancy = manpower.reduce((s, m) => s + Math.max(0, (m.budgeted || 0) - (m.actual || 0)), 0);
    const vacancyRate = totalBudgeted > 0 ? (totalVacancy / totalBudgeted) * 100 : 0;

    const totalResignations = resignations.length;
    const turnoverRate = totalStaff > 0 ? (totalResignations / totalStaff) * 100 : 0;
    const retentionRate = 100 - turnoverRate;

    const totalHires = candidates.filter(c => c.finalStatus === 'Joined').length;
    const netChange = totalHires - totalResignations;
    const inPipeline = candidates.filter(c => c.finalStatus === 'In Progress').length;

    return {
      totalStaff,
      totalBudgeted,
      totalVacancy,
      vacancyRate,
      totalResignations,
      turnoverRate,
      retentionRate,
      totalHires,
      netChange,
      inPipeline,
    };
  }, [candidates, resignations, manpower]);

  const kpiRows: KpiRow[] = useMemo(() => [
    {
      kpi: 'Total Staff',
      current: stats.totalStaff.toString(),
      target: stats.totalBudgeted > 0 ? stats.totalBudgeted.toString() : '—',
      status: stats.totalBudgeted > 0 ? getStatus(stats.totalStaff, stats.totalBudgeted, true) : 'green',
      trend: 'up',
      trendValue: `${stats.totalHires} hires this period`,
      icon: Users,
      category: 'Workforce',
    },
    {
      kpi: 'Vacancy Rate',
      current: `${stats.vacancyRate.toFixed(1)}%`,
      target: '<5%',
      status: getStatus(stats.vacancyRate, 5, false),
      trend: stats.vacancyRate > 5 ? 'up' : 'down',
      trendValue: `${stats.totalVacancy} vacant positions`,
      icon: AlertTriangle,
      category: 'Recruitment',
    },
    {
      kpi: 'Monthly Turnover',
      current: `${stats.turnoverRate.toFixed(1)}%`,
      target: '<10%',
      status: getStatus(stats.turnoverRate, 10, false),
      trend: stats.turnoverRate > 10 ? 'up' : 'down',
      trendValue: `${stats.totalResignations} resignations`,
      icon: TrendingDown,
      category: 'Retention',
    },
    {
      kpi: 'Retention Rate',
      current: `${stats.retentionRate.toFixed(1)}%`,
      target: '>90%',
      status: getStatus(stats.retentionRate, 90, true),
      trend: stats.retentionRate >= 90 ? 'up' : 'down',
      trendValue: `${stats.retentionRate.toFixed(1)}% retained`,
      icon: ShieldCheck,
      category: 'Retention',
    },
    {
      kpi: 'Total Hires',
      current: stats.totalHires.toString(),
      target: `${stats.totalResignations} (replace)`,
      status: stats.totalHires >= stats.totalResignations ? 'green' : 'red',
      trend: stats.totalHires > 0 ? 'up' : 'flat',
      trendValue: `${candidates.length} total CVs`,
      icon: UserPlus,
      category: 'Recruitment',
    },
    {
      kpi: 'Net Staff Change',
      current: stats.netChange >= 0 ? `+${stats.netChange}` : stats.netChange.toString(),
      target: '>0',
      status: stats.netChange >= 0 ? 'green' : 'red',
      trend: stats.netChange > 0 ? 'up' : stats.netChange < 0 ? 'down' : 'flat',
      trendValue: `${stats.totalHires} hired - ${stats.totalResignations} resigned`,
      icon: Activity,
      category: 'Workforce',
    },
    {
      kpi: 'Recruitment Pipeline',
      current: stats.inPipeline.toString(),
      target: 'Active',
      status: stats.inPipeline > 0 ? 'yellow' : 'red',
      trend: 'flat',
      trendValue: `${candidates.length} total candidates`,
      icon: Gauge,
      category: 'Recruitment',
    },
  ], [stats, candidates.length]);

  const healthScore = useMemo(() => {
    const weights: Record<string, number> = {
      'Total Staff': 0.15,
      'Vacancy Rate': 0.20,
      'Monthly Turnover': 0.25,
      'Retention Rate': 0.15,
      'Total Hires': 0.10,
      'Net Staff Change': 0.10,
      'Recruitment Pipeline': 0.05,
    };
    const statusScore: Record<Status, number> = { green: 100, yellow: 50, red: 0 };
    let total = 0;
    for (const kpi of kpiRows) {
      total += statusScore[kpi.status] * (weights[kpi.kpi] || 0);
    }
    return Math.round(total);
  }, [kpiRows]);

  const redCount = kpiRows.filter(k => k.status === 'red').length;
  const yellowCount = kpiRows.filter(k => k.status === 'yellow').length;
  const greenCount = kpiRows.filter(k => k.status === 'green').length;

  const health = healthScore >= 75
    ? { label: 'Healthy', color: 'text-emerald-400', bg: 'from-emerald-600 to-emerald-800' }
    : healthScore >= 50
    ? { label: 'At Risk', color: 'text-amber-400', bg: 'from-amber-600 to-amber-800' }
    : { label: 'Critical', color: 'text-rose-400', bg: 'from-rose-600 to-rose-800' };

  const statusConfig: Record<Status, { dot: string; badge: string; label: string; bar: string; border: string; iconBg: string }> = {
    green: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'On Track', bar: 'bg-emerald-500', border: 'border-emerald-200', iconBg: 'bg-emerald-50 text-emerald-600' },
    red: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Critical', bar: 'bg-rose-500', border: 'border-rose-200', iconBg: 'bg-rose-50 text-rose-600' },
    yellow: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'At Risk', bar: 'bg-amber-500', border: 'border-amber-200', iconBg: 'bg-amber-50 text-amber-600' },
  };

  const trendConfig: Record<TrendDir, { icon: React.ElementType; color: string }> = {
    up: { icon: ArrowRight, color: 'text-emerald-500' },
    down: { icon: ArrowRight, color: 'text-rose-500' },
    flat: { icon: MinusCircle, color: 'text-slate-400' },
  };

  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);

  const detailData = useMemo(() => {
    const deptStaff = (Object.entries(
      manpower.reduce((acc, m) => {
        const dept = m.department;
        if (!acc[dept]) acc[dept] = { actual: 0, budgeted: 0 };
        acc[dept].actual += m.actual || 0;
        acc[dept].budgeted += m.budgeted || 0;
        return acc;
      }, {} as Record<string, { actual: number; budgeted: number }>)
    ) as [string, { actual: number; budgeted: number }][])
      .map(([dept, d]) => ({
        department: dept,
        actual: d.actual,
        budgeted: d.budgeted,
        vacancy: Math.max(0, d.budgeted - d.actual),
        vacancyRate: d.budgeted > 0 ? (Math.max(0, d.budgeted - d.actual) / d.budgeted) * 100 : 0,
      }))
      .sort((a, b) => b.vacancy - a.vacancy);

    const resignationsList = resignations.map(r => ({
      name: r.name,
      department: r.department,
      position: r.position || r.designation || '—',
      date: r.resignationDate,
      reason: r.reason || '—',
    }));

    const hiresList = candidates
      .filter(c => c.finalStatus === 'Joined')
      .map(c => ({
        name: c.name,
        department: c.department,
        position: c.position,
        date: c.joinedDate || c.date,
      }));

    const pipelineList = candidates
      .filter(c => c.finalStatus === 'In Progress')
      .map(c => ({
        name: c.name,
        department: c.department,
        position: c.position,
        status: c.finalStatus,
        sentToHOD: c.sentToHOD,
        firstInterview: c.firstInterview,
        secondInterview: c.secondInterview,
      }));

    return { deptStaff, resignationsList, hiresList, pipelineList };
  }, [manpower, resignations, candidates]);

  const renderDetail = (kpiName: string) => {
    if (kpiName === 'Total Staff') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budgeted</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gap</th>
              </tr>
            </thead>
            <tbody>
              {detailData.deptStaff.map((d, i) => (
                <tr key={d.department} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm font-bold text-slate-700">{d.department}</span></div></td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{d.budgeted}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{d.actual}</td>
                  <td className={`px-4 py-3 text-right text-sm font-black tabular-nums ${d.vacancy > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{d.actual - d.budgeted > 0 ? '+' : ''}{d.actual - d.budgeted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (kpiName === 'Vacancy Rate') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacant</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budgeted</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacancy %</th>
              </tr>
            </thead>
            <tbody>
              {detailData.deptStaff.filter(d => d.vacancy > 0).map((d, i) => (
                <tr key={d.department} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-rose-400" /><span className="text-sm font-bold text-slate-700">{d.department}</span></div></td>
                  <td className="px-4 py-3 text-right text-sm font-black text-rose-600 tabular-nums">{d.vacancy}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-500 tabular-nums">{d.budgeted}</td>
                  <td className="px-4 py-3 text-right"><div className="inline-flex items-center gap-2"><div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, d.vacancyRate)}%` }} /></div><span className="text-sm font-bold text-rose-600 tabular-nums">{d.vacancyRate.toFixed(1)}%</span></div></td>
                </tr>
              ))}
              {detailData.deptStaff.filter(d => d.vacancy > 0).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">No vacant positions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (kpiName === 'Monthly Turnover') {
      return (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0">
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody>
              {detailData.resignationsList.slice(0, 50).map((r, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-bold text-rose-600">{r.name.charAt(0)}</div><span className="text-sm font-bold text-slate-700">{r.name}</span></div></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.position}</td>
                  <td className="px-4 py-3 text-sm text-slate-500"><div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{r.date}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {detailData.resignationsList.length > 50 && <p className="text-xs text-slate-400 text-center py-3">Showing 50 of {detailData.resignationsList.length}</p>}
        </div>
      );
    }

    if (kpiName === 'Total Hires') {
      return (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0">
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {detailData.hiresList.length > 0 ? detailData.hiresList.slice(0, 50).map((h, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600">{h.name.charAt(0)}</div><span className="text-sm font-bold text-slate-700">{h.name}</span></div></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{h.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{h.position}</td>
                  <td className="px-4 py-3 text-sm text-slate-500"><div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{h.date}</div></td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">No hires yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (kpiName === 'Recruitment Pipeline') {
      return (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0">
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">HOD</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">1st Int</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">2nd Int</th>
              </tr>
            </thead>
            <tbody>
              {detailData.pipelineList.length > 0 ? detailData.pipelineList.slice(0, 50).map((p, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">{p.name.charAt(0)}</div><span className="text-sm font-bold text-slate-700">{p.name}</span></div></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.position}</td>
                  <td className="px-4 py-3 text-center">{p.sentToHOD ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{p.firstInterview ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{p.secondInterview ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No candidates in pipeline</td></tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (kpiName === 'Retention Rate') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resigned</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retained</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retention %</th>
              </tr>
            </thead>
            <tbody>
              {detailData.deptStaff.map((d, i) => {
                const resCount = resignations.filter(r => r.department === d.department).length;
                const retained = d.actual - resCount;
                const retention = d.actual > 0 ? ((d.actual - resCount) / d.actual) * 100 : 100;
                return (
                  <tr key={d.department} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm font-bold text-slate-700">{d.department}</span></div></td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{d.actual}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-rose-600 tabular-nums">{resCount}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600 tabular-nums">{retained}</td>
                    <td className="px-4 py-3 text-right"><div className="inline-flex items-center gap-2"><div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${retention >= 90 ? 'bg-emerald-500' : retention >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${retention}%` }} /></div><span className="text-sm font-bold tabular-nums">{retention.toFixed(1)}%</span></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (kpiName === 'Net Staff Change') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hires</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resignations</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Change</th>
              </tr>
            </thead>
            <tbody>
              {detailData.deptStaff.map((d, i) => {
                const hires = candidates.filter(c => c.finalStatus === 'Joined' && c.department === d.department).length;
                const resCount = resignations.filter(r => r.department === d.department).length;
                const net = hires - resCount;
                return (
                  <tr key={d.department} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm font-bold text-slate-700">{d.department}</span></div></td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600 tabular-nums">+{hires}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-rose-600 tabular-nums">-{resCount}</td>
                    <td className={`px-4 py-3 text-right text-sm font-black tabular-nums ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{net >= 0 ? '+' : ''}{net}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header + Health Score */}
      <div className={`bg-gradient-to-br ${health.bg} rounded-3xl p-8 md:p-10 text-white shadow-xl`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">Chairman Briefing</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">HR Executive Summary</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(healthScore / 100) * 326.7} 326.7`} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black">{healthScore}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">/ 100</span>
                </div>
              </div>
              <span className={`text-sm font-bold mt-2 ${health.color}`}>{health.label}</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
                <XCircle className="w-5 h-5 text-rose-300" />
                <div><p className="text-2xl font-black leading-none">{redCount}</p><p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">Critical</p></div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <div><p className="text-2xl font-black leading-none">{yellowCount}</p><p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">At Risk</p></div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <div><p className="text-2xl font-black leading-none">{greenCount}</p><p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">On Track</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-7 bg-indigo-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">KPI Scorecard</h3>
          <span className="text-sm text-slate-400 font-medium">— Computed from live data, click any card for details</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiRows.map((kpi) => {
            const sc = statusConfig[kpi.status];
            const TrendIcon = trendConfig[kpi.trend].icon;
            const trendColor = kpi.trend === 'up' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-rose-500' : 'text-slate-400';
            const progress = kpi.status === 'green' ? 100 : kpi.status === 'yellow' ? 50 : 25;
            const isActive = expandedKpi === kpi.kpi;
            return (
              <div
                key={kpi.kpi}
                className={`bg-white p-6 rounded-2xl border-2 ${sc.border} shadow-sm transition-all cursor-pointer ${isActive ? 'shadow-lg ring-2 ring-indigo-200' : 'hover:shadow-md'}`}
                onClick={() => setExpandedKpi(isActive ? null : kpi.kpi)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${sc.iconBg}`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${sc.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{sc.label}</span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.category}</p>
                <h4 className="text-sm font-bold text-slate-800 mb-3">{kpi.kpi}</h4>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black text-slate-900 tabular-nums">{kpi.current}</span>
                  <span className="text-xs font-bold text-slate-400">/ {kpi.target}</span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${trendColor} mb-4`}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  <span>{kpi.trendValue}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${sc.bar} rounded-full transition-all duration-1000`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Section */}
      {expandedKpi && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-7 bg-indigo-500 rounded-full" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">{expandedKpi} — Detail Breakdown</h3>
                <p className="text-slate-500 text-sm mt-0.5">Computed from live HR data</p>
              </div>
            </div>
            <button
              onClick={() => setExpandedKpi(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
              Close
            </button>
          </div>
          <div className="p-6">
            {renderDetail(expandedKpi)}
          </div>
        </div>
      )}

      {/* Ownership */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <UserCog className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accountable</p>
              <p className="text-lg font-bold text-slate-800">HR GM</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Overall HR Health</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsible</p>
              <p className="text-lg font-bold text-slate-800">HR Analytics Team</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Data & Reporting</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Gauge className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review Cadence</p>
              <p className="text-lg font-bold text-slate-800">Monthly</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Executive Committee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
