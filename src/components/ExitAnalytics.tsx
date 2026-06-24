import React, { useMemo, useState } from 'react';
import {
  LogOut,
  AlertTriangle,
  Users,
  TrendingDown,
  PieChart,
  MessageSquare,
  UserCog,
  Building2,
  ChevronUp,
} from 'lucide-react';
import { ExitInterview } from '../data/mockData';

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
  topReason: string;
  reasons: Record<string, number>;
}

function normalizeReason(reason: string): string {
  const lower = reason.toLowerCase().trim();
  if (!lower || lower === 'unknown') return 'Other';

  // English keywords
  if (lower.includes('salary') || lower.includes('compensation') || lower.includes('pay')) return 'Salary';
  if (lower.includes('family') || lower.includes('personal') || lower.includes('home')) return 'Family/Personal';
  if (lower.includes('supervisor') || lower.includes('manager') || lower.includes('boss')) return 'Supervisor Issue';
  if (lower.includes('career') || lower.includes('growth') || lower.includes('promotion')) return 'Career Growth';
  if (lower.includes('health') || lower.includes('medical')) return 'Health';
  if (lower.includes('relocate') || lower.includes('location') || lower.includes('distance')) return 'Relocation';
  if (lower.includes('better') || lower.includes('opportunity') || lower.includes('new job')) return 'Better Opportunity';
  if (lower.includes('work environment') || lower.includes('culture')) return 'Work Environment';

  // Burmese keywords
  if (reason.includes('လစာ') || reason.includes('ကြေး') || reason.includes('ရှာ')) return 'Salary';
  if (reason.includes('မိသားစု') || reason.includes('ကိုယ်ပိုင်') || reason.includes('အိမ်') || reason.includes('ပုဂ္ဂလ')) return 'Family/Personal';
  if (reason.includes('ကြီးကြပ်') || reason.includes('မန်နေဂျာ') || reason.includes('သူဌေး')) return 'Supervisor Issue';
  if (reason.includes('အခွင့်အလမ်း') || reason.includes('တိုးတက်') || reason.includes('ရာထူး')) return 'Career Growth';
  if (reason.includes('ကျန်းမာ') || reason.includes('ဆေး')) return 'Health';
  if (reason.includes('ပြောင်း') || reason.includes('နေရာ')) return 'Relocation';
  if (reason.includes('အလုပ်သစ်') || reason.includes('ကောင်းကောင်း')) return 'Better Opportunity';
  if (reason.includes('ပတ်ဝန်းကျင်') || reason.includes('ယဉ်ကျေးမှု')) return 'Work Environment';

  return reason.trim() || 'Other';
}

const reasonColors: Record<string, string> = {
  'Salary': 'bg-rose-500',
  'Family/Personal': 'bg-amber-500',
  'Supervisor Issue': 'bg-purple-500',
  'Career Growth': 'bg-blue-500',
  'Health': 'bg-teal-500',
  'Relocation': 'bg-indigo-500',
  'Better Opportunity': 'bg-emerald-500',
  'Work Environment': 'bg-pink-500',
  'Other': 'bg-slate-400',
};

export const ExitAnalytics: React.FC<ExitAnalyticsProps> = ({ exitInterviews }) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const reasonBreakdown = useMemo<ReasonData[]>(() => {
    if (exitInterviews.length === 0) return [];

    const reasonMap = exitInterviews.reduce((acc, e) => {
      const rawReason = [e.reason, e.requestReason, e.hrReason].find(
        r => r && r.trim() && r.trim().toLowerCase() !== 'unknown'
      ) || 'Other';
      const reason = normalizeReason(rawReason);
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
      const rawReason = [e.reason, e.requestReason, e.hrReason].find(
        r => r && r.trim() && r.trim().toLowerCase() !== 'unknown'
      ) || 'Other';
      const reason = normalizeReason(rawReason);
      if (!acc[dept]) acc[dept] = { count: 0, reasons: {} };
      acc[dept].count++;
      acc[dept].reasons[reason] = (acc[dept].reasons[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, { count: number; reasons: Record<string, number> }>);

    return (Object.entries(deptMap) as [string, { count: number; reasons: Record<string, number> }][])
      .map(([dept, data]) => {
        const topReason = Object.entries(data.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        return {
          department: dept,
          count: data.count,
          topReason,
          reasons: data.reasons,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [exitInterviews]);

  const totalExits = exitInterviews.length;
  const topReason = reasonBreakdown[0]?.reason || 'N/A';
  const topReasonPct = reasonBreakdown[0]?.pct || 0;
  const topDept = deptBreakdown[0]?.department || 'N/A';
  const salaryExits = reasonBreakdown.find(r => r.reason === 'Salary')?.count || 0;
  const supervisorExits = reasonBreakdown.find(r => r.reason === 'Supervisor Issue')?.count || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-orange-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500/30 backdrop-blur rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-orange-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-300/70">Exit Insights</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Exit Interview Analytics</h2>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Total Exits</span>
              <span className="text-3xl font-black">{totalExits}</span>
            </div>
            <div className="flex flex-col items-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Top Reason</span>
              <span className="text-xl font-black text-orange-300">{topReason}</span>
              <span className="text-xs font-bold text-white/70 mt-1">{topReasonPct.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center"><LogOut className="w-4 h-4 text-orange-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Exits</span>
          </div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{totalExits}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center"><TrendingDown className="w-4 h-4 text-rose-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salary Exits</span>
          </div>
          <p className="text-2xl font-black text-rose-600 tabular-nums">{salaryExits}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-purple-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supervisor Issues</span>
          </div>
          <p className="text-2xl font-black text-purple-600 tabular-nums">{supervisorExits}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center"><Building2 className="w-4 h-4 text-indigo-600" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Department</span>
          </div>
          <p className="text-lg font-black text-slate-900 truncate">{topDept}</p>
        </div>
      </div>

      {totalExits === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
          <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-700">No Exit Interview Data Available</p>
          <p className="text-sm text-slate-400 mt-2">Data will appear once exit interview records are loaded.</p>
        </div>
      ) : (
        <>
          {/* Reason Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-2 h-7 bg-orange-500 rounded-full" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">Exit Reasons Breakdown</h3>
                <p className="text-slate-500 text-sm mt-0.5">Why employees are leaving — computed from exit interview data</p>
              </div>
            </div>
            <div className="p-8 space-y-4">
              {reasonBreakdown.map((item) => {
                const color = reasonColors[item.reason] || 'bg-slate-400';
                const isActive = selectedReason === item.reason;
                return (
                  <div key={item.reason} onClick={() => setSelectedReason(isActive ? null : item.reason)} className={`flex items-center gap-4 cursor-pointer rounded-xl p-2 transition-all ${isActive ? 'ring-2 ring-indigo-200 bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                    <div className="w-40 flex-shrink-0">
                      <span className="text-sm font-bold text-slate-700">{item.reason}</span>
                    </div>
                    <div className="flex-1 h-8 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                      <div
                        className={`h-full ${color} rounded-xl transition-all duration-1000 flex items-center justify-end px-3`}
                        style={{ width: `${Math.max(item.pct, 3)}%` }}
                      >
                        <span className="text-xs font-black text-white tabular-nums">{item.pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-16 text-right flex-shrink-0">
                      <span className="text-base font-black text-slate-900 tabular-nums">{item.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department-wise Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-2 h-7 bg-indigo-500 rounded-full" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">Department-wise Exit Breakdown</h3>
                <p className="text-slate-500 text-sm mt-0.5">Exit count and top reason per department</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Exit Count</th>
                    <th className="px-6 py-4 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">% of Total</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Top Reason</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reason Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {deptBreakdown.map((dept, idx) => {
                    const pct = (dept.count / totalExits) * 100;
                    const topColor = reasonColors[dept.topReason] || 'bg-slate-400';
                    const isActive = selectedDept === dept.department;
                    return (
                      <tr key={dept.department} onClick={() => setSelectedDept(isActive ? null : dept.department)} className={`border-t border-slate-100 transition-colors cursor-pointer ${isActive ? 'ring-2 ring-indigo-200 ' : ''}hover:bg-slate-50/50 ${idx % 2 === 1 ? 'bg-slate-50/20' : ''}`}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100">
                              <Building2 className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{dept.department}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-lg font-black text-slate-900 tabular-nums">{dept.count}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-sm font-bold text-slate-600 tabular-nums">{pct.toFixed(1)}%</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className={`w-2 h-2 rounded-full ${topColor}`} />
                            <span className="text-sm font-bold text-slate-700">{dept.topReason}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1 flex-wrap">
                            {(Object.entries(dept.reasons) as [string, number][])
                              .sort((a, b) => b[1] - a[1])
                              .map(([reason, count]) => (
                                <span
                                  key={reason}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-100"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${reasonColors[reason] || 'bg-slate-400'}`} />
                                  {reason}: {count}
                                </span>
                              ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Detail Section */}
      {(selectedReason || selectedDept) && (() => {
        const reason = selectedReason;
        const dept = selectedDept;
        const filtered = exitInterviews.filter(e => {
          if (reason && dept) {
            const eDept = e.department || 'Unknown';
            if (eDept !== dept) return false;
            const rawReason = [e.reason, e.requestReason, e.hrReason].find(r => r && r.trim() && r.trim().toLowerCase() !== 'unknown') || 'Other';
            return normalizeReason(rawReason) === reason;
          }
          if (reason) {
            const rawReason = [e.reason, e.requestReason, e.hrReason].find(r => r && r.trim() && r.trim().toLowerCase() !== 'unknown') || 'Other';
            return normalizeReason(rawReason) === reason;
          }
          if (dept) return (e.department || 'Unknown') === dept;
          return false;
        });
        const title = reason ? `Reason: ${reason}` : `Department: ${dept}`;
        return (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-7 bg-orange-500 rounded-full" />
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{title} — Detail Breakdown</h3>
                  <p className="text-slate-500 text-sm mt-0.5">{filtered.length} exit interview record{filtered.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedReason(null); setSelectedDept(null); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                <ChevronUp className="w-4 h-4" />Close
              </button>
            </div>
            <div className="p-6">
              {filtered.length > 0 ? (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0"><tr className="bg-slate-50/80">
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    </tr></thead>
                    <tbody>
                      {filtered.slice(0, 50).map((e, i) => {
                        const rawReason = [e.reason, e.requestReason, e.hrReason].find(r => r && r.trim() && r.trim().toLowerCase() !== 'unknown') || 'Other';
                        const normalized = normalizeReason(rawReason);
                        return (
                          <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600">{(e.name || e.employeeName || '?').charAt(0)}</div><span className="text-sm font-bold text-slate-700">{e.name || e.employeeName || 'Unknown'}</span></div></td>
                            <td className="px-4 py-3 text-sm text-slate-600">{e.department || 'Unknown'}</td>
                            <td className="px-4 py-3"><div className="inline-flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${reasonColors[normalized] || 'bg-slate-400'}`} /><span className="text-sm font-bold text-slate-700">{normalized}</span></div></td>
                            <td className="px-4 py-3 text-sm text-slate-500">{e.resignationDate || e.date || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filtered.length > 50 && <p className="text-xs text-slate-400 text-center py-3">Showing 50 of {filtered.length}</p>}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No records found.</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Ownership */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-7 bg-orange-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Ownership</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary</p>
              <p className="text-lg font-bold text-slate-800">HR Employee Relations Team</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Exit interview & analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
              <UserCog className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Co-Owner</p>
              <p className="text-lg font-bold text-slate-800">Department Heads</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Department-level retention action</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
