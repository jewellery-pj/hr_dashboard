import React, { useMemo, useState } from 'react';
import {
  Store,
  Users,
  TrendingDown,
  Calendar,
  Award,
  AlertTriangle,
  ArrowRight,
  UserCog,
  MapPin,
  Target,
  Siren,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react';
import { Resignation, Manpower } from '../data/mockData';

interface BranchScorecardProps {
  resignations: Resignation[];
  manpower: Manpower[];
}

type Score = 'A' | 'B' | 'C' | 'D';

function vacancyToScore(vacancyRate: number): Score {
  if (vacancyRate <= 3) return 'A';
  if (vacancyRate <= 7) return 'B';
  if (vacancyRate <= 12) return 'C';
  return 'D';
}

function turnoverToScore(turnoverRate: number): Score {
  if (turnoverRate < 5) return 'A';
  if (turnoverRate < 10) return 'B';
  if (turnoverRate < 15) return 'C';
  return 'D';
}

function attendanceToScore(attendanceRate: number): Score {
  if (attendanceRate >= 95) return 'A';
  if (attendanceRate >= 90) return 'B';
  if (attendanceRate >= 85) return 'C';
  return 'D';
}

function scoreToValue(s: Score): number {
  return { A: 4, B: 3, C: 2, D: 1 }[s];
}

function valueToScore(v: number): Score {
  if (v >= 3.5) return 'A';
  if (v >= 2.5) return 'B';
  if (v >= 1.5) return 'C';
  return 'D';
}

interface BranchData {
  branch: string;
  staff: number;
  vacancy: number;
  vacancyRate: number;
  turnover: number;
  turnoverRate: number;
  attendance: number;
  score: Score;
  vacancyScore: Score;
  turnoverScore: Score;
  attendanceScore: Score;
}

const scoreConfig: Record<Score, { label: string; badge: string; bg: string; border: string; text: string; bar: string }> = {
  A: { label: 'Excellent', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', bg: 'bg-emerald-50/40', border: 'border-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  B: { label: 'Good', badge: 'bg-blue-100 text-blue-700 border-blue-300', bg: 'bg-blue-50/40', border: 'border-blue-200', text: 'text-blue-600', bar: 'bg-blue-500' },
  C: { label: 'At Risk', badge: 'bg-amber-100 text-amber-700 border-amber-300', bg: 'bg-amber-50/40', border: 'border-amber-300', text: 'text-amber-600', bar: 'bg-amber-500' },
  D: { label: 'Critical', badge: 'bg-rose-100 text-rose-700 border-rose-300', bg: 'bg-rose-50/40', border: 'border-rose-300', text: 'text-rose-600', bar: 'bg-rose-500' },
};

export const BranchScorecard: React.FC<BranchScorecardProps> = ({ resignations, manpower }) => {
  const branches = useMemo<BranchData[]>(() => {
    // Group manpower by branch/shopLocation
    const branchMap = manpower.reduce((acc, m) => {
      const branch = m.shopLocation || m.branch || 'Unknown';
      if (!acc[branch]) acc[branch] = { staff: 0, budgeted: 0, resignations: 0 };
      acc[branch].staff += m.actual || 0;
      acc[branch].budgeted += m.budgeted || 0;
      return acc;
    }, {} as Record<string, { staff: number; budgeted: number; resignations: number }>);

    // Count resignations per branch (match by location if available)
    for (const r of resignations) {
      const loc = r.location || r.division || '';
      // Try to match resignation location to a branch key
      const matchKey = Object.keys(branchMap).find(k =>
        k.toLowerCase().includes(loc.toLowerCase()) || loc.toLowerCase().includes(k.toLowerCase())
      );
      if (matchKey) {
        branchMap[matchKey].resignations++;
      }
    }

    return (Object.entries(branchMap) as [string, { staff: number; budgeted: number; resignations: number }][]).map(([branch, data]) => {
      const vacancy = Math.max(0, data.budgeted - data.staff);
      const vacancyRate = data.budgeted > 0 ? (vacancy / data.budgeted) * 100 : 0;
      const turnoverRate = data.staff > 0 ? (data.resignations / data.staff) * 100 : 0;
      // Attendance: estimate from staff ratio (no direct attendance data, use staff/budgeted as proxy)
      const attendanceRate = data.budgeted > 0 ? Math.min(100, (data.staff / data.budgeted) * 100) : 100;

      const vScore = vacancyToScore(vacancyRate);
      const tScore = turnoverToScore(turnoverRate);
      const aScore = attendanceToScore(attendanceRate);

      // Weighted: 40% turnover, 30% vacancy, 30% attendance
      const overall = scoreToValue(tScore) * 0.40 + scoreToValue(vScore) * 0.30 + scoreToValue(aScore) * 0.30;
      const score = valueToScore(overall);

      return {
        branch,
        staff: data.staff,
        vacancy,
        vacancyRate,
        turnover: data.resignations,
        turnoverRate,
        attendance: Math.round(attendanceRate),
        score,
        vacancyScore: vScore,
        turnoverScore: tScore,
        attendanceScore: aScore,
      };
    }).filter(b => b.staff > 0);
  }, [resignations, manpower]);

  const [sortField, setSortField] = useState<'branch' | 'staff' | 'vacancyRate' | 'turnoverRate' | 'attendance'>('score');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...branches].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'branch') cmp = a.branch.localeCompare(b.branch);
      else cmp = (a[sortField] as number) - (b[sortField] as number);
      if (sortField === 'score') cmp = scoreToValue(a.score) - scoreToValue(b.score);
      return sortAsc ? cmp : -cmp;
    });
  }, [branches, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const redAlertBranches = branches.filter(b => b.score === 'C' || b.score === 'D');
  const totalStaff = branches.reduce((s, b) => s + b.staff, 0);
  const avgVacancy = branches.length > 0 ? branches.reduce((s, b) => s + b.vacancyRate, 0) / branches.length : 0;
  const avgTurnover = branches.length > 0 ? branches.reduce((s, b) => s + b.turnoverRate, 0) / branches.length : 0;
  const avgAttendance = branches.length > 0 ? branches.reduce((s, b) => s + b.attendance, 0) / branches.length : 0;

  const SortHeader = ({ field, label, align = 'left' }: { field: typeof sortField; label: string; align?: 'left' | 'right' | 'center' }) => (
    <th
      onClick={() => toggleSort(field)}
      className={`px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors select-none ${
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
      <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500/30 backdrop-blur rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300/70">Branch Performance</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Branch HR Performance Scorecard</h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Total Staff</span>
              <span className="text-3xl font-black">{totalStaff}</span>
              <span className="text-xs font-bold text-white/70 mt-1">{branches.length} branches</span>
            </div>
          </div>
        </div>
        {redAlertBranches.length > 0 && (
          <div className="mt-6 flex items-center gap-3 px-5 py-3 bg-rose-500/20 backdrop-blur rounded-xl border border-rose-400/30">
            <Siren className="w-5 h-5 text-rose-300 flex-shrink-0 animate-pulse" />
            <p className="text-sm font-bold text-rose-100">
              RED ALERT: {redAlertBranches.map(b => b.branch).join(', ')} — Score {redAlertBranches.map(b => b.score).join(' & ')} require immediate action
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center"><Users className="w-4 h-4 text-indigo-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Vacancy</span>
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{avgVacancy.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center"><TrendingDown className="w-4 h-4 text-rose-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Turnover</span>
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{avgTurnover.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center"><Calendar className="w-4 h-4 text-emerald-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Attendance</span>
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{avgAttendance.toFixed(0)}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-amber-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Red Alerts</span>
          </div>
          <p className="text-2xl font-black text-rose-600 tabular-nums">{redAlertBranches.length}</p>
        </div>
      </div>

      {/* Branch Table */}
      {branches.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-700">No Branch Data Available</p>
          <p className="text-sm text-slate-400 mt-2">Branch data will appear once manpower data is loaded.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-7 bg-indigo-500 rounded-full" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">Branch Scorecard</h3>
                <p className="text-slate-500 text-sm mt-0.5">Sortable — scores computed from live data</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(['A', 'B', 'C', 'D'] as Score[]).map(s => {
                const count = branches.filter(b => b.score === s).length;
                if (count === 0) return null;
                const sc = scoreConfig[s];
                return <span key={s} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${sc.badge}`}>{s}: {count}</span>;
              })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <SortHeader field="branch" label="Branch" />
                  <SortHeader field="staff" label="Staff" align="right" />
                  <SortHeader field="vacancyRate" label="Vacancy" align="right" />
                  <SortHeader field="turnoverRate" label="Turnover" align="right" />
                  <SortHeader field="attendance" label="Attendance" align="right" />
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Score</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((branch, idx) => {
                  const sc = scoreConfig[branch.score];
                  const isRedAlert = branch.score === 'C' || branch.score === 'D';
                  const isActive = selectedBranch === branch.branch;
                  return (
                    <tr key={branch.branch} onClick={() => setSelectedBranch(isActive ? null : branch.branch)} className={`border-t border-slate-100 transition-colors cursor-pointer ${isActive ? 'ring-2 ring-indigo-200 ' : ''}${isRedAlert ? sc.bg : 'hover:bg-slate-50/50'} ${idx % 2 === 1 && !isRedAlert ? 'bg-slate-50/20' : ''}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sc.bg} border ${sc.border}`}>
                            <Store className={`w-5 h-5 ${sc.text}`} />
                          </div>
                          <span className="font-bold text-slate-800 text-sm">{branch.branch}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right"><span className="text-lg font-black text-slate-900 tabular-nums">{branch.staff}</span></td>
                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${branch.vacancyRate > 10 ? 'bg-rose-500' : branch.vacancyRate > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, branch.vacancyRate * 5)}%` }} />
                          </div>
                          <span className={`text-sm font-bold tabular-nums ${branch.vacancyRate > 10 ? 'text-rose-600' : branch.vacancyRate > 5 ? 'text-amber-600' : 'text-slate-700'}`}>{branch.vacancyRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${branch.turnoverRate > 15 ? 'bg-rose-500' : branch.turnoverRate > 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, branch.turnoverRate * 3)}%` }} />
                          </div>
                          <span className={`text-sm font-bold tabular-nums ${branch.turnoverRate > 15 ? 'text-rose-600' : branch.turnoverRate > 10 ? 'text-amber-600' : 'text-slate-700'}`}>{branch.turnoverRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${branch.attendance < 90 ? 'bg-rose-500' : branch.attendance < 95 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${branch.attendance}%` }} />
                          </div>
                          <span className={`text-sm font-bold tabular-nums ${branch.attendance < 90 ? 'text-rose-600' : branch.attendance < 95 ? 'text-amber-600' : 'text-slate-700'}`}>{branch.attendance}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          {isRedAlert ? (
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${sc.border} ${sc.bg} shadow-sm`}>
                              <AlertTriangle className={`w-4 h-4 ${sc.text} animate-pulse`} />
                              <span className={`text-lg font-black ${sc.text}`}>{branch.score}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${sc.text}`}>{sc.label}</span>
                            </div>
                          ) : (
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${sc.border} ${sc.bg}`}>
                              <Award className={`w-4 h-4 ${sc.text}`} />
                              <span className={`text-lg font-black ${sc.text}`}>{branch.score}</span>
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
      {selectedBranch && (() => {
        const b = branches.find(x => x.branch === selectedBranch);
        if (!b) return null;
        const sc = scoreConfig[b.score];
        const branchResignations = resignations.filter(r => {
          const loc = r.location || r.division || '';
          return loc.toLowerCase().includes(b.branch.toLowerCase()) || b.branch.toLowerCase().includes(loc.toLowerCase());
        });
        const branchManpower = manpower.filter(m => (m.shopLocation || m.branch || 'Unknown') === b.branch);
        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-7 bg-indigo-500 rounded-full" />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{b.branch} — Detail Breakdown</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Score {b.score} ({sc.label}) · {b.staff} staff · {b.vacancy} vacant · {b.turnover} resignations</p>
                </div>
              </div>
              <button onClick={() => setSelectedBranch(null)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                <ChevronUp className="w-4 h-4" />Close
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Staff</p><p className="text-xl font-black text-slate-900 tabular-nums">{b.staff}</p></div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Vacancy</p><p className="text-xl font-black text-rose-600 tabular-nums">{b.vacancy} ({b.vacancyRate.toFixed(1)}%)</p></div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Turnover</p><p className="text-xl font-black text-rose-600 tabular-nums">{b.turnover} ({b.turnoverRate.toFixed(1)}%)</p></div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attendance</p><p className="text-xl font-black text-slate-900 tabular-nums">{b.attendance}%</p></div>
              </div>
              {branchManpower.length > 0 && (
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
                        {branchManpower.map((m, i) => (
                          <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm font-bold text-slate-700">{m.position}</span></div></td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{m.budgeted}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{m.actual}</td>
                            <td className="px-4 py-3 text-right text-sm font-black text-rose-600 tabular-nums">{Math.max(0, m.budgeted - m.actual)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {branchResignations.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-3">Resignation List ({branchResignations.length})</p>
                  <div className="overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0"><tr className="bg-slate-50/80">
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                      </tr></thead>
                      <tbody>
                        {branchResignations.slice(0, 30).map((r, i) => (
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

      {/* Ownership */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-7 bg-indigo-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Ownership</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center"><MapPin className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regional Oversight</p><p className="text-base font-bold text-slate-800">Regional Operations Managers</p></div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center"><Store className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local Execution</p><p className="text-base font-bold text-slate-800">Branch Managers</p></div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center"><UserCog className="w-6 h-6 text-indigo-600" /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">HR Support</p><p className="text-base font-bold text-slate-800">HR Business Partners</p></div>
          </div>
        </div>
      </div>

    </div>
  );
};
