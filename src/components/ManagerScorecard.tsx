import React, { useMemo, useState } from 'react';
import {
  UserCog,
  TrendingDown,
  AlertTriangle,
  Award,
  ChevronUp,
  ChevronDown,
  Users,
  Gauge,
} from 'lucide-react';
import { Resignation, Manpower } from '../data/mockData';

interface ManagerScorecardProps {
  resignations: Resignation[];
  manpower: Manpower[];
}

type Score = 'A' | 'B' | 'C' | 'D';

const SCORE_WEIGHTS = {
  turnover: 0.40,
  vacancy: 0.35,
  utilization: 0.25,
} as const;

const gradeValue: Record<Score, number> = { A: 4, B: 3, C: 2, D: 1 };
const valueToScore = (v: number): Score => (v >= 3.5 ? 'A' : v >= 2.5 ? 'B' : v >= 1.5 ? 'C' : 'D');

function turnoverToScore(rate: number): Score {
  if (rate < 5) return 'A';
  if (rate < 10) return 'B';
  if (rate < 15) return 'C';
  return 'D';
}

function vacancyToScore(rate: number): Score {
  if (rate <= 3) return 'A';
  if (rate <= 7) return 'B';
  if (rate <= 12) return 'C';
  return 'D';
}

function utilizationToScore(rate: number): Score {
  if (rate >= 95) return 'A';
  if (rate >= 85) return 'B';
  if (rate >= 75) return 'C';
  return 'D';
}

interface ManagerData {
  department: string;
  headcount: number;
  budgeted: number;
  turnoverRate: number;
  vacancyRate: number;
  utilizationRate: number;
  turnoverScore: Score;
  vacancyScore: Score;
  utilizationScore: Score;
  overallScore: number;
  overallGrade: Score;
}

const scoreConfig: Record<Score, { label: string; badge: string; bg: string; border: string; text: string; bar: string }> = {
  A: { label: 'Excellent', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', bg: 'bg-emerald-50/40', border: 'border-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  B: { label: 'Good', badge: 'bg-blue-100 text-blue-700 border-blue-300', bg: 'bg-blue-50/40', border: 'border-blue-200', text: 'text-blue-600', bar: 'bg-blue-500' },
  C: { label: 'At Risk', badge: 'bg-amber-100 text-amber-700 border-amber-300', bg: 'bg-amber-50/40', border: 'border-amber-300', text: 'text-amber-600', bar: 'bg-amber-500' },
  D: { label: 'Critical', badge: 'bg-rose-100 text-rose-700 border-rose-300', bg: 'bg-rose-50/40', border: 'border-rose-300', text: 'text-rose-600', bar: 'bg-rose-500' },
};

export const ManagerScorecard: React.FC<ManagerScorecardProps> = ({ resignations, manpower }) => {
  const managers = useMemo<ManagerData[]>(() => {
    const deptMap = manpower.reduce((acc, m) => {
      const dept = m.department;
      if (!acc[dept]) acc[dept] = { actual: 0, budgeted: 0 };
      acc[dept].actual += m.actual || 0;
      acc[dept].budgeted += m.budgeted || 0;
      return acc;
    }, {} as Record<string, { actual: number; budgeted: number }>);

    const resByDept = resignations.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (Object.entries(deptMap) as [string, { actual: number; budgeted: number }][])
      .map(([dept, data]) => {
        const headcount = data.actual;
        const budgeted = data.budgeted;
        const vacancy = Math.max(0, budgeted - headcount);
        const turnoverRate = headcount > 0 ? ((resByDept[dept] || 0) / headcount) * 100 : 0;
        const vacancyRate = budgeted > 0 ? (vacancy / budgeted) * 100 : 0;
        const utilizationRate = budgeted > 0 ? (headcount / budgeted) * 100 : 100;

        const tScore = turnoverToScore(turnoverRate);
        const vScore = vacancyToScore(vacancyRate);
        const uScore = utilizationToScore(utilizationRate);

        const overallScore =
          gradeValue[tScore] * SCORE_WEIGHTS.turnover +
          gradeValue[vScore] * SCORE_WEIGHTS.vacancy +
          gradeValue[uScore] * SCORE_WEIGHTS.utilization;

        return {
          department: dept,
          headcount,
          budgeted,
          turnoverRate,
          vacancyRate,
          utilizationRate,
          turnoverScore: tScore,
          vacancyScore: vScore,
          utilizationScore: uScore,
          overallScore: Math.round(overallScore * 100) / 100,
          overallGrade: valueToScore(overallScore),
        };
      })
      .filter(d => d.headcount > 0);
  }, [resignations, manpower]);

  const [sortField, setSortField] = useState<'department' | 'headcount' | 'turnoverRate' | 'vacancyRate' | 'overallScore'>('overallScore');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedMgr, setSelectedMgr] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...managers].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'department') cmp = a.department.localeCompare(b.department);
      else cmp = (a[sortField] as number) - (b[sortField] as number);
      return sortAsc ? cmp : -cmp;
    });
  }, [managers, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const ranking = useMemo(() => [...managers].sort((a, b) => b.overallScore - a.overallScore), [managers]);

  const gradeA = managers.filter(m => m.overallGrade === 'A').length;
  const gradeB = managers.filter(m => m.overallGrade === 'B').length;
  const gradeC = managers.filter(m => m.overallGrade === 'C').length;
  const gradeD = managers.filter(m => m.overallGrade === 'D').length;
  const avgScore = managers.length > 0 ? managers.reduce((s, m) => s + m.overallScore, 0) / managers.length : 0;

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
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/30 backdrop-blur rounded-xl flex items-center justify-center">
                <UserCog className="w-5 h-5 text-purple-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-300/70">Leadership Effectiveness</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Department Manager Scorecard</h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Avg Effectiveness</span>
              <span className="text-3xl font-black">{avgScore.toFixed(1)}</span>
              <span className="text-xs font-bold text-white/70 mt-1">/ 4.0</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-xl border border-white/10">
                <span className="text-lg font-black text-emerald-400">{gradeA}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">A</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-xl border border-white/10">
                <span className="text-lg font-black text-blue-400">{gradeB}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">B</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-xl border border-white/10">
                <span className="text-lg font-black text-amber-400">{gradeC}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">C</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-xl border border-white/10">
                <span className="text-lg font-black text-rose-400">{gradeD}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">D</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Weights */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gauge className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-800">Leadership Score Calculation</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(SCORE_WEIGHTS).map(([key, weight]) => (
            <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-xl font-black text-slate-800 tabular-nums">{Math.round(weight * 100)}%</p>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${weight * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manager Table */}
      {managers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
          <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-700">No Manager Data Available</p>
          <p className="text-sm text-slate-400 mt-2">Data will appear once manpower records are loaded.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-2 h-7 bg-purple-500 rounded-full" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">Manager Scorecard</h3>
              <p className="text-slate-500 text-sm mt-0.5">Sortable — leadership effectiveness from live HR data</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <SortHeader field="department" label="Department Head" />
                  <SortHeader field="headcount" label="Headcount" align="right" />
                  <SortHeader field="turnoverRate" label="Turnover" align="right" />
                  <SortHeader field="vacancyRate" label="Vacancy" align="right" />
                  <th className="px-5 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Utilization</th>
                  <SortHeader field="overallScore" label="Score" align="center" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((mgr, idx) => {
                  const sc = scoreConfig[mgr.overallGrade];
                  const isRedAlert = mgr.overallGrade === 'C' || mgr.overallGrade === 'D';
                  const isActive = selectedMgr === mgr.department;
                  return (
                    <tr key={mgr.department} onClick={() => setSelectedMgr(isActive ? null : mgr.department)} className={`border-t border-slate-100 transition-colors cursor-pointer ${isActive ? 'ring-2 ring-indigo-200 ' : ''}${isRedAlert ? sc.bg : 'hover:bg-slate-50/50'} ${idx % 2 === 1 && !isRedAlert ? 'bg-slate-50/20' : ''}`}>
                      {/* Department Head */}
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sc.bg} border ${sc.border}`}>
                            <UserCog className={`w-5 h-5 ${sc.text}`} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">Dept Head</span>
                            <span className="text-xs text-slate-400 font-medium">{mgr.department}</span>
                          </div>
                        </div>
                      </td>
                      {/* Headcount */}
                      <td className="px-5 py-5 text-right">
                        <span className="text-base font-black text-slate-900 tabular-nums">{mgr.headcount}</span>
                        {mgr.budgeted > 0 && <span className="text-xs text-slate-400 ml-1">/ {mgr.budgeted}</span>}
                      </td>
                      {/* Turnover */}
                      <td className="px-5 py-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <span className={`text-sm font-bold tabular-nums ${mgr.turnoverRate > 15 ? 'text-rose-600' : mgr.turnoverRate > 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {mgr.turnoverRate.toFixed(1)}%
                          </span>
                          <span className={`text-[9px] font-bold ${scoreConfig[mgr.turnoverScore].text}`}>({mgr.turnoverScore})</span>
                        </div>
                      </td>
                      {/* Vacancy */}
                      <td className="px-5 py-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <span className={`text-sm font-bold tabular-nums ${mgr.vacancyRate > 12 ? 'text-rose-600' : mgr.vacancyRate > 7 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {mgr.vacancyRate.toFixed(1)}%
                          </span>
                          <span className={`text-[9px] font-bold ${scoreConfig[mgr.vacancyScore].text}`}>({mgr.vacancyScore})</span>
                        </div>
                      </td>
                      {/* Utilization */}
                      <td className="px-5 py-5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span className={`text-sm font-bold tabular-nums ${mgr.utilizationRate < 75 ? 'text-rose-600' : mgr.utilizationRate < 85 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {mgr.utilizationRate.toFixed(0)}%
                          </span>
                          <span className={`text-[9px] font-bold ${scoreConfig[mgr.utilizationScore].text}`}>({mgr.utilizationScore})</span>
                        </div>
                      </td>
                      {/* Overall Score */}
                      <td className="px-5 py-5">
                        <div className="flex justify-center">
                          {isRedAlert ? (
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 ${sc.border} ${sc.bg} shadow-sm`}>
                              <AlertTriangle className={`w-4 h-4 ${sc.text} animate-pulse`} />
                              <span className={`text-lg font-black ${sc.text}`}>{mgr.overallGrade}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>{sc.label}</span>
                            </div>
                          ) : (
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${sc.border} ${sc.bg}`}>
                              <Award className={`w-4 h-4 ${sc.text}`} />
                              <span className={`text-lg font-black ${sc.text}`}>{mgr.overallGrade}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>{sc.label}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Section */}
      {selectedMgr && (() => {
        const m = managers.find(x => x.department === selectedMgr);
        if (!m) return null;
        const sc = scoreConfig[m.overallGrade];
        const deptResignations = resignations.filter(r => r.department === m.department);
        const deptManpower = manpower.filter(x => x.department === m.department);
        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-7 bg-purple-500 rounded-full" />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{m.department} — Manager Detail Breakdown</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Score {m.overallScore.toFixed(2)}/4.0 · Grade {m.overallGrade} ({sc.label}) · {m.headcount}/{m.budgeted} staff</p>
                </div>
              </div>
              <button onClick={() => setSelectedMgr(null)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                <ChevronUp className="w-4 h-4" />Close
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Headcount</p><p className="text-xl font-black text-slate-900 tabular-nums">{m.headcount} / {m.budgeted}</p></div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Turnover Rate</p><p className="text-xl font-black text-rose-600 tabular-nums">{m.turnoverRate.toFixed(1)}%</p><p className="text-[10px] font-bold mt-1">Grade: {m.turnoverScore}</p></div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Vacancy Rate</p><p className="text-xl font-black text-rose-600 tabular-nums">{m.vacancyRate.toFixed(1)}%</p><p className="text-[10px] font-bold mt-1">Grade: {m.vacancyScore}</p></div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Utilization</p><p className="text-xl font-black text-slate-900 tabular-nums">{m.utilizationRate.toFixed(0)}%</p><p className="text-[10px] font-bold mt-1">Grade: {m.utilizationScore}</p></div>
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
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacant</th>
                      </tr></thead>
                      <tbody>
                        {deptManpower.map((p, i) => (
                          <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                            <td className="px-4 py-3"><span className="text-sm font-bold text-slate-700">{p.position}</span></td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{p.budgeted}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{p.actual}</td>
                            <td className="px-4 py-3 text-right text-sm font-black text-rose-600 tabular-nums">{Math.max(0, p.budgeted - p.actual)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {deptResignations.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-3">Resignation List ({deptResignations.length})</p>
                  <div className="overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0"><tr className="bg-slate-50/80">
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                      </tr></thead>
                      <tbody>
                        {deptResignations.slice(0, 30).map((r, i) => (
                          <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-bold text-rose-600">{r.name.charAt(0)}</div><span className="text-sm font-bold text-slate-700">{r.name}</span></div></td>
                            <td className="px-4 py-3 text-sm text-slate-600">{r.position || r.designation || '—'}</td>
                            <td className="px-4 py-3 text-sm text-slate-500">{r.resignationDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Leadership Ranking */}
      {ranking.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-7 bg-purple-500 rounded-full" />
            <h3 className="text-xl font-bold text-slate-800">Leadership Effectiveness Ranking</h3>
            <span className="text-sm text-slate-400 font-medium">— Best to worst</span>
          </div>
          <div className="space-y-3">
            {ranking.map((mgr, idx) => {
              const sc = scoreConfig[mgr.overallGrade];
              const isRedAlert = mgr.overallGrade === 'C' || mgr.overallGrade === 'D';
              return (
                <div key={mgr.department} className={`flex items-center gap-4 p-4 rounded-2xl border ${isRedAlert ? sc.border : 'border-slate-100'} ${isRedAlert ? sc.bg : 'bg-slate-50/50'}`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                    idx === 0 ? 'bg-emerald-100 text-emerald-600' :
                    idx === 1 ? 'bg-blue-100 text-blue-600' :
                    idx === ranking.length - 1 ? 'bg-rose-100 text-rose-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">Dept Head — {mgr.department}</p>
                    <p className="text-xs text-slate-400 font-medium">{mgr.headcount} staff · {mgr.turnoverRate.toFixed(1)}% turnover · {mgr.vacancyRate.toFixed(1)}% vacancy</p>
                  </div>
                  <div className="hidden md:flex items-center gap-3 w-48">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${sc.bar} rounded-full transition-all duration-1000`} style={{ width: `${(mgr.overallScore / 4) * 100}%` }} />
                    </div>
                    <span className="text-sm font-black text-slate-700 tabular-nums w-10 text-right">{mgr.overallScore.toFixed(1)}</span>
                  </div>
                  <div className="flex-shrink-0">
                    {isRedAlert ? (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${sc.badge}`}>
                        <AlertTriangle className={`w-3.5 h-3.5 ${sc.text}`} />
                        <span className={`text-sm font-black ${sc.text}`}>{mgr.overallGrade}</span>
                      </div>
                    ) : (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${sc.badge}`}>
                        <Award className={`w-3.5 h-3.5 ${sc.text}`} />
                        <span className={`text-sm font-black ${sc.text}`}>{mgr.overallGrade}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ownership */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-7 bg-purple-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Ownership</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <UserCog className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary</p>
              <p className="text-lg font-bold text-slate-800">HR GM</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Overall leadership effectiveness oversight</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Co-Owner</p>
              <p className="text-lg font-bold text-slate-800">Respective Functional Directors</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Direct manager accountability</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
