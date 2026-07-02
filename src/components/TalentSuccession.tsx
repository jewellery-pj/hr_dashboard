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
import { EmployeeRecord, Manpower, VacantListRow, VacantPositionReadinessRow, SuccessionReadinessLink } from '../data/mockData';
import { flattenOffTarget, getSuccessionOffTargetRows } from '../utils/offTarget';
import { OffTargetPanel } from './OffTargetPanel';
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
  successor: string | null;
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
  if (readiness < SCORE_THRESHOLDS.successionReadiness.target) return { riskType: 'low-readiness', chairmanReview: false };
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
        successor: hasSuccessor ? link.employeeName : null,
        readiness: link.readinessPercent,
        isVacant,
        riskType,
        chairmanReview,
      };
    });

    return rows.sort((a, b) => a.readiness - b.readiness);
  }, [successionReadinessLinks]);

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
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Department: <strong>{row.department}</strong> · Readiness: <strong>{row.readiness}%</strong>
          · Successor: <strong>{row.successor ?? '—'}</strong>
        </p>
        <p className="text-xs text-slate-500">
          Current Holder: <strong>{row.currentHolder}</strong>
        </p>
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
              {talentRiskAlerts.length} talent risk(s) — {noSuccessorItems.length} no successor, {chairmanReviewItems.length} vacant
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
                            <span className={`text-sm font-black tabular-nums ${row.readiness >= SCORE_THRESHOLDS.successionReadiness.target ? 'text-emerald-600' : row.readiness >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
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
                          : `Readiness ${row.readiness}% · target ${SCORE_THRESHOLDS.successionReadiness.target}%`}
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
