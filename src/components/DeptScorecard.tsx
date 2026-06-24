import React, { useMemo, useState } from 'react';
import {
  Building2,
  Users,
  AlertTriangle,
  Award,
  ArrowRight,
  UserCog,
  Calendar,
  TrendingUp,
  TrendingDown,
  MinusCircle,
  Target,
  Siren,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Gauge,
} from 'lucide-react';

type Grade = 'A' | 'B' | 'C' | 'D';

interface DeptRawData {
  department: string;
  headcount: number;
  vacancy: number;
  turnover: number;
  attendance: number;
  productivity: Grade;
  labourCost: Grade;
}

const deptRawData: DeptRawData[] = [
  { department: 'Goldsmith Production', headcount: 146, vacancy: 12, turnover: 4, attendance: 96, productivity: 'A', labourCost: 'A' },
  { department: 'SR Finance', headcount: 112, vacancy: 3, turnover: 2, attendance: 97, productivity: 'A', labourCost: 'A' },
  { department: 'Security', headcount: 74, vacancy: 7, turnover: 16, attendance: 91, productivity: 'C', labourCost: 'B' },
  { department: 'BSO', headcount: 71, vacancy: 2, turnover: 6, attendance: 94, productivity: 'B', labourCost: 'B' },
  { department: 'Admin', headcount: 58, vacancy: 4, turnover: 12, attendance: 93, productivity: 'C', labourCost: 'B' },
  { department: 'HR', headcount: 15, vacancy: 2, turnover: 18, attendance: 90, productivity: 'D', labourCost: 'B' },
  { department: 'Procurement', headcount: 15, vacancy: 1, turnover: 7, attendance: 95, productivity: 'B', labourCost: 'B' },
];

const SCORE_WEIGHTS = {
  productivity: 0.40,
  turnover: 0.20,
  attendance: 0.15,
  vacancy: 0.15,
  labourCost: 0.10,
} as const;

const gradeValue: Record<Grade, number> = { A: 4, B: 3, C: 2, D: 1 };
const valueToGrade = (v: number): Grade => (v >= 3.5 ? 'A' : v >= 2.5 ? 'B' : v >= 1.5 ? 'C' : 'D');

function turnoverToGrade(turnover: number): Grade {
  if (turnover < 5) return 'A';
  if (turnover < 10) return 'B';
  if (turnover < 15) return 'C';
  return 'D';
}

function vacancyToGrade(vacancy: number): Grade {
  if (vacancy <= 2) return 'A';
  if (vacancy <= 5) return 'B';
  if (vacancy <= 10) return 'C';
  return 'D';
}

function attendanceToGrade(attendance: number): Grade {
  if (attendance >= 95) return 'A';
  if (attendance >= 90) return 'B';
  if (attendance >= 85) return 'C';
  return 'D';
}

interface DeptScored extends DeptRawData {
  turnoverGrade: Grade;
  vacancyGrade: Grade;
  attendanceGrade: Grade;
  overallScore: number;
  overallGrade: Grade;
}

function calculateScores(data: DeptRawData[]): DeptScored[] {
  return data.map(d => {
    const turnoverGrade = turnoverToGrade(d.turnover);
    const vacancyGrade = vacancyToGrade(d.vacancy);
    const attendanceGrade = attendanceToGrade(d.attendance);

    const overallScore =
      gradeValue[d.productivity] * SCORE_WEIGHTS.productivity +
      gradeValue[turnoverGrade] * SCORE_WEIGHTS.turnover +
      gradeValue[attendanceGrade] * SCORE_WEIGHTS.attendance +
      gradeValue[vacancyGrade] * SCORE_WEIGHTS.vacancy +
      gradeValue[d.labourCost] * SCORE_WEIGHTS.labourCost;

    return {
      ...d,
      turnoverGrade,
      vacancyGrade,
      attendanceGrade,
      overallScore: Math.round(overallScore * 100) / 100,
      overallGrade: valueToGrade(overallScore),
    };
  });
}

const gradeConfig: Record<Grade, { label: string; badge: string; bg: string; border: string; text: string; bar: string }> = {
  A: { label: 'Excellent', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', bg: 'bg-emerald-50/40', border: 'border-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  B: { label: 'Good', badge: 'bg-blue-100 text-blue-700 border-blue-300', bg: 'bg-blue-50/40', border: 'border-blue-200', text: 'text-blue-600', bar: 'bg-blue-500' },
  C: { label: 'At Risk', badge: 'bg-amber-100 text-amber-700 border-amber-300', bg: 'bg-amber-50/40', border: 'border-amber-300', text: 'text-amber-600', bar: 'bg-amber-500' },
  D: { label: 'Critical', badge: 'bg-rose-100 text-rose-700 border-rose-300', bg: 'bg-rose-50/40', border: 'border-rose-300', text: 'text-rose-600', bar: 'bg-rose-500' },
};

function GradeCell({ grade, showLabel = false }: { grade: Grade; showLabel?: boolean }) {
  const gc = gradeConfig[grade];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${gc.badge}`}>
      <span className={`text-sm font-black ${gc.text}`}>{grade}</span>
      {showLabel && <span className={`text-[10px] font-bold uppercase tracking-wider ${gc.text}`}>{gc.label}</span>}
    </div>
  );
}

export const DeptScorecard: React.FC = () => {
  const scored = useMemo(() => calculateScores(deptRawData), []);
  const [sortField, setSortField] = useState<'department' | 'headcount' | 'vacancy' | 'turnover' | 'overallScore'>('overallScore');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const sortedList = [...scored].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'department') {
        cmp = a.department.localeCompare(b.department);
      } else {
        cmp = (a[sortField] as number) - (b[sortField] as number);
      }
      return sortAsc ? cmp : -cmp;
    });
    return sortedList;
  }, [scored, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const riskRankings = useMemo(() => {
    return [...scored].sort((a, b) => a.overallScore - b.overallScore);
  }, [scored]);

  const gradeA = scored.filter(d => d.overallGrade === 'A').length;
  const gradeB = scored.filter(d => d.overallGrade === 'B').length;
  const gradeC = scored.filter(d => d.overallGrade === 'C').length;
  const gradeD = scored.filter(d => d.overallGrade === 'D').length;
  const totalHeadcount = scored.reduce((s, d) => s + d.headcount, 0);
  const avgScore = scored.reduce((s, d) => s + d.overallScore, 0) / scored.length;

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
      {/* ──────────────────────────────────────────────
          SECTION 1: Header
         ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500/30 backdrop-blur rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-indigo-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300/70">Core Function</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Department HR Performance Scorecard
            </h2>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Network Avg Score</span>
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

      {/* ──────────────────────────────────────────────
          SECTION 2: Score Calculation Reference
         ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gauge className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">Score Calculation Weights</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(SCORE_WEIGHTS).map(([key, weight]) => (
            <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-xl font-black text-slate-800 tabular-nums">{Math.round(weight * 100)}%</p>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${weight * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          SECTION 3: Department Scorecard Table
         ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-2 h-7 bg-indigo-500 rounded-full" />
          <div>
            <h3 className="text-xl font-bold text-slate-800">Department Scorecard</h3>
            <p className="text-slate-500 text-sm mt-0.5">Sortable — scores calculated from weighted formula</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <SortHeader field="department" label="Department" />
                <SortHeader field="headcount" label="Headcount" align="right" />
                <SortHeader field="vacancy" label="Vacancy" align="right" />
                <SortHeader field="turnover" label="Turnover" align="right" />
                <th className="px-5 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Attendance</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Productivity</th>
                <th className="px-5 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Labour Cost</th>
                <SortHeader field="overallScore" label="Score" align="center" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((dept, idx) => {
                const gc = gradeConfig[dept.overallGrade];
                const isRedAlert = dept.overallGrade === 'C' || dept.overallGrade === 'D';
                const isActive = selectedDept === dept.department;

                return (
                  <tr
                    key={dept.department}
                    onClick={() => setSelectedDept(isActive ? null : dept.department)}
                    className={`border-t border-slate-100 transition-colors cursor-pointer ${isActive ? 'ring-2 ring-indigo-200 ' : ''}${isRedAlert ? gc.bg : 'hover:bg-slate-50/50'} ${idx % 2 === 1 && !isRedAlert ? 'bg-slate-50/20' : ''}`}
                  >
                    {/* Department */}
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${gc.bg} border ${gc.border}`}>
                          <Building2 className={`w-4 h-4 ${gc.text}`} />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{dept.department}</span>
                      </div>
                    </td>

                    {/* Headcount */}
                    <td className="px-5 py-5 text-right">
                      <span className="text-base font-black text-slate-900 tabular-nums">{dept.headcount}</span>
                    </td>

                    {/* Vacancy */}
                    <td className="px-5 py-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className={`text-sm font-bold tabular-nums ${dept.vacancy > 10 ? 'text-rose-600' : dept.vacancy > 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                          {dept.vacancy}
                        </span>
                        <span className={`text-[9px] font-bold ${gradeConfig[dept.vacancyGrade].text}`}>
                          ({dept.vacancyGrade})
                        </span>
                      </div>
                    </td>

                    {/* Turnover */}
                    <td className="px-5 py-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className={`text-sm font-bold tabular-nums ${dept.turnover > 15 ? 'text-rose-600' : dept.turnover > 10 ? 'text-amber-600' : 'text-slate-700'}`}>
                          {dept.turnover}%
                        </span>
                        <span className={`text-[9px] font-bold ${gradeConfig[dept.turnoverGrade].text}`}>
                          ({dept.turnoverGrade})
                        </span>
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="px-5 py-5 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className={`text-sm font-bold tabular-nums ${dept.attendance < 90 ? 'text-rose-600' : dept.attendance < 95 ? 'text-amber-600' : 'text-slate-700'}`}>
                          {dept.attendance}%
                        </span>
                        <span className={`text-[9px] font-bold ${gradeConfig[dept.attendanceGrade].text}`}>
                          ({dept.attendanceGrade})
                        </span>
                      </div>
                    </td>

                    {/* Productivity */}
                    <td className="px-5 py-5 text-center">
                      <GradeCell grade={dept.productivity} />
                    </td>

                    {/* Labour Cost */}
                    <td className="px-5 py-5 text-center">
                      <GradeCell grade={dept.labourCost} />
                    </td>

                    {/* Overall Score */}
                    <td className="px-5 py-5">
                      <div className="flex justify-center">
                        {isRedAlert ? (
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 ${gc.border} ${gc.bg} shadow-sm`}>
                            <AlertTriangle className={`w-4 h-4 ${gc.text} animate-pulse`} />
                            <span className={`text-lg font-black ${gc.text}`}>{dept.overallGrade}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${gc.text}`}>{gc.label}</span>
                          </div>
                        ) : (
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${gc.border} ${gc.bg}`}>
                            <Award className={`w-4 h-4 ${gc.text}`} />
                            <span className={`text-lg font-black ${gc.text}`}>{dept.overallGrade}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${gc.text}`}>{gc.label}</span>
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

      {/* Detail Section */}
      {selectedDept && (() => {
        const d = scored.find(x => x.department === selectedDept);
        if (!d) return null;
        const gc = gradeConfig[d.overallGrade];
        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-7 bg-indigo-500 rounded-full" />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{d.department} — Detail Breakdown</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Score {d.overallScore.toFixed(2)}/4.0 · Grade {d.overallGrade} ({gc.label}) · {d.headcount} staff</p>
                </div>
              </div>
              <button onClick={() => setSelectedDept(null)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                <ChevronUp className="w-4 h-4" />Close
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Headcount</p><p className="text-xl font-black text-slate-900 tabular-nums">{d.headcount}</p></div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Vacancy</p><p className="text-xl font-black text-rose-600 tabular-nums">{d.vacancy}</p><p className="text-[10px] font-bold mt-1">Grade: {d.vacancyGrade}</p></div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Turnover</p><p className="text-xl font-black text-rose-600 tabular-nums">{d.turnover}%</p><p className="text-[10px] font-bold mt-1">Grade: {d.turnoverGrade}</p></div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attendance</p><p className="text-xl font-black text-slate-900 tabular-nums">{d.attendance}%</p><p className="text-[10px] font-bold mt-1">Grade: {d.attendanceGrade}</p></div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Productivity</p><p className="text-xl font-black text-slate-900">{d.productivity}</p><p className="text-[10px] font-bold mt-1">Labour Cost: {d.labourCost}</p></div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Score Component Breakdown</p>
                <div className="space-y-3">
                  {([
                    { label: 'Productivity', grade: d.productivity, weight: SCORE_WEIGHTS.productivity },
                    { label: 'Turnover', grade: d.turnoverGrade, weight: SCORE_WEIGHTS.turnover },
                    { label: 'Attendance', grade: d.attendanceGrade, weight: SCORE_WEIGHTS.attendance },
                    { label: 'Vacancy', grade: d.vacancyGrade, weight: SCORE_WEIGHTS.vacancy },
                    { label: 'Labour Cost', grade: d.labourCost, weight: SCORE_WEIGHTS.labourCost },
                  ] as { label: string; grade: Grade; weight: number }[]).map((c) => {
                    const cg = gradeConfig[c.grade];
                    const contribution = gradeValue[c.grade] * c.weight;
                    return (
                      <div key={c.label} className="flex items-center gap-4">
                        <div className="w-32 flex-shrink-0"><span className="text-sm font-bold text-slate-700">{c.label}</span></div>
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border ${cg.badge}`}><span className={`text-sm font-black ${cg.text}`}>{c.grade}</span></div>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${cg.bar} rounded-full`} style={{ width: `${(gradeValue[c.grade] / 4) * 100}%` }} /></div>
                        <div className="w-20 text-right"><span className="text-xs font-bold text-slate-500">{Math.round(c.weight * 100)}% weight</span></div>
                        <div className="w-16 text-right"><span className="text-sm font-black text-slate-700 tabular-nums">{contribution.toFixed(2)}</span></div>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                    <div className="w-32 flex-shrink-0"><span className="text-sm font-black text-slate-800">Overall Score</span></div>
                    <div className="flex-1" />
                    <div className="w-20 text-right" />
                    <div className="w-16 text-right"><span className={`text-lg font-black tabular-nums ${gc.text}`}>{d.overallScore.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ──────────────────────────────────────────────
          SECTION 4: Department Risk Ranking
         ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-7 bg-rose-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Department Risk Ranking</h3>
          <span className="text-sm text-slate-400 font-medium">— Lowest score to highest</span>
        </div>

        <div className="space-y-3">
          {riskRankings.map((dept, idx) => {
            const gc = gradeConfig[dept.overallGrade];
            const isRedAlert = dept.overallGrade === 'C' || dept.overallGrade === 'D';

            return (
              <div
                key={dept.department}
                className={`flex items-center gap-4 p-4 rounded-2xl border ${isRedAlert ? gc.border : 'border-slate-100'} ${isRedAlert ? gc.bg : 'bg-slate-50/50'}`}
              >
                {/* Rank Number */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                  idx === 0 ? 'bg-rose-100 text-rose-600' :
                  idx === 1 ? 'bg-amber-100 text-amber-600' :
                  idx === 2 ? 'bg-amber-50 text-amber-500' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {idx + 1}
                </div>

                {/* Department Name + Headcount */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{dept.department}</p>
                  <p className="text-xs text-slate-400 font-medium">{dept.headcount} staff · {dept.vacancy} vacant · {dept.turnover}% turnover</p>
                </div>

                {/* Score Bar */}
                <div className="hidden md:flex items-center gap-3 w-48">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${gc.bar} rounded-full transition-all duration-1000`}
                      style={{ width: `${(dept.overallScore / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-slate-700 tabular-nums w-10 text-right">{dept.overallScore.toFixed(1)}</span>
                </div>

                {/* Grade Badge */}
                <div className="flex-shrink-0">
                  {isRedAlert ? (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${gc.badge}`}>
                      <AlertTriangle className={`w-3.5 h-3.5 ${gc.text}`} />
                      <span className={`text-sm font-black ${gc.text}`}>{dept.overallGrade}</span>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${gc.badge}`}>
                      <Award className={`w-3.5 h-3.5 ${gc.text}`} />
                      <span className={`text-sm font-black ${gc.text}`}>{dept.overallGrade}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          SECTION 5: Ownership
         ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-7 bg-indigo-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Ownership</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary</p>
              <p className="text-lg font-bold text-slate-800">Department Heads</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Department-level performance & recovery</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <UserCog className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Oversight</p>
              <p className="text-lg font-bold text-slate-800">HR GM</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Cross-department HR strategy</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
