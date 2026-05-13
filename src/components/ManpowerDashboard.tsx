import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Manpower } from '../data/mockData';
import { Users, Filter, Search, TrendingUp, TrendingDown, Minus, Building2 } from 'lucide-react';

interface ManpowerDashboardProps {
  manpower: Manpower[];
  externalMonthFilter?: string;
}

export const ManpowerDashboard: React.FC<ManpowerDashboardProps> = ({ manpower, externalMonthFilter = 'All' }) => {
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [posSearch, setPosSearch] = useState<string>('');

  const departments = useMemo(() => 
    ['All', ...Array.from(new Set(manpower.map(r => r.department)))].sort()
  , [manpower]);

  const filteredData = useMemo(() => {
    let monthAbbrev = externalMonthFilter;
    if (externalMonthFilter && externalMonthFilter !== 'All') {
      const selectedDate = new Date(externalMonthFilter);
      monthAbbrev = selectedDate.toLocaleString('en-US', { month: 'short' });
    }
    
    return manpower.filter(r => {
      const matchesDept = deptFilter === 'All' || r.department === deptFilter;
      const matchesMonth = !externalMonthFilter || r.month === monthAbbrev;
      const matchesPos = posSearch === '' || 
        r.position.toLowerCase().includes(posSearch.toLowerCase());
      
      return matchesDept && matchesMonth && matchesPos;
    });
  }, [manpower, deptFilter, externalMonthFilter, posSearch]);

  const stats = useMemo(() => {
    const totalBudgeted = filteredData.reduce((acc, r) => acc + r.budgeted, 0);
    const totalActual = filteredData.reduce((acc, r) => acc + r.actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const variancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

    return {
      totalBudgeted,
      totalActual,
      totalVariance,
      variancePercent
    };
  }, [filteredData]);

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

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Actual Manpower</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalActual}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Departments</p>
            <p className="text-2xl font-bold text-slate-900">{departments.filter(d => d !== 'All').length}</p>
          </div>
        </div>
      </div>

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
    </div>
  );
};
