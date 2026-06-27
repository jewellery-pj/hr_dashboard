import React, { useMemo, useState } from 'react';
import {
  Crown,
  UserX,
  AlertTriangle,
  UserCog,
  Siren,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Bell,
  Users,
} from 'lucide-react';
import { EmployeeRecord, Manpower } from '../data/mockData';
import { flattenOffTarget, getSuccessionOffTargetRows } from '../utils/offTarget';
import { OffTargetPanel } from './OffTargetPanel';

interface TalentSuccessionProps {
  employees: EmployeeRecord[];
  manpower: Manpower[];
}

type RiskType = 'no-successor' | 'low-readiness' | 'vacant' | 'none';

interface SuccessionRow {
  id: string;
  position: string;
  department: string;
  currentHolder: string;
  successor: string | null;
  readiness: number;
  isVacant: boolean;
  riskType: RiskType;
  chairmanReview: boolean;
  budgeted?: number;
  actual?: number;
}

function getPositionLevel(position: string): number {
  const lower = position.toLowerCase();
  if (lower.includes('gm') || lower.includes('general manager') || lower.includes('chief') || lower.includes('director')) return 5;
  if (lower.includes('deputy') && lower.includes('manager')) return 4;
  if (lower.includes('manager') || lower.includes('head')) return 4;
  if (lower.includes('supervisor') || lower.includes('leader')) return 3;
  return 1;
}

function isTopCriticalPosition(position: string): boolean {
  const level = getPositionLevel(position);
  return level >= 4;
}

function formatCriticalLabel(position: string, department: string): string {
  const lower = position.toLowerCase();
  if (lower.includes('gm') || lower.includes('general manager')) {
    const deptShort = department.split(' ')[0];
    return `${deptShort} GM`;
  }
  if (lower.includes('director') || lower.includes('chief')) return position;
  if (lower.includes('head') || lower.includes('manager')) return `${department} — ${position}`;
  return position;
}

function computeReadiness(currentLevel: number, successorLevel: number): number {
  if (successorLevel <= 0) return 0;
  const diff = currentLevel - successorLevel;
  if (diff === 0) return 90;
  if (diff === 1) return 80;
  if (diff === 2) return 55;
  return 30;
}

function getRiskType(
  isVacant: boolean,
  hasSuccessor: boolean,
  readiness: number,
): { riskType: RiskType; chairmanReview: boolean } {
  if (isVacant) return { riskType: 'vacant', chairmanReview: true };
  if (!hasSuccessor) return { riskType: 'no-successor', chairmanReview: false };
  if (readiness < 80) return { riskType: 'low-readiness', chairmanReview: false };
  return { riskType: 'none', chairmanReview: false };
}

export const TalentSuccession: React.FC<TalentSuccessionProps> = ({ employees, manpower }) => {
  const successionData = useMemo<SuccessionRow[]>(() => {
    if (employees.length === 0 && manpower.length === 0) return [];

    const rows: SuccessionRow[] = [];
    const seen = new Set<string>();

    const positionMap = new Map<string, { position: string; department: string; holders: EmployeeRecord[] }>();
    for (const emp of employees) {
      if (!isTopCriticalPosition(emp.position)) continue;
      const key = `${emp.position}||${emp.department}`;
      if (!positionMap.has(key)) {
        positionMap.set(key, { position: emp.position, department: emp.department, holders: [] });
      }
      positionMap.get(key)!.holders.push(emp);
    }

    for (const [key, data] of positionMap.entries()) {
      seen.add(key);
      const holders = data.holders.sort(
        (a, b) => getPositionLevel(b.position) - getPositionLevel(a.position)
      );
      const currentHolder = holders[0]?.name || 'Vacant';
      const isVacant = !holders.length;

      const currentLevel = getPositionLevel(data.position);
      const sameDept = employees.filter(
        e => e.department === data.department && e.position !== data.position
      );
      const ranked = sameDept
        .map(e => ({ emp: e, level: getPositionLevel(e.position) }))
        .filter(c => c.level >= Math.max(1, currentLevel - 1))
        .sort((a, b) => b.level - a.level);

      const successor = ranked[0]?.emp || null;
      const readiness = isVacant ? 0 : successor
        ? computeReadiness(currentLevel, getPositionLevel(successor.position))
        : 0;

      const mpRow = manpower.find(m => m.position === data.position && m.department === data.department);
      const { riskType, chairmanReview } = getRiskType(isVacant, !!successor, readiness);

      rows.push({
        id: key,
        position: formatCriticalLabel(data.position, data.department),
        department: data.department,
        currentHolder: isVacant ? 'Vacant' : currentHolder,
        successor: successor?.name || null,
        readiness,
        isVacant,
        riskType,
        chairmanReview,
        budgeted: mpRow?.budgeted,
        actual: mpRow?.actual,
      });
    }

    for (const m of manpower) {
      if (!isTopCriticalPosition(m.position)) continue;
      const key = `${m.position}||${m.department}`;
      if (seen.has(key)) continue;

      const vacant = (m.budgeted || 0) > (m.actual || 0);
      const hasEmployee = employees.some(
        e => e.department === m.department && e.position === m.position
      );
      if (!vacant && hasEmployee) continue;

      seen.add(key);
      rows.push({
        id: key,
        position: formatCriticalLabel(m.position, m.department),
        department: m.department,
        currentHolder: 'Vacant',
        successor: null,
        readiness: 0,
        isVacant: true,
        riskType: 'vacant',
        chairmanReview: true,
        budgeted: m.budgeted,
        actual: m.actual,
      });
    }

    return rows.sort((a, b) => a.readiness - b.readiness);
  }, [employees, manpower]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const coverageRate = successionData.length > 0
    ? (successionData.filter(r => r.successor !== null).length / successionData.length) * 100
    : 0;
  const avgReadiness = successionData.length > 0
    ? successionData.reduce((s, r) => s + r.readiness, 0) / successionData.length
    : 0;

  const talentRiskAlerts = successionData.filter(r => r.riskType !== 'none');
  const chairmanReviewItems = successionData.filter(r => r.chairmanReview);
  const noSuccessorItems = successionData.filter(r => r.riskType === 'no-successor');
  const lowReadinessItems = successionData.filter(r => r.riskType === 'low-readiness');

  const headerGradient = chairmanReviewItems.length > 0 || noSuccessorItems.length > 0
    ? 'from-rose-900 via-rose-800 to-slate-900'
    : lowReadinessItems.length > 0
    ? 'from-amber-900 via-amber-800 to-slate-900'
    : 'from-amber-800 via-amber-700 to-slate-800';

  const offTargetRows = useMemo(
    () => flattenOffTarget(successionData.filter(r => r.riskType !== 'none'), getSuccessionOffTargetRows),
    [successionData],
  );

  const renderDetail = (row: SuccessionRow) => {
    const deptEmployees = employees.filter(e => e.department === row.department);
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Department: <strong>{row.department}</strong> · Readiness: <strong>{row.readiness}%</strong>
          · Successor: <strong>{row.successor ?? '—'}</strong>
        </p>
        {deptEmployees.length > 0 && (
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Position</th>
                </tr>
              </thead>
              <tbody>
                {deptEmployees.map((e, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-sm font-bold text-slate-700">{e.name}</td>
                    <td className="px-4 py-2 text-sm text-slate-600">{e.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Leadership Pipeline</p>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Talent & Succession Dashboard</h2>
            <p className="text-sm text-white/60 mt-2">
              {successionData.length} critical positions · live employee data
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
              {talentRiskAlerts.length} talent risk(s) — {noSuccessorItems.length} no successor, {chairmanReviewItems.length} vacant
            </p>
          </div>
        )}
      </div>

      {successionData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Crown className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No Succession Data Available</p>
          <p className="text-sm text-slate-400 mt-1">Load employee records with GM/Manager positions.</p>
        </div>
      ) : (
        <>
          {/* Chairman Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-800">Critical Position Succession Plan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click a row for department detail</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Critical Position</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Current Holder</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Successor</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Readiness</th>
                  </tr>
                </thead>
                <tbody>
                  {successionData.map((row) => {
                    const isRisk = row.riskType !== 'none';
                    const isExpanded = expandedId === row.id;
                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          className={`border-t border-slate-100 cursor-pointer transition-colors ${isRisk ? 'bg-rose-50/30' : 'hover:bg-slate-50/80'} ${isExpanded ? 'ring-1 ring-inset ring-indigo-200' : ''}`}
                          onClick={() => setExpandedId(isExpanded ? null : row.id)}
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              {isRisk && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />}
                              <Crown className={`w-4 h-4 flex-shrink-0 ${isRisk ? 'text-rose-500' : 'text-amber-500'}`} />
                              <div>
                                <span className="text-sm font-bold text-slate-800">{row.position}</span>
                                <p className="text-[10px] text-slate-400">{row.department}</p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-400 ml-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-300 ml-auto" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {row.isVacant ? (
                              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-600">
                                <UserX className="w-3.5 h-3.5" /> Vacant
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-slate-800">{row.currentHolder}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {row.successor ? (
                              <span className="text-sm font-semibold text-slate-700">{row.successor}</span>
                            ) : (
                              <span className="text-sm font-bold text-rose-600">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className={`text-sm font-black tabular-nums ${row.readiness >= 80 ? 'text-emerald-600' : row.readiness >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {row.readiness}%
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={4} className="px-6 py-4 border-t border-indigo-100">
                              {renderDetail(row)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Immediate Talent Risk Alerts */}
          {talentRiskAlerts.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-rose-50/80 border-b border-rose-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-500" />
                <h3 className="text-base font-bold text-slate-800">Talent Risk Alerts</h3>
                <span className="text-xs text-slate-400">{talentRiskAlerts.length} flagged</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {talentRiskAlerts.map((row) => (
                  <li key={row.id} className="px-6 py-3.5 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{row.position}</p>
                      <p className="text-xs text-slate-500">
                        {row.isVacant
                          ? `${row.actual ?? 0}/${row.budgeted ?? 0} filled`
                          : !row.successor
                          ? '0 successors'
                          : `Readiness ${row.readiness}% · target 80%`}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                      {row.riskType}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chairman Review Agenda */}
          {chairmanReviewItems.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-bold text-slate-800">Chairman Review Agenda</h3>
                <span className="text-xs text-slate-400">Vacant critical positions</span>
              </div>
              <ul className="space-y-2">
                {chairmanReviewItems.map(row => (
                  <li key={row.id} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="font-bold text-slate-800">{row.position}</span>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <span className="text-slate-600">{row.actual ?? 0}/{row.budgeted ?? 0} · Vacant</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <OffTargetPanel title="Off-Target Succession" rows={offTargetRows} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <p className="text-sm font-bold text-slate-800">Succession Coverage</p>
        <p className="text-xs text-slate-600 mt-1">
          {coverageRate.toFixed(0)}% · {successionData.filter(r => r.successor).length}/{successionData.length} with successor · Avg readiness {avgReadiness.toFixed(0)}%
        </p>
      </div>

      {/* Ownership */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><Crown className="w-3.5 h-3.5" /><strong className="text-slate-700">Accountable:</strong> HR GM</span>
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /><strong className="text-slate-700">Oversight:</strong> Executive Committee</span>
      </div>
    </div>
  );
};
