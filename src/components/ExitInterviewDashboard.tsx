import React, { useMemo, useState } from 'react';
import { ExitInterview } from '../data/mockData';
import { normalizeDateForCompare } from '../utils/dateUtils';
import {
  getEmployeeReasonCategory,
  getExecutiveReasonCategory,
  getHrReasonCategory,
  hasReasonMismatch,
  REASON_COLORS,
  SALARY_HIGH_THRESHOLD,
  SUPERVISOR_HIGH_THRESHOLD,
  CAREER_GROWTH_THRESHOLD,
} from '../utils/exitReasons';
import { MessageSquare, Search, Info, UserCog, AlertTriangle, Siren, ChevronDown, ChevronUp } from 'lucide-react';
import { buildExitReasonOffTarget } from '../utils/offTarget';
import { OffTargetPanel } from './OffTargetPanel';
import {
  OperationalShell,
  OperationalHeader,
  OperationalSection,
  OperationalFilters,
  FilterField,
  filterSelectClass,
  filterInputClass,
  OperationalOwnership,
  OperationalTableWrap,
  OperationalTable,
  OperationalThead,
  OperationalTh,
  OperationalAlert,
} from './OperationalLayout';

interface ExitInterviewDashboardProps {
  exitInterviews: ExitInterview[];
  externalMonthFilter?: string;
}

export const ExitInterviewDashboard: React.FC<ExitInterviewDashboardProps> = ({
  exitInterviews,
  externalMonthFilter = 'All',
}) => {
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [reasonSearch, setReasonSearch] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedInterview, setSelectedInterview] = useState<ExitInterview | null>(null);
  const [selectedDeptForPositions, setSelectedDeptForPositions] = useState<string>('');
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [showMismatchOnly, setShowMismatchOnly] = useState(false);

  const departments = useMemo(() =>
    ['All', ...Array.from(new Set(exitInterviews.map(r => r.department)))].sort(),
  [exitInterviews]);

  const actualDepartments = useMemo(() =>
    Array.from(new Set(exitInterviews.map(r => r.department))).sort(),
  [exitInterviews]);

  React.useEffect(() => {
    if (actualDepartments.length > 0 && !selectedDeptForPositions) {
      setSelectedDeptForPositions(actualDepartments[0]);
    }
  }, [actualDepartments, selectedDeptForPositions]);

  const filteredData = useMemo(() => {
    return exitInterviews.filter(r => {
      const matchesDept = deptFilter === 'All' || r.department === deptFilter;
      const matchesMonth = externalMonthFilter === 'All' || r.month === externalMonthFilter;
      const matchesDate = !dateFilter || !r.resignationDate
        ? true
        : normalizeDateForCompare(r.resignationDate) === dateFilter;
      const q = reasonSearch.toLowerCase();
      const matchesReason = reasonSearch === '' ||
        r.reason.toLowerCase().includes(q) ||
        r.requestReason.toLowerCase().includes(q) ||
        r.hrReason.toLowerCase().includes(q) ||
        getExecutiveReasonCategory(r).toLowerCase().includes(q) ||
        (r.feedback || '').toLowerCase().includes(q);
      const matchesMismatch = !showMismatchOnly || hasReasonMismatch(r);
      return matchesDept && matchesMonth && matchesDate && matchesReason && matchesMismatch;
    });
  }, [exitInterviews, deptFilter, externalMonthFilter, dateFilter, reasonSearch, showMismatchOnly]);

  const reasonBreakdown = useMemo(() => {
    const total = filteredData.length || 1;
    const map = filteredData.reduce((acc, e) => {
      const cat = getExecutiveReasonCategory(e);
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return (Object.entries(map) as [string, number][])
      .map(([reason, count]) => ({ reason, count, pct: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const deptBreakdown = useMemo(() => {
    const total = filteredData.length || 1;
    const map = filteredData.reduce((acc, e) => {
      const dept = e.department || 'Unknown';
      if (!acc[dept]) acc[dept] = { count: 0, reasons: {} as Record<string, number> };
      acc[dept].count++;
      const cat = getExecutiveReasonCategory(e);
      acc[dept].reasons[cat] = (acc[dept].reasons[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, { count: number; reasons: Record<string, number> }>);
    return (Object.entries(map) as [string, { count: number; reasons: Record<string, number> }][])
      .map(([department, data]) => {
        const topReason = (Object.entries(data.reasons) as [string, number][])
          .sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
        return { department, count: data.count, pct: (data.count / total) * 100, topReason };
      })
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const mismatchRows = useMemo(() =>
    filteredData
      .filter(hasReasonMismatch)
      .map(e => ({
        id: e.id,
        name: e.name,
        department: e.department,
        employeeReason: getEmployeeReasonCategory(e),
        hrReason: getHrReasonCategory(e),
      })),
  [filteredData]);

  const alignmentStats = useMemo(() => {
    const withBoth = filteredData.filter(
      e => (e.requestReason || e.reason) && e.hrReason &&
        e.requestReason !== 'Unknown' && e.hrReason !== 'Unknown',
    );
    const aligned = withBoth.filter(e => !hasReasonMismatch(e)).length;
    return {
      withBoth: withBoth.length,
      aligned,
      mismatched: mismatchRows.length,
      alignPct: withBoth.length > 0 ? (aligned / withBoth.length) * 100 : 100,
    };
  }, [filteredData, mismatchRows.length]);

  const positionsByDept = useMemo(() => {
    if (!selectedDeptForPositions) return [];
    return filteredData
      .filter(r => r.department === selectedDeptForPositions)
      .reduce((acc, r) => {
        acc[r.position] = (acc[r.position] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
  }, [filteredData, selectedDeptForPositions]);

  const salaryPct = reasonBreakdown.find(r => r.reason === 'Salary')?.pct || 0;
  const supervisorPct = reasonBreakdown.find(r => r.reason === 'Supervisor Issue')?.pct || 0;
  const careerPct = reasonBreakdown.find(r => r.reason === 'Career Growth')?.pct || 0;

  const offTargetReasons = useMemo(
    () => buildExitReasonOffTarget(reasonBreakdown),
    [reasonBreakdown],
  );

  const periodLabel = externalMonthFilter === 'All' ? 'All months' : externalMonthFilter;
  const topReason = reasonBreakdown[0];

  return (
    <OperationalShell>
      <OperationalHeader
        eyebrow="HR Executive Dashboard 2.0"
        title="Exit Interview Analytics"
        subtitle={`${filteredData.length} interviews · ${periodLabel} · unified reason categories`}
        gradient="amber"
        metrics={[
          { value: filteredData.length, label: 'Exits' },
          { value: topReason?.reason || '—', label: 'Top Reason' },
          { value: topReason ? `${topReason.pct.toFixed(0)}%` : '—', label: 'Top %' },
          { value: mismatchRows.length, label: 'Reason Gaps', accentClass: mismatchRows.length > 0 ? 'text-rose-300' : undefined },
        ]}
        alert={
          offTargetReasons.length > 0 ? (
            <OperationalAlert tone="rose">
              <Siren className="w-4 h-4 flex-shrink-0 animate-pulse" />
              <span className="text-sm font-bold">
                {offTargetReasons[0].metric}: {offTargetReasons[0].now} · {offTargetReasons[0].gap}
              </span>
            </OperationalAlert>
          ) : undefined
        }
      />

      <OperationalSection
        title="Reason Field Alignment"
        subtitle={`Request Reason + HR Reason · ${alignmentStats.withBoth} records with both fields`}
      >
        <div className="flex flex-wrap gap-4">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
            <span className="text-xs font-bold text-emerald-700 uppercase">Aligned</span>
            <p className="text-lg font-black text-emerald-800">{alignmentStats.alignPct.toFixed(0)}%</p>
          </div>
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase">Same category</span>
            <p className="text-lg font-black text-slate-800">{alignmentStats.aligned} / {alignmentStats.withBoth || filteredData.length}</p>
          </div>
          {mismatchRows.length > 0 && (
            <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl">
              <span className="text-xs font-bold text-rose-600 uppercase">Category mismatch</span>
              <p className="text-lg font-black text-rose-700">{mismatchRows.length}</p>
            </div>
          )}
        </div>
      </OperationalSection>

      <OperationalFilters>
        <FilterField label="Department">
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className={filterSelectClass}>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FilterField>
        <FilterField label="Resignation Date">
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className={filterInputClass} />
        </FilterField>
        <FilterField label="Search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Reason category..." value={reasonSearch} onChange={e => setReasonSearch(e.target.value)} className={`${filterInputClass} pl-9`} />
          </div>
        </FilterField>
        <FilterField label="View">
          <select value={showMismatchOnly ? 'gaps' : 'all'} onChange={e => setShowMismatchOnly(e.target.value === 'gaps')} className={filterSelectClass}>
            <option value="all">All interviews</option>
            <option value="gaps">Reason gaps only</option>
          </select>
        </FilterField>
      </OperationalFilters>

      {/* Chairman table: Reason | Count | % */}
      <OperationalSection title="Exit Reason Summary" subtitle="Unified categories · click row for employees">
        <OperationalTableWrap>
          <OperationalTable>
            <OperationalThead>
              <OperationalTh>Reason</OperationalTh>
              <OperationalTh align="right">Count</OperationalTh>
              <OperationalTh align="right">%</OperationalTh>
            </OperationalThead>
            <tbody>
              {reasonBreakdown.map(row => {
                const isHighRisk =
                  (row.reason === 'Salary' && row.pct >= SALARY_HIGH_THRESHOLD) ||
                  (row.reason === 'Supervisor Issue' && row.pct >= SUPERVISOR_HIGH_THRESHOLD) ||
                  (row.reason === 'Career Growth' && row.pct >= CAREER_GROWTH_THRESHOLD);
                const isExpanded = expandedReason === row.reason;
                const records = filteredData.filter(e => getExecutiveReasonCategory(e) === row.reason);
                return (
                  <React.Fragment key={row.reason}>
                    <tr
                      className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50/80 ${isHighRisk ? 'bg-rose-50/30' : ''}`}
                      onClick={() => setExpandedReason(isExpanded ? null : row.reason)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {isHighRisk && <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />}
                          <span className={`text-sm font-bold ${REASON_COLORS[row.reason] || 'text-slate-700'}`}>{row.reason}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 ml-auto" /> : <ChevronDown className="w-4 h-4 text-slate-300 ml-auto" />}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-black tabular-nums">{row.count}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-bold tabular-nums">{row.pct.toFixed(0)}%</td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/40">
                        <td colSpan={3} className="px-4 py-3">
                          <div className="max-h-48 overflow-y-auto">
                            <table className="w-full">
                              <thead>
                                <tr>
                                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase py-1">Employee</th>
                                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase py-1">Department</th>
                                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase py-1">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {records.slice(0, 20).map((e, i) => (
                                  <tr key={i} className="border-t border-slate-100">
                                    <td className="py-1.5 text-sm font-semibold text-slate-700">{e.name}</td>
                                    <td className="py-1.5 text-sm text-slate-500">{e.department}</td>
                                    <td className="py-1.5 text-sm text-slate-500">{e.resignationDate}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </OperationalTable>
        </OperationalTableWrap>
      </OperationalSection>

      {/* Department Wise Breakdown */}
      <OperationalSection title="Department Wise Breakdown" subtitle="Department | Exits | % | Top Reason">
        <OperationalTableWrap>
          <OperationalTable>
            <OperationalThead>
              <OperationalTh>Department</OperationalTh>
              <OperationalTh align="right">Exits</OperationalTh>
              <OperationalTh align="right">%</OperationalTh>
              <OperationalTh>Top Reason</OperationalTh>
            </OperationalThead>
            <tbody>
              {deptBreakdown.map(row => (
                <tr key={row.department} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.department}</td>
                  <td className="px-4 py-3 text-right text-sm font-black tabular-nums">{row.count}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-slate-600">{row.pct.toFixed(0)}%</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${REASON_COLORS[row.topReason] || 'text-slate-600'}`}>{row.topReason}</td>
                </tr>
              ))}
            </tbody>
          </OperationalTable>
        </OperationalTableWrap>
      </OperationalSection>

      {/* Reason gaps — only when employee category ≠ HR category */}
      {mismatchRows.length > 0 && (
        <OperationalSection title="Reason Alignment Gaps" subtitle="Employee stated ≠ HR classification — review these">
          <OperationalTableWrap>
            <OperationalTable>
              <OperationalThead>
                <OperationalTh>Employee</OperationalTh>
                <OperationalTh>Department</OperationalTh>
                <OperationalTh>Employee Stated</OperationalTh>
                <OperationalTh>HR Classified</OperationalTh>
              </OperationalThead>
              <tbody>
                {mismatchRows.slice(0, 30).map(row => (
                  <tr key={row.id} className="border-t border-slate-100 bg-rose-50/20">
                    <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.department}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-amber-700">{row.employeeReason}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-indigo-700">{row.hrReason}</td>
                  </tr>
                ))}
              </tbody>
            </OperationalTable>
          </OperationalTableWrap>
        </OperationalSection>
      )}

      <OperationalSection
        title="Position Breakdown"
        subtitle={`${selectedDeptForPositions} · ${(Object.values(positionsByDept) as number[]).reduce((a, b) => a + b, 0)} exits`}
        headerAction={
          <select value={selectedDeptForPositions} onChange={e => setSelectedDeptForPositions(e.target.value)} className={`${filterSelectClass} font-semibold text-indigo-600 min-w-[140px]`}>
            {actualDepartments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        }
      >
        <OperationalTableWrap>
          <OperationalTable>
            <OperationalThead>
              <OperationalTh>Position</OperationalTh>
              <OperationalTh align="right">Count</OperationalTh>
            </OperationalThead>
            <tbody>
              {(Object.entries(positionsByDept) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([pos, count]) => (
                <tr key={pos} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-700">{pos}</td>
                  <td className="px-4 py-3 text-right text-sm font-black tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
          </OperationalTable>
        </OperationalTableWrap>
      </OperationalSection>

      {/* Executive Actions */}
      <OffTargetPanel
        title="Exit Reasons Over Threshold"
        rows={offTargetReasons}
        showEntity={false}
        emptyLabel={`Salary ${salaryPct.toFixed(0)}% · Supervisor ${supervisorPct.toFixed(0)}% · Career ${careerPct.toFixed(0)}% — within ${SALARY_HIGH_THRESHOLD}% / ${SUPERVISOR_HIGH_THRESHOLD}% / ${CAREER_GROWTH_THRESHOLD}%`}
      />

      <OperationalSection title="Interview Registry" subtitle={`${filteredData.length} records · normalized reason + raw detail on click`}>
        <OperationalTableWrap>
          <OperationalTable>
            <OperationalThead>
              <OperationalTh>Employee</OperationalTh>
              <OperationalTh>Department</OperationalTh>
              <OperationalTh>Reason</OperationalTh>
              <OperationalTh>Last Date</OperationalTh>
              <OperationalTh align="center">Detail</OperationalTh>
            </OperationalThead>
            <tbody>
              {filteredData.slice(0, 50).map(item => {
                const cat = getExecutiveReasonCategory(item);
                const gap = hasReasonMismatch(item);
                return (
                  <tr key={item.id} className={`border-t border-slate-100 hover:bg-slate-50/80 ${gap ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.position}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.department}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${REASON_COLORS[cat] || 'text-slate-700'}`}>{cat}</span>
                      {gap && <span className="ml-2 text-[10px] font-bold text-amber-600 uppercase">Gap</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{item.lastDate}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedInterview(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <Info className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </OperationalTable>
        </OperationalTableWrap>
      </OperationalSection>

      {selectedInterview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedInterview.name}</h3>
                <p className="text-sm text-slate-500">{selectedInterview.position} · {selectedInterview.department}</p>
              </div>
              <button onClick={() => setSelectedInterview(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">Executive Category</p>
                <p className={`text-base font-black ${REASON_COLORS[getExecutiveReasonCategory(selectedInterview)]}`}>
                  {getExecutiveReasonCategory(selectedInterview)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Employee Stated</p>
                  <p className="text-xs font-semibold text-amber-800">{getEmployeeReasonCategory(selectedInterview)}</p>
                  <p className="text-[10px] text-amber-700/80 mt-1 line-clamp-3">{selectedInterview.requestReason}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">HR Classified</p>
                  <p className="text-xs font-semibold text-indigo-800">{getHrReasonCategory(selectedInterview)}</p>
                  <p className="text-[10px] text-indigo-700/80 mt-1 line-clamp-3">{selectedInterview.hrReason}</p>
                </div>
              </div>
              {selectedInterview.feedback && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Feedback</p>
                  <p className="text-sm text-slate-700">{selectedInterview.feedback}</p>
                </div>
              )}
              <button onClick={() => setSelectedInterview(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <OperationalOwnership items={[
        { icon: MessageSquare, label: 'Primary', value: 'HR Employee Relations Team' },
        { icon: UserCog, label: 'Co-Owner', value: 'Department Heads' },
      ]} />
    </OperationalShell>
  );
};
