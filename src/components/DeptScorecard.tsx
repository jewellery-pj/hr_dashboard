import React, { useMemo, useState } from 'react';
import {
  Building2,
  AlertTriangle,
  UserCog,
  Siren,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Gauge,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { Candidate, EmployeeRecord, Resignation, Manpower } from '../data/mockData';
import { flattenOffTarget, getDeptOffTargetRows } from '../utils/offTarget';
import { OffTargetPanel } from './OffTargetPanel';

interface DeptScorecardProps {
  resignations: Resignation[];
  manpower: Manpower[];
  employees: EmployeeRecord[];
  candidates: Candidate[];
}

type Grade = 'A' | 'B' | 'C' | 'D';

interface DeptData {
  department: string;
  headcount: number;
  budgeted: number;
  vacancy: number;
  vacancyRate: number;
  turnover: number;
  turnoverRate: number;
  attendance: number;
  productivity: Grade;
  labourCost: Grade;
  turnoverGrade: Grade;
  vacancyGrade: Grade;
  attendanceGrade: Grade;
  overallScore: number;
  overallGrade: Grade;
  needsWorkforceStabilization: boolean;
  needsProductivityReview: boolean;
  riskRank: number;
}

const SCORE_WEIGHTS = {
  productivity: 0.40,
  turnover: 0.20,
  attendance: 0.15,
  vacancy: 0.15,
  labourCost: 0.10,
} as const;

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const gradeValue: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1 };
const valueToGrade = (v: number): Grade => (v >= 3.5 ? 'A' : v >= 2.5 ? 'B' : v >= 1.5 ? 'C' : 'D');

function turnoverToGrade(rate: number): Grade {
  if (rate < 5) return 'A';
  if (rate < 10) return 'B';
  if (rate < 15) return 'C';
  return 'D';
}

function vacancyCountToGrade(count: number): Grade {
  if (count <= 2) return 'A';
  if (count <= 5) return 'B';
  if (count <= 10) return 'C';
  return 'D';
}

function attendanceToGrade(rate: number): Grade {
  if (rate >= 95) return 'A';
  if (rate >= 90) return 'B';
  if (rate >= 85) return 'C';
  return 'D';
}

function productivityToGrade(
  turnoverRate: number,
  vacancyRate: number,
  hireRatio: number,
): Grade {
  let score = 4;
  if (turnoverRate >= 15) score -= 2;
  else if (turnoverRate >= 10) score -= 1;
  else if (turnoverRate >= 5) score -= 0.5;

  if (vacancyRate >= 15) score -= 1.5;
  else if (vacancyRate >= 8) score -= 1;
  else if (vacancyRate >= 4) score -= 0.5;

  if (hireRatio >= 0.6) score += 0.5;
  else if (hireRatio < 0.2 && turnoverRate > 5) score -= 0.5;

  if (score >= 3.5) return 'A';
  if (score >= 2.5) return 'B';
  if (score >= 1.5) return 'C';
  return 'D';
}

const gradeConfig: Record<Grade, { label: string; badge: string; bg: string; border: string; text: string; bar: string }> = {
  A: { label: 'Excellent', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  B: { label: 'Good', badge: 'bg-blue-50 text-blue-700 border-blue-200', bg: 'bg-blue-50/40', border: 'border-blue-200', text: 'text-blue-600', bar: 'bg-blue-500' },
  C: { label: 'At Risk', badge: 'bg-amber-50 text-amber-700 border-amber-200', bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-600', bar: 'bg-amber-500' },
  D: { label: 'Critical', badge: 'bg-rose-50 text-rose-700 border-rose-200', bg: 'bg-rose-50/50', border: 'border-rose-200', text: 'text-rose-600', bar: 'bg-rose-500' },
};

function GradeBadge({ grade, compact = false }: { grade: Grade; compact?: boolean }) {
  const gc = gradeConfig[grade];
  return (
    <span className={`inline-flex items-center justify-center ${compact ? 'w-7 h-7' : 'px-2.5 py-1'} rounded-lg border ${gc.badge} text-sm font-black ${gc.text}`}>
      {grade}
    </span>
  );
}

export const DeptScorecard: React.FC<DeptScorecardProps> = ({
  resignations,
  manpower,
  employees,
  candidates,
}) => {
  const departments = useMemo<DeptData[]>(() => {
    const deptMap = new Map<string, {
      headcount: number;
      budgeted: number;
      resignations: Resignation[];
      priorResignations: Resignation[];
    }>();

    for (const emp of employees) {
      const dept = emp.department?.trim() || 'Unknown';
      if (dept === 'Unknown') continue;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { headcount: 0, budgeted: 0, resignations: [], priorResignations: [] });
      }
      deptMap.get(dept)!.headcount += 1;
    }

    for (const m of manpower) {
      const dept = m.department?.trim() || 'Unknown';
      if (dept === 'Unknown') continue;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { headcount: 0, budgeted: 0, resignations: [], priorResignations: [] });
      }
      const entry = deptMap.get(dept)!;
      entry.budgeted += m.budgeted || 0;
      if (entry.headcount === 0) entry.headcount += m.actual || 0;
    }

    const midMonthIdx = Math.floor(MONTH_ORDER.length / 2);
    for (const r of resignations) {
      const dept = r.department?.trim() || 'Unknown';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { headcount: 0, budgeted: 0, resignations: [], priorResignations: [] });
      }
      const entry = deptMap.get(dept)!;
      const monthIdx = MONTH_ORDER.indexOf(r.month);
      if (monthIdx >= midMonthIdx) entry.resignations.push(r);
      else entry.priorResignations.push(r);
    }

    const pipelineByDept = new Map<string, number>();
    for (const c of candidates.filter(x => x.finalStatus === 'In Progress')) {
      pipelineByDept.set(c.department, (pipelineByDept.get(c.department) || 0) + 1);
    }
    const joinedByDept = new Map<string, number>();
    for (const c of candidates.filter(x => x.finalStatus === 'Joined')) {
      joinedByDept.set(c.department, (joinedByDept.get(c.department) || 0) + 1);
    }

    const raw: Omit<DeptData, 'riskRank'>[] = [...deptMap.entries()]
      .map(([department, data]) => {
        if (data.headcount === 0 && data.budgeted === 0) return null;

        let vacancy: number;
        let vacancyRate: number;
        if (data.budgeted > 0) {
          vacancy = Math.max(0, data.budgeted - data.headcount);
          vacancyRate = (vacancy / data.budgeted) * 100;
        } else {
          vacancy = pipelineByDept.get(department) || 0;
          vacancyRate = data.headcount > 0 ? (vacancy / data.headcount) * 100 : 0;
        }

        const turnover = data.resignations.length;
        const turnoverRate = data.headcount > 0 ? (turnover / data.headcount) * 100 : 0;
        const priorTurnoverRate = data.headcount > 0 ? (data.priorResignations.length / data.headcount) * 100 : 0;

        const attendance = Math.round(
          Math.max(80, Math.min(99, 100 - turnoverRate * 1.1 - vacancyRate * 0.4))
        );

        const joined = joinedByDept.get(department) || 0;
        const pipeline = pipelineByDept.get(department) || 0;
        const hireRatio = turnover + pipeline > 0 ? joined / (turnover + pipeline) : joined > 0 ? 1 : 0.5;

        const turnoverGrade = turnoverToGrade(turnoverRate);
        const vacancyGrade = vacancyCountToGrade(vacancy);
        const attendanceGrade = attendanceToGrade(attendance);
        const productivity = productivityToGrade(turnoverRate, vacancyRate, hireRatio);
        const labourCost: Grade = 'B';

        const overallScore =
          gradeValue[productivity] * SCORE_WEIGHTS.productivity +
          gradeValue[turnoverGrade] * SCORE_WEIGHTS.turnover +
          gradeValue[attendanceGrade] * SCORE_WEIGHTS.attendance +
          gradeValue[vacancyGrade] * SCORE_WEIGHTS.vacancy +
          gradeValue[labourCost] * SCORE_WEIGHTS.labourCost;

        const overallGrade = valueToGrade(overallScore);

        const needsWorkforceStabilization =
          (turnoverGrade === 'C' || turnoverGrade === 'D') &&
          (vacancyGrade === 'C' || vacancyGrade === 'D');

        const needsProductivityReview =
          productivity === 'C' || productivity === 'D' ||
          turnoverRate > priorTurnoverRate + 3;

        return {
          department,
          headcount: data.headcount,
          budgeted: data.budgeted,
          vacancy,
          vacancyRate,
          turnover,
          turnoverRate,
          attendance,
          productivity,
          labourCost,
          turnoverGrade,
          vacancyGrade,
          attendanceGrade,
          overallScore: Math.round(overallScore * 100) / 100,
          overallGrade,
          needsWorkforceStabilization,
          needsProductivityReview,
        };
      })
      .filter((d) => d !== null) as Omit<DeptData, 'riskRank'>[];

    const ranked = [...raw].sort((a, b) => a.overallScore - b.overallScore);
    return ranked.map((d, i) => ({ ...d, riskRank: i + 1 }));
  }, [resignations, manpower, employees, candidates]);

  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const redAlertDepts = departments.filter(d => d.overallGrade === 'C' || d.overallGrade === 'D');
  const avgScore = departments.length > 0
    ? departments.reduce((s, d) => s + d.overallScore, 0) / departments.length
    : 0;

  const headerGradient = departments.some(d => d.overallGrade === 'D')
    ? 'from-rose-900 via-rose-800 to-slate-900'
    : departments.some(d => d.overallGrade === 'C')
    ? 'from-amber-900 via-amber-800 to-slate-900'
    : 'from-emerald-800 via-emerald-700 to-slate-800';

  const offTargetRows = useMemo(
    () => flattenOffTarget(departments, getDeptOffTargetRows),
    [departments],
  );

  const renderDetail = (d: DeptData) => {
    const deptRes = resignations.filter(r => r.department === d.department);
    const deptManpower = manpower.filter(m => m.department === d.department);
    const deptJoined = candidates.filter(c => c.finalStatus === 'Joined' && c.department === d.department);
    const deptPipeline = candidates.filter(c => c.finalStatus === 'In Progress' && c.department === d.department);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {([
            { label: 'Productivity', grade: d.productivity, weight: '40%' },
            { label: 'Turnover', grade: d.turnoverGrade, weight: '20%' },
            { label: 'Attendance', grade: d.attendanceGrade, weight: '15%' },
            { label: 'Vacancy', grade: d.vacancyGrade, weight: '15%' },
            { label: 'Labour Cost', grade: d.labourCost, weight: '10%' },
          ] as const).map(({ label, grade, weight }) => (
            <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
              <p className="text-lg font-black mt-1">{grade}</p>
              <p className="text-[10px] text-slate-400">{weight}</p>
            </div>
          ))}
        </div>
        <p className="text-sm font-bold text-slate-700">
          Overall: {d.overallScore.toFixed(2)} / 4.0 · Grade {d.overallGrade}
        </p>
        {deptManpower.length > 0 && (
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50/80">
                <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Position</th>
                <th className="px-4 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Staff</th>
              </tr></thead>
              <tbody>
                {deptManpower.slice(0, 15).map((m, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-sm font-bold text-slate-700">{m.position}</td>
                    <td className="px-4 py-2 text-right text-sm tabular-nums">{m.actual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex gap-4 text-xs text-slate-500">
          <span>{deptRes.length} resignations</span>
          <span>{deptJoined.length} hires</span>
          <span>{deptPipeline.length} in pipeline</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header — Core Function */}
      <div className={`bg-gradient-to-br ${headerGradient} rounded-2xl p-6 md:p-8 text-white shadow-lg`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Core Function · HQ Departments</p>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Department HR Performance Scorecard</h2>
            <p className="text-sm text-white/60 mt-2">
              {departments.length} departments · {departments.reduce((s, d) => s + d.headcount, 0).toLocaleString()} headcount
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center col-span-2">
              <p className="text-2xl font-black">{avgScore.toFixed(1)}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Network Avg Score / 4.0</p>
            </div>
            {(['A', 'B', 'C', 'D'] as Grade[]).map(g => {
              const count = departments.filter(d => d.overallGrade === g).length;
              return (
                <div key={g} className="px-3 py-2 bg-white/10 rounded-lg border border-white/10 text-center">
                  <p className="text-lg font-black">{count}</p>
                  <p className="text-[10px] font-bold text-white/50">{g}</p>
                </div>
              );
            })}
          </div>
        </div>
        {redAlertDepts.length > 0 && (
          <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-rose-500/25 rounded-xl border border-rose-400/30">
            <Siren className="w-4 h-4 text-rose-200 flex-shrink-0 animate-pulse" />
            <p className="text-sm font-bold text-rose-100">
              RED ALERT: {redAlertDepts.map(d => `${d.department} (${d.overallGrade})`).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Score Weights */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">Score Calculation</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {([
            ['Productivity', 40],
            ['Turnover', 20],
            ['Attendance', 15],
            ['Vacancy', 15],
            ['Labour Cost', 10],
          ] as const).map(([label, pct]) => (
            <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
              <p className="text-lg font-black text-slate-800">{pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No Department Data Available</p>
        </div>
      ) : (
        <>
          {/* Chairman Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-800">Department Scorecard</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click a row for score breakdown · Score C & D = Red Alert</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Headcount</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Vacancy</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Turnover</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Productivity</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Labour Cost</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[...departments].sort((a, b) => b.headcount - a.headcount).map((d) => {
                    const gc = gradeConfig[d.overallGrade];
                    const isRedAlert = d.overallGrade === 'C' || d.overallGrade === 'D';
                    const isExpanded = expandedDept === d.department;
                    return (
                      <React.Fragment key={d.department}>
                        <tr
                          className={`border-t border-slate-100 cursor-pointer transition-colors ${isRedAlert ? gc.bg : 'hover:bg-slate-50/80'} ${isExpanded ? 'ring-1 ring-inset ring-indigo-200' : ''}`}
                          onClick={() => setExpandedDept(isExpanded ? null : d.department)}
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              {isRedAlert && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />}
                              <Building2 className={`w-4 h-4 flex-shrink-0 ${gc.text}`} />
                              <span className="text-sm font-bold text-slate-800">{d.department}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-400 ml-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-300 ml-auto" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-black tabular-nums">{d.headcount}</td>
                          <td className={`px-4 py-3.5 text-right text-sm font-bold tabular-nums ${d.vacancy > 10 ? 'text-rose-600' : d.vacancy > 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {d.vacancy}
                          </td>
                          <td className={`px-4 py-3.5 text-right text-sm font-bold tabular-nums ${d.turnoverRate >= 15 ? 'text-rose-600' : d.turnoverRate >= 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                            {d.turnoverRate.toFixed(0)}%
                          </td>
                          <td className="px-4 py-3.5 text-center"><GradeBadge grade={d.productivity} compact /></td>
                          <td className="px-4 py-3.5 text-center"><GradeBadge grade={d.labourCost} compact /></td>
                          <td className="px-4 py-3.5">
                            <div className="flex justify-center">
                              {isRedAlert ? (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 ${gc.border} ${gc.bg}`}>
                                  <AlertTriangle className={`w-3.5 h-3.5 ${gc.text} animate-pulse`} />
                                  <span className={`text-base font-black ${gc.text}`}>{d.overallGrade}</span>
                                </div>
                              ) : (
                                <GradeBadge grade={d.overallGrade} />
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={7} className="px-6 py-4 border-t border-indigo-100">
                              {renderDetail(d)}
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

          {/* Department Risk Ranking */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              <h3 className="text-base font-bold text-slate-800">Department Risk Ranking</h3>
              <span className="text-xs text-slate-400">Lowest score = highest risk</span>
            </div>
            <div className="space-y-2">
              {departments.map((d) => {
                const gc = gradeConfig[d.overallGrade];
                const isRedAlert = d.overallGrade === 'C' || d.overallGrade === 'D';
                return (
                  <div
                    key={d.department}
                    className={`flex items-center gap-4 p-3 rounded-xl border ${isRedAlert ? gc.border : 'border-slate-100'} ${isRedAlert ? gc.bg : 'bg-slate-50/50'}`}
                  >
                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                      d.riskRank === 1 ? 'bg-rose-100 text-rose-700' :
                      d.riskRank === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {d.riskRank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{d.department}</p>
                      <p className="text-xs text-slate-400">
                        {d.headcount} staff · {d.vacancy} vacant · {d.turnoverRate.toFixed(0)}% turnover
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${gc.bar} rounded-full`} style={{ width: `${(d.overallScore / 4) * 100}%` }} />
                      </div>
                      <span className="text-xs font-black tabular-nums text-slate-600">{d.overallScore.toFixed(1)}</span>
                    </div>
                    <GradeBadge grade={d.overallGrade} compact />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <OffTargetPanel title="Off-Target Departments" rows={offTargetRows} />

      {/* Ownership */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /><strong className="text-slate-700">Accountable:</strong> Department Heads</span>
        <span className="flex items-center gap-1.5"><UserCog className="w-3.5 h-3.5" /><strong className="text-slate-700">Oversight:</strong> HR GM</span>
      </div>
    </div>
  );
};
