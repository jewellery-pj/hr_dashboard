import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExitInterview } from '../data/mockData';
import { MessageSquare, Filter, Search, Info } from 'lucide-react';

interface ExitInterviewDashboardProps {
  exitInterviews: ExitInterview[];
  externalMonthFilter?: string;
}

const COLORS = [
  '#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#4f46e5', '#ef4444', '#f97316', 
  '#14b8a6', '#3b82f6', '#d946ef', '#84cc16'
];

export const ExitInterviewDashboard: React.FC<ExitInterviewDashboardProps> = ({ exitInterviews, externalMonthFilter = 'All' }) => {
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [reasonSearch, setReasonSearch] = useState<string>('');
  const [selectedInterview, setSelectedInterview] = useState<ExitInterview | null>(null);
  const [selectedDeptForPositions, setSelectedDeptForPositions] = useState<string>('');

  const departments = useMemo(() => 
    ['All', ...Array.from(new Set(exitInterviews.map(r => r.department)))].sort()
  , [exitInterviews]);

  const actualDepartments = useMemo(() => 
    Array.from(new Set(exitInterviews.map(r => r.department))).sort()
  , [exitInterviews]);

  React.useEffect(() => {
    if (actualDepartments.length > 0 && !selectedDeptForPositions) {
      setSelectedDeptForPositions(actualDepartments[0]);
    }
  }, [actualDepartments, selectedDeptForPositions]);

  const positionsByDept = useMemo(() => {
    if (!selectedDeptForPositions) return [];
    const filtered = exitInterviews.filter(r => r.department === selectedDeptForPositions);
    const counts = filtered.reduce((acc, r) => {
      acc[r.position] = (acc[r.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count);
  }, [exitInterviews, selectedDeptForPositions]);

  const totalStaffInDept = useMemo(() => {
    return exitInterviews.filter(r => r.department === selectedDeptForPositions).length;
  }, [exitInterviews, selectedDeptForPositions]);

  const filteredData = useMemo(() => {
    return exitInterviews.filter(r => {
      const matchesDept = deptFilter === 'All' || r.department === deptFilter;
      const matchesMonth = externalMonthFilter === 'All' || r.month === externalMonthFilter;
      const matchesReason = reasonSearch === '' || 
        r.reason.toLowerCase().includes(reasonSearch.toLowerCase()) ||
        r.requestReason.toLowerCase().includes(reasonSearch.toLowerCase()) ||
        r.hrReason.toLowerCase().includes(reasonSearch.toLowerCase()) ||
        (r.feedback || '').toLowerCase().includes(reasonSearch.toLowerCase());
      
      return matchesDept && matchesMonth && matchesReason;
    });
  }, [exitInterviews, deptFilter, externalMonthFilter, reasonSearch]);

  const requestReasonStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      if (r.requestReason && r.requestReason !== 'Unknown') {
        acc[r.requestReason] = (acc[r.requestReason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData]);

  const hrReasonStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      if (r.hrReason && r.hrReason !== 'Unknown') {
        acc[r.hrReason] = (acc[r.hrReason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData]);

  const positionStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      acc[r.position] = (acc[r.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData]);

  const deptStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Interviews</p>
            <p className="text-2xl font-bold text-slate-900">{filteredData.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 ml-1">Department</label>
            <select 
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 ml-1">Search Reason/Feedback</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search..."
                value={reasonSearch}
                onChange={(e) => setReasonSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Reasons Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Request Reasons</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestReasonStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(value) => value.length > 30 ? `${value.substring(0, 30)}...` : value}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HR Reasons Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top HR Reasons</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hrReasonStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(value) => value.length > 30 ? `${value.substring(0, 30)}...` : value}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Position Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Resignations by Position</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {positionStats.map((stat, index) => {
              const percentage = filteredData.length > 0 ? ((stat.count / filteredData.length) * 100).toFixed(1) : '0.0';
              return (
                <div key={stat.name} className="flex items-center justify-between group py-1">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors truncate max-w-[180px]">
                      {stat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-bold text-slate-900">{stat.count}</span>
                    <span className="text-xs font-medium text-slate-400 w-12 text-right">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
            
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-sm font-bold text-slate-900">{filteredData.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Department Distribution</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {deptStats.map((stat, index) => {
              const percentage = filteredData.length > 0 ? ((stat.value / filteredData.length) * 100).toFixed(1) : '0.0';
              return (
                <div key={stat.name} className="flex items-center justify-between group py-1">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors truncate max-w-[180px]">
                      {stat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-bold text-slate-900">{stat.value}</span>
                    <span className="text-xs font-medium text-slate-400 w-12 text-right">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
            
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between sticky bottom-0 bg-white">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-sm font-bold text-slate-900">{filteredData.length}</span>
            </div>
          </div>
        </div>

        {/* By Department Position Count */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">By Department</h3>
            <div className="relative">
              <select
                value={selectedDeptForPositions}
                onChange={(e) => setSelectedDeptForPositions(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-100 rounded-xl px-6 py-2 pr-10 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                {actualDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{selectedDeptForPositions}</h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{totalStaffInDept} TOTAL STAFF</span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              {positionsByDept.map((pos) => (
                <div key={pos.name} className="flex items-center justify-between py-2 group">
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                    {pos.name}
                  </span>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-1.5 shadow-sm min-w-[48px] text-center">
                    <span className="text-sm font-bold text-slate-900">{pos.count}</span>
                  </div>
                </div>
              ))}
              {positionsByDept.length === 0 && (
                <div className="text-center py-10 text-slate-400 italic text-sm">
                  No data available for this department
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Interview Details</h3>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredData.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Request Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">HR Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.resignationDate}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.position}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                      {item.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.lastDate}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={item.requestReason}>
                    {item.requestReason}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate" title={item.hrReason}>
                    {item.hrReason}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedInterview(item)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedInterview.name}</h3>
                    <p className="text-sm text-slate-400">{selectedInterview.position}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedInterview(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Filter className="w-5 h-5 text-slate-400 rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
                    <p className="text-sm font-bold text-slate-700">{selectedInterview.department}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resign Date</p>
                    <p className="text-sm font-bold text-slate-700">{selectedInterview.resignationDate}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Date</p>
                    <p className="text-sm font-bold text-slate-700">{selectedInterview.lastDate}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reason (General)</p>
                    <p className="text-sm font-bold text-slate-700">{selectedInterview.reason}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Request Reason</p>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-sm text-amber-700 font-medium">{selectedInterview.requestReason}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">HR Reason</p>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <p className="text-sm text-rose-700 font-medium">{selectedInterview.hrReason}</p>
                  </div>
                </div>

                {selectedInterview.feedback && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Feedback / Comments</p>
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-sm text-indigo-700 leading-relaxed">{selectedInterview.feedback}</p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedInterview(null)}
                className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
