import React, { useMemo, useState } from 'react';
import {
  LogOut,
  AlertTriangle,
  Building2,
  MessageSquare,
  UserCog,
  ChevronDown,
  ChevronUp,
  Siren,
  DollarSign,
} from 'lucide-react';
import { ExitInterview } from '../data/mockData';
import {
  getExecutiveReasonCategory,
  normalizeExitReason,
  REASON_COLORS,
  SALARY_HIGH_THRESHOLD,
  SUPERVISOR_HIGH_THRESHOLD,
  CAREER_GROWTH_THRESHOLD,
} from '../utils/exitReasons';
import { buildExitReasonOffTarget } from '../utils/offTarget';
import { OffTargetPanel } from './OffTargetPanel';

export { normalizeExitReason };

interface ExitAnalyticsProps {
  exitInterviews: ExitInterview[];
}

interface ReasonData {
  reason: string;
  count: number;
  pct: number;
}

interface DeptData {
  department: string;
  count: number;
  pctOfTotal: number;
  topReason: string;
  reasons: Record<string, number>;
}

const reasonColors = REASON_COLORS;

export const ExitAnalytics: React.FC<ExitAnalyticsProps> = ({ exitInterviews }) => {
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [expandedReason, setExpandedReason] = useState<string | null>(null);

  const reasonBreakdown = useMemo<ReasonData[]>(() => {
    if (exitInterviews.length === 0) return [];

    const reasonMap = exitInterviews.reduce((acc, e) => {
      const reason = getExecutiveReasonCategory(e);
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = exitInterviews.length;
    return (Object.entries(reasonMap) as [string, number][])
      .map(([reason, count]) => ({
        reason,
        count,
        pct: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }, [exitInterviews]);

  const deptBreakdown = useMemo<DeptData[]>(() => {
    if (exitInterviews.length === 0) return [];

    const deptMap = exitInterviews.reduce((acc, e) => {
      const dept = e.department || 'Unknown';
      const reason = getExecutiveReasonCategory(e);
      if (!acc[dept]) acc[dept] = { count: 0, reasons: {} };
      acc[dept].count++;
      acc[dept].reasons[reason] = (acc[dept].reasons[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, { count: number; reasons: Record<string, number> }>);

    const total = exitInterviews.length;
    return (Object.entries(deptMap) as [string, { count: number; reasons: Record<string, number> }][])
      .map(([dept, data]) => {
        const topReason = Object.entries(data.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        return {
          department: dept,
          count: data.count,
          pctOfTotal: (data.count / total) * 100,
          topReason,
          reasons: data.reasons,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [exitInterviews]);

  const totalExits = exitInterviews.length;
  const salaryData = reasonBreakdown.find(r => r.reason === 'Salary');
  const supervisorData = reasonBreakdown.find(r => r.reason === 'Supervisor Issue');
  const careerData = reasonBreakdown.find(r => r.reason === 'Career Growth');

  const salaryPct = salaryData?.pct || 0;
  const supervisorPct = supervisorData?.pct || 0;
  const careerPct = careerData?.pct || 0;

  const offTargetReasons = useMemo(
    () => buildExitReasonOffTarget(reasonBreakdown),
    [reasonBreakdown],
  );

  const renderReasonDetail = (reason: string) => {
    const records = exitInterviews.filter(e => getExecutiveReasonCategory(e) === reason);
    return (
      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0">
            <tr className="bg-slate-50/90">
              <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
              <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
              <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
            </tr>
          </thead>
          <tbody>
            {records.slice(0, 30).map((e, i) => (
              <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-white/60' : ''}`}>
                <td className="px-4 py-2 text-sm font-bold text-slate-700">{e.name || 'Unknown'}</td>
                <td className="px-4 py-2 text-sm text-slate-600">{e.department || 'Unknown'}</td>
                <td className="px-4 py-2 text-sm text-slate-500">{e.resignationDate || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length > 30 && (
          <p className="text-xs text-slate-400 text-center py-2">Showing 30 of {records.length}</p>
        )}
      </div>
    );
  };

  const renderDeptDetail = (dept: DeptData) => {
    const sortedReasons = Object.entries(dept.reasons).sort((a, b) => b[1] - a[1]);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Reason Breakdown</p>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Reason</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">Count</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-400 uppercase">%</th>
              </tr>
            </thead>
            <tbody>
              {sortedReasons.map(([reason, count], i) => (
                <tr key={reason} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-white/60' : ''}`}>
                  <td className={`px-3 py-2 text-sm font-bold ${reasonColors[reason] || 'text-slate-600'}`}>{reason}</td>
                  <td className="px-3 py-2 text-right text-sm font-black tabular-nums">{count}</td>
                  <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-slate-600">
                    {((count / dept.count) * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Recent Exits</p>
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0">
                <tr className="bg-slate-50/90">
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Employee</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody>
                {exitInterviews
                  .filter(e => (e.department || 'Unknown') === dept.department)
                  .slice(0, 15)
                  .map((e, i) => (
                    <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-white/60' : ''}`}>
                      <td className="px-3 py-2 text-sm font-bold text-slate-700">{e.name || 'Unknown'}</td>
                      <td className="px-3 py-2 text-sm text-slate-600">{getExecutiveReasonCategory(e)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-orange-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Retention Insights</p>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Exit Interview Analytics</h2>
            <p className="text-sm text-white/60 mt-2">
              {totalExits} exit interviews · live data
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 flex-shrink-0">
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black">{totalExits}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Total Exits</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black text-rose-300">{salaryPct.toFixed(0)}%</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Salary</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black text-purple-300">{supervisorPct.toFixed(0)}%</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Supervisor</p>
            </div>
          </div>
        </div>
        {offTargetReasons.length > 0 && (
          <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-rose-500/25 rounded-xl border border-rose-400/30">
            <Siren className="w-4 h-4 text-rose-200 flex-shrink-0 animate-pulse" />
            <p className="text-sm font-bold text-rose-100">
              {offTargetReasons.length} reason(s) over threshold — {offTargetReasons[0].metric}: {offTargetReasons[0].now} ({offTargetReasons[0].gap})
            </p>
          </div>
        )}
      </div>

      {totalExits === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <LogOut className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No Exit Interview Data Available</p>
          <p className="text-sm text-slate-400 mt-1">Data will appear once exit interview records are loaded.</p>
        </div>
      ) : (
        <>
          {/* Chairman Table — Reason | Count | % */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-800">Exit Reason Summary</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click a row for employee detail</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reason</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Count</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">%</th>
                  </tr>
                </thead>
                <tbody>
                  {reasonBreakdown.map((item) => {
                    const isHighRisk =
                      (item.reason === 'Salary' && item.pct >= SALARY_HIGH_THRESHOLD) ||
                      (item.reason === 'Supervisor Issue' && item.pct >= SUPERVISOR_HIGH_THRESHOLD) ||
                      (item.reason === 'Career Growth' && item.pct >= CAREER_GROWTH_THRESHOLD);
                    const isExpanded = expandedReason === item.reason;
                    return (
                      <React.Fragment key={item.reason}>
                        <tr
                          className={`border-t border-slate-100 cursor-pointer transition-colors ${isHighRisk ? 'bg-rose-50/30' : 'hover:bg-slate-50/80'} ${isExpanded ? 'ring-1 ring-inset ring-indigo-200' : ''}`}
                          onClick={() => setExpandedReason(isExpanded ? null : item.reason)}
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              {isHighRisk && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />}
                              <span className={`text-sm font-bold ${reasonColors[item.reason] || 'text-slate-700'}`}>
                                {item.reason}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-400 ml-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-300 ml-auto" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-sm font-black text-slate-900 tabular-nums">{item.count}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-sm font-black tabular-nums text-slate-700">{item.pct.toFixed(0)}%</span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={3} className="px-6 py-4 border-t border-indigo-100">
                              {renderReasonDetail(item.reason)}
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

          {/* Department Wise Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <div>
                <h3 className="text-base font-bold text-slate-800">Department Wise Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">Exit count and top reason per department</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Exits</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">% of Total</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Top Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {deptBreakdown.map((dept) => {
                    const isExpanded = expandedDept === dept.department;
                    const topIsRisk =
                      (dept.topReason === 'Salary' && salaryPct >= SALARY_HIGH_THRESHOLD) ||
                      dept.topReason === 'Supervisor Issue' ||
                      dept.topReason === 'Career Growth';
                    return (
                      <React.Fragment key={dept.department}>
                        <tr
                          className={`border-t border-slate-100 cursor-pointer transition-colors hover:bg-slate-50/80 ${isExpanded ? 'ring-1 ring-inset ring-indigo-200' : ''}`}
                          onClick={() => setExpandedDept(isExpanded ? null : dept.department)}
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span className="text-sm font-bold text-slate-800">{dept.department}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-400 ml-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-300 ml-auto" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-sm font-black text-slate-900 tabular-nums">{dept.count}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-sm font-bold tabular-nums text-slate-600">{dept.pctOfTotal.toFixed(0)}%</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              {topIsRisk && <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />}
                              <span className={`text-sm font-bold ${reasonColors[dept.topReason] || 'text-slate-700'}`}>
                                {dept.topReason}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={4} className="px-6 py-4 border-t border-indigo-100">
                              {renderDeptDetail(dept)}
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

        </>
      )}

      {totalExits > 0 && (
        <OffTargetPanel
          title="Exit Reasons Over Threshold"
          rows={offTargetReasons}
          showEntity={false}
          emptyLabel={`Salary ${salaryPct.toFixed(0)}% · Supervisor ${supervisorPct.toFixed(0)}% · Career ${careerPct.toFixed(0)}% — within ${SALARY_HIGH_THRESHOLD}% / ${SUPERVISOR_HIGH_THRESHOLD}% / ${CAREER_GROWTH_THRESHOLD}%`}
        />
      )}

      {/* Ownership */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          <strong className="text-slate-700">Primary:</strong> HR Employee Relations Team
        </span>
        <span className="flex items-center gap-1.5">
          <UserCog className="w-3.5 h-3.5" />
          <strong className="text-slate-700">Co-Owner:</strong> Department Heads
        </span>
      </div>
    </div>
  );
};
