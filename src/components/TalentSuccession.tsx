import React, { useMemo, useState } from 'react';
import {
  Crown,
  UserX,
  Siren,
  Users,
} from 'lucide-react';
import { EmployeeRecord, Manpower, VacantListRow, VacantPositionReadinessRow, SuccessionReadinessLink } from '../data/mockData';
import { SCORE_THRESHOLDS } from '../utils/scoreThresholds';

interface TalentSuccessionProps {
  employees: EmployeeRecord[];
  manpower: Manpower[];
  vacantList: VacantListRow[];
  vacantReadiness: VacantPositionReadinessRow[];
  successionReadinessLinks: SuccessionReadinessLink[];
}

type RiskType = 'no-successor' | 'low-readiness' | 'vacant' | 'none';

interface SuccessionRow {
  id: string;
  position: string;
  department: string;
  currentHolder: string;
  currentHolderPosition: string;
  successor: string | null;
  successorPosition: string | null;
  readiness: number;
  isVacant: boolean;
  riskType: RiskType;
  chairmanReview: boolean;
  budgeted?: number;
  actual?: number;
}

function isVacantName(name: string | null | undefined): boolean {
  if (!name) return true;
  return /vacant|vancant|open/i.test(name);
}

function getRiskType(
  isVacant: boolean,
  hasSuccessor: boolean,
  readiness: number,
): { riskType: RiskType; chairmanReview: boolean } {
  if (isVacant) return { riskType: 'vacant', chairmanReview: true };
  if (!hasSuccessor) return { riskType: 'no-successor', chairmanReview: false };
  if (readiness < SCORE_THRESHOLDS.successionReadiness.target) return { riskType: 'low-readiness', chairmanReview: true };
  return { riskType: 'none', chairmanReview: false };
}

export const TalentSuccession: React.FC<TalentSuccessionProps> = ({
  employees: _employees,
  manpower: _manpower,
  vacantList: _vacantList,
  vacantReadiness: _vacantReadiness,
  successionReadinessLinks,
}) => {
  const successionData = useMemo<SuccessionRow[]>(() => {
    if (successionReadinessLinks.length === 0) return [];

    const rows = successionReadinessLinks.map((link): SuccessionRow => {
      const isVacant = isVacantName(link.currentHolderName);
      const hasSuccessor = !isVacantName(link.employeeName);
      const { riskType, chairmanReview } = getRiskType(
        isVacant,
        hasSuccessor,
        link.readinessPercent,
      );

      return {
        id: link.id,
        position: `${link.employeeDepartment} — ${link.currentHolderPosition || link.vacantPosition}`,
        department: link.employeeDepartment,
        currentHolder: link.currentHolderName || 'Vacant',
        currentHolderPosition: link.currentHolderPosition || link.vacantPosition || '',
        successor: hasSuccessor ? link.employeeName : null,
        successorPosition: hasSuccessor ? (link.employeePosition || null) : null,
        readiness: link.readinessPercent,
        isVacant,
        riskType,
        chairmanReview,
      };
    });

    return rows.sort((a, b) => a.readiness - b.readiness);
  }, [successionReadinessLinks]);

  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [posFilter, setPosFilter] = useState<string>('All');

  const departments = useMemo(() => {
    const depts = Array.from(new Set(successionData.map(r => r.department))).sort();
    return ['All', ...depts];
  }, [successionData]);

  const positions = useMemo(() => {
    const pos = Array.from(new Set(successionData.map(r => r.currentHolderPosition).filter(Boolean))).sort();
    return ['All', ...pos] as string[];
  }, [successionData]);

  const filteredSuccessionData = useMemo(() => {
    return successionData.filter(r => {
      if (deptFilter !== 'All' && r.department !== deptFilter) return false;
      if (posFilter !== 'All' && r.currentHolderPosition !== posFilter) return false;
      return true;
    });
  }, [successionData, deptFilter, posFilter]);

  const coverageRate = successionData.length > 0
    ? (successionData.filter(r => r.successor !== null).length / successionData.length) * 100
    : 0;
  const avgReadiness = successionData.length > 0
    ? successionData.reduce((s, r) => s + r.readiness, 0) / successionData.length
    : 0;

  const talentRiskAlerts = successionData.filter(r => r.riskType !== 'none');
  const noSuccessorItems = successionData.filter(r => r.riskType === 'no-successor');
  const lowReadinessItems = successionData.filter(r => r.riskType === 'low-readiness');

  const headerGradient = noSuccessorItems.length > 0
    ? 'from-rose-900 via-rose-800 to-slate-900'
    : lowReadinessItems.length > 0
    ? 'from-amber-900 via-amber-800 to-slate-900'
    : 'from-amber-800 via-amber-700 to-slate-800';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className={`bg-gradient-to-br ${headerGradient} rounded-2xl p-6 md:p-8 text-white shadow-lg`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Leadership Pipeline</p>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Talent & Succession Dashboard</h2>
            <p className="text-sm text-white/60 mt-2">
              {successionData.length} positions · source: Readiness (%) sheet
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 flex-shrink-0">
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black">{coverageRate.toFixed(0)}%</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Coverage</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black">{avgReadiness.toFixed(0)}%</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Avg Ready</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black text-rose-300">{talentRiskAlerts.length}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Risk Alerts</p>
            </div>
          </div>
        </div>
        {talentRiskAlerts.length > 0 && (
          <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-rose-500/25 rounded-xl border border-rose-400/30">
            <Siren className="w-4 h-4 text-rose-200 flex-shrink-0 animate-pulse" />
            <p className="text-sm font-bold text-rose-100">
              {talentRiskAlerts.length} talent risk(s) — {noSuccessorItems.length} no successor, {talentRiskAlerts.filter(r => r.isVacant).length} vacant
            </p>
          </div>
        )}
      </div>

      {successionData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Crown className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No Succession Data Available</p>
          <p className="text-sm text-slate-400 mt-1">No rows found in Readiness (%) sheet.</p>
        </div>
      ) : (
        <>
          {/* Chairman Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Critical Position Succession Plan</h3>
                <p className="text-xs text-slate-500 mt-0.5">{filteredSuccessionData.length} position{filteredSuccessionData.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={deptFilter}
                  onChange={e => { setDeptFilter(e.target.value); }}
                  className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-7 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
                  ))}
                </select>
                <select
                  value={posFilter}
                  onChange={e => { setPosFilter(e.target.value); }}
                  className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-7 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                >
                  {positions.map(p => (
                    <option key={p} value={p}>{p === 'All' ? 'All Positions' : p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dept</th>
                    <th colSpan={2} className="px-4 py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest border-x border-slate-200">
                      Current Holder
                    </th>
                    <th colSpan={2} className="px-4 py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-200">
                      Successor
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Readiness</th>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50/60">
                    <th className="px-4 py-1.5" />
                    <th className="px-4 py-1.5 text-left text-[10px] font-bold text-slate-400 border-l border-slate-200">Name</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-bold text-slate-400 border-r border-slate-200">Position</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-bold text-slate-400">Name</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-bold text-slate-400 border-r border-slate-200">Position</th>
                    <th className="px-4 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {filteredSuccessionData.map((row) => {
                    const isRisk = row.riskType !== 'none';
                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          className={`border-t border-slate-100 transition-colors ${isRisk ? 'bg-rose-50/30' : ''}`}
                        >
                          {/* Department */}
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-slate-700">{row.department}</span>
                          </td>
                          {/* Current Holder Name */}
                          <td className="px-4 py-3 border-l border-slate-100">
                            {row.isVacant ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                                <UserX className="w-3 h-3" /> Vacant
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-slate-800">{row.currentHolder}</span>
                            )}
                          </td>
                          {/* Current Holder Position */}
                          <td className="px-4 py-3 border-r border-slate-100">
                            <span className="text-xs text-slate-500">{row.currentHolderPosition || '—'}</span>
                          </td>
                          {/* Successor Name */}
                          <td className="px-4 py-3">
                            {row.successor ? (
                              <span className="text-sm font-semibold text-slate-800">{row.successor}</span>
                            ) : (
                              <span className="text-xs font-bold text-rose-500">—</span>
                            )}
                          </td>
                          {/* Successor Position */}
                          <td className="px-4 py-3 border-r border-slate-100">
                            <span className="text-xs text-slate-500">{row.successorPosition ?? '—'}</span>
                          </td>
                          {/* Readiness */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${row.readiness >= SCORE_THRESHOLDS.successionReadiness.target ? 'bg-emerald-500' : row.readiness >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
                                  style={{ width: `${row.readiness}%` }}
                                />
                              </div>
                              <span className={`text-sm font-black tabular-nums w-9 text-right ${row.readiness >= SCORE_THRESHOLDS.successionReadiness.target ? 'text-emerald-600' : row.readiness >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {row.readiness}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}

      {/* Chairman Review Agenda */}
      {successionData.filter(r => r.isVacant).length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-rose-600" />
                <h3 className="text-base font-bold text-rose-800">Chairman Review Agenda</h3>
                <span className="text-xs font-bold text-white bg-rose-600 px-2 py-0.5 rounded-full">
                  {successionData.filter(r => r.isVacant).length} vacant
                </span>
              </div>
              <p className="text-xs text-rose-500 mt-0.5 ml-6">Vacant critical positions requiring immediate chairman attention</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rose-100 bg-rose-50/40">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-rose-400 uppercase tracking-widest w-8">No</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-rose-400 uppercase tracking-widest">Dept</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-rose-400 uppercase tracking-widest">Vacant Position (Title)</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-rose-400 uppercase tracking-widest">Successor</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-rose-400 uppercase tracking-widest">Successor Position</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-rose-400 uppercase tracking-widest">Readiness</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-rose-400 uppercase tracking-widest border-l border-rose-100">Action</th>
                </tr>
              </thead>
              <tbody>
                {successionData.filter(r => r.isVacant).map((row, idx) => (
                  <tr key={row.id} className="border-t border-rose-100 hover:bg-rose-50/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-rose-300 tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-slate-700">{row.department}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserX className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        <span className="text-sm font-bold text-rose-700">{row.position}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.successor ? (
                        <span className="text-sm font-semibold text-slate-700">{row.successor}</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None identified</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{row.successorPosition ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.readiness > 0 ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 h-1.5 bg-rose-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.readiness >= SCORE_THRESHOLDS.successionReadiness.target ? 'bg-emerald-500' : row.readiness >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
                              style={{ width: `${row.readiness}%` }}
                            />
                          </div>
                          <span className={`text-sm font-black tabular-nums w-9 text-right ${row.readiness >= SCORE_THRESHOLDS.successionReadiness.target ? 'text-emerald-600' : row.readiness >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {row.readiness}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-l border-rose-100">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                        Chairman Review
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ownership */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /><strong className="text-slate-700">Accountable:</strong> HR GM</span>
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /><strong className="text-slate-700">Oversight:</strong> Executive Committee</span>
      </div>
    </div>
  );
};
