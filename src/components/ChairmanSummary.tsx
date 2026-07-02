import React, { useMemo, useState } from 'react';
import {
  Users,
  TrendingDown,
  ShieldCheck,
  UserPlus,
  AlertTriangle,
  UserCog,
  Activity,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Clock,
  Crown,
  Siren,
  ArrowRight,
  Briefcase,
  Store,
  Calculator,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { Candidate, Resignation, Manpower, EmployeeRecord } from '../data/mockData';
import {
  OperationalShell,
  OperationalHeader,
  OperationalSection,
  OperationalAlert,
  OperationalTableWrap,
  OperationalTable,
  OperationalThead,
  OperationalTh,
  OperationalOwnership,
} from './OperationalLayout';
import { SCORE_THRESHOLDS } from '../utils/scoreThresholds';

interface ChairmanSummaryProps {
  candidates: Candidate[];
  resignations: Resignation[];
  manpower: Manpower[];
  employees: EmployeeRecord[];
  selectedMonth?: string;
  onNavigate?: (tab: string) => void;
}

type Status = 'green' | 'red' | 'yellow';

interface KpiRow {
  kpi: string;
  current: string;
  shouldBe: string;
  verdict: string;
  status: Status;
  icon: React.ElementType;
  category: string;
  hasData: boolean;
}

import { formatGap, getMetricStatus } from '../utils/metricGap';

function isCriticalPosition(position: string): boolean {
  const criticalKeywords = ['gm', 'general manager', 'manager', 'head', 'director', 'chief', 'officer', 'supervisor', 'leader'];
  const lower = position.toLowerCase();
  return criticalKeywords.some(k => lower.includes(k));
}

function getPositionLevel(position: string): number {
  const lower = position.toLowerCase();
  if (lower.includes('gm') || lower.includes('general manager') || lower.includes('chief') || lower.includes('director')) return 5;
  if (lower.includes('manager') || lower.includes('head ')) return 4;
  if (lower.includes('supervisor') || lower.includes('leader') || lower.includes('deputy')) return 3;
  if (lower.includes('officer') || lower.includes('senior') || lower.includes('asst') || lower.includes('assistant')) return 2;
  return 1;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[./-]/);
  if (parts.length < 3) return null;
  const p1 = parseInt(parts[0]);
  const p2 = parseInt(parts[1]);
  const p3 = parseInt(parts[2]);
  if (isNaN(p1) || isNaN(p2) || isNaN(p3)) return null;
  if (p3 > 31) {
    if (p1 > 12) return new Date(p3, p2 - 1, p1);
    return new Date(p3, p1 - 1, p2);
  }
  if (p1 > 12) return new Date(p3, p2 - 1, p1);
  return new Date(p3, p1 - 1, p2);
}

export const ChairmanSummary: React.FC<ChairmanSummaryProps> = ({
  candidates,
  resignations,
  manpower,
  employees,
  selectedMonth = 'All',
  onNavigate,
}) => {
  const stats = useMemo(() => {
    const totalStaff = manpower.reduce((s, m) => s + (m.actual || 0), 0);
    const totalBudgeted = manpower.reduce((s, m) => s + (m.budgeted || 0), 0);
    const totalVacancy = manpower.reduce((s, m) => s + Math.max(0, (m.budgeted || 0) - (m.actual || 0)), 0);
    const vacancyRate = totalBudgeted > 0 ? (totalVacancy / totalBudgeted) * 100 : null;

    const totalResignations = resignations.length;
    const turnoverRate = totalStaff > 0 ? (totalResignations / totalStaff) * 100 : 0;
    const retentionRate = 100 - turnoverRate;

    const totalHires = candidates.filter(c => c.finalStatus === 'Joined').length;
    const inPipeline = candidates.filter(c => c.finalStatus === 'In Progress').length;

    const hasBudgetData = totalBudgeted > 0;

    const criticalVacancies = hasBudgetData
      ? manpower.filter(m => Math.max(0, (m.budgeted || 0) - (m.actual || 0)) >= SCORE_THRESHOLDS.manpowerShortage.critical).length
      : null;

    const joinedWithDates = candidates.filter(c => c.finalStatus === 'Joined' && c.joinedDate && c.date);
    const timeToFills = joinedWithDates.map(c => {
      const received = parseDate(c.date);
      const joined = parseDate(c.joinedDate!);
      if (received && joined) return Math.max(0, (joined.getTime() - received.getTime()) / (1000 * 60 * 60 * 24));
      return null;
    }).filter((d): d is number => d !== null);
    const avgTimeToFill = timeToFills.length > 0 ? timeToFills.reduce((a, b) => a + b, 0) / timeToFills.length : null;

    const labourCostRatio: number | null = null;

    const criticalPositionMap = new Map<string, { position: string; department: string }>();
    for (const emp of employees) {
      if (isCriticalPosition(emp.position)) {
        const key = `${emp.position}||${emp.department}`;
        if (!criticalPositionMap.has(key)) {
          criticalPositionMap.set(key, { position: emp.position, department: emp.department });
        }
      }
    }
    let withSuccessor = 0;
    for (const [, data] of criticalPositionMap) {
      const currentLevel = getPositionLevel(data.position);
      const sameDeptEmployees = employees.filter(e => e.department === data.department && e.position !== data.position);
      const hasSuccessor = sameDeptEmployees.some(e => getPositionLevel(e.position) >= Math.max(1, currentLevel - 1));
      if (hasSuccessor) withSuccessor++;
    }
    const successorCoverage = criticalPositionMap.size > 0 ? (withSuccessor / criticalPositionMap.size) * 100 : null;

    return {
      totalStaff,
      totalBudgeted,
      totalVacancy,
      vacancyRate,
      totalResignations,
      turnoverRate,
      retentionRate,
      totalHires,
      inPipeline,
      hasBudgetData,
      criticalVacancies,
      avgTimeToFill,
      labourCostRatio,
      successorCoverage,
      criticalPositionCount: criticalPositionMap.size,
    };
  }, [candidates, resignations, manpower, employees]);

  const kpiRows: KpiRow[] = useMemo(() => {
    const staffGap = stats.totalBudgeted > 0 ? stats.totalStaff - stats.totalBudgeted : 0;
    const staffVerdict = stats.totalBudgeted > 0
      ? staffGap >= 0
        ? 'On budget'
        : `${Math.abs(staffGap).toLocaleString()} short`
      : 'Pending data';

    const vacancyVerdict = stats.vacancyRate !== null
      ? formatGap(stats.vacancyRate, SCORE_THRESHOLDS.vacancyRate.chairmanTarget, false, '%')
      : 'Pending data';

    const turnoverVerdict = formatGap(stats.turnoverRate, SCORE_THRESHOLDS.turnover.warning, false, '%');
    const retentionVerdict = formatGap(stats.retentionRate, SCORE_THRESHOLDS.retention.target, true, '%');

    const criticalVerdict = stats.criticalVacancies !== null
      ? stats.criticalVacancies === 0
        ? 'No gaps'
        : `${stats.criticalVacancies} unfilled`
      : 'Pending data';

    const ttfVerdict = stats.avgTimeToFill !== null
      ? formatGap(stats.avgTimeToFill, SCORE_THRESHOLDS.timeToFill.targetDays, false, 'd', 0)
      : 'Pending data';

    const successorVerdict = stats.successorCoverage !== null
      ? formatGap(stats.successorCoverage, SCORE_THRESHOLDS.successionReadiness.target, true, '%', 0)
      : 'Pending data';

    return [
      {
        kpi: 'Total Staff',
        current: stats.totalStaff.toLocaleString(),
        shouldBe: stats.totalBudgeted > 0 ? `${stats.totalBudgeted.toLocaleString()} approved` : 'Approved headcount',
        verdict: staffVerdict,
        status: stats.totalBudgeted > 0 ? getMetricStatus(stats.totalStaff, stats.totalBudgeted, true) : 'green',
        icon: Users,
        category: 'Workforce',
        hasData: true,
      },
      {
        kpi: 'Vacancy Rate',
        current: stats.vacancyRate !== null ? `${stats.vacancyRate.toFixed(1)}%` : '—',
        shouldBe: `Max ${SCORE_THRESHOLDS.vacancyRate.chairmanTarget}%`,
        verdict: vacancyVerdict,
        status: stats.vacancyRate !== null ? getMetricStatus(stats.vacancyRate, SCORE_THRESHOLDS.vacancyRate.chairmanTarget, false) : 'yellow',
        icon: AlertTriangle,
        category: 'Recruitment',
        hasData: stats.vacancyRate !== null,
      },
      {
        kpi: 'Monthly Turnover',
        current: `${stats.turnoverRate.toFixed(1)}%`,
        shouldBe: `Max ${SCORE_THRESHOLDS.turnover.warning}%`,
        verdict: turnoverVerdict,
        status: getMetricStatus(stats.turnoverRate, SCORE_THRESHOLDS.turnover.warning, false),
        icon: TrendingDown,
        category: 'Retention',
        hasData: true,
      },
      {
        kpi: 'Retention Rate',
        current: `${stats.retentionRate.toFixed(1)}%`,
        shouldBe: `Min ${SCORE_THRESHOLDS.retention.target}%`,
        verdict: retentionVerdict,
        status: getMetricStatus(stats.retentionRate, SCORE_THRESHOLDS.retention.target, true),
        icon: ShieldCheck,
        category: 'Retention',
        hasData: true,
      },
      {
        kpi: 'Critical Vacancies',
        current: stats.criticalVacancies !== null ? stats.criticalVacancies.toString() : '—',
        shouldBe: 'Zero',
        verdict: criticalVerdict,
        status: stats.criticalVacancies !== null ? (stats.criticalVacancies === 0 ? 'green' : stats.criticalVacancies <= SCORE_THRESHOLDS.manpowerShortage.critical ? 'yellow' : 'red') : 'yellow',
        icon: Siren,
        category: 'Recruitment',
        hasData: stats.criticalVacancies !== null,
      },
      {
        kpi: 'Time to Fill',
        current: stats.avgTimeToFill !== null ? `${Math.round(stats.avgTimeToFill)} days` : '—',
        shouldBe: `Max ${SCORE_THRESHOLDS.timeToFill.targetDays} days`,
        verdict: ttfVerdict,
        status: stats.avgTimeToFill !== null ? getMetricStatus(stats.avgTimeToFill, SCORE_THRESHOLDS.timeToFill.targetDays, false) : 'yellow',
        icon: Clock,
        category: 'Recruitment',
        hasData: stats.avgTimeToFill !== null,
      },
      {
        kpi: 'Hiring Pipeline',
        current: stats.inPipeline.toString(),
        shouldBe: 'Close open reqs',
        verdict: stats.inPipeline > 20 ? `${stats.inPipeline - 20} over backlog` : stats.inPipeline > 0 ? 'Active pipeline' : 'Clear',
        status: stats.inPipeline > 30 ? 'red' : stats.inPipeline > 20 ? 'yellow' : 'green',
        icon: UserPlus,
        category: 'Recruitment',
        hasData: true,
      },
      {
        kpi: 'Net Workforce Change',
        current: `${stats.totalHires - stats.totalResignations >= 0 ? '+' : ''}${stats.totalHires - stats.totalResignations}`,
        shouldBe: 'Net positive',
        verdict: stats.totalHires >= stats.totalResignations ? 'Growing' : `${stats.totalResignations - stats.totalHires} net loss`,
        status: stats.totalHires >= stats.totalResignations ? 'green' : stats.totalResignations - stats.totalHires > SCORE_THRESHOLDS.manpowerShortage.critical ? 'red' : 'yellow',
        icon: Activity,
        category: 'Workforce',
        hasData: true,
      },
      {
        kpi: 'Labour Cost Ratio',
        current: '—',
        shouldBe: 'Max 10%',
        verdict: 'Pending data',
        status: 'yellow',
        icon: Activity,
        category: 'Finance',
        hasData: false,
      },
      {
        kpi: 'Successor Coverage',
        current: stats.successorCoverage !== null ? `${stats.successorCoverage.toFixed(0)}%` : '—',
        shouldBe: `Min ${SCORE_THRESHOLDS.successionReadiness.target}%`,
        verdict: successorVerdict,
        status: stats.successorCoverage !== null ? getMetricStatus(stats.successorCoverage, SCORE_THRESHOLDS.successionReadiness.target, true) : 'yellow',
        icon: Crown,
        category: 'Talent',
        hasData: stats.successorCoverage !== null,
      },
    ];
  }, [stats]);

  const redCount = kpiRows.filter(k => k.status === 'red').length;
  const yellowCount = kpiRows.filter(k => k.status === 'yellow').length;
  const greenCount = kpiRows.filter(k => k.status === 'green').length;

  const overallHealth: Status = redCount >= 3 ? 'red' : redCount >= 1 || yellowCount >= 3 ? 'yellow' : 'green';

  const healthSummary = {
    green: { title: 'On Track', detail: `${greenCount}/${kpiRows.length} KPIs on target` },
    yellow: { title: 'Needs Attention', detail: `${yellowCount + redCount}/${kpiRows.length} KPIs off target` },
    red: { title: 'Critical', detail: `${redCount} critical · ${yellowCount} at risk` },
  }[overallHealth];

  const categoryOrder = ['Workforce', 'Retention', 'Recruitment', 'Finance', 'Talent'];
  const groupedKpis = categoryOrder
    .map(cat => ({ category: cat, rows: kpiRows.filter(k => k.category === cat) }))
    .filter(g => g.rows.length > 0);

  const offTargetKpis = useMemo(
    () => kpiRows
      .filter(k => k.status !== 'green')
      .sort((a, b) => {
        const order: Record<Status, number> = { red: 0, yellow: 1, green: 2 };
        return order[a.status] - order[b.status];
      }),
    [kpiRows],
  );

  const dataGapKpis = useMemo(() => kpiRows.filter(k => !k.hasData), [kpiRows]);

  const workforceFacts = useMemo(() => [
    { label: 'Total Staff', value: stats.totalStaff.toLocaleString() },
    { label: 'Hires', value: stats.totalHires.toLocaleString() },
    { label: 'Resignations', value: stats.totalResignations.toLocaleString() },
    { label: 'Net Change', value: `${stats.totalHires - stats.totalResignations >= 0 ? '+' : ''}${stats.totalHires - stats.totalResignations}` },
    { label: 'Retention Rate', value: `${stats.retentionRate.toFixed(1)}%` },
    { label: 'Turnover Rate', value: `${stats.turnoverRate.toFixed(1)}%` },
    { label: 'Hiring Pipeline', value: stats.inPipeline.toLocaleString() },
    ...(stats.vacancyRate !== null ? [{ label: 'Vacancy Rate', value: `${stats.vacancyRate.toFixed(1)}%` }] : []),
  ], [stats]);

  const statusConfig: Record<Status, { dot: string; badge: string; label: string; border: string; iconBg: string }> = {
    green: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'On Track', border: 'border-emerald-200', iconBg: 'bg-emerald-50 text-emerald-600' },
    red: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Critical', border: 'border-rose-200', iconBg: 'bg-rose-50 text-rose-600' },
    yellow: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'At Risk', border: 'border-amber-200', iconBg: 'bg-amber-50 text-amber-600' },
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
        timeToFill: c.joinedDate && c.date ? (() => {
          const r = parseDate(c.date); const j = parseDate(c.joinedDate);
          if (r && j) return Math.max(0, Math.round((j.getTime() - r.getTime()) / (1000 * 60 * 60 * 24)));
          return null;
        })() : null,
      }));

    const pipelineList = candidates
      .filter(c => c.finalStatus === 'In Progress')
      .map(c => ({
        name: c.name,
        department: c.department,
        position: c.position,
        sentToHOD: c.sentToHOD,
        firstInterview: c.firstInterview,
        secondInterview: c.secondInterview,
      }));

    const criticalVacantPositions = manpower
      .filter(m => Math.max(0, (m.budgeted || 0) - (m.actual || 0)) >= SCORE_THRESHOLDS.manpowerShortage.critical)
      .map(m => ({
        department: m.department,
        position: m.position,
        budgeted: m.budgeted,
        actual: m.actual,
        vacant: Math.max(0, m.budgeted - m.actual),
      }))
      .sort((a, b) => b.vacant - a.vacant);

    const successorList: { position: string; department: string; hasSuccessor: boolean; successorName: string | null }[] = [];
    const seen = new Set<string>();
    for (const emp of employees) {
      if (!isCriticalPosition(emp.position)) continue;
      const key = `${emp.position}||${emp.department}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const currentLevel = getPositionLevel(emp.position);
      const sameDeptEmployees = employees.filter(e => e.department === emp.department && e.position !== emp.position);
      const ranked = sameDeptEmployees
        .map(e => ({ emp: e, level: getPositionLevel(e.position) }))
        .filter(c => c.level >= Math.max(1, currentLevel - 1))
        .sort((a, b) => b.level - a.level);
      const successor = ranked[0]?.emp || null;
      successorList.push({
        position: emp.position,
        department: emp.department,
        hasSuccessor: !!successor,
        successorName: successor ? successor.name : null,
      });
    }

    return { deptStaff, resignationsList, hiresList, pipelineList, criticalVacantPositions, successorList };
  }, [manpower, resignations, candidates, employees]);

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
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{d.budgeted > 0 ? d.budgeted : '—'}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{d.actual}</td>
                  <td className={`px-4 py-3 text-right text-sm font-black tabular-nums ${d.actual - d.budgeted < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{d.budgeted > 0 ? (d.actual - d.budgeted > 0 ? '+' : '') + (d.actual - d.budgeted) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (kpiName === 'Vacancy Rate') {
      if (!stats.hasBudgetData) {
        return <div className="py-8 text-center text-sm text-slate-400">Budget data not available. Cannot compute vacancy breakdown.</div>;
      }
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

    if (kpiName === 'Critical Vacancies') {
      if (!stats.hasBudgetData || detailData.criticalVacantPositions.length === 0) {
        return <div className="py-8 text-center text-sm text-slate-400">{!stats.hasBudgetData ? 'Budget data not available.' : 'No critical vacancies identified.'}</div>;
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budgeted</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacant</th>
              </tr>
            </thead>
            <tbody>
              {detailData.criticalVacantPositions.map((p, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3"><span className="text-sm font-bold text-slate-700">{p.department}</span></td>
                  <td className="px-4 py-3"><span className="text-sm text-slate-600">{p.position}</span></td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{p.budgeted}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{p.actual}</td>
                  <td className="px-4 py-3 text-right text-sm font-black text-rose-600 tabular-nums">{p.vacant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (kpiName === 'Time to Fill') {
      const withTTF = detailData.hiresList.filter(h => h.timeToFill !== null);
      if (withTTF.length === 0) {
        return <div className="py-8 text-center text-sm text-slate-400">No joined candidates with date data available.</div>;
      }
      return (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0">
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days</th>
              </tr>
            </thead>
            <tbody>
              {withTTF.map((h, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600">{h.name.charAt(0)}</div><span className="text-sm font-bold text-slate-700">{h.name}</span></div></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{h.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{h.position}</td>
                  <td className={`px-4 py-3 text-right text-sm font-black tabular-nums ${(h.timeToFill as number) > SCORE_THRESHOLDS.timeToFill.targetDays ? 'text-rose-600' : 'text-emerald-600'}`}>{h.timeToFill}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (kpiName === 'Labour Cost Ratio') {
      return <div className="py-8 text-center text-sm text-slate-400">Payroll cost data not available. Finance to provide labour cost data for this KPI.</div>;
    }

    if (kpiName === 'Successor Coverage') {
      if (detailData.successorList.length === 0) {
        return <div className="py-8 text-center text-sm text-slate-400">No critical positions identified in employee data.</div>;
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Successor Identified</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Successor Name</th>
              </tr>
            </thead>
            <tbody>
              {detailData.successorList.map((s, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3"><span className="text-sm font-bold text-slate-700">{s.position}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{s.department}</td>
                  <td className="px-4 py-3 text-center">{s.hasSuccessor ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-rose-400 mx-auto" />}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{s.successorName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  const actionSeverityConfig = {
    red: { border: 'border-rose-200', bg: 'bg-rose-50/60' },
    yellow: { border: 'border-amber-200', bg: 'bg-amber-50/60' },
  };

  const netWorkforceChange = stats.totalHires - stats.totalResignations;
  const periodLabel = selectedMonth === 'All' ? 'All periods' : selectedMonth;

  const topRiskDept = useMemo(() => {
    const deptMap = manpower.reduce((acc, m) => {
      acc[m.department] = (acc[m.department] || 0) + (m.actual || 0);
      return acc;
    }, {} as Record<string, number>);

    let worst: { department: string; resignations: number; staff: number; retention: number } | null = null;
    for (const [department, staff] of Object.entries(deptMap) as [string, number][]) {
      const resCount = resignations.filter(r => r.department === department).length;
      if (staff === 0) continue;
      const retention = ((staff - resCount) / staff) * 100;
      if (!worst || retention < worst.retention) {
        worst = { department, resignations: resCount, staff, retention };
      }
    }
    return worst;
  }, [manpower, resignations]);

  const headerGradient = overallHealth === 'green' ? 'emerald' as const : overallHealth === 'yellow' ? 'amber' as const : 'rose' as const;

  const drillSections = [
    { tab: 'riskalerts', label: 'Risk Alerts', desc: 'Open HR risks', icon: Siren, tone: 'text-rose-600 bg-rose-50' },
    { tab: 'branch', label: 'Branch Scorecard', desc: 'Location performance', icon: Store, tone: 'text-indigo-600 bg-indigo-50' },
    { tab: 'dept', label: 'Dept Scorecard', desc: 'Department KPIs', icon: Briefcase, tone: 'text-blue-600 bg-blue-50' },
    { tab: 'manager', label: 'Manager Scorecard', desc: 'Leadership metrics', icon: UserCog, tone: 'text-purple-600 bg-purple-50' },
    { tab: 'planning', label: 'Manpower Planning', desc: 'Headcount vs budget', icon: Calculator, tone: 'text-emerald-600 bg-emerald-50' },
    { tab: 'talent', label: 'Talent & Succession', desc: 'Successor coverage', icon: Crown, tone: 'text-amber-600 bg-amber-50' },
    { tab: 'exitanalytics', label: 'Exit Analytics', desc: 'Why people leave', icon: LogOut, tone: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <OperationalShell>
      <OperationalHeader
        eyebrow="29 ရတနာ · Chairman HR Executive Summary 2.0"
        title="Company HR Health — 30 Second Overview"
        subtitle={`${periodLabel} · ${kpiRows.length} KPIs · live sheet data`}
        gradient={headerGradient}
        metrics={[
          { value: stats.totalStaff.toLocaleString(), label: 'Total Staff' },
          { value: `${stats.turnoverRate.toFixed(1)}%`, label: 'Turnover', accentClass: stats.turnoverRate > SCORE_THRESHOLDS.turnover.warning ? 'text-rose-300' : undefined },
          { value: stats.vacancyRate !== null ? `${stats.vacancyRate.toFixed(1)}%` : '—', label: 'Vacancy' },
          { value: healthSummary.title, label: 'Verdict', accentClass: overallHealth === 'red' ? 'text-rose-300' : overallHealth === 'yellow' ? 'text-amber-200' : 'text-emerald-200' },
        ]}
        alert={
          offTargetKpis.length > 0 ? (
            <OperationalAlert tone="rose">
              <Siren className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-bold">
                {offTargetKpis.length} KPI{offTargetKpis.length > 1 ? 's' : ''} off target — {offTargetKpis[0].kpi}: {offTargetKpis[0].current} ({offTargetKpis[0].verdict})
              </span>
            </OperationalAlert>
          ) : undefined
        }
      />

      {/* Briefing + Health strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <OperationalSection
          title="Data Summary"
          subtitle={`${periodLabel} · computed from sheet records`}
          icon={LayoutDashboard}
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <div className="border-b border-slate-100 px-6 py-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Workforce</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {workforceFacts.map(fact => (
                <div key={fact.label} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{fact.label}</p>
                  <p className="text-lg font-black text-slate-900 tabular-nums mt-0.5">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>
          <OperationalTableWrap>
            <OperationalTable>
              <OperationalThead>
                <OperationalTh>KPI (off target)</OperationalTh>
                <OperationalTh align="right">Now</OperationalTh>
                <OperationalTh align="right">Target</OperationalTh>
                <OperationalTh>Gap</OperationalTh>
                <OperationalTh align="center">Status</OperationalTh>
              </OperationalThead>
              <tbody>
                {offTargetKpis.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                      {greenCount}/{kpiRows.length} KPIs on target
                    </td>
                  </tr>
                ) : (
                  offTargetKpis.map(kpi => {
                    const sc = statusConfig[kpi.status];
                    return (
                      <tr key={kpi.kpi} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-sm font-bold text-slate-800">{kpi.kpi}</td>
                        <td className="px-4 py-3 text-right text-sm font-black tabular-nums">{kpi.current}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">{kpi.shouldBe}</td>
                        <td className={`px-4 py-3 text-sm font-semibold ${kpi.status === 'red' ? 'text-rose-700' : 'text-amber-700'}`}>{kpi.verdict}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${sc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </OperationalTable>
          </OperationalTableWrap>
        </OperationalSection>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">KPI Health</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
              {greenCount > 0 && <div className="bg-emerald-500" style={{ width: `${(greenCount / kpiRows.length) * 100}%` }} />}
              {yellowCount > 0 && <div className="bg-amber-500" style={{ width: `${(yellowCount / kpiRows.length) * 100}%` }} />}
              {redCount > 0 && <div className="bg-rose-500" style={{ width: `${(redCount / kpiRows.length) * 100}%` }} />}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { count: redCount, status: 'red' as Status, label: 'Critical' },
                { count: yellowCount, status: 'yellow' as Status, label: 'At Risk' },
                { count: greenCount, status: 'green' as Status, label: 'On Track' },
              ]).map(({ count, status, label }) => (
                <div key={status} className={`rounded-xl border px-3 py-2 text-center ${statusConfig[status].border}`}>
                  <p className="text-xl font-black text-slate-900 tabular-nums">{count}</p>
                  <p className="text-[10px] font-bold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {topRiskDept && (
            <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Highest Risk Department</p>
              <p className="text-lg font-black text-slate-900">{topRiskDept.department}</p>
              <p className="text-xs text-slate-500 mt-1">
                {topRiskDept.resignations} resignations · {topRiskDept.retention.toFixed(0)}% retention
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Workforce pulse */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Hires', value: stats.totalHires, icon: UserPlus, tone: 'text-emerald-600 bg-emerald-50' },
          { label: 'Resignations', value: stats.totalResignations, icon: TrendingDown, tone: 'text-rose-600 bg-rose-50' },
          { label: 'Pipeline', value: stats.inPipeline, icon: Clock, tone: 'text-indigo-600 bg-indigo-50' },
          { label: 'Net Change', value: `${netWorkforceChange >= 0 ? '+' : ''}${netWorkforceChange}`, icon: Activity, tone: netWorkforceChange >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.tone}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{item.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI + Actions side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <OperationalSection
          title="KPI Scorecard"
          subtitle="KPI · Now · Target · Gap · Status — click row for drill-down"
          icon={ShieldCheck}
          className="xl:col-span-3"
          bodyClassName="p-0"
        >
          <OperationalTableWrap>
            <OperationalTable>
              <OperationalThead>
                <OperationalTh>KPI</OperationalTh>
                <OperationalTh align="right">Now</OperationalTh>
                <OperationalTh align="right">Target</OperationalTh>
                <OperationalTh>Gap</OperationalTh>
                <OperationalTh align="center">Status</OperationalTh>
              </OperationalThead>
              <tbody>
                {groupedKpis.map(({ category, rows }) => (
                  <React.Fragment key={category}>
                    <tr className="bg-slate-50/60">
                      <td colSpan={5} className="px-4 py-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{category}</span>
                      </td>
                    </tr>
                    {rows.map(kpi => {
                      const sc = statusConfig[kpi.status];
                      const isActive = expandedKpi === kpi.kpi;
                      const Icon = kpi.icon;
                      return (
                        <React.Fragment key={kpi.kpi}>
                          <tr
                            className={`border-t border-slate-100 cursor-pointer transition-colors ${isActive ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'}`}
                            onClick={() => setExpandedKpi(isActive ? null : kpi.kpi)}
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sc.iconBg}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-sm font-bold text-slate-800">{kpi.kpi}</span>
                                  {!kpi.hasData && <span className="ml-2 text-[10px] font-bold text-amber-500">No data</span>}
                                </div>
                                {isActive ? <ChevronUp className="w-4 h-4 text-indigo-400 ml-auto" /> : <ChevronDown className="w-4 h-4 text-slate-300 ml-auto" />}
                              </div>
                            </td>
                            <td className={`px-4 py-3.5 text-right text-sm font-black tabular-nums ${kpi.hasData ? 'text-slate-900' : 'text-slate-400'}`}>{kpi.current}</td>
                            <td className="px-4 py-3.5 text-right text-sm text-slate-600">{kpi.shouldBe}</td>
                            <td className="px-4 py-3.5">
                              <p className={`text-sm font-semibold ${kpi.status === 'green' ? 'text-emerald-700' : kpi.status === 'red' ? 'text-rose-700' : 'text-amber-700'}`}>{kpi.verdict}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex justify-center">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${sc.badge}`}>
                                  <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">{sc.label}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          {isActive && (
                            <tr className="bg-slate-50/40">
                              <td colSpan={5} className="px-4 py-4 border-t border-indigo-100">{renderDetail(kpi.kpi)}</td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </OperationalTable>
          </OperationalTableWrap>
        </OperationalSection>

        <div className="xl:col-span-2 space-y-6">
          <OperationalSection title="Off-Target KPIs" subtitle={`${offTargetKpis.length} from scorecard`} icon={Siren}>
            {offTargetKpis.length === 0 ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <p className="text-sm text-slate-600">{greenCount}/{kpiRows.length} KPIs on target</p>
              </div>
            ) : (
              <div className="space-y-2">
                {offTargetKpis.slice(0, 5).map(kpi => {
                  const cfg = actionSeverityConfig[kpi.status === 'red' ? 'red' : 'yellow'];
                  return (
                    <div key={kpi.kpi} className={`p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800">{kpi.kpi}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusConfig[kpi.status].badge}`}>
                          {statusConfig[kpi.status].label}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div><span className="text-slate-400">Now</span><p className="font-black text-slate-900">{kpi.current}</p></div>
                        <div><span className="text-slate-400">Target</span><p className="font-semibold text-slate-700">{kpi.shouldBe}</p></div>
                        <div><span className="text-slate-400">Gap</span><p className={`font-semibold ${kpi.status === 'red' ? 'text-rose-700' : 'text-amber-700'}`}>{kpi.verdict}</p></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {dataGapKpis.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Missing Data</p>
                <ul className="space-y-1">
                  {dataGapKpis.map(kpi => (
                    <li key={kpi.kpi} className="text-xs text-slate-500 flex items-center gap-2">
                      <MinusCircle className="w-3 h-3 flex-shrink-0" />
                      {kpi.kpi}: {kpi.verdict}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </OperationalSection>

          {onNavigate && (
            <OperationalSection title="Drill Down" subtitle="Chairman section navigation" icon={ArrowRight}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {drillSections.map(section => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.tab}
                      type="button"
                      onClick={() => onNavigate(section.tab)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors text-left group"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${section.tone}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">{section.label}</p>
                        <p className="text-[10px] text-slate-400 truncate">{section.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </OperationalSection>
          )}
        </div>
      </div>

      <OperationalOwnership items={[
        { icon: UserCog, label: 'Accountable', value: 'HR GM' },
        { icon: Users, label: 'Responsible', value: 'HR Analytics Team' },
        { icon: Calendar, label: 'Review', value: 'Monthly — Executive Committee' },
      ]} />
    </OperationalShell>
  );
};
