import React, { useMemo, useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  LogOut, 
  Users, 
  Send, 
  MessageSquare, 
  UserPlus, 
  XCircle,
  Filter,
  Settings
} from 'lucide-react';
import { Candidate, mockCandidates, Resignation, mockResignations, ExitInterview, mockExitInterviews, Manpower, mockManpower } from './data/mockData';
import { KpiCard } from './components/KpiCard';
import { HiringFunnel } from './components/HiringFunnel';
import { TrendChart } from './components/TrendChart';
import { PositionChart } from './components/PositionChart';
import { HodSentChart } from './components/HodSentChart';
import { PivotTable } from './components/PivotTable';
import { PivotTable2 } from './components/PivotTable2';
import { PivotTable3 } from './components/PivotTable3';
import { ResignationDashboard } from './components/ResignationDashboard';
import { ExitInterviewDashboard } from './components/ExitInterviewDashboard';
import { ManpowerDashboard } from './components/ManpowerDashboard';
import { OverviewDashboard } from './components/OverviewDashboard';
import { fetchExcelData, fetchResignationData, fetchExitInterviewData, fetchManpowerData } from './services/excelService';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import { useAuth } from './context/AuthContext';

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function App() {
  const { isAuthenticated, user, logout, login } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [exitInterviews, setExitInterviews] = useState<ExitInterview[]>([]);
  const [manpower, setManpower] = useState<Manpower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'overview' | 'recruitment' | 'resignation' | 'exit' | 'manpower'>('overview');
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [selectedDeptForPositions, setSelectedDeptForPositions] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [excelData, resData, exitData, mpData] = await Promise.all([
          fetchExcelData(),
          fetchResignationData(),
          fetchExitInterviewData(),
          fetchManpowerData()
        ]);
        
        if (excelData && excelData.length > 0) {
          setCandidates(excelData);
          // Set initial department for position counts
          const depts = Array.from(new Set(excelData.map(c => c.department))).sort();
          if (depts.length > 0) setSelectedDeptForPositions(depts[0]);
        }
        if (resData && resData.length > 0) {
          setResignations(resData);
        }
        if (exitData && exitData.length > 0) {
          setExitInterviews(exitData);
        }
        if (mpData && mpData.length > 0) {
          setManpower(mpData);
        }
      } catch (err) {
        console.error('Failed to fetch Excel data:', err);
        setError('Could not load Excel data. Using sample data instead.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const recruitmentDepts = useMemo(() => 
    Array.from(new Set(candidates.map(c => c.department))).sort()
  , [candidates]);

  const positionsByDept = useMemo(() => {
    if (!selectedDeptForPositions) return [];
    const filtered = candidates.filter(c => c.department === selectedDeptForPositions);
    const counts = filtered.reduce((acc, c) => {
      acc[c.position] = (acc[c.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count);
  }, [candidates, selectedDeptForPositions]);

  const totalApplicantsInDept = useMemo(() => {
    return candidates.filter(c => c.department === selectedDeptForPositions).length;
  }, [candidates, selectedDeptForPositions]);

  const availableMonths = useMemo(() => {
    let data: any[] = [];
    if (activeTab === 'recruitment') data = candidates;
    else if (activeTab === 'resignation') data = resignations;
    else if (activeTab === 'exit') data = exitInterviews;
    else if (activeTab === 'manpower') data = manpower;

    const months = Array.from(new Set(data.map(c => c.month)))
      .sort((a, b) => MONTH_ORDER.indexOf(a as string) - MONTH_ORDER.indexOf(b as string));
    return ['All', ...MONTH_ORDER];
  }, [candidates, resignations, exitInterviews, manpower, activeTab]);

  const filteredCandidates = useMemo(() => {
    if (selectedMonth === 'All') return candidates;
    return candidates.filter(c => c.month === selectedMonth);
  }, [candidates, selectedMonth]);

  const stats = useMemo(() => {
    const totalCV = filteredCandidates.length;
    const sentToHOD = filteredCandidates.filter(c => c.sentToHOD).length;
    const firstInterview = filteredCandidates.filter(c => c.firstInterview).length;
    const secondInterview = filteredCandidates.filter(c => c.secondInterview).length;
    const hired = filteredCandidates.filter(c => c.finalStatus === 'Joined').length;
    const rejected = filteredCandidates.filter(c => c.finalStatus === 'Rejected').length;

    return {
      totalCV,
      sentToHOD,
      firstInterview,
      secondInterview,
      hired,
      rejected
    };
  }, [filteredCandidates]);

  const funnelData = useMemo(() => [
    { name: 'CV Received', value: stats.totalCV, color: '#6366f1' },
    { name: 'Sent to HOD', value: stats.sentToHOD, color: '#818cf8' },
    { name: '1st Interview', value: stats.firstInterview, color: '#a5b4fc' },
    { name: '2nd Interview', value: stats.secondInterview, color: '#c7d2fe' },
    { name: 'Joined', value: stats.hired, color: '#10b981' },
  ], [stats]);

  const trendData = useMemo(() => {
    return MONTH_ORDER.map(month => ({
      month,
      cvs: candidates.filter(c => c.month === month).length,
      hires: candidates.filter(c => c.month === month && c.finalStatus === 'Joined').length,
    }));
  }, [candidates]);

  const positionData = useMemo(() => {
    const positions = Array.from(new Set(filteredCandidates.map(c => c.position)));
    return positions.map(pos => ({
      position: pos,
      applicants: filteredCandidates.filter(c => c.position === pos).length,
      hires: filteredCandidates.filter(c => c.position === pos && c.finalStatus === 'Joined').length,
    }));
  }, [filteredCandidates]);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  {activeTab === 'overview' ? 'Executive Overview' :
                   activeTab === 'recruitment' ? 'Recruitment Overview' : 
                   activeTab === 'resignation' ? 'Resignation Analysis' :
                   activeTab === 'exit' ? 'Exit Interview Insights' :
                   'Manpower Tracking'}
                </h2>
                <p className="text-slate-500 mt-1 font-medium">Executive Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end gap-1">
                <label htmlFor="month-filter" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Month</label>
                <select 
                  id="month-filter"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Change Password</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
              <div className="flex flex-col items-end gap-2">
                {loading && (
                  <span className="text-xs text-indigo-600 font-semibold animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                    Syncing with Google Sheets...
                  </span>
                )}
                {error && (
                  <span className="text-xs text-rose-500 font-medium">{error}</span>
                )}
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Updated</p>
                  <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'overview' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('recruitment')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'recruitment' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Recruitment
            </button>
            <button
              onClick={() => setActiveTab('resignation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'resignation' 
                ? 'bg-white text-rose-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Resignation
            </button>
            <button
              onClick={() => setActiveTab('exit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'exit' 
                ? 'bg-white text-amber-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Exit Interview
            </button>
            <button
              onClick={() => setActiveTab('manpower')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'manpower' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Manpower
            </button>
          </div>
        </header>

        {activeTab === 'overview' ? (
          <OverviewDashboard 
            candidates={candidates} 
            resignations={resignations} 
            exitInterviews={exitInterviews} 
            manpower={manpower}
            selectedMonth={selectedMonth}
          />
        ) : activeTab === 'recruitment' ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
              <KpiCard title="Total CV" value={stats.totalCV} icon={Users} color="bg-indigo-500" />
              <KpiCard title="Sent to HOD" value={stats.sentToHOD} icon={Send} color="bg-indigo-400" />
              <KpiCard title="1st Interview" value={stats.firstInterview} icon={MessageSquare} color="bg-indigo-300" />
              <KpiCard title="2nd Interview" value={stats.secondInterview} icon={MessageSquare} color="bg-indigo-200" />
              <KpiCard title="Hired" value={stats.hired} icon={UserPlus} color="bg-emerald-500" />
              <KpiCard title="Rejected" value={stats.rejected} icon={XCircle} color="bg-rose-500" />
            </div>

            {/* Main Funnel Section */}
            <div className="mb-12">
              <HiringFunnel data={funnelData} />
            </div>

            {/* By Department Position Count */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">By Department</h3>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Position breakdown for applicants</p>
                </div>
                <div className="relative">
                  <select
                    value={selectedDeptForPositions}
                    onChange={(e) => setSelectedDeptForPositions(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-100 rounded-xl px-6 py-2.5 pr-12 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    {recruitmentDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Filter className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-[2rem] p-10 border border-slate-100">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                    <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{selectedDeptForPositions}</h4>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Applicants</span>
                    <span className="text-2xl font-black text-indigo-600 tabular-nums">{totalApplicantsInDept}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6 max-h-[600px] overflow-y-auto pr-6 custom-scrollbar">
                  {positionsByDept.map((pos) => (
                    <div key={pos.name} className="flex items-center justify-between py-3 group border-b border-slate-100 last:border-0">
                      <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                        {pos.name}
                      </span>
                      <div className="bg-white border border-slate-200 rounded-xl px-4 py-1.5 shadow-sm min-w-[52px] text-center group-hover:border-indigo-200 group-hover:shadow-indigo-100/50 transition-all">
                        <span className="text-sm font-bold text-slate-900">{pos.count}</span>
                      </div>
                    </div>
                  ))}
                  {positionsByDept.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-400 italic text-sm">
                      No data available for this department
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pivot Table Section */}
            <div className="mb-12 space-y-8">
              <PivotTable2 candidates={filteredCandidates} />
              <PivotTable3 candidates={filteredCandidates} />
            </div>

            {/* Secondary Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <TrendChart data={trendData} />
              {/* <PositionChart data={positionData} /> */}
            </div>

            {/* HOD Analysis Section */}
            {/* <div className="grid grid-cols-1 gap-8">
              <HodSentChart candidates={filteredCandidates} />
            </div> */}
          </>
        ) : activeTab === 'resignation' ? (
          <ResignationDashboard resignations={resignations} externalMonthFilter={selectedMonth} />
        ) : activeTab === 'exit' ? (
          <ExitInterviewDashboard exitInterviews={exitInterviews} externalMonthFilter={selectedMonth} />
        ) : (
          <ManpowerDashboard manpower={manpower} externalMonthFilter={selectedMonth} />
        )}
      </main>

      {showChangePassword && (
        <ChangePassword
          username={user?.username || ''}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}
