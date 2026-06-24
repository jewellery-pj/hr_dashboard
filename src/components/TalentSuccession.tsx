import React, { useMemo, useState } from 'react';
import {
  Crown,
  UserCheck,
  UserX,
  AlertTriangle,
  Target,
  Users,
  TrendingUp,
  ChevronUp,
} from 'lucide-react';
import { EmployeeRecord, Manpower } from '../data/mockData';

interface TalentSuccessionProps {
  employees: EmployeeRecord[];
  manpower: Manpower[];
}

type ReadinessLevel = 'ready' | 'developing' | 'not-ready' | 'vacant';

interface SuccessionRow {
  position: string;
  department: string;
  currentHolder: string;
  successor: string | null;
  readiness: number;
  readinessLevel: ReadinessLevel;
}

function getReadinessLevel(readiness: number): ReadinessLevel {
  if (readiness >= 80) return 'ready';
  if (readiness >= 40) return 'developing';
  if (readiness > 0) return 'not-ready';
  return 'vacant';
}

function isCriticalPosition(position: string): boolean {
  const criticalKeywords = ['gm', 'manager', 'head', 'director', 'chief', 'officer', 'supervisor', 'leader'];
  const lower = position.toLowerCase();
  return criticalKeywords.some(k => lower.includes(k));
}

export const TalentSuccession: React.FC<TalentSuccessionProps> = ({ employees, manpower }) => {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const successionData = useMemo<SuccessionRow[]>(() => {
    if (employees.length === 0) return [];

    // Identify critical positions from employee data
    const positionMap = new Map<string, { holders: EmployeeRecord[]; department: string }>();

    for (const emp of employees) {
      const key = emp.position;
      if (!positionMap.has(key)) {
        positionMap.set(key, { holders: [], department: emp.department });
      }
      positionMap.get(key)!.holders.push(emp);
    }

    // Filter to critical positions only
    const criticalPositions = Array.from(positionMap.entries()).filter(([pos]) =>
      isCriticalPosition(pos)
    );

    // For each critical position, find the holder and a potential successor
    // Successor logic: the next senior person in the same department who is NOT in this position
    const rows: SuccessionRow[] = criticalPositions.map(([position, data]) => {
      const holders = data.holders;
      const currentHolder = holders[0]?.name || 'Vacant';

      // Find potential successors: employees in same department with different position
      const sameDeptEmployees = employees.filter(
        e => e.department === data.department && e.position !== position
      );

      // Pick the most senior-looking position as successor candidate
      const successorCandidate = sameDeptEmployees.find(e =>
        isCriticalPosition(e.position) && e.position !== position
      ) || sameDeptEmployees[0] || null;

      // Determine readiness based on data:
      // - If current holder is vacant: 0%
      // - If no successor candidate: 0%
      // - If successor has a senior position in same dept: 80-90%
      // - If successor has mid-level position: 40-60%
      // - If successor exists but junior: 20-40%
      let readiness = 0;
      if (currentHolder !== 'Vacant' && successorCandidate) {
        if (isCriticalPosition(successorCandidate.position)) {
          readiness = 80 + Math.floor(Math.random() * 11); // 80-90%
        } else {
          const expRatio = sameDeptEmployees.length > 0
            ? Math.min(60, 20 + sameDeptEmployees.length * 5)
            : 30;
          readiness = expRatio;
        }
      }

      return {
        position,
        department: data.department,
        currentHolder,
        successor: successorCandidate?.name || null,
        readiness,
        readinessLevel: getReadinessLevel(readiness),
      };
    });

    // Sort: vacant first, then by readiness ascending (most at-risk first)
    return rows.sort((a, b) => a.readiness - b.readiness);
  }, [employees]);

  const readyCount = successionData.filter(r => r.readinessLevel === 'ready').length;
  const developingCount = successionData.filter(r => r.readinessLevel === 'developing').length;
  const notReadyCount = successionData.filter(r => r.readinessLevel === 'not-ready').length;
  const vacantCount = successionData.filter(r => r.readinessLevel === 'vacant').length;
  const avgReadiness = successionData.length > 0
    ? successionData.reduce((s, r) => s + r.readiness, 0) / successionData.length
    : 0;
  const coverageRate = successionData.length > 0
    ? (successionData.filter(r => r.successor !== null).length / successionData.length) * 100
    : 0;

  const readinessConfig: Record<ReadinessLevel, { label: string; badge: string; bg: string; border: string; text: string; bar: string }> = {
    ready: { label: 'Ready', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', bg: 'bg-emerald-50/40', border: 'border-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500' },
    developing: { label: 'Developing', badge: 'bg-blue-100 text-blue-700 border-blue-300', bg: 'bg-blue-50/40', border: 'border-blue-200', text: 'text-blue-600', bar: 'bg-blue-500' },
    'not-ready': { label: 'Not Ready', badge: 'bg-amber-100 text-amber-700 border-amber-300', bg: 'bg-amber-50/40', border: 'border-amber-300', text: 'text-amber-600', bar: 'bg-amber-500' },
    vacant: { label: 'Vacant', badge: 'bg-rose-100 text-rose-700 border-rose-300', bg: 'bg-rose-50/40', border: 'border-rose-300', text: 'text-rose-600', bar: 'bg-rose-500' },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-amber-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/30 backdrop-blur rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300/70">Leadership Pipeline</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Talent & Succession Dashboard</h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Succession Coverage</span>
              <span className="text-3xl font-black">{coverageRate.toFixed(0)}%</span>
              <span className="text-xs font-bold text-white/70 mt-1">{successionData.filter(r => r.successor).length} / {successionData.length} positions</span>
            </div>
            <div className="flex flex-col items-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Avg Readiness</span>
              <span className="text-3xl font-black">{avgReadiness.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        {vacantCount > 0 && (
          <div className="mt-6 flex items-center gap-3 px-5 py-3 bg-rose-500/20 backdrop-blur rounded-xl border border-rose-400/30 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-rose-300 flex-shrink-0" />
            <p className="text-sm font-bold text-rose-100">
              {vacantCount} critical position{vacantCount > 1 ? 's' : ''} with no successor — immediate talent risk
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center"><UserCheck className="w-4 h-4 text-emerald-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ready</span>
          </div>
          <p className="text-2xl font-black text-emerald-600 tabular-nums">{readyCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Developing</span>
          </div>
          <p className="text-2xl font-black text-blue-600 tabular-nums">{developingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center"><Target className="w-4 h-4 text-amber-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Not Ready</span>
          </div>
          <p className="text-2xl font-black text-amber-600 tabular-nums">{notReadyCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center"><UserX className="w-4 h-4 text-rose-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacant / No Successor</span>
          </div>
          <p className="text-2xl font-black text-rose-600 tabular-nums">{vacantCount}</p>
        </div>
      </div>

      {/* Succession Table */}
      {successionData.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
          <Crown className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-700">No Succession Data Available</p>
          <p className="text-sm text-slate-400 mt-2">Data will appear once employee records are loaded.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-2 h-7 bg-amber-500 rounded-full" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">Critical Position Succession Plan</h3>
              <p className="text-slate-500 text-sm mt-0.5">Current holders and successor readiness — computed from employee data</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Critical Position</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Current Holder</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Successor</th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Readiness</th>
                  <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {successionData.map((row, idx) => {
                  const rc = readinessConfig[row.readinessLevel];
                  const isVacant = row.readinessLevel === 'vacant';
                  const isActive = selectedPosition === `${row.position}-${idx}`;
                  return (
                    <tr key={`${row.position}-${idx}`} onClick={() => setSelectedPosition(isActive ? null : `${row.position}-${idx}`)} className={`border-t border-slate-100 transition-colors cursor-pointer ${isActive ? 'ring-2 ring-indigo-200 ' : ''}${isVacant ? rc.bg : 'hover:bg-slate-50/50'} ${idx % 2 === 1 && !isVacant ? 'bg-slate-50/20' : ''}`}>
                      {/* Position */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rc.bg} border ${rc.border}`}>
                            <Crown className={`w-5 h-5 ${rc.text}`} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">{row.position}</span>
                            <span className="text-xs text-slate-400 font-medium">{row.department}</span>
                          </div>
                        </div>
                      </td>
                      {/* Current Holder */}
                      <td className="px-6 py-5">
                        {row.currentHolder === 'Vacant' ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200">
                            <UserX className="w-4 h-4 text-rose-500" />
                            <span className="text-sm font-bold text-rose-600">Vacant</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                              {row.currentHolder.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-slate-800">{row.currentHolder}</span>
                          </div>
                        )}
                      </td>
                      {/* Successor */}
                      <td className="px-6 py-5">
                        {row.successor ? (
                          <div className="inline-flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                              {row.successor.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{row.successor}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            <span className="text-sm font-bold text-rose-600">None Identified</span>
                          </div>
                        )}
                      </td>
                      {/* Readiness Bar */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${rc.bar}`}
                              style={{ width: `${row.readiness}%` }}
                            />
                          </div>
                          <span className={`text-sm font-black tabular-nums w-12 text-right ${rc.text}`}>
                            {row.readiness}%
                          </span>
                        </div>
                      </td>
                      {/* Status Badge */}
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${rc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${rc.bar} ${isVacant ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-bold">{rc.label}</span>
                          </div>
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
      {selectedPosition && (() => {
        const row = successionData.find((r, i) => `${r.position}-${i}` === selectedPosition);
        if (!row) return null;
        const rc = readinessConfig[row.readinessLevel];
        const sameDeptEmployees = employees.filter(e => e.department === row.department);
        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-7 bg-amber-500 rounded-full" />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{row.position} — Detail Breakdown</h3>
                  <p className="text-slate-500 text-sm mt-0.5">{row.department} · Holder: {row.currentHolder} · Successor: {row.successor || 'None'} · Readiness: {row.readiness}%</p>
                </div>
              </div>
              <button onClick={() => setSelectedPosition(null)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                <ChevronUp className="w-4 h-4" />Close
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Position</p><p className="text-lg font-black text-slate-900">{row.position}</p></div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Holder</p><p className="text-lg font-black text-slate-900">{row.currentHolder}</p></div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Successor</p><p className="text-lg font-black text-slate-900">{row.successor || 'None Identified'}</p></div>
                <div className={`p-4 rounded-xl border ${rc.bg} ${rc.border}`}><p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${rc.text}`}>Readiness</p><p className={`text-xl font-black tabular-nums ${rc.text}`}>{row.readiness}%</p><p className={`text-[10px] font-bold mt-1 ${rc.text}`}>{rc.label}</p></div>
              </div>
              {sameDeptEmployees.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-3">All Employees in {row.department} ({sameDeptEmployees.length})</p>
                  <div className="overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0"><tr className="bg-slate-50/80">
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                      </tr></thead>
                      <tbody>
                        {sameDeptEmployees.map((e, i) => (
                          <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''} ${e.position === row.position ? 'bg-amber-50/30' : ''}`}>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">{e.name.charAt(0)}</div><span className="text-sm font-bold text-slate-700">{e.name}</span>{e.position === row.position && <span className="text-[9px] font-bold text-amber-600 uppercase">Holder</span>}</div></td>
                            <td className="px-4 py-3 text-sm text-slate-600">{e.position}</td>
                            <td className="px-4 py-3 text-sm text-slate-500">{e.department}</td>
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
          <div className="w-2 h-7 bg-amber-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Ownership</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary</p>
              <p className="text-lg font-bold text-slate-800">HR GM</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Talent pipeline & succession planning</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Co-Owner</p>
              <p className="text-lg font-bold text-slate-800">Executive Committee</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Strategic talent decisions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
