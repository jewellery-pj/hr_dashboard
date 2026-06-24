import React, { useMemo, useState } from 'react';
import {
  Calculator,
  Users,
  TrendingDown,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Building2,
  Target,
  Briefcase,
} from 'lucide-react';
import { Manpower } from '../data/mockData';

interface ManpowerPlanningProps {
  manpower: Manpower[];
}

interface DeptGap {
  department: string;
  budget: number;
  actual: number;
  gap: number;
  gapPct: number;
  fillRate: number;
  isCritical: boolean;
}

export const ManpowerPlanning: React.FC<ManpowerPlanningProps> = ({ manpower }) => {
  const departments = useMemo<DeptGap[]>(() => {
    const deptMap = manpower.reduce((acc, m) => {
      const dept = m.department;
      if (!acc[dept]) acc[dept] = { budget: 0, actual: 0 };
      acc[dept].budget += m.budgeted || 0;
      acc[dept].actual += m.actual || 0;
      return acc;
    }, {} as Record<string, { budget: number; actual: number }>);

    return (Object.entries(deptMap) as [string, { budget: number; actual: number }][])
      .map(([dept, data]) => {
        const gap = data.actual - data.budget;
        const gapPct = data.budget > 0 ? (gap / data.budget) * 100 : 0;
        const fillRate = data.budget > 0 ? (data.actual / data.budget) * 100 : 0;
        return {
          department: dept,
          budget: data.budget,
          actual: data.actual,
          gap,
          gapPct,
          fillRate,
          isCritical: Math.abs(gap) > 5,
        };
      })
      .filter(d => d.budget > 0 || d.actual > 0)
      .sort((a, b) => a.gap - b.gap);
  }, [manpower]);

  const [sortField, setSortField] = useState<'department' | 'budget' | 'actual' | 'gap' | 'fillRate'>('gap');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...departments].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'department') cmp = a.department.localeCompare(b.department);
      else cmp = (a[sortField] as number) - (b[sortField] as number);
      return sortAsc ? cmp : -cmp;
    });
  }, [departments, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const totalBudget = departments.reduce((s, d) => s + d.budget, 0);
  const totalActual = departments.reduce((s, d) => s + d.actual, 0);
  const totalGap = totalActual - totalBudget;
  const overallFillRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  const criticalDepts = departments.filter(d => d.isCritical);

  const SortHeader = ({ field, label, align = 'left' }: { field: typeof sortField; label: string; align?: 'left' | 'right' | 'center' }) => (
    <th
      onClick={() => toggleSort(field)}
      className={`px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors select-none whitespace-nowrap ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-500/30 backdrop-blur rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-teal-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-300/70">Workforce Planning</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Manpower Planning Dashboard</h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Overall Fill Rate</span>
              <span className="text-3xl font-black">{overallFillRate.toFixed(1)}%</span>
              <span className="text-xs font-bold text-white/70 mt-1">{totalActual} / {totalBudget}</span>
            </div>
            <div className="flex flex-col items-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Total Gap</span>
              <span className={`text-3xl font-black ${totalGap < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{totalGap > 0 ? '+' : ''}{totalGap}</span>
              <span className="text-xs font-bold text-white/70 mt-1">{criticalDepts.length} critical</span>
            </div>
          </div>
        </div>
        {criticalDepts.length > 0 && (
          <div className="mt-6 flex items-center gap-3 px-5 py-3 bg-rose-500/20 backdrop-blur rounded-xl border border-rose-400/30">
            <AlertTriangle className="w-5 h-5 text-rose-300 flex-shrink-0" />
            <p className="text-sm font-bold text-rose-100">
              {criticalDepts.length} departments with gap exceeding 5 — immediate hiring or reallocation required
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center"><Target className="w-4 h-4 text-teal-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Budget</span>
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{totalBudget}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center"><Users className="w-4 h-4 text-indigo-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Actual</span>
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{totalActual}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center"><TrendingDown className="w-4 h-4 text-rose-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Gap</span>
          </div>
          <p className={`text-2xl font-black tabular-nums ${totalGap < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{totalGap > 0 ? '+' : ''}{totalGap}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-amber-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Critical Depts</span>
          </div>
          <p className="text-2xl font-black text-rose-600 tabular-nums">{criticalDepts.length}</p>
        </div>
      </div>

      {/* Department Gap Table */}
      {departments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
          <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-700">No Manpower Data Available</p>
          <p className="text-sm text-slate-400 mt-2">Data will appear once manpower records are loaded.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-2 h-7 bg-teal-500 rounded-full" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">Budget vs Actual by Department</h3>
              <p className="text-slate-500 text-sm mt-0.5">Sortable — gap highlighted when exceeding 5</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <SortHeader field="department" label="Department" />
                  <SortHeader field="budget" label="Budget" align="right" />
                  <SortHeader field="actual" label="Actual" align="right" />
                  <SortHeader field="gap" label="Gap" align="right" />
                  <SortHeader field="fillRate" label="Fill Rate" align="center" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((dept, idx) => (
                  <tr key={dept.department} onClick={() => setSelectedDept(selectedDept === dept.department ? null : dept.department)} className={`border-t border-slate-100 transition-colors cursor-pointer ${selectedDept === dept.department ? 'ring-2 ring-indigo-200 ' : ''}${dept.isCritical ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'} ${idx % 2 === 1 && !dept.isCritical ? 'bg-slate-50/20' : ''}`}>
                    {/* Department */}
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dept.isCritical ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50 border border-slate-100'}`}>
                          <Building2 className={`w-4 h-4 ${dept.isCritical ? 'text-rose-500' : 'text-slate-400'}`} />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{dept.department}</span>
                        {dept.isCritical && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[9px] font-bold uppercase tracking-wider border border-rose-200">
                            <AlertTriangle className="w-2.5 h-2.5" /> Critical
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Budget */}
                    <td className="px-5 py-5 text-right">
                      <span className="text-base font-black text-slate-900 tabular-nums">{dept.budget}</span>
                    </td>
                    {/* Actual */}
                    <td className="px-5 py-5 text-right">
                      <span className="text-base font-black text-slate-900 tabular-nums">{dept.actual}</span>
                    </td>
                    {/* Gap */}
                    <td className="px-5 py-5 text-right">
                      <span className={`text-base font-black tabular-nums ${dept.gap < -5 ? 'text-rose-600' : dept.gap < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {dept.gap > 0 ? '+' : ''}{dept.gap}
                      </span>
                      <span className={`text-xs font-bold ml-1 ${dept.gap < -5 ? 'text-rose-400' : dept.gap < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ({dept.gapPct.toFixed(1)}%)
                      </span>
                    </td>
                    {/* Fill Rate Bar */}
                    <td className="px-5 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              dept.fillRate < 85 ? 'bg-rose-500' : dept.fillRate < 95 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, dept.fillRate)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold tabular-nums w-12 text-right ${
                          dept.fillRate < 85 ? 'text-rose-600' : dept.fillRate < 95 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {dept.fillRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Total Row */}
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="px-5 py-5">
                    <span className="font-black text-slate-800 text-sm">TOTAL</span>
                  </td>
                  <td className="px-5 py-5 text-right">
                    <span className="text-lg font-black text-slate-900 tabular-nums">{totalBudget}</span>
                  </td>
                  <td className="px-5 py-5 text-right">
                    <span className="text-lg font-black text-slate-900 tabular-nums">{totalActual}</span>
                  </td>
                  <td className="px-5 py-5 text-right">
                    <span className={`text-lg font-black tabular-nums ${totalGap < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {totalGap > 0 ? '+' : ''}{totalGap}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-center">
                    <span className={`text-base font-black tabular-nums ${overallFillRate < 85 ? 'text-rose-600' : overallFillRate < 95 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {overallFillRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Detail Section */}
      {selectedDept && (() => {
        const d = departments.find(x => x.department === selectedDept);
        if (!d) return null;
        const deptManpower = manpower.filter(m => m.department === d.department);
        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-7 bg-teal-500 rounded-full" />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{d.department} — Detail Breakdown</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Budget {d.budget} · Actual {d.actual} · Gap {d.gap > 0 ? '+' : ''}{d.gap} · Fill Rate {d.fillRate.toFixed(1)}%</p>
                </div>
              </div>
              <button onClick={() => setSelectedDept(null)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                <ChevronUp className="w-4 h-4" />Close
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Budget</p><p className="text-xl font-black text-slate-900 tabular-nums">{d.budget}</p></div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Actual</p><p className="text-xl font-black text-slate-900 tabular-nums">{d.actual}</p></div>
                <div className={`p-4 rounded-xl border ${d.gap < -5 ? 'bg-rose-50 border-rose-100' : d.gap < 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}><p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${d.gap < -5 ? 'text-rose-400' : d.gap < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>Gap</p><p className={`text-xl font-black tabular-nums ${d.gap < -5 ? 'text-rose-600' : d.gap < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.gap > 0 ? '+' : ''}{d.gap}</p></div>
                <div className={`p-4 rounded-xl border ${d.fillRate < 85 ? 'bg-rose-50 border-rose-100' : d.fillRate < 95 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}><p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${d.fillRate < 85 ? 'text-rose-400' : d.fillRate < 95 ? 'text-amber-400' : 'text-emerald-400'}`}>Fill Rate</p><p className={`text-xl font-black tabular-nums ${d.fillRate < 85 ? 'text-rose-600' : d.fillRate < 95 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.fillRate.toFixed(1)}%</p></div>
              </div>
              {deptManpower.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-3">Position-level Breakdown</p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="bg-slate-50/80">
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budgeted</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gap</th>
                        <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fill Rate</th>
                      </tr></thead>
                      <tbody>
                        {deptManpower.map((m, i) => {
                          const mGap = (m.actual || 0) - (m.budgeted || 0);
                          const mFill = m.budgeted > 0 ? ((m.actual || 0) / m.budgeted) * 100 : 0;
                          return (
                            <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                              <td className="px-4 py-3"><div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm font-bold text-slate-700">{m.position}</span></div></td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{m.budgeted}</td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{m.actual}</td>
                              <td className={`px-4 py-3 text-right text-sm font-black tabular-nums ${mGap < -5 ? 'text-rose-600' : mGap < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{mGap > 0 ? '+' : ''}{mGap}</td>
                              <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-2"><div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${mFill < 85 ? 'bg-rose-500' : mFill < 95 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, mFill)}%` }} /></div><span className={`text-xs font-bold tabular-nums ${mFill < 85 ? 'text-rose-600' : mFill < 95 ? 'text-amber-600' : 'text-emerald-600'}`}>{mFill.toFixed(0)}%</span></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Priority Recruitment List */}
      {criticalDepts.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-7 bg-rose-500 rounded-full" />
            <h3 className="text-xl font-bold text-slate-800">Priority Recruitment List</h3>
            <span className="text-sm text-slate-400 font-medium">— Departments with gap {'>'} 5</span>
          </div>
          <div className="space-y-3">
            {criticalDepts.map((dept, idx) => (
              <div key={dept.department} className="flex items-center gap-4 p-4 rounded-2xl border border-rose-200 bg-rose-50/30">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg bg-rose-100 text-rose-600">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{dept.department}</p>
                  <p className="text-xs text-slate-400 font-medium">{dept.actual} actual · {dept.budget} budget · {Math.abs(dept.gap)} positions to fill</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, dept.fillRate)}%` }} />
                  </div>
                  <span className="text-sm font-black text-rose-600 tabular-nums w-12 text-right">{dept.fillRate.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ownership */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-7 bg-teal-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Ownership</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary</p>
              <p className="text-base font-bold text-slate-800">HR Planning Team</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Workforce planning & analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Co-Owner</p>
              <p className="text-base font-bold text-slate-800">Department Heads</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Department-level staffing</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget Approval</p>
              <p className="text-base font-bold text-slate-800">Finance Department</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Budget validation & approval</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
