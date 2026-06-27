import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Resignation } from '../data/mockData';
import { normalizeExitReason } from './ExitAnalytics';
import { normalizeDateForCompare } from '../utils/dateUtils';
import { UserMinus, X, Info, MessageSquare, Search, Filter, PieChart as PieIcon, AlignLeft, UserCog } from 'lucide-react';
import {
  OperationalShell,
  OperationalHeader,
  OperationalSection,
  OperationalFilters,
  FilterField,
  filterSelectClass,
  filterInputClass,
  OperationalTableWrap,
  OperationalTable,
  OperationalThead,
  OperationalTh,
  OperationalOwnership,
} from './OperationalLayout';

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
        const normalizedDataDate = normalizeDateForCompare(r.resignationDate);
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
      inPeriod: resignations.length,
      filtered: filteredResignations.length,
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
      const raw = r.comment || r.reason || r.remarks || '';
      const reason = normalizeExitReason(raw);
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 10);
  }, [filteredResignations]);

  const deptSummary = useMemo(() => {
    const total = filteredResignations.length || 1;
    return deptData.map(d => {
      const deptRows = filteredResignations.filter(r => r.department === d.name);
      const reasonCounts = deptRows.reduce((acc, r) => {
        const reason = normalizeExitReason(r.comment || r.reason || r.remarks || '');
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topReason = Object.entries(reasonCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '—';
      return { ...d, pct: (d.count / total) * 100, topReason };
    });
  }, [deptData, filteredResignations]);

  const periodLabel = externalMonthFilter === 'All' ? 'All months' : externalMonthFilter;

  return (
    <OperationalShell>
      <OperationalHeader
        eyebrow="Staff Exit"
        title="Resignation Dashboard"
        subtitle={`${stats.inPeriod} resignations · ${periodLabel} · live data`}
        gradient="rose"
        metrics={[
          { value: stats.inPeriod, label: 'In Period' },
          { value: stats.filtered, label: 'Filtered' },
          { value: deptData.length, label: 'Departments' },
          { value: reasonData[0]?.name?.slice(0, 8) || '—', label: 'Top Reason' },
        ]}
      />

      <OperationalSection title="Department Summary" subtitle="Department | Count | % | Top Reason">
        <OperationalTableWrap>
          <OperationalTable>
            <OperationalThead>
              <OperationalTh>Department</OperationalTh>
              <OperationalTh align="right">Count</OperationalTh>
              <OperationalTh align="right">%</OperationalTh>
              <OperationalTh>Top Reason</OperationalTh>
            </OperationalThead>
            <tbody>
              {deptSummary.map(row => (
                <tr key={row.name} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.name}</td>
                  <td className="px-4 py-3 text-sm font-black text-right tabular-nums">{row.count}</td>
                  <td className="px-4 py-3 text-sm font-bold text-right tabular-nums text-slate-600">{row.pct.toFixed(0)}%</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-600">{row.topReason}</td>
                </tr>
              ))}
            </tbody>
          </OperationalTable>
        </OperationalTableWrap>
      </OperationalSection>

      <OperationalFilters>
        <FilterField label="Department">
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className={filterSelectClass}>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FilterField>
          <FilterField label="Location">
            <select value={locFilter} onChange={(e) => setLocFilter(e.target.value)} className={filterSelectClass}>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </FilterField>
          <FilterField label="Status">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={filterSelectClass}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FilterField>
          <FilterField label="Service Month">
            <select value={serviceMonthFilter} onChange={(e) => setServiceMonthFilter(e.target.value)} className={filterSelectClass}>
              {serviceMonths.map(sm => <option key={sm} value={sm}>{sm}</option>)}
            </select>
          </FilterField>
          <FilterField label="Last Working Date">
            <input type="date" value={lastWorkingDateFilter} onChange={(e) => setLastWorkingDateFilter(e.target.value)} className={filterInputClass} />
          </FilterField>
          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Comment..." value={commentSearch} onChange={(e) => setCommentSearch(e.target.value)} className={`${filterInputClass} pl-9`} />
            </div>
          </FilterField>
      </OperationalFilters>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OperationalSection title="Resignation Status" subtitle="Distribution by status">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {statusData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </OperationalSection>

        <OperationalSection title="Exit Reasons" subtitle="Normalized reason categories">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasonData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </OperationalSection>
      </div>

      <OperationalSection
        title="Resignations by Position"
        subtitle={`${selectedDeptForPositions || '—'} · ${totalStaffInDept} resignations`}
        headerAction={
          <select
            value={selectedDeptForPositions}
            onChange={(e) => setSelectedDeptForPositions(e.target.value)}
            className={`${filterSelectClass} font-semibold text-indigo-600 min-w-[140px]`}
          >
            {actualDepartments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        }
      >
        {positionsByDept.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No data for this department</p>
        ) : (
          <OperationalTableWrap>
            <OperationalTable>
              <OperationalThead>
                <OperationalTh>Position</OperationalTh>
                <OperationalTh align="right">Count</OperationalTh>
              </OperationalThead>
              <tbody>
                {positionsByDept.map(pos => (
                  <tr key={pos.name} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{pos.name}</td>
                    <td className="px-4 py-3 text-sm font-black text-right tabular-nums">{pos.count}</td>
                  </tr>
                ))}
              </tbody>
            </OperationalTable>
          </OperationalTableWrap>
        )}
      </OperationalSection>

      <OperationalSection title="Resignation Registry" subtitle={`${stats.filtered} records · click for detail`}>
        <OperationalTableWrap>
          <OperationalTable>
            <OperationalThead>
              <OperationalTh>Name</OperationalTh>
              <OperationalTh>Department</OperationalTh>
              <OperationalTh>Designation</OperationalTh>
              <OperationalTh>Last Date</OperationalTh>
              <OperationalTh>Status</OperationalTh>
              <OperationalTh>Reason</OperationalTh>
            </OperationalThead>
            <tbody>
              {filteredResignations.slice(0, 50).map(res => (
                <tr key={res.id} className="border-t border-slate-100 hover:bg-slate-50/80 cursor-pointer" onClick={() => setSelectedResignation(res)}>
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{res.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{res.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{res.designation || res.position}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{res.resignationDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${res.resignStatus === 'Dismiss' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                      {res.resignStatus || 'Resign'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px] truncate">{normalizeExitReason(res.comment || res.reason || '')}</td>
                </tr>
              ))}
            </tbody>
          </OperationalTable>
        </OperationalTableWrap>
      </OperationalSection>

      <OperationalOwnership items={[
        { icon: UserMinus, label: 'Primary', value: 'HR Employee Relations' },
        { icon: UserCog, label: 'Co-Owner', value: 'Department Heads' },
      ]} />

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
    </OperationalShell>
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
