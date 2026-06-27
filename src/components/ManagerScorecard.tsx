import React, { useMemo, useState } from 'react';
import {
  UserCog,
  AlertTriangle,
  Siren,
  ChevronUp,
  ChevronDown,
  Users,
  Gauge,
  ArrowRight,
  Crown,
  TrendingDown,
} from 'lucide-react';
import { Candidate, EmployeeRecord, Resignation, Manpower } from '../data/mockData';
import { flattenOffTarget, getManagerOffTargetRows } from '../utils/offTarget';
import { OffTargetPanel } from './OffTargetPanel';

interface ManagerScorecardProps {
  resignations: Resignation[];
  manpower: Manpower[];
  employees: EmployeeRecord[];
  candidates: Candidate[];
}

type Score = 'A' | 'B' | 'C' | 'D';

interface ManagerData {
  manager: string;
  department: string;
  position: string;
  headcount: number;
  turnoverRate: number;
  vacancyRate: number;
  productivity: Score;
  turnoverGrade: Score;
  vacancyGrade: Score;
  overallScore: number;
  overallGrade: Score;
  isLeadershipRisk: boolean;
  isHighPerformer: boolean;
  riskRank: number;
}

const SCORE_WEIGHTS = {
  turnover: 0.40,
  vacancy: 0.35,
  productivity: 0.25,
} as const;

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const gradeValue: Record<Score, number> = { A: 4, B: 3, C: 2, D: 1 };
const valueToScore = (v: number): Score => (v >= 3.5 ? 'A' : v >= 2.5 ? 'B' : v >= 1.5 ? 'C' : 'D');

function getPositionLevel(position: string): number {
  const lower = position.toLowerCase();
  if (lower.includes('gm') || lower.includes('general manager') || lower.includes('chief') || lower.includes('director')) return 5;
  if (lower.includes('deputy') && lower.includes('manager')) return 4;
  if (lower.includes('manager') || lower.includes('head ')) return 4;
  if (lower.includes('supervisor') || lower.includes('leader')) return 3;
  return 1;
}

function isManagerPosition(position: string): boolean {
  const lower = position.toLowerCase();
  return ['manager', 'head', 'director', 'chief', 'gm', 'general manager', 'supervisor'].some(k => lower.includes(k));
}

function turnoverToScore(rate: number): Score {
  if (rate < 5) return 'A';
  if (rate < 10) return 'B';
  if (rate < 15) return 'C';
  return 'D';
}

function vacancyRateToScore(rate: number): Score {
  if (rate <= 3) return 'A';
  if (rate <= 7) return 'B';
  if (rate <= 12) return 'C';
  return 'D';
}

function productivityToScore(turnoverRate: number, vacancyRate: number, hireRatio: number): Score {
  let score = 4;
  if (turnoverRate >= 15) score -= 2;
  else if (turnoverRate >= 10) score -= 1;
  else if (turnoverRate >= 5) score -= 0.5;
  if (vacancyRate >= 12) score -= 1.5;
  else if (vacancyRate >= 7) score -= 1;
  else if (vacancyRate >= 4) score -= 0.5;
  if (hireRatio >= 0.5) score += 0.25;
  else if (hireRatio < 0.2 && turnoverRate > 5) score -= 0.5;
  if (score >= 3.5) return 'A';
  if (score >= 2.5) return 'B';
  if (score >= 1.5) return 'C';
  return 'D';
}

const scoreConfig: Record<Score, { label: string; badge: string; bg: string; border: string; text: string; bar: string }> = {
  A: { label: 'Excellent', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  B: { label: 'Good', badge: 'bg-blue-50 text-blue-700 border-blue-200', bg: 'bg-blue-50/40', border: 'border-blue-200', text: 'text-blue-600', bar: 'bg-blue-500' },
  C: { label: 'At Risk', badge: 'bg-amber-50 text-amber-700 border-amber-200', bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-600', bar: 'bg-amber-500' },
  D: { label: 'Critical', badge: 'bg-rose-50 text-rose-700 border-rose-200', bg: 'bg-rose-50/50', border: 'border-rose-200', text: 'text-rose-600', bar: 'bg-rose-500' },
};

function GradeBadge({ grade, compact = false }: { grade: Score; compact?: boolean }) {
  const gc = scoreConfig[grade];
  return (
    <span className={`inline-flex items-center justify-center ${compact ? 'w-7 h-7' : 'px-2.5 py-1'} rounded-lg border ${gc.badge} text-sm font-black ${gc.text}`}>
      {grade}
    </span>
  );
}

export const ManagerScorecard: React.FC<ManagerScorecardProps> = ({
  resignations,
  manpower,
  employees,
  candidates,
}) => {
  const managers = useMemo<ManagerData[]>(() => {
    const deptEmployees = new Map<string, EmployeeRecord[]>();
    for (const emp of employees) {
      const dept = emp.department?.trim() || 'Unknown';
      if (dept === 'Unknown') continue;
      if (!deptEmployees.has(dept)) deptEmployees.set(dept, []);
      deptEmployees.get(dept)!.push(emp);
    }

    for (const m of manpower) {
      const dept = m.department?.trim() || 'Unknown';
      if (dept === 'Unknown') continue;
      if (!deptEmployees.has(dept)) deptEmployees.set(dept, []);
    }

    const pipelineByDept = new Map<string, number>();
    for (const c of candidates.filter(x => x.finalStatus === 'In Progress')) {
      pipelineByDept.set(c.department, (pipelineByDept.get(c.department) || 0) + 1);
    }
    const joinedByDept = new Map<string, number>();
    for (const c of candidates.filter(x => x.finalStatus === 'Joined')) {
      joinedByDept.set(c.department, (joinedByDept.get(c.department) || 0) + 1);
    }

    const midMonthIdx = Math.floor(MONTH_ORDER.length / 2);
    const resByDept = new Map<string, { recent: number; prior: number }>();
    for (const r of resignations) {
      const dept = r.department?.trim() || 'Unknown';
      if (!resByDept.has(dept)) resByDept.set(dept, { recent: 0, prior: 0 });
      const entry = resByDept.get(dept)!;
      const monthIdx = MONTH_ORDER.indexOf(r.month);
      if (monthIdx >= midMonthIdx) entry.recent += 1;
      else entry.prior += 1;
    }

    const mpByDept = manpower.reduce((acc, m) => {
      const dept = m.department?.trim() || 'Unknown';
      if (!acc[dept]) acc[dept] = { actual: 0, budgeted: 0 };
      acc[dept].actual += m.actual || 0;
      acc[dept].budgeted += m.budgeted || 0;
      return acc;
    }, {} as Record<string, { actual: number; budgeted: number }>);

    const findDeptHead = (dept: string, emps: EmployeeRecord[]): { name: string; position: string } => {
      const managersInDept = emps.filter(e => isManagerPosition(e.position));
      if (managersInDept.length > 0) {
        const best = [...managersInDept].sort(
          (a, b) => getPositionLevel(b.position) - getPositionLevel(a.position)
        )[0];
        return { name: best.name, position: best.position };
      }
      return { name: `${dept} Head`, position: 'Department Head' };
    };

    const raw: Omit<ManagerData, 'riskRank'>[] = [];

    for (const [department, emps] of deptEmployees.entries()) {
      const headcount = emps.length > 0
        ? emps.length
        : (mpByDept[department]?.actual || 0);
      if (headcount === 0) continue;

      const mp = mpByDept[department] || { actual: headcount, budgeted: 0 };
      const budgeted = mp.budgeted;
      let vacancyRate: number;
      if (budgeted > 0) {
        vacancyRate = (Math.max(0, budgeted - headcount) / budgeted) * 100;
      } else {
        const pipeline = pipelineByDept.get(department) || 0;
        vacancyRate = headcount > 0 ? (pipeline / headcount) * 100 : 0;
      }

      const res = resByDept.get(department) || { recent: 0, prior: 0 };
      const turnoverRate = headcount > 0 ? (res.recent / headcount) * 100 : 0;

      const joined = joinedByDept.get(department) || 0;
      const pipeline = pipelineByDept.get(department) || 0;
      const hireRatio = res.recent + pipeline > 0 ? joined / (res.recent + pipeline) : joined > 0 ? 1 : 0.5;

      const turnoverGrade = turnoverToScore(turnoverRate);
      const vacancyGrade = vacancyRateToScore(vacancyRate);
      const productivity = productivityToScore(turnoverRate, vacancyRate, hireRatio);

      const overallScore =
        gradeValue[turnoverGrade] * SCORE_WEIGHTS.turnover +
        gradeValue[vacancyGrade] * SCORE_WEIGHTS.vacancy +
        gradeValue[productivity] * SCORE_WEIGHTS.productivity;

      const overallGrade = valueToScore(overallScore);
      const head = findDeptHead(department, emps);

      const isLeadershipRisk =
        overallGrade === 'C' || overallGrade === 'D' ||
        turnoverRate >= 15 || vacancyRate >= 10;

      raw.push({
        manager: head.name,
        department,
        position: head.position,
        headcount,
        turnoverRate,
        vacancyRate,
        productivity,
        turnoverGrade,
        vacancyGrade,
        overallScore: Math.round(overallScore * 100) / 100,
        overallGrade,
        isLeadershipRisk,
        isHighPerformer: overallGrade === 'A',
      });
    }

    const ranked = [...raw].sort((a, b) => a.overallScore - b.overallScore);
    return ranked.map((m, i) => ({ ...m, riskRank: i + 1 }));
  }, [resignations, manpower, employees, candidates]);

  const [expandedManager, setExpandedManager] = useState<string | null>(null);

  const leadershipRisks = managers.filter(m => m.isLeadershipRisk);
  const highPerformers = managers.filter(m => m.isHighPerformer);
  const redAlertManagers = managers.filter(m => m.overallGrade === 'C' || m.overallGrade === 'D');
  const avgScore = managers.length > 0
    ? managers.reduce((s, m) => s + m.overallScore, 0) / managers.length
    : 0;

  const headerGradient = managers.some(m => m.overallGrade === 'D')
    ? 'from-rose-900 via-rose-800 to-slate-900'
    : managers.some(m => m.overallGrade === 'C')
    ? 'from-amber-900 via-amber-800 to-slate-900'
    : 'from-emerald-800 via-emerald-700 to-slate-800';

  const offTargetRows = useMemo(
    () => flattenOffTarget(managers, getManagerOffTargetRows),
    [managers],
  );

  const renderDetail = (m: ManagerData) => {
    const deptRes = resignations.filter(r => r.department === m.department);
    const deptPipeline = candidates.filter(c => c.finalStatus === 'In Progress' && c.department === m.department);
    const deptJoined = candidates.filter(c => c.finalStatus === 'Joined' && c.department === m.department);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Position</p>
            <p className="text-sm font-bold text-slate-800 mt-1">{m.position}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Team Size</p>
            <p className="text-lg font-black tabular-nums">{m.headcount}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Turnover Grade</p>
            <p className="text-lg font-black">{m.turnoverGrade}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Vacancy Grade</p>
            <p className="text-lg font-black">{m.vacancyGrade}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Score: {m.overallScore.toFixed(2)} / 4.0 · {deptRes.length} resignations · {deptJoined.length} hires · {deptPipeline.length} in pipeline
        </p>
        {deptRes.length > 0 && (
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full">
              <tbody>
                {deptRes.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-sm font-bold text-slate-700">{r.name}</td>
                    <td className="px-4 py-2 text-sm text-slate-500">{r.resignationDate}</td>
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
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Leadership Effectiveness</p>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Department Manager Scorecard</h2>
            <p className="text-sm text-white/60 mt-2">
              {managers.length} managers · measures people leadership by department
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 flex-shrink-0">
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black">{avgScore.toFixed(1)}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Avg Score</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black text-rose-300">{leadershipRisks.length}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Risk</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black text-emerald-300">{highPerformers.length}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Top (A)</p>
            </div>
          </div>
        </div>
        {redAlertManagers.length > 0 && (
          <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-rose-500/25 rounded-xl border border-rose-400/30">
            <Siren className="w-4 h-4 text-rose-200 flex-shrink-0 animate-pulse" />
            <p className="text-sm font-bold text-rose-100">
              LEADERSHIP RISK: {redAlertManagers.map(m => `${m.manager} (${m.overallGrade})`).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Score Weights */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-bold text-slate-800">Leadership Score</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['Turnover', 40],
            ['Vacancy', 35],
            ['Productivity', 25],
          ] as const).map(([label, pct]) => (
            <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
              <p className="text-lg font-black text-slate-800">{pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {managers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <UserCog className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No Manager Data Available</p>
        </div>
      ) : (
        <>
          {/* Chairman Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-800">Manager Scorecard</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click a row for details · Score C & D = Leadership Risk</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Manager</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Turnover</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Vacancy</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Productivity</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[...managers].sort((a, b) => b.overallScore - a.overallScore).map((m) => {
                    const gc = scoreConfig[m.overallGrade];
                    const isRedAlert = m.overallGrade === 'C' || m.overallGrade === 'D';
                    const isExpanded = expandedManager === m.department;
                    return (
                      <React.Fragment key={m.department}>
                        <tr
                          className={`border-t border-slate-100 cursor-pointer transition-colors ${isRedAlert ? gc.bg : 'hover:bg-slate-50/80'} ${isExpanded ? 'ring-1 ring-inset ring-indigo-200' : ''}`}
                          onClick={() => setExpandedManager(isExpanded ? null : m.department)}
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              {isRedAlert && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />}
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
                                {m.manager.charAt(0)}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-slate-800">{m.manager}</span>
                                {m.isHighPerformer && (
                                  <span className="ml-2 text-[10px] font-bold text-emerald-600">★ Top</span>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-400 ml-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-300 ml-auto" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-slate-700">{m.department}</td>
                          <td className={`px-4 py-3.5 text-right text-sm font-bold tabular-nums ${m.turnoverRate >= 15 ? 'text-rose-600' : m.turnoverRate >= 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {m.turnoverRate.toFixed(0)}%
                          </td>
                          <td className={`px-4 py-3.5 text-right text-sm font-bold tabular-nums ${m.vacancyRate >= 12 ? 'text-rose-600' : m.vacancyRate >= 7 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {m.vacancyRate.toFixed(0)}%
                          </td>
                          <td className="px-4 py-3.5 text-center"><GradeBadge grade={m.productivity} compact /></td>
                          <td className="px-4 py-3.5">
                            <div className="flex justify-center">
                              {isRedAlert ? (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 ${gc.border} ${gc.bg}`}>
                                  <AlertTriangle className={`w-3.5 h-3.5 ${gc.text} animate-pulse`} />
                                  <span className={`text-base font-black ${gc.text}`}>{m.overallGrade}</span>
                                </div>
                              ) : (
                                <GradeBadge grade={m.overallGrade} />
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={6} className="px-6 py-4 border-t border-indigo-100">
                              {renderDetail(m)}
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

          {/* Leadership Risk Indicators */}
          <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-rose-50/80 border-b border-rose-100 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              <h3 className="text-base font-bold text-slate-800">Leadership Risk Indicators</h3>
              <span className="text-xs text-slate-400">{leadershipRisks.length} flagged</span>
            </div>
            {leadershipRisks.length === 0 ? (
              <p className="px-6 py-8 text-sm text-slate-500 text-center">No leadership risks identified.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {leadershipRisks.map((m) => (
                  <li key={m.department} className="px-6 py-3.5 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{m.manager} — {m.department}</p>
                      <p className="text-xs text-slate-500">
                        Score {m.overallGrade} · Turnover {m.turnoverRate.toFixed(0)}% · Vacancy {m.vacancyRate.toFixed(0)}%
                      </p>
                    </div>
                    <GradeBadge grade={m.overallGrade} compact />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Succession Pipeline Candidates */}
          {highPerformers.length > 0 && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-4 h-4 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-800">Succession Pipeline Candidates</h3>
                <span className="text-xs text-slate-400">Score A managers</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {highPerformers.map(m => (
                  <div key={m.department} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                      {m.manager.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{m.manager}</p>
                      <p className="text-xs text-slate-500">{m.department} · Score {m.overallGrade}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <OffTargetPanel title="Off-Target Managers" rows={offTargetRows} />

      {/* Ownership */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><UserCog className="w-3.5 h-3.5" /><strong className="text-slate-700">Accountable:</strong> HR GM</span>
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /><strong className="text-slate-700">Co-Owner:</strong> Functional Directors</span>
      </div>
    </div>
  );
};
