import React, { useMemo, useState } from 'react';
import { JobNetData } from '../data/mockData';
import { Users, Phone, Calendar, Clock, Award, Building2, Briefcase } from 'lucide-react';

interface JobNetDashboardProps {
  jobNetData: JobNetData[];
  externalMonthFilter?: string;
}

export const JobNetDashboard: React.FC<JobNetDashboardProps> = ({ jobNetData, externalMonthFilter = 'All' }) => {
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const departments = useMemo(() => 
    ['All', ...Array.from(new Set(jobNetData.map(r => r.department)))].sort()
  , [jobNetData]);

  const filteredData = useMemo(() => {
    return jobNetData.filter(r => {
      const matchesDept = deptFilter === 'All' || r.department === deptFilter;
      const matchesSearch = searchQuery === '' ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.position.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesMonth = true;
      if (externalMonthFilter !== 'All' && r.cvReceivedDate) {
        const dateParts = r.cvReceivedDate.split(/[./-]/);
        if (dateParts.length >= 2) {
          const monthNum = parseInt(dateParts[1]);
          const monthMap: Record<string, number> = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
          };
          const targetMonth = monthMap[externalMonthFilter] || parseInt(externalMonthFilter);
          matchesMonth = monthNum === targetMonth;
        } else {
          matchesMonth = false;
        }
      }

      return matchesDept && matchesSearch && matchesMonth;
    });
  }, [jobNetData, deptFilter, searchQuery, externalMonthFilter]);

  const stats = useMemo(() => {
    const totalApplicants = filteredData.length;
    const withInterview = filteredData.filter(r => r.firstInterviewDate && r.firstInterviewDate !== '').length;
    const avgScore = filteredData.reduce((acc, r) => acc + r.interviewScore, 0) / (totalApplicants || 1);
    
    return {
      totalApplicants,
      withInterview,
      avgScore: avgScore.toFixed(1)
    };
  }, [filteredData]);

  const deptStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + 1;
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

  const positionStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      acc[r.position] = (acc[r.position] || 0) + 1;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Applicants</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalApplicants}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">With Interview</p>
            <p className="text-2xl font-bold text-slate-900">{stats.withInterview}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg Score</p>
            <p className="text-2xl font-bold text-slate-900">{stats.avgScore}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Breakdown Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BreakdownList title="Applicants by Department" data={deptStats} />
        <BreakdownList title="Applicants by Position" data={positionStats} />
      </div>
    </div>
  );
};
