import React, { useMemo, useState } from 'react';
import {
  Store,
  Users,
  TrendingDown,
  AlertTriangle,
  UserCog,
  MapPin,
  Siren,
  ChevronDown,
  ChevronUp,
  Building2,
  TrendingUp,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { Candidate, EmployeeRecord, Resignation, Manpower } from '../data/mockData';
import { flattenOffTarget, getBranchOffTargetRows } from '../utils/offTarget';
import { OffTargetPanel } from './OffTargetPanel';

interface BranchScorecardProps {
  resignations: Resignation[];
  manpower: Manpower[];
  employees: EmployeeRecord[];
  candidates: Candidate[];
}

type Score = 'A' | 'B' | 'C' | 'D';
type Trend = 'improving' | 'declining' | 'stable';

interface BranchData {
  branch: string;
  rawLocation: string;
  staff: number;
  budgeted: number;
  vacancy: number;
  vacancyRate: number;
  turnover: number;
  turnoverRate: number;
  attendance: number;
  attendanceIsProxy: boolean;
  score: Score;
  trend: Trend;
  priorTurnoverRate: number;
  needsHrbpAssessment: boolean;
}

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function normalizeShopName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'Unknown') return 'Unknown';
  const paren = trimmed.match(/\((\d+)\)/);
  if (paren) return `Shop ${paren[1]}`;
  const shopNum = trimmed.match(/shop\s*(\d+)/i);
  if (shopNum) return `Shop ${shopNum[1]}`;
  const burmese = trimmed.match(/ဆိုင်အမှတ်\s*\(?(\d+)\)?/);
  if (burmese) return `Shop ${burmese[1]}`;
  return trimmed;
}

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

function computeTrend(currentRate: number, priorRate: number): Trend {
  const diff = currentRate - priorRate;
  if (diff <= -2) return 'improving';
  if (diff >= 2) return 'declining';
  return 'stable';
}

const scoreConfig: Record<Score, { label: string; badge: string; bg: string; border: string; text: string }> = {
  A: { label: 'Excellent', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-600' },
  B: { label: 'Good', badge: 'bg-blue-50 text-blue-700 border-blue-200', bg: 'bg-blue-50/40', border: 'border-blue-200', text: 'text-blue-600' },
  C: { label: 'At Risk', badge: 'bg-amber-50 text-amber-700 border-amber-200', bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-600' },
  D: { label: 'Critical', badge: 'bg-rose-50 text-rose-700 border-rose-200', bg: 'bg-rose-50/50', border: 'border-rose-200', text: 'text-rose-600' },
};

const trendConfig: Record<Trend, { label: string; icon: React.ElementType; color: string }> = {
  improving: { label: 'Improving', icon: TrendingUp, color: 'text-emerald-600' },
  declining: { label: 'Declining', icon: TrendingDown, color: 'text-rose-600' },
  stable: { label: 'Stable', icon: Minus, color: 'text-slate-500' },
};

export const BranchScorecard: React.FC<BranchScorecardProps> = ({
  resignations,
  manpower,
  employees,
  candidates,
}) => {
  const branches = useMemo<BranchData[]>(() => {
    const employeeByName = new Map<string, EmployeeRecord>();
    for (const emp of employees) {
      employeeByName.set(emp.name.trim().toLowerCase(), emp);
    }

    const shopKeys = new Set<string>();
    for (const emp of employees) {
      const shop = normalizeShopName(emp.shopLocation || emp.branch || 'Unknown');
      if (shop !== 'Unknown') shopKeys.add(shop);
    }
    for (const m of manpower) {
      const shop = normalizeShopName(m.shopLocation || m.branch || 'Unknown');
      if (shop !== 'Unknown') shopKeys.add(shop);
    }

    const branchMap = new Map<string, {
      rawLocation: string;
      staff: number;
      budgeted: number;
      resignations: Resignation[];
      priorResignations: Resignation[];
      departments: Set<string>;
    }>();

    for (const shop of shopKeys) {
      branchMap.set(shop, {
        rawLocation: shop,
        staff: 0,
        budgeted: 0,
        resignations: [],
        priorResignations: [],
        departments: new Set(),
      });
    }

    for (const emp of employees) {
      const shop = normalizeShopName(emp.shopLocation || emp.branch || 'Unknown');
      if (shop === 'Unknown') continue;
      const entry = branchMap.get(shop)!;
      entry.staff += 1;
      entry.departments.add(emp.department);
    }

    for (const m of manpower) {
      const shop = normalizeShopName(m.shopLocation || m.branch || 'Unknown');
      if (shop === 'Unknown') continue;
      if (!branchMap.has(shop)) {
        branchMap.set(shop, {
          rawLocation: m.shopLocation || m.branch || shop,
          staff: 0,
          budgeted: 0,
          resignations: [],
          priorResignations: [],
          departments: new Set(),
        });
      }
      const entry = branchMap.get(shop)!;
      entry.budgeted += m.budgeted || 0;
      if (entry.staff === 0) entry.staff += m.actual || 0;
      entry.departments.add(m.department);
    }

    const matchResignationToShop = (r: Resignation): string | null => {
      const byName = employeeByName.get(r.name.trim().toLowerCase());
      if (byName?.shopLocation || byName?.branch) {
        return normalizeShopName(byName.shopLocation || byName.branch || 'Unknown');
      }
      const loc = (r.location || r.division || '').trim();
      if (loc) {
        const normalized = normalizeShopName(loc);
        if (branchMap.has(normalized)) return normalized;
        for (const shop of branchMap.keys()) {
          if (loc.toLowerCase().includes(shop.toLowerCase()) || shop.toLowerCase().includes(loc.toLowerCase())) {
            return shop;
          }
        }
      }
      const deptShop = [...branchMap.entries()].find(([, data]) => data.departments.has(r.department));
      return deptShop?.[0] ?? null;
    };

    const midMonthIdx = Math.floor(MONTH_ORDER.length / 2);

    for (const r of resignations) {
      const shop = matchResignationToShop(r);
      if (!shop || !branchMap.has(shop)) continue;
      const entry = branchMap.get(shop)!;
      const monthIdx = MONTH_ORDER.indexOf(r.month);
      if (monthIdx >= midMonthIdx) entry.resignations.push(r);
      else entry.priorResignations.push(r);
    }

    const pipelineByShop = new Map<string, number>();
    for (const c of candidates.filter(x => x.finalStatus === 'In Progress')) {
      for (const [shop, data] of branchMap.entries()) {
        if (data.departments.has(c.department)) {
          pipelineByShop.set(shop, (pipelineByShop.get(shop) || 0) + 1);
        }
      }
    }

    return [...branchMap.entries()]
      .map(([branch, data]) => {
        if (data.staff === 0) return null;

        let vacancy: number;
        let vacancyRate: number;

        if (data.budgeted > 0) {
          vacancy = Math.max(0, data.budgeted - data.staff);
          vacancyRate = (vacancy / data.budgeted) * 100;
        } else {
          vacancy = pipelineByShop.get(branch) || 0;
          vacancyRate = data.staff > 0 ? (vacancy / data.staff) * 100 : 0;
        }

        const turnover = data.resignations.length;
        const turnoverRate = data.staff > 0 ? (turnover / data.staff) * 100 : 0;
        const priorTurnoverRate = data.staff > 0 ? (data.priorResignations.length / data.staff) * 100 : 0;

        const attendanceIsProxy = true;
        const attendance = Math.round(
          Math.max(80, Math.min(99, 100 - turnoverRate * 1.1 - vacancyRate * 0.45))
        );

        const vScore = vacancyToScore(vacancyRate);
        const tScore = turnoverToScore(turnoverRate);
        const aScore = attendanceToScore(attendance);
        const overall = scoreToValue(tScore) * 0.4 + scoreToValue(vScore) * 0.3 + scoreToValue(aScore) * 0.3;
        const score = valueToScore(overall);
        const trend = computeTrend(turnoverRate, priorTurnoverRate);

        const hasTurnoverIssue = tScore === 'C' || tScore === 'D';
        const hasAttendanceIssue = aScore === 'C' || aScore === 'D';
        const needsHrbpAssessment = hasTurnoverIssue && hasAttendanceIssue;

        return {
          branch,
          rawLocation: data.rawLocation,
          staff: data.staff,
          budgeted: data.budgeted,
          vacancy,
          vacancyRate,
          turnover,
          turnoverRate,
          attendance,
          attendanceIsProxy,
          score,
          trend,
          priorTurnoverRate,
          needsHrbpAssessment,
        };
      })
      .filter((b): b is BranchData => b !== null)
      .sort((a, b) => scoreToValue(a.score) - scoreToValue(b.score));
  }, [resignations, manpower, employees, candidates]);

  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  const redAlertBranches = branches.filter(b => b.score === 'C' || b.score === 'D');
  const scoreCBranches = branches.filter(b => b.score === 'C');
  const scoreDBranches = branches.filter(b => b.score === 'D');
  const hrbpBranches = branches.filter(b => b.needsHrbpAssessment);

  const headerGradient = scoreDBranches.length > 0
    ? 'from-rose-900 via-rose-800 to-slate-900'
    : scoreCBranches.length > 0
    ? 'from-amber-900 via-amber-800 to-slate-900'
    : 'from-emerald-800 via-emerald-700 to-slate-800';

  const offTargetRows = useMemo(
    () => flattenOffTarget(branches, getBranchOffTargetRows),
    [branches],
  );

  const renderDetail = (b: BranchData) => {
    const branchEmployees = employees.filter(
      e => normalizeShopName(e.shopLocation || e.branch || '') === b.branch
    );
    const branchResignations = resignations.filter(r => {
      const emp = employees.find(e => e.name.trim().toLowerCase() === r.name.trim().toLowerCase());
      if (emp) return normalizeShopName(emp.shopLocation || emp.branch || '') === b.branch;
      const loc = (r.location || r.division || '').trim();
      return loc && (normalizeShopName(loc) === b.branch || loc.toLowerCase().includes(b.branch.toLowerCase()));
    });
    const branchManpower = manpower.filter(
      m => normalizeShopName(m.shopLocation || m.branch || '') === b.branch
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Staff</p>
            <p className="text-lg font-black tabular-nums">{b.staff}</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <p className="text-[10px] font-bold text-rose-400 uppercase">Vacancy</p>
            <p className="text-lg font-black text-rose-600 tabular-nums">{b.vacancyRate.toFixed(1)}%</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
            <p className="text-[10px] font-bold text-rose-400 uppercase">Turnover</p>
            <p className="text-lg font-black text-rose-600 tabular-nums">{b.turnoverRate.toFixed(1)}%</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Trend</p>
            <p className={`text-sm font-bold ${trendConfig[b.trend].color}`}>{trendConfig[b.trend].label}</p>
          </div>
        </div>
        {branchManpower.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Position</th>
                  <th className="px-4 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Staff</th>
                </tr>
              </thead>
              <tbody>
                {branchManpower.slice(0, 20).map((m, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-sm font-bold text-slate-700">{m.position}</td>
                    <td className="px-4 py-2 text-right text-sm tabular-nums">{m.actual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {branchResignations.length > 0 && (
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <p className="text-xs font-bold text-slate-500 mb-2">Recent resignations ({branchResignations.length})</p>
            <table className="w-full">
              <tbody>
                {branchResignations.slice(0, 15).map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-sm font-bold text-slate-700">{r.name}</td>
                    <td className="px-4 py-2 text-sm text-slate-500">{r.resignationDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {branchEmployees.length === 0 && branchManpower.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No additional detail available for this branch.</p>
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
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Branch Performance</p>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Branch HR Performance Scorecard</h2>
            <p className="text-sm text-white/60 mt-2">{branches.length} branches · live manpower & resignation data</p>
          </div>
          <div className="grid grid-cols-3 gap-2 flex-shrink-0">
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black">{branches.reduce((s, b) => s + b.staff, 0).toLocaleString()}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Staff</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black text-rose-300">{redAlertBranches.length}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Red Alert</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black text-amber-300">{hrbpBranches.length}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">HRBP Review</p>
            </div>
          </div>
        </div>
        {redAlertBranches.length > 0 && (
          <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-rose-500/25 rounded-xl border border-rose-400/30">
            <Siren className="w-4 h-4 text-rose-200 flex-shrink-0 animate-pulse" />
            <p className="text-sm font-bold text-rose-100">
              RED ALERT: {redAlertBranches.map(b => `${b.branch} (${b.score})`).join(', ')}
            </p>
          </div>
        )}
      </div>

      {branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No Branch Data Available</p>
          <p className="text-sm text-slate-400 mt-1">Load employee/manpower data with shop locations.</p>
        </div>
      ) : (
        <>
          {/* Scorecard Table — Chairman format */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Branch Scorecard</h3>
                <p className="text-xs text-slate-500 mt-0.5">Click a row for details · Score C & D = Red Alert · Attendance estimated from HR metrics</p>
              </div>
              <div className="flex gap-2">
                {(['A', 'B', 'C', 'D'] as Score[]).map(s => {
                  const count = branches.filter(b => b.score === s).length;
                  if (!count) return null;
                  return (
                    <span key={s} className={`px-2 py-1 rounded-lg text-xs font-bold border ${scoreConfig[s].badge}`}>
                      {s}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Branch</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Staff</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Vacancy</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Turnover</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Attendance</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Score</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => {
                    const sc = scoreConfig[b.score];
                    const isRedAlert = b.score === 'C' || b.score === 'D';
                    const isExpanded = expandedBranch === b.branch;
                    const TrendIcon = trendConfig[b.trend].icon;
                    return (
                      <React.Fragment key={b.branch}>
                        <tr
                          className={`border-t border-slate-100 cursor-pointer transition-colors ${isRedAlert ? sc.bg : 'hover:bg-slate-50/80'} ${isExpanded ? 'ring-1 ring-inset ring-indigo-200' : ''}`}
                          onClick={() => setExpandedBranch(isExpanded ? null : b.branch)}
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              {isRedAlert && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />}
                              <Store className={`w-4 h-4 flex-shrink-0 ${sc.text}`} />
                              <div>
                                <span className="text-sm font-bold text-slate-800">{b.branch}</span>
                                {b.rawLocation !== b.branch && (
                                  <p className="text-[10px] text-slate-400">{b.rawLocation}</p>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-400 ml-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-300 ml-auto" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-black tabular-nums">{b.staff}</td>
                          <td className={`px-4 py-3.5 text-right text-sm font-bold tabular-nums ${b.vacancyRate > 10 ? 'text-rose-600' : b.vacancyRate > 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {b.vacancyRate.toFixed(0)}%
                          </td>
                          <td className={`px-4 py-3.5 text-right text-sm font-bold tabular-nums ${b.turnoverRate >= 15 ? 'text-rose-600' : b.turnoverRate >= 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {b.turnoverRate.toFixed(0)}%
                          </td>
                          <td className={`px-4 py-3.5 text-right text-sm font-bold tabular-nums ${b.attendance < 90 ? 'text-rose-600' : b.attendance < 95 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {b.attendance}%
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex justify-center">
                              {isRedAlert ? (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 ${sc.border} ${sc.bg}`}>
                                  <AlertTriangle className={`w-3.5 h-3.5 ${sc.text} animate-pulse`} />
                                  <span className={`text-base font-black ${sc.text}`}>{b.score}</span>
                                </div>
                              ) : (
                                <span className={`inline-flex px-3 py-1.5 rounded-lg border ${sc.border} ${sc.badge} text-base font-black`}>
                                  {b.score}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className={`flex items-center justify-center gap-1 ${trendConfig[b.trend].color}`}>
                              <TrendIcon className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase">{trendConfig[b.trend].label}</span>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={7} className="px-6 py-4 border-t border-indigo-100">
                              {renderDetail(b)}
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

          {/* Improvement Trend */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-800">Improvement Trend</h3>
              <span className="text-xs text-slate-400">Turnover vs prior period</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['improving', 'stable', 'declining'] as Trend[]).map(t => {
                const list = branches.filter(b => b.trend === t);
                const cfg = trendConfig[t];
                const Icon = cfg.icon;
                return (
                  <div key={t} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className={`flex items-center gap-2 mb-2 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-bold">{cfg.label}</span>
                      <span className="text-xs text-slate-400">({list.length})</span>
                    </div>
                    {list.length === 0 ? (
                      <p className="text-xs text-slate-400">None</p>
                    ) : (
                      <ul className="space-y-1">
                        {list.map(b => (
                          <li key={b.branch} className="text-xs text-slate-600 flex justify-between">
                            <span className="font-semibold">{b.branch}</span>
                            <span className="tabular-nums">{b.priorTurnoverRate.toFixed(0)}% → {b.turnoverRate.toFixed(0)}%</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <OffTargetPanel title="Off-Target Branches" rows={offTargetRows} />

      {/* Ownership */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /><strong className="text-slate-700">Regional:</strong> Regional Operations Managers</span>
        <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /><strong className="text-slate-700">Local:</strong> Branch Managers</span>
        <span className="flex items-center gap-1.5"><UserCog className="w-3.5 h-3.5" /><strong className="text-slate-700">HR:</strong> HR Business Partners</span>
      </div>
    </div>
  );
};
