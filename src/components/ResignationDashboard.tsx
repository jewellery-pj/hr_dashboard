import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Resignation } from '../data/mockData';
import { UserMinus, X, Info, MessageSquare, Search, Filter, PieChart as PieIcon, AlignLeft } from 'lucide-react';

interface ResignationDashboardProps {
  resignations: Resignation[];
  externalMonthFilter?: string;
}

const COLORS = [
  '#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#4f46e5', '#ef4444', '#f97316', 
  '#14b8a6', '#3b82f6', '#d946ef', '#84cc16'
];

export const ResignationDashboard: React.FC<ResignationDashboardProps> = ({ resignations, externalMonthFilter = 'All' }) => {
  const [selectedResignation, setSelectedResignation] = useState<Resignation | null>(null);
  const [selectedDeptForPositions, setSelectedDeptForPositions] = useState<string>('');
  
  // Filter states
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [locFilter, setLocFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [serviceMonthFilter, setServiceMonthFilter] = useState<string>('All');
  const [lastWorkingDateFilter, setLastWorkingDateFilter] = useState<string>('');
  const [commentSearch, setCommentSearch] = useState<string>('');

  const departments = useMemo(() => 
    ['All', ...Array.from(new Set(resignations.map(r => r.department)))].sort()
  , [resignations]);

  const actualDepartments = useMemo(() => 
    Array.from(new Set(resignations.map(r => r.department))).sort()
  , [resignations]);

  React.useEffect(() => {
    if (actualDepartments.length > 0 && !selectedDeptForPositions) {
      setSelectedDeptForPositions(actualDepartments[0]);
    }
  }, [actualDepartments, selectedDeptForPositions]);

  const positionsByDept = useMemo(() => {
    if (!selectedDeptForPositions) return [];
    const filtered = resignations.filter(r => r.department === selectedDeptForPositions);
    const counts = filtered.reduce((acc, r) => {
      const pos = r.designation || r.position;
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count);
  }, [resignations, selectedDeptForPositions]);

  const totalStaffInDept = useMemo(() => {
    return resignations.filter(r => r.department === selectedDeptForPositions).length;
  }, [resignations, selectedDeptForPositions]);

  const locations = useMemo(() => 
    ['All', ...Array.from(new Set(resignations.map(r => r.location).filter(Boolean) as string[]))].sort()
  , [resignations]);

  const statuses = useMemo(() => 
    ['All', ...Array.from(new Set(resignations.map(r => r.resignStatus || 'Resign')))].sort()
  , [resignations]);

  const serviceMonths = useMemo(() => 
    ['All', ...Array.from(new Set(resignations.map(r => r.serviceMonth).filter(Boolean) as string[]))].sort()
  , [resignations]);


  const filteredResignations = useMemo(() => {
    return resignations.filter(r => {
      const matchesDept = deptFilter === 'All' || r.department === deptFilter;
      const matchesLoc = locFilter === 'All' || r.location === locFilter;
      const matchesStatus = statusFilter === 'All' || (r.resignStatus || 'Resign') === statusFilter;
      const matchesServiceMonth = serviceMonthFilter === 'All' || r.serviceMonth === serviceMonthFilter;
      
      let matchesLastWorkingDate = true;
      if (lastWorkingDateFilter && r.resignationDate) {
        // Normalize date formats for comparison
        const normalizeDate = (dateStr: string) => {
          // Handle DD.MM.YYYY format (e.g., '15.3.2026')
          if (dateStr.includes('.')) {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2];
              return `${year}-${month}-${day}`;
            }
          }
          // Handle MM/DD/YY format (e.g., '12/26/25')
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const month = parts[0].padStart(2, '0');
              const day = parts[1].padStart(2, '0');
              const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
              return `${year}-${month}-${day}`;
            }
          }
          // Already in YYYY-MM-DD format
          return dateStr;
        };
        
        const normalizedDataDate = normalizeDate(r.resignationDate);
        matchesLastWorkingDate = normalizedDataDate === lastWorkingDateFilter;
      }
      
      const matchesMonth = externalMonthFilter === 'All' || r.month === externalMonthFilter;
      const matchesComment = commentSearch === '' || 
        (r.comment || r.reason || '').toLowerCase().includes(commentSearch.toLowerCase());
      
      return matchesDept && matchesLoc && matchesStatus && matchesServiceMonth && matchesLastWorkingDate && matchesMonth && matchesComment;
    });
  }, [resignations, deptFilter, locFilter, statusFilter, serviceMonthFilter, lastWorkingDateFilter, externalMonthFilter, commentSearch]);

  const stats = useMemo(() => {
    return {
      total: resignations.length,
      filtered: filteredResignations.length
    };
  }, [resignations, filteredResignations]);

  const deptData = useMemo(() => {
    const depts = filteredResignations.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(depts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count);
  }, [filteredResignations]);

  const positionStats = useMemo(() => {
    const counts = filteredResignations.reduce((acc, r) => {
      const pos = r.designation || r.position;
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredResignations]);

  const statusData = useMemo(() => {
    const counts = filteredResignations.reduce((acc, r) => {
      const status = r.resignStatus || 'Resign';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredResignations]);

  const reasonData = useMemo(() => {
    const counts = filteredResignations.reduce((acc, r) => {
      const reason = r.comment || r.reason || 'No Reason Provided';
      if (reason !== 'No Reason Provided' && reason !== 'Unknown') {
        acc[reason] = (acc[reason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 10); // Top 10 reasons
  }, [filteredResignations]);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Resignations" 
          value={stats.total} 
          icon={<UserMinus className="w-6 h-6 text-rose-500" />}
          trend="All time recorded"
        />
        <StatCard 
          title="Filtered Count" 
          value={stats.filtered} 
          icon={<Filter className="w-6 h-6 text-indigo-500" />}
          trend="Based on current filters"
        />
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
            <label className="text-xs font-medium text-slate-500 ml-1">Location</label>
            <select 
              value={locFilter}
              onChange={(e) => setLocFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 ml-1">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 ml-1">Service Month</label>
            <select 
              value={serviceMonthFilter}
              onChange={(e) => setServiceMonthFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              {serviceMonths.map(sm => <option key={sm} value={sm}>{sm}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 ml-1">Last Working Date</label>
            <input 
              type="date"
              value={lastWorkingDateFilter}
              onChange={(e) => setLastWorkingDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 ml-1">Search Comment</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search comments..."
                value={commentSearch}
                onChange={(e) => setCommentSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-800">Resignation Status</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <AlignLeft className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-800">Department Distribution</h3>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {deptData.map((stat, index) => {
              const percentage = filteredResignations.length > 0 ? ((stat.count / filteredResignations.length) * 100).toFixed(1) : '0.0';
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
              <span className="text-sm font-bold text-slate-900">{filteredResignations.length}</span>
            </div>
          </div>
        </div>

        {/* Position Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <AlignLeft className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-800">Resignations by Position</h3>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {positionStats.map((stat, index) => {
              const percentage = filteredResignations.length > 0 ? ((stat.count / filteredResignations.length) * 100).toFixed(1) : '0.0';
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
              <span className="text-sm font-bold text-slate-900">{filteredResignations.length}</span>
            </div>
          </div>
        </div>

        {/* Reasons/Comments Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-slate-800">Top Resignation Reasons (Comments)</h3>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonData} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 11}} 
                  width={180}
                  tickFormatter={(value) => value.length > 30 ? `${value.substring(0, 30)}...` : value}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
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

        {/* Recent Resignations Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Resignations List ({stats.filtered})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-50">
                  <th className="pb-4 font-medium">Name</th>
                  <th className="pb-4 font-medium">Department</th>
                  <th className="pb-4 font-medium">Designation</th>
                  <th className="pb-4 font-medium">Location</th>
                  <th className="pb-4 font-medium">Service Month</th>
                  <th className="pb-4 font-medium">Last Working Date</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium">Comment</th>
                  <th className="pb-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredResignations.slice(0, 50).map((res) => (
                  <tr key={res.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-medium text-slate-700">{res.name}</td>
                    <td className="py-4 text-slate-600">{res.department}</td>
                    <td className="py-4 text-slate-600">{res.designation || res.position}</td>
                    <td className="py-4 text-slate-600">{res.location || '-'}</td>
                    <td className="py-4 text-slate-600 font-medium">{res.serviceMonth || '-'}</td>
                    <td className="py-4 text-slate-600">{res.resignationDate}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        res.resignStatus === 'Dismiss' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {res.resignStatus || 'Resign'}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600 max-w-[200px] truncate">
                      <button 
                        onClick={() => setSelectedResignation(res)}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span className="truncate">{res.comment || res.reason}</span>
                      </button>
                    </td>
                    <td className="py-4 text-center">
                      <button 
                        onClick={() => setSelectedResignation(res)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="View Full Details"
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
      </div>

      {/* Details Modal */}
      {selectedResignation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedResignation.name}</h3>
                  <p className="text-sm text-slate-500">{selectedResignation.employeeCode || 'No Employee Code'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedResignation(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <DetailItem label="Department" value={selectedResignation.department} />
                <DetailItem label="Designation" value={selectedResignation.designation || selectedResignation.position} />
                <DetailItem label="Division" value={selectedResignation.division} />
                <DetailItem label="Location" value={selectedResignation.location} />
              </div>
              <div className="space-y-6">
                <DetailItem label="Date of Employment" value={selectedResignation.doe} />
                <DetailItem label="Service Month" value={selectedResignation.serviceMonth} />
                <DetailItem label="Last Working Date" value={selectedResignation.resignationDate} />
                <DetailItem label="Resign Status" value={selectedResignation.resignStatus} isStatus />
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Comment / Reason</h4>
                  <p className="text-slate-700 leading-relaxed font-medium">{selectedResignation.comment || selectedResignation.reason}</p>
                </div>
                {selectedResignation.remarks && (
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Remarks</h4>
                    <p className="text-indigo-700 leading-relaxed">{selectedResignation.remarks}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedResignation(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value, isStatus }: { label: string; value?: string; isStatus?: boolean }) => (
  <div>
    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</h4>
    {isStatus ? (
      <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold mt-1 ${
        value === 'Dismiss' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
      }`}>
        {value || 'Resign'}
      </span>
    ) : (
      <p className="text-slate-800 font-semibold">{value || '-'}</p>
    )}
  </div>
);

const StatCard = ({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-slate-50 rounded-xl">
        {icon}
      </div>
    </div>
    <div>
      <h4 className="text-slate-500 text-sm font-medium">{title}</h4>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      <p className="text-xs text-slate-400 mt-2">{trend}</p>
    </div>
  </div>
);
