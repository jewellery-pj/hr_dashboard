import React, { useMemo, useState, useEffect } from 'react';
import { JobNetData } from '../data/mockData';
import { Users, Phone, Calendar, Clock, Award, Building2, Briefcase, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface JobNetDashboardProps {
  jobNetData: JobNetData[];
  externalMonthFilter?: string;
}

export const JobNetDashboard: React.FC<JobNetDashboardProps> = ({ jobNetData, externalMonthFilter = 'All' }) => {
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interview Details List filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [positionFilter, setPositionFilter] = useState<string>('All');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState<string>('All');
  const [joinedStatusFilter, setJoinedStatusFilter] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<JobNetData | null>(null);

  const departments = useMemo(() => 
    ['All', ...Array.from(new Set(jobNetData.map(r => r.department)))].sort()
  , [jobNetData]);

  const positions = useMemo(() => 
    ['All', ...Array.from(new Set(jobNetData.map(r => r.position)))].sort()
  , [jobNetData]);

  const remarks = useMemo(() => 
    ['All', ...Array.from(new Set(jobNetData.map(r => r.remark).filter(r => r && r !== '').map(r => r.toLowerCase())))].sort()
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

  // Filtered data for Interview Details List
  const filteredInterviewData = useMemo(() => {
    return filteredData.filter(r => {
      const matchesDepartment = departmentFilter === 'All' || r.department === departmentFilter;
      const matchesPosition = positionFilter === 'All' || r.position === positionFilter;
      
      let matchesInterviewStatus = true;
      if (interviewStatusFilter === 'With 1st Interview') {
        matchesInterviewStatus = r.firstInterviewDate && r.firstInterviewDate !== '';
      } else if (interviewStatusFilter === 'Without 1st Interview') {
        matchesInterviewStatus = !r.firstInterviewDate || r.firstInterviewDate === '';
      } else if (interviewStatusFilter === 'With 2nd Interview') {
        matchesInterviewStatus = r.secondInterviewDate && r.secondInterviewDate !== '';
      } else if (interviewStatusFilter === 'Without 2nd Interview') {
        matchesInterviewStatus = !r.secondInterviewDate || r.secondInterviewDate === '';
      }

      let matchesJoinedStatus = true;
      if (joinedStatusFilter !== 'All') {
        matchesJoinedStatus = r.remark && r.remark.toLowerCase() === joinedStatusFilter.toLowerCase();
      }

      return matchesDepartment && matchesPosition && matchesInterviewStatus && matchesJoinedStatus;
    });
  }, [filteredData, departmentFilter, positionFilter, interviewStatusFilter, joinedStatusFilter]);

  const stats = useMemo(() => {
    const totalApplicants = filteredData.length;
    const withInterview = filteredData.filter(r => r.firstInterviewDate && r.firstInterviewDate !== '').length;
    const avgScore = filteredData.reduce((acc, r) => acc + r.interviewScore, 0) / (totalApplicants || 1);
    const numberOfJoin = filteredData.filter(r => r.joinedDate && r.joinedDate !== '').length;
    
    return {
      totalApplicants,
      withInterview,
      avgScore: avgScore.toFixed(1),
      numberOfJoin
    };
  }, [filteredData]);

  const deptStats = useMemo(() => {
    // Count applicants by department names directly from data
    const counts = filteredData.reduce((acc, r) => {
      const deptName = r.department || 'Unknown';
      acc[deptName] = (acc[deptName] || 0) + 1;
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

  const applicantPhoneStats = useMemo(() => {
    // Show individual applicant names
    return filteredData
      .map(applicant => ({
        name: applicant.name,
        မphone: applicant.phNo,
        count: 1,
        percentage: 0
      }))
      .slice(0, 50); // Limit to top 50
  }, [filteredData]);

  const deptInterviewStats = useMemo(() => {
    const stats = filteredData.reduce((acc, r) => {
      const deptName = r.department || 'Unknown';
      
      if (!acc[deptName]) {
        acc[deptName] = {
          department: deptName,
          totalApplicants: 0,
          firstInterviewCount: 0,
          secondInterviewCount: 0,
          remarks: []
        };
      }
      
      acc[deptName].totalApplicants++;
      
      if (r.firstInterviewDate && r.firstInterviewDate !== '') {
        acc[deptName].firstInterviewCount++;
      }
      
      if (r.secondInterviewDate && r.secondInterviewDate !== '') {
        acc[deptName].secondInterviewCount++;
      }
      
      if (r.remark && r.remark !== '') {
        acc[deptName].remarks.push(r.remark);
      }
      
      return acc;
    }, {} as Record<string, {
      department: string;
      totalApplicants: number;
      firstInterviewCount: number;
      secondInterviewCount: number;
      remarks: string[];
    }>);

    return (Object.values(stats) as typeof stats[string])
      .filter(stat => stat.department !== 'Unknown')
      .sort((a, b) => b.totalApplicants - a.totalApplicants);
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

  const cvInStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      const cvDate = r.cvReceivedDate || 'Unknown';
      acc[cvDate] = (acc[cvDate] || 0) + 1;
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

  const firstInterviewStats = useMemo(() => {
    const counts = filteredData.reduce((acc, r) => {
      const dept = r.department || 'Unknown';
      if (r.firstInterviewDate && r.firstInterviewDate !== '') {
        acc[dept] = (acc[dept] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const total = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);

    return (Object.entries(counts) as [string, number][])
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  const firstInterviewPivotData = useMemo(() => {
    // Get unique dates, departments, and positions for first interviews only
    const firstInterviewRecords = filteredData.filter(r => r.firstInterviewDate && r.firstInterviewDate !== '');
    const dates = Array.from(new Set(firstInterviewRecords.map(c => c.firstInterviewDate))).sort() as string[];
    const departments = Array.from(new Set(firstInterviewRecords.map(c => c.department))).sort() as string[];
    const positions = Array.from(new Set(firstInterviewRecords.map(c => c.position))).sort() as string[];

    if (positions.length === 0) return { dates, departments, positions, grid: {}, dateTotals: {}, grandTotals: {} };

    // Build grid: grid[date][dept][position] = count
    const grid: Record<string, Record<string, Record<string, number>>> = {};
    
    firstInterviewRecords.forEach(c => {
      if (!grid[c.firstInterviewDate]) grid[c.firstInterviewDate] = {};
      if (!grid[c.firstInterviewDate][c.department]) grid[c.firstInterviewDate][c.department] = {};
      const dateGrid = grid[c.firstInterviewDate];
      const deptGrid = dateGrid[c.department];
      deptGrid[c.position] = (deptGrid[c.position] || 0) + 1;
    });

    // Calculate totals
    const dateTotals: Record<string, Record<string, number>> = {};
    const grandTotals: Record<string, number> = {};

    dates.forEach(date => {
      dateTotals[date] = {};
      positions.forEach(pos => {
        let sum = 0;
        departments.forEach(dept => {
          sum += grid[date]?.[dept]?.[pos] || 0;
        });
        dateTotals[date][pos] = sum;
        grandTotals[pos] = (grandTotals[pos] || 0) + sum;
      });
    });

    return { dates, departments, positions, grid, dateTotals, grandTotals };
  }, [filteredData]);

  const secondInterviewPivotData = useMemo(() => {
    // Get unique dates, departments, and positions for second interviews only
    const secondInterviewRecords = filteredData.filter(r => r.secondInterviewDate && r.secondInterviewDate !== '');
    const dates = Array.from(new Set(secondInterviewRecords.map(c => c.secondInterviewDate))).sort() as string[];
    const departments = Array.from(new Set(secondInterviewRecords.map(c => c.department))).sort() as string[];
    const positions = Array.from(new Set(secondInterviewRecords.map(c => c.position))).sort() as string[];

    if (positions.length === 0) return { dates, departments, positions, grid: {}, dateTotals: {}, grandTotals: {} };

    // Build grid: grid[date][dept][position] = count
    const grid: Record<string, Record<string, Record<string, number>>> = {};
    
    secondInterviewRecords.forEach(c => {
      if (!grid[c.secondInterviewDate]) grid[c.secondInterviewDate] = {};
      if (!grid[c.secondInterviewDate][c.department]) grid[c.secondInterviewDate][c.department] = {};
      const dateGrid = grid[c.secondInterviewDate];
      const deptGrid = dateGrid[c.department];
      deptGrid[c.position] = (deptGrid[c.position] || 0) + 1;
    });

    // Calculate totals
    const dateTotals: Record<string, Record<string, number>> = {};
    const grandTotals: Record<string, number> = {};

    dates.forEach(date => {
      dateTotals[date] = {};
      positions.forEach(pos => {
        let sum = 0;
        departments.forEach(dept => {
          sum += grid[date]?.[dept]?.[pos] || 0;
        });
        dateTotals[date][pos] = sum;
        grandTotals[pos] = (grandTotals[pos] || 0) + sum;
      });
    });

    return { dates, departments, positions, grid, dateTotals, grandTotals };
  }, [filteredData]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#f97316', '#06b6d4', '#84cc16'];

  const BreakdownList = ({ title, data, showPhone }: { title: string, data: { name: string, count: number, percentage: number, phone?: string }[], showPhone?: boolean }) => {
    const total = data.reduce((acc, item) => acc + item.count, 0);
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm h-full">
        <h3 className="text-xl font-bold text-slate-800 mb-8">{title}</h3>
        <div className="space-y-5">
          {data.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-500 text-sm">No data available</div>
            </div>
          ) : (
            data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-4 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                      {item.name}
                    </span>
                    {showPhone && item.phone && (
                      <span className="text-sm text-slate-500 ml-2">({item.phone})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">{item.count}</span>
                  <span className="text-xs font-medium text-slate-400 min-w-[50px] text-right">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-500">Total</span>
          <span className="text-lg font-bold text-slate-900">{total}</span>
        </div>
      </div>
    );
  };

  const InterviewStatsTable = ({ data }: { data: typeof deptInterviewStats }) => {
    // Calculate totals across all departments
    const totalStats = data.reduce((acc, dept) => {
      acc.totalFirstInterview += dept.firstInterviewCount;
      acc.totalSecondInterview += dept.secondInterviewCount;
      return acc;
    }, {
      totalFirstInterview: 0,
      totalSecondInterview: 0
    });

    // Calculate additional metrics
    const totalInterviews = totalStats.totalFirstInterview + totalStats.totalSecondInterview;
    const interviewToApplicantRatio = filteredData.length > 0 ? (totalInterviews / filteredData.length).toFixed(1) : '0';
    const secondInterviewConversionRate = totalStats.totalFirstInterview > 0 ? 
      ((totalStats.totalSecondInterview / totalStats.totalFirstInterview) * 100).toFixed(1) : '0';

    // Determine performance color based on ratio
    const getRatioColor = (ratio: string) => {
      const numRatio = parseFloat(ratio);
      if (numRatio >= 1.5) return 'text-emerald-600 bg-emerald-50';
      if (numRatio >= 1.0) return 'text-blue-600 bg-blue-50';
      if (numRatio >= 0.5) return 'text-amber-600 bg-amber-50';
      return 'text-rose-600 bg-rose-50';
    };

    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Interview Statistics Summary</h3>

        {/* Applicant Interview Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 border-b border-slate-200">Name</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600 border-b border-slate-200">First Interviews</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600 border-b border-slate-200">Second Interviews</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 50).map((applicant) => (
                <tr key={applicant.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">{applicant.name}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">
                    {applicant.firstInterviewDate && applicant.firstInterviewDate !== '' ? 1 : 0}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right">
                    {applicant.secondInterviewDate && applicant.secondInterviewDate !== '' ? 1 : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length > 50 && (
            <p className="text-sm text-slate-500 mt-4 italic">Showing first 50 of {filteredData.length} applicants</p>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`p-6 rounded-xl border ${getRatioColor(interviewToApplicantRatio)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Interviews per Applicant</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{interviewToApplicantRatio}</span>
                <span className="text-xs font-medium">interviews/candidate</span>
              </div>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {parseFloat(interviewToApplicantRatio) >= 1.5 ? 'Excellent coverage' :
               parseFloat(interviewToApplicantRatio) >= 1.0 ? 'Good coverage' :
               parseFloat(interviewToApplicantRatio) >= 0.5 ? 'Moderate coverage' : 'Low coverage'}
            </div>
          </div>
          
          <div className={`p-6 rounded-xl border ${getRatioColor(secondInterviewConversionRate)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">2nd Interview Conversion</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{secondInterviewConversionRate}%</span>
                <span className="text-xs font-medium">of 1st interviews</span>
              </div>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {parseFloat(secondInterviewConversionRate) >= 50 ? 'Excellent progression' :
               parseFloat(secondInterviewConversionRate) >= 30 ? 'Good progression' :
               parseFloat(secondInterviewConversionRate) >= 20 ? 'Moderate progression' : 'Needs improvement'}
            </div>
          </div>
          
          <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Interview Completion Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {filteredData.length > 0 ? ((totalInterviews / filteredData.length) * 100).toFixed(1) : '0'}%
                </span>
                <span className="text-xs font-medium text-slate-600">of applicants interviewed</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {filteredData.length > 0 && ((totalInterviews / filteredData.length) * 100) >= 80 ? 'High completion' :
               ((totalInterviews / filteredData.length) * 100) >= 60 ? 'Good completion' :
               ((totalInterviews / filteredData.length) * 100) >= 40 ? 'Moderate completion' : 'Low completion'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Number of Joined</p>
            <p className="text-2xl font-bold text-slate-900">{stats.numberOfJoin}</p>
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

      {/* Applicants by CV In */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <BreakdownList title="Applicants by CV In" data={cvInStats} />
      </div>

      {/* Number of First Interview Pivot Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">First Interview Pivot Table (Date & Dept vs Position)</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              {/* Top Header */}
              <tr className="bg-white">
                <th className="border border-slate-300 p-1" colSpan={2}></th>
                <th className="border border-slate-300 p-1 text-right font-bold bg-slate-50" rowSpan={2}>Position:</th>
                {firstInterviewPivotData.positions.map(pos => (
                  <th key={pos} className="border border-slate-300 p-1 text-left font-bold min-w-[80px]">
                    {pos}
                  </th>
                ))}
                <th className="border border-slate-300 p-1 text-left font-bold bg-slate-100 min-w-[80px]">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Sub Header Row */}
              <tr className="bg-white font-bold">
                <td className="border border-slate-300 p-1 text-lg">1st Interview Date</td>
                <td className="border border-slate-300 p-1 text-lg">Department</td>
                <td className="border border-slate-300 p-1">Position (Count)</td>
                {firstInterviewPivotData.positions.map(pos => (
                  <td key={pos} className="border border-slate-300 p-1"></td>
                ))}
                <td className="border border-slate-300 p-1"></td>
              </tr>

              {/* Data Rows */}
              {firstInterviewPivotData.dates.map(date => (
                <React.Fragment key={date}>
                  {firstInterviewPivotData.departments.filter(dept => firstInterviewPivotData.grid[date]?.[dept]).map((dept, deptIdx) => {
                    const rowTotal = firstInterviewPivotData.positions.reduce((sum, pos) => sum + (firstInterviewPivotData.grid[date][dept][pos] || 0), 0);
                    if (rowTotal === 0) return null;

                    return (
                      <tr key={`${date}-${dept}`} className="hover:bg-slate-50">
                        {deptIdx === 0 ? (
                          <td className="border border-slate-300 p-1 font-bold align-top" rowSpan={firstInterviewPivotData.departments.filter(d => firstInterviewPivotData.grid[date]?.[d]).length}>
                            ▼ {date}
                          </td>
                        ) : null}
                        <td className="border border-slate-300 p-1 text-slate-700">
                          {dept}
                        </td>
                        <td className="border border-slate-300 p-1"></td>
                        {firstInterviewPivotData.positions.map(pos => (
                          <td key={pos} className="border border-slate-300 p-1 text-center">
                            {firstInterviewPivotData.grid[date][dept][pos] || ''}
                          </td>
                        ))}
                        <td className="border border-slate-300 p-1 text-center font-bold">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Date Total Row */}
                  <tr className="bg-slate-50 font-bold">
                    <td className="border border-slate-300 p-1" colSpan={2}>{date} Total</td>
                    <td className="border border-slate-300 p-1"></td>
                    {firstInterviewPivotData.positions.map(pos => (
                      <td key={pos} className="border border-slate-300 p-1 text-center">
                        {firstInterviewPivotData.dateTotals[date][pos] || ''}
                      </td>
                    ))}
                    <td className="border border-slate-300 p-1 text-center">
                      {Object.values(firstInterviewPivotData.dateTotals[date]).reduce((a: number, b: number) => a + b, 0)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold text-sm">
                <td className="border border-slate-300 p-1" colSpan={2}>Grand Total</td>
                <td className="border border-slate-300 p-1"></td>
                {firstInterviewPivotData.positions.map(pos => (
                  <td key={pos} className="border border-slate-300 p-1 text-center">
                    {firstInterviewPivotData.grandTotals[pos]}
                  </td>
                ))}
                <td className="border border-slate-300 p-1 text-center text-indigo-600">
                  {Object.values(firstInterviewPivotData.grandTotals).reduce((a: number, b: number) => a + b, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
          {firstInterviewPivotData.positions.length === 0 && (
            <p className="text-sm text-slate-500 mt-4 italic">No first interview data available</p>
          )}
        </div>
      </div>

      {/* Number of Second Interview Pivot Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Second Interview Pivot Table (Date & Dept vs Position)</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              {/* Top Header */}
              <tr className="bg-white">
                <th className="border border-slate-300 p-1" colSpan={2}></th>
                <th className="border border-slate-300 p-1 text-right font-bold bg-slate-50" rowSpan={2}>Position:</th>
                {secondInterviewPivotData.positions.map(pos => (
                  <th key={pos} className="border border-slate-300 p-1 text-left font-bold min-w-[80px]">
                    {pos}
                  </th>
                ))}
                <th className="border border-slate-300 p-1 text-left font-bold bg-slate-100 min-w-[80px]">Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Sub Header Row */}
              <tr className="bg-white font-bold">
                <td className="border border-slate-300 p-1 text-lg">2nd Interview Date</td>
                <td className="border border-slate-300 p-1 text-lg">Department</td>
                <td className="border border-slate-300 p-1">Position (Count)</td>
                {secondInterviewPivotData.positions.map(pos => (
                  <td key={pos} className="border border-slate-300 p-1"></td>
                ))}
                <td className="border border-slate-300 p-1"></td>
              </tr>

              {/* Data Rows */}
              {secondInterviewPivotData.dates.map(date => (
                <React.Fragment key={date}>
                  {secondInterviewPivotData.departments.filter(dept => secondInterviewPivotData.grid[date]?.[dept]).map((dept, deptIdx) => {
                    const rowTotal = secondInterviewPivotData.positions.reduce((sum, pos) => sum + (secondInterviewPivotData.grid[date][dept][pos] || 0), 0);
                    if (rowTotal === 0) return null;

                    return (
                      <tr key={`${date}-${dept}`} className="hover:bg-slate-50">
                        {deptIdx === 0 ? (
                          <td className="border border-slate-300 p-1 font-bold align-top" rowSpan={secondInterviewPivotData.departments.filter(d => secondInterviewPivotData.grid[date]?.[d]).length}>
                            ▼ {date}
                          </td>
                        ) : null}
                        <td className="border border-slate-300 p-1 text-slate-700">
                          {dept}
                        </td>
                        <td className="border border-slate-300 p-1"></td>
                        {secondInterviewPivotData.positions.map(pos => (
                          <td key={pos} className="border border-slate-300 p-1 text-center">
                            {secondInterviewPivotData.grid[date][dept][pos] || ''}
                          </td>
                        ))}
                        <td className="border border-slate-300 p-1 text-center font-bold">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Date Total Row */}
                  <tr className="bg-slate-50 font-bold">
                    <td className="border border-slate-300 p-1" colSpan={2}>{date} Total</td>
                    <td className="border border-slate-300 p-1"></td>
                    {secondInterviewPivotData.positions.map(pos => (
                      <td key={pos} className="border border-slate-300 p-1 text-center">
                        {secondInterviewPivotData.dateTotals[date][pos] || ''}
                      </td>
                    ))}
                    <td className="border border-slate-300 p-1 text-center">
                      {Object.values(secondInterviewPivotData.dateTotals[date]).reduce((a: number, b: number) => a + b, 0)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold text-sm">
                <td className="border border-slate-300 p-1" colSpan={2}>Grand Total</td>
                <td className="border border-slate-300 p-1"></td>
                {secondInterviewPivotData.positions.map(pos => (
                  <td key={pos} className="border border-slate-300 p-1 text-center">
                    {secondInterviewPivotData.grandTotals[pos]}
                  </td>
                ))}
                <td className="border border-slate-300 p-1 text-center text-indigo-600">
                  {Object.values(secondInterviewPivotData.grandTotals).reduce((a: number, b: number) => a + b, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
          {secondInterviewPivotData.positions.length === 0 && (
            <p className="text-sm text-slate-500 mt-4 italic">No second interview data available</p>
          )}
        </div>
      </div>

      {/* Interview Details List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800">Interview Details List</h3>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Position</label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Interview Status</label>
            <select
              value={interviewStatusFilter}
              onChange={(e) => setInterviewStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All</option>
              <option value="With 1st Interview">With 1st Interview</option>
              <option value="Without 1st Interview">Without 1st Interview</option>
              <option value="With 2nd Interview">With 2nd Interview</option>
              <option value="Without 2nd Interview">Without 2nd Interview</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
            <select
              value={joinedStatusFilter}
              onChange={(e) => setJoinedStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {remarks.map(remark => (
                <option key={remark} value={remark}>{remark}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 text-left font-semibold text-slate-700">Name</th>
                <th className="p-3 text-left font-semibold text-slate-700">Position</th>
                <th className="p-3 text-left font-semibold text-slate-700">Department</th>
                <th className="p-3 text-left font-semibold text-slate-700">1st Interview</th>
                <th className="p-3 text-left font-semibold text-slate-700">2nd Interview</th>
                <th className="p-3 text-left font-semibold text-slate-700">မှတ်ချက်</th>
                <th className="p-3 text-left font-semibold text-slate-700">Offer</th>
                <th className="p-3 text-left font-semibold text-slate-700">Joined Date</th>
                <th className="p-3 text-left font-semibold text-slate-700">Remark</th>
                <th className="p-3 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviewData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-900">{item.name}</td>
                  <td className="p-3 text-slate-700">{item.position}</td>
                  <td className="p-3 text-slate-700">{item.department}</td>
                  <td className="p-3 text-slate-700">{item.firstInterviewDate || '_'}</td>
                  <td className="p-3 text-slate-700">{item.secondInterviewDate || '_'}</td>
                  <td className="p-3 text-slate-700">
                    <div className="max-w-[150px]">
                      <span className="block truncate text-slate-700" title={item.မှတ်ချက် || '-'}>
                        {item.မှတ်ချက် || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-700">{item.offer || '_'}</td>
                  <td className="p-3 text-slate-700">{item.joinedDate || '_'}</td>
                  <td className="p-3 text-slate-700">
                    <div className="max-w-[150px]">
                      <span className="block truncate text-slate-700" title={item.remark || '-'}>
                        {item.remark || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-slate-700">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInterviewData.length === 0 && (
            <p className="text-sm text-slate-500 mt-4 italic">No interview details available</p>
          )}
        </div>
      </div>

      {/* Modal for View more Detail */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-blue-600 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Applicant Details</h3>
                  <p className="text-blue-100 text-sm mt-0.5">View complete information</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-white/80 hover:text-white hover:bg-white/20 transition-all p-2 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)] bg-slate-50">
              {/* Name Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <label className="text-xs font-bold text-blue-700 uppercase tracking-wider">Name</label>
                </div>
                <p className="text-lg font-bold text-slate-900 mt-2">{selectedItem.name}</p>
              </div>

              {/* Position & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Position</label>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-2">{selectedItem.position}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Department</label>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-2">{selectedItem.department}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Phone Number</label>
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-2">{selectedItem.phNo}</p>
              </div>

              {/* Interview Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">1st Interview</label>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-2">{selectedItem.firstInterviewDate || '-'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">2nd Interview</label>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-2">{selectedItem.secondInterviewDate || '-'}</p>
                </div>
              </div>

              {/* မှတ်ချက် */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">မှတ်ချက်</label>
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-2">{selectedItem.မှတ်ချက် || '-'}</p>
              </div>

              {/* Offer & Joined Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Offer</label>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-2">{selectedItem.offer || '-'}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Joined Date</label>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mt-2">{selectedItem.joinedDate || '-'}</p>
                </div>
              </div>

              {/* Remark */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Remark</label>
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-2">{selectedItem.remark || '-'}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 px-8 py-5 border-t border-slate-200">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
