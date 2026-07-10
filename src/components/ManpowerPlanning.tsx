import React, { useMemo, useState } from 'react';
import {
  Calculator,
  Users,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Building2,
  Siren,
  ArrowRight,
  UserCog,
  Briefcase,
} from 'lucide-react';
import { Candidate, EmployeeRecord, Manpower, VacantListRow } from '../data/mockData';
import { flattenOffTarget, getManpowerOffTargetRows } from '../utils/offTarget';
import { OffTargetPanel } from './OffTargetPanel';

interface ManpowerPlanningProps {
  manpower: Manpower[];
  employees: EmployeeRecord[];
  candidates: Candidate[];
  vacantList: VacantListRow[];
}

interface DeptGap {
  department: string;
  budget: number;
  actual: number;
  gap: number;
  shortage: number;
  fillRate: number;
  isCritical: boolean;
  inPipeline: number;
}

export const ManpowerPlanning: React.FC<ManpowerPlanningProps> = ({
  manpower,
  employees,
  candidates,
  vacantList,
}) => {
  const departments = useMemo<DeptGap[]>(() => {
    if (vacantList.length > 0) {
      const pipelineByDept = new Map<string, number>();
      for (const c of candidates.filter(x => x.finalStatus === 'In Progress')) {
        pipelineByDept.set(c.department, (pipelineByDept.get(c.department) || 0) + 1);
      }

      return vacantList
        .map((row) => {
          const budget = row.sanctionedStrength;
          const actual = row.activeHeadcount;
          const gap = actual - budget;
          const shortage = row.shortage;
          const fillRate = budget > 0 ? (actual / budget) * 100 : 100;
          const inPipeline = pipelineByDept.get(row.department) || 0;
          return {
            department: row.department,
            budget,
            actual,
            gap,
            shortage,
            fillRate,
            isCritical: shortage > 5,
            inPipeline,
          };
        });
    }

    const deptMap = new Map<string, { budget: number; actual: number }>();

    for (const emp of employees) {
      const dept = emp.department?.trim() || 'Unknown';
      if (dept === 'Unknown') continue;
      if (!deptMap.has(dept)) deptMap.set(dept, { budget: 0, actual: 0 });
      deptMap.get(dept)!.actual += 1;
    }

    for (const m of manpower) {
      const dept = m.department?.trim() || 'Unknown';
      if (dept === 'Unknown') continue;
      if (!deptMap.has(dept)) deptMap.set(dept, { budget: 0, actual: 0 });
      const entry = deptMap.get(dept)!;
      entry.budget += m.budgeted || 0;
      if (entry.actual === 0) entry.actual += m.actual || 0;
    }

    const pipelineByDept = new Map<string, number>();
    for (const c of candidates.filter(x => x.finalStatus === 'In Progress')) {
      pipelineByDept.set(c.department, (pipelineByDept.get(c.department) || 0) + 1);
    }

    return [...deptMap.entries()]
      .map(([department, data]) => {
        const budget = data.budget;
        const actual = data.actual;
        const gap = actual - budget;
        const shortage = Math.max(0, budget - actual);
        const fillRate = budget > 0 ? (actual / budget) * 100 : 100;
        const inPipeline = pipelineByDept.get(department) || 0;
        const isCritical = shortage > 5;

        return {
          department,
          budget,
          actual,
          gap,
          shortage,
          fillRate,
          isCritical,
          inPipeline,
        };
      })
      .filter(d => d.budget > 0 || d.actual > 0);
  }, [manpower, employees, candidates, vacantList]);

  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const totalBudget = departments.reduce((s, d) => s + d.budget, 0);
  const totalActual = departments.reduce((s, d) => s + d.actual, 0);
  const totalGap = totalActual - totalBudget;
  const overallFillRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  const criticalDepts = departments.filter(d => d.isCritical);
  const hasBudgetData = totalBudget > 0;

  const headerGradient = criticalDepts.length > 0
    ? 'from-rose-900 via-rose-800 to-slate-900'
    : totalGap < 0
    ? 'from-amber-900 via-amber-800 to-slate-900'
    : 'from-teal-800 via-teal-700 to-slate-800';

  const offTargetRows = useMemo(
    () => flattenOffTarget(departments, getManpowerOffTargetRows),
    [departments],
  );

  const renderDetail = (d: DeptGap) => {
    const deptManpower = manpower.filter(m => m.department === d.department);
    const deptPipeline = candidates.filter(
      c => c.finalStatus === 'In Progress' && c.department === d.department
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Budget</p>
            <p className="text-lg font-black tabular-nums">{d.budget || '—'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Actual</p>
            <p className="text-lg font-black tabular-nums">{d.actual}</p>
          </div>
          <div className={`p-3 rounded-xl border ${d.isCritical ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Gap</p>
            <p className={`text-lg font-black tabular-nums ${d.gap < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {d.gap > 0 ? '+' : ''}{d.budget > 0 ? d.gap : '—'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">In Pipeline</p>
            <p className="text-lg font-black tabular-nums">{d.inPipeline}</p>
          </div>
        </div>
        {deptManpower.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Position</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Budget</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Actual</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Gap</th>
                </tr>
              </thead>
              <tbody>
                {deptManpower.map((m, i) => {
                  const mGap = (m.actual || 0) - (m.budgeted || 0);
                  return (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-2 text-sm font-bold text-slate-700">{m.position}</td>
                      <td className="px-4 py-2 text-right text-sm tabular-nums">{m.budgeted || '—'}</td>
                      <td className="px-4 py-2 text-right text-sm tabular-nums">{m.actual}</td>
                      <td className={`px-4 py-2 text-right text-sm font-black tabular-nums ${mGap < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {m.budgeted > 0 ? (mGap > 0 ? '+' : '') + mGap : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {deptPipeline.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">Pipeline candidates ({deptPipeline.length})</p>
            <ul className="space-y-1">
              {deptPipeline.slice(0, 8).map((c, i) => (
                <li key={i} className="text-sm text-slate-600">{c.name} — {c.position}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className={`bg-gradient-to-br ${headerGradient} rounded-2xl p-6 md:p-8 text-white shadow-lg`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Workforce Planning</p>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Manpower Planning Dashboard</h2>
            <p className="text-sm text-white/60 mt-2">
              {departments.length} departments · {totalActual.toLocaleString()} actual headcount
              {hasBudgetData && ` · ${overallFillRate.toFixed(0)}% fill rate`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 flex-shrink-0">
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black">{hasBudgetData ? totalBudget.toLocaleString() : '—'}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Budget</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black">{totalActual.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Actual</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className={`text-2xl font-black ${totalGap < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                {hasBudgetData ? (totalGap > 0 ? '+' : '') + totalGap : '—'}
              </p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Gap</p>
            </div>
          </div>
        </div>
        {!hasBudgetData && (
          <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-amber-500/20 rounded-xl border border-amber-400/30">
            <AlertTriangle className="w-4 h-4 text-amber-200 flex-shrink-0" />
            <p className="text-sm font-bold text-amber-100">
              Budget data not in source — showing actual headcount by department. Finance to provide approved headcount.
            </p>
          </div>
        )}
        {criticalDepts.length > 0 && (
          <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-rose-500/25 rounded-xl border border-rose-400/30">
            <Siren className="w-4 h-4 text-rose-200 flex-shrink-0 animate-pulse" />
            <p className="text-sm font-bold text-rose-100">
              {criticalDepts.length} department(s) with gap exceeding 5 — immediate action required
            </p>
          </div>
        )}
      </div>

      {departments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Calculator className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No Manpower Data Available</p>
        </div>
      ) : (
        <>
          {/* Chairman Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-800">Budget vs Actual by Department</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click a row for position breakdown · Gap &lt; -5 = critical</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Budget</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Actual</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => {
                    const isExpanded = expandedDept === d.department;
                    return (
                      <React.Fragment key={d.department}>
                        <tr
                          className={`border-t border-slate-100 cursor-pointer transition-colors ${d.isCritical ? 'bg-rose-50/40' : 'hover:bg-slate-50/80'} ${isExpanded ? 'ring-1 ring-inset ring-indigo-200' : ''}`}
                          onClick={() => setExpandedDept(isExpanded ? null : d.department)}
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              {d.isCritical && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />}
                              <Building2 className={`w-4 h-4 flex-shrink-0 ${d.isCritical ? 'text-rose-500' : 'text-slate-400'}`} />
                              <span className="text-sm font-bold text-slate-800">{d.department}</span>
                              {d.isCritical && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                  Critical
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-400 ml-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-300 ml-auto" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-black tabular-nums text-slate-900">
                            {d.budget > 0 ? d.budget : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-black tabular-nums text-slate-900">
                            {d.actual}
                          </td>
                          <td className={`px-4 py-3.5 text-right text-sm font-black tabular-nums ${d.gap < 0 ? 'text-rose-600' : d.gap > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {d.budget > 0 ? (d.gap > 0 ? '+' : '') + d.gap : '—'}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={4} className="px-6 py-4 border-t border-indigo-100">
                              {renderDetail(d)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                {hasBudgetData && (
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td className="px-6 py-3.5 text-sm font-black text-slate-800">TOTAL</td>
                      <td className="px-4 py-3.5 text-right text-sm font-black tabular-nums">{totalBudget}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-black tabular-nums">{totalActual}</td>
                      <td className={`px-4 py-3.5 text-right text-sm font-black tabular-nums ${totalGap < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {totalGap > 0 ? '+' : ''}{totalGap}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Priority Recruitment List */}
          {criticalDepts.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-rose-50/80 border-b border-rose-100 flex items-center gap-2">
                <Siren className="w-4 h-4 text-rose-500" />
                <h3 className="text-base font-bold text-slate-800">Priority Recruitment List</h3>
                <span className="text-xs text-slate-400">Gap exceeds 5</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {criticalDepts.map((d, idx) => (
                  <li key={d.department} className="px-6 py-3.5 flex items-center gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-sm font-black text-rose-700">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{d.department}</p>
                      <p className="text-xs text-slate-500">
                        {d.shortage} positions to fill · {d.inPipeline} in pipeline · Fill {d.fillRate.toFixed(0)}%
                      </p>
                    </div>
                    <span className="text-sm font-black text-rose-600 tabular-nums">{d.gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <OffTargetPanel title="Off-Target Headcount" rows={offTargetRows} />

      {/* Ownership */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /><strong className="text-slate-700">Planning:</strong> HR Planning Team</span>
        <span className="flex items-center gap-1.5"><UserCog className="w-3.5 h-3.5" /><strong className="text-slate-700">Execution:</strong> Department Heads</span>
        <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /><strong className="text-slate-700">Budget:</strong> Finance Department</span>
      </div>
    </div>
  );
};
