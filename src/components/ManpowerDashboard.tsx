import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Manpower, EmployeeRecord } from '../data/mockData';
import { Users, Search, TrendingUp, TrendingDown, Minus, Building2, UserCog } from 'lucide-react';
import {
  OperationalShell,
  OperationalHeader,
  OperationalSection,
  OperationalOwnership,
  OperationalAlert,
  FilterField,
  filterSelectClass,
  filterInputClass,
} from './OperationalLayout';

interface ManpowerDashboardProps {
  manpower: Manpower[];
  employees?: EmployeeRecord[];
  externalMonthFilter?: string;
}

export const ManpowerDashboard: React.FC<ManpowerDashboardProps> = ({ manpower, employees = [], externalMonthFilter = 'All' }) => {
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [posSearch, setPosSearch] = useState<string>('');

  const departments = useMemo(() => 
    ['All', ...Array.from(new Set(manpower.map(r => r.department)))].sort()
  , [manpower]);

  const filteredData = useMemo(() => {
    return manpower.filter(r => {
      const matchesDept = deptFilter === 'All' || r.department === deptFilter;
      const matchesPos = posSearch === '' ||
        r.position.toLowerCase().includes(posSearch.toLowerCase());
      return matchesDept && matchesPos;
    });
  }, [manpower, deptFilter, posSearch]);

  const stats = useMemo(() => {
    const totalBudgeted = filteredData.reduce((acc, r) => acc + r.budgeted, 0);
    const totalActual = employees.length > 0
      ? employees.length
      : filteredData.reduce((acc, r) => acc + r.actual, 0);
    const hasBudgetData = totalBudgeted > 0;
    const totalVariance = hasBudgetData ? totalActual - totalBudgeted : null;
    const variancePercent = hasBudgetData && totalBudgeted > 0 ? ((totalActual - totalBudgeted) / totalBudgeted) * 100 : null;

    return {
      totalBudgeted,
      totalActual,
      hasBudgetData,
      totalVariance,
      variancePercent,
    };
  }, [filteredData, employees]);

  const chartData = useMemo(() => {
    const deptGroups = filteredData.reduce((acc, r) => {
      if (!acc[r.department]) {
        acc[r.department] = { name: r.department, budgeted: 0, actual: 0 };
      }
      acc[r.department].budgeted += r.budgeted;
      acc[r.department].actual += r.actual;
      return acc;
    }, {} as Record<string, { name: string; budgeted: number; actual: number }>);

    return (Object.values(deptGroups) as { name: string; budgeted: number; actual: number }[])
      .sort((a, b) => b.budgeted - a.budgeted);
  }, [filteredData]);

  const deptStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + r.actual;
      return acc;
    }, {} as Record<string, number>);

    const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);

    return (Object.entries(counts) as [string, number][])
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const shopLocationStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      const loc = r.shopLocation || 'Unknown';
      acc[loc] = (acc[loc] || 0) + r.actual;
      return acc;
    }, {} as Record<string, number>);

    const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);

    return (Object.entries(counts) as [string, number][])
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const branchStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      const branch = r.branch || 'Unknown';
      acc[branch] = (acc[branch] || 0) + r.actual;
      return acc;
    }, {} as Record<string, number>);

    const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);

    return (Object.entries(counts) as [string, number][])
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const genderStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      const gender = r.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + r.actual;
      return acc;
    }, {} as Record<string, number>);

    const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);

    return (Object.entries(counts) as [string, number][])
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const [selectedBreakdownDept, setSelectedBreakdownDept] = useState<string>('');
  const [selectedBreakdownShop, setSelectedBreakdownShop] = useState<string>('');

  const positionBreakdown = useMemo(() => {
    const groups = filteredData.reduce((acc, r) => {
      if (!acc[r.department]) {
        acc[r.department] = {};
      }
      acc[r.department][r.position] = (acc[r.department][r.position] || 0) + r.actual;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return Object.entries(groups).map(([dept, positions]) => ({
      dept,
      positions: Object.entries(positions).map(([pos, count]) => ({ pos, count })).sort((a, b) => b.count - a.count)
    })).sort((a, b) => a.dept.localeCompare(b.dept));
  }, [filteredData]);

  const shopPositionBreakdown = useMemo(() => {
    const groups = filteredData.reduce((acc, r) => {
      const loc = r.shopLocation || 'Unknown';
      if (!acc[loc]) {
        acc[loc] = {};
      }
      acc[loc][r.position] = (acc[loc][r.position] || 0) + r.actual;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    return Object.entries(groups).map(([shop, positions]) => ({
      shop,
      positions: Object.entries(positions).map(([pos, count]) => ({ pos, count })).sort((a, b) => b.count - a.count)
    })).sort((a, b) => a.shop.localeCompare(b.shop));
  }, [filteredData]);

  const activeBreakdown = useMemo(() => {
    if (selectedBreakdownDept) {
      return positionBreakdown.find(d => d.dept === selectedBreakdownDept);
    }
    return positionBreakdown[0];
  }, [positionBreakdown, selectedBreakdownDept]);

  const activeShopBreakdown = useMemo(() => {
    if (selectedBreakdownShop) {
      return shopPositionBreakdown.find(s => s.shop === selectedBreakdownShop);
    }
    return shopPositionBreakdown[0];
  }, [shopPositionBreakdown, selectedBreakdownShop]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#f97316', '#06b6d4', '#84cc16'];

  const BreakdownList = ({ title, data }: { title: string, data: { name: string, count: number, percentage: number }[] }) => {
    const total = data.reduce((acc, item) => acc + item.count, 0);
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm h-full">
        <h3 className="text-xl font-bold text-slate-800 mb-8">{title}</h3>
        <div className="space-y-5">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900">{item.count}</span>
                <span className="text-xs font-medium text-slate-400 min-w-[50px] text-right">({item.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-500">Total</span>
          <span className="text-lg font-bold text-slate-900">{total}</span>
        </div>
      </div>
    );
  };

  const periodLabel = externalMonthFilter === 'All' ? 'All months' : externalMonthFilter;

  return (
    <OperationalShell>
      <OperationalHeader
        eyebrow="Workforce Snapshot"
        title="Manpower Dashboard"
        subtitle={`${stats.totalActual} employees · ${departments.length - 1} departments · live data`}
        gradient="emerald"
        metrics={[
          { value: stats.totalActual, label: 'Actual' },
          { value: stats.hasBudgetData ? stats.totalBudgeted : '—', label: 'Budgeted' },
          { value: stats.hasBudgetData && stats.totalVariance !== null ? stats.totalVariance : '—', label: 'Gap' },
          { value: deptStats.length, label: 'Departments' },
        ]}
        alert={
          !stats.hasBudgetData ? (
            <OperationalAlert tone="amber">
              <span className="text-sm font-bold">Approved headcount budget not loaded — showing actual staff only.</span>
            </OperationalAlert>
          ) : undefined
        }
      />

      {externalMonthFilter !== 'All' && (
        <p className="text-sm text-slate-500 px-1">Headcount is a live snapshot — period filter ({periodLabel}) does not change totals.</p>
      )}

      <OperationalSection title="Filters" subtitle="Department and position search">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FilterField label="Department">
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className={filterSelectClass}>
              {departments.map(dept => <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>)}
            </select>
          </FilterField>
          <FilterField label="Search Position">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search position..." value={posSearch} onChange={(e) => setPosSearch(e.target.value)} className={`${filterInputClass} pl-9`} />
            </div>
          </FilterField>
        </div>
      </OperationalSection>
      {/* Breakdown Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BreakdownList title="Employees by Department" data={deptStats} />
        <BreakdownList title="Employees by Shop Location" data={shopLocationStats} />
      </div>

      {/* Branch and Gender Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BreakdownList title="Employees by Branch" data={branchStats} />
        <BreakdownList title="Employees by Gender" data={genderStats} />
      </div>

      {/* Position Breakdown by Department */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h3 className="text-xl font-bold text-slate-800">By Department</h3>
            <div className="flex items-center gap-3">
              <select 
                value={selectedBreakdownDept || (activeBreakdown?.dept || '')}
                onChange={(e) => setSelectedBreakdownDept(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {positionBreakdown.map(d => (
                  <option key={d.dept} value={d.dept}>{d.dept}</option>
                ))}
              </select>
            </div>
          </div>

          {activeBreakdown ? (
            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-6 border-b border-indigo-100 pb-3 flex items-center justify-between">
                <span>{activeBreakdown.dept}</span>
                <span className="text-xs text-slate-400 font-medium">
                  {activeBreakdown.positions.reduce((a, b) => a + b.count, 0)} Total Staff
                </span>
              </h4>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {activeBreakdown.positions.map((p) => (
                  <div key={p.pos} className="flex items-center justify-between group">
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                      {p.pos}
                    </span>
                    <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm min-w-[40px] text-center">
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 italic">
              No data available.
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h3 className="text-xl font-bold text-slate-800">By Shop Location</h3>
            <div className="flex items-center gap-3">
              <select 
                value={selectedBreakdownShop || (activeShopBreakdown?.shop || '')}
                onChange={(e) => setSelectedBreakdownShop(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                {shopPositionBreakdown.map(s => (
                  <option key={s.shop} value={s.shop}>{s.shop}</option>
                ))}
              </select>
            </div>
          </div>

          {activeShopBreakdown ? (
            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-6 border-b border-emerald-100 pb-3 flex items-center justify-between">
                <span>{activeShopBreakdown.shop}</span>
                <span className="text-xs text-slate-400 font-medium">
                  {activeShopBreakdown.positions.reduce((a, b) => a + b.count, 0)} Total Staff
                </span>
              </h4>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {activeShopBreakdown.positions.map((p) => (
                  <div key={p.pos} className="flex items-center justify-between group">
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                      {p.pos}
                    </span>
                    <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm min-w-[40px] text-center">
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 italic">
              No data available.
            </div>
          )}
        </div>
      </div>
      <OperationalOwnership items={[
        { icon: Users, label: 'Primary', value: 'HR Operations' },
        { icon: UserCog, label: 'Co-Owner', value: 'Department Heads' },
      ]} />
    </OperationalShell>
  );
};
