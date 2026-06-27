import React, { useMemo, useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  LogOut, 
  Users, 
  MessageSquare, 
  Filter,
  Settings,
  AlertTriangle,
  Store,
  Briefcase,
  UserCog,
  Calculator,
  Crown
} from 'lucide-react';
import { Candidate, mockCandidates, Resignation, mockResignations, ExitInterview, mockExitInterviews, Manpower, mockManpower, JobNetData, mockJobNetData, EmployeeRecord } from './data/mockData';
import { RecruitmentDashboard } from './components/RecruitmentDashboard';
import { ResignationDashboard } from './components/ResignationDashboard';
import { ExitInterviewDashboard } from './components/ExitInterviewDashboard';
import { ManpowerDashboard } from './components/ManpowerDashboard';
import { OverviewDashboard } from './components/OverviewDashboard';
import { JobNetDashboard } from './components/JobNetDashboard';
import { ChairmanSummary } from './components/ChairmanSummary';
import { RiskAlertCenter } from './components/RiskAlertCenter';
import { BranchScorecard } from './components/BranchScorecard';
import { DeptScorecard } from './components/DeptScorecard';
import { ManagerScorecard } from './components/ManagerScorecard';
import { ManpowerPlanning } from './components/ManpowerPlanning';
import { TalentSuccession } from './components/TalentSuccession';
import { ExitAnalytics } from './components/ExitAnalytics';
import { fetchExcelData, fetchResignationData, fetchExitInterviewData, fetchManpowerData, fetchJobNetData, fetchEmployeeData } from './services/excelService';
import { extractMonthFromDate } from './utils/dateUtils';
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
  const [jobNetData, setJobNetData] = useState<JobNetData[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'chairman' | 'riskalerts' | 'branch' | 'dept' | 'manager' | 'planning' | 'talent' | 'exitanalytics' | 'overview' | 'recruitment' | 'resignation' | 'exit' | 'manpower' | 'jobnet'>('chairman');
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [excelData, resData, exitData, mpData, jnData, empData] = await Promise.all([
          fetchExcelData(),
          fetchResignationData(),
          fetchExitInterviewData(),
          fetchManpowerData(),
          fetchJobNetData(),
          fetchEmployeeData()
        ]);

        if (excelData && excelData.length > 0) {
          setCandidates(excelData);
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
        if (jnData && jnData.length > 0) {
          setJobNetData(jnData);
        } else {
          // Use mock data directly as fallback
          console.log('Using mockJobNetData directly');
          setJobNetData(mockJobNetData);
        }
        if (empData && empData.length > 0) {
          setEmployees(empData);
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

  const availableMonths = useMemo(() => {
    let data: { month?: string }[] = [];
    if (activeTab === 'recruitment' || activeTab === 'overview') data = candidates;
    else if (activeTab === 'resignation') data = resignations;
    else if (activeTab === 'exit' || activeTab === 'exitanalytics') data = exitInterviews;
    else if (activeTab === 'manpower') data = manpower;
    else if (activeTab === 'jobnet') {
      data = jobNetData.map(j => ({ month: extractMonthFromDate(j.cvReceivedDate) || undefined }));
    }

    const months = Array.from(
      new Set(
        data
          .map(c => c.month)
          .filter((m): m is string => !!m && m !== 'Unknown' && m !== 'All' && MONTH_ORDER.includes(m))
      )
    ).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));

    return ['All', ...(months.length > 0 ? months : MONTH_ORDER)];
  }, [candidates, resignations, exitInterviews, manpower, jobNetData, activeTab]);

  const filteredCandidates = useMemo(() => {
    if (selectedMonth === 'All') return candidates;
    return candidates.filter(c => c.month === selectedMonth);
  }, [candidates, selectedMonth]);

  const filteredResignations = useMemo(() => {
    if (selectedMonth === 'All') return resignations;
    return resignations.filter(r => r.month === selectedMonth);
  }, [resignations, selectedMonth]);

  const filteredExitInterviews = useMemo(() => {
    if (selectedMonth === 'All') return exitInterviews;
    return exitInterviews.filter(e => e.month === selectedMonth);
  }, [exitInterviews, selectedMonth]);

  const filteredManpower = useMemo(() => {
    // Employee headcount is a point-in-time snapshot — not filtered by month
    return manpower;
  }, [manpower]);

  const filteredJobNetData = useMemo(() => {
    if (selectedMonth === 'All') return jobNetData;
    return jobNetData.filter(j => extractMonthFromDate(j.cvReceivedDate) === selectedMonth);
  }, [jobNetData, selectedMonth]);

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
                  {activeTab === 'chairman' ? 'Chairman Summary 2.0' :
                   activeTab === 'riskalerts' ? 'HR Risk Alert Center' :
                   activeTab === 'branch' ? 'Branch Performance Scorecard' :
                   activeTab === 'dept' ? 'Department Performance Scorecard' :
                   activeTab === 'manager' ? 'Manager Leadership Scorecard' :
                   activeTab === 'planning' ? 'Manpower Planning Dashboard' :
                   activeTab === 'talent' ? 'Talent & Succession Dashboard' :
                   activeTab === 'exitanalytics' ? 'Exit Interview Analytics' :
                   activeTab === 'overview' ? 'Executive Overview' :
                   activeTab === 'recruitment' ? 'Recruitment Overview' :
                   activeTab === 'resignation' ? 'Resignation Analysis' :
                   activeTab === 'exit' ? 'HR Executive Exit 2.0' :
                   activeTab === 'manpower' ? 'Manpower Tracking' :
                   'Job Net'}
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
              onClick={() => setActiveTab('chairman')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'chairman'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Chairman Summary
            </button>
            <button
              onClick={() => setActiveTab('riskalerts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'riskalerts'
                ? 'bg-white text-rose-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Risk Alerts
            </button>
            <button
              onClick={() => setActiveTab('branch')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'branch'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Store className="w-4 h-4" />
              Branch Scorecard
            </button>
            <button
              onClick={() => setActiveTab('dept')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'dept'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Dept Scorecard
            </button>
            <button
              onClick={() => setActiveTab('manager')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'manager'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCog className="w-4 h-4" />
              Manager Scorecard
            </button>
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'planning'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Manpower Planning
            </button>
            <button
              onClick={() => setActiveTab('talent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'talent'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Crown className="w-4 h-4" />
              Talent & Succession
            </button>
            <button
              onClick={() => setActiveTab('exitanalytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'exitanalytics'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Exit Analytics
            </button>
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
              Exit 2.0
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
            <button
              onClick={() => setActiveTab('jobnet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'jobnet'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Job Net
            </button>
          </div>
        </header>

        {activeTab === 'chairman' ? (
          <ChairmanSummary
            candidates={filteredCandidates}
            resignations={filteredResignations}
            manpower={filteredManpower}
            employees={employees}
            selectedMonth={selectedMonth}
            onNavigate={tab => setActiveTab(tab as typeof activeTab)}
          />
        ) : activeTab === 'riskalerts' ? (
          <RiskAlertCenter candidates={filteredCandidates} resignations={filteredResignations} manpower={filteredManpower} />
        ) : activeTab === 'branch' ? (
          <BranchScorecard resignations={filteredResignations} manpower={filteredManpower} employees={employees} candidates={filteredCandidates} />
        ) : activeTab === 'dept' ? (
          <DeptScorecard resignations={filteredResignations} manpower={filteredManpower} employees={employees} candidates={filteredCandidates} />
        ) : activeTab === 'manager' ? (
          <ManagerScorecard resignations={filteredResignations} manpower={filteredManpower} employees={employees} candidates={filteredCandidates} />
        ) : activeTab === 'planning' ? (
          <ManpowerPlanning manpower={filteredManpower} employees={employees} candidates={filteredCandidates} />
        ) : activeTab === 'talent' ? (
          <TalentSuccession employees={employees} manpower={filteredManpower} />
        ) : activeTab === 'exitanalytics' ? (
          <ExitAnalytics exitInterviews={filteredExitInterviews} />
        ) : activeTab === 'overview' ? (
          <OverviewDashboard 
            candidates={filteredCandidates}
            allCandidates={candidates}
            resignations={filteredResignations}
            allResignations={resignations}
            exitInterviews={filteredExitInterviews}
            manpower={manpower}
            employees={employees}
            selectedMonth={selectedMonth}
          />
        ) : activeTab === 'recruitment' ? (
          <RecruitmentDashboard
            candidates={filteredCandidates}
            allCandidates={candidates}
            selectedMonth={selectedMonth}
          />
        ) : activeTab === 'resignation' ? (
          <ResignationDashboard resignations={filteredResignations} externalMonthFilter={selectedMonth} />
        ) : activeTab === 'exit' ? (
          <ExitInterviewDashboard exitInterviews={filteredExitInterviews} externalMonthFilter={selectedMonth} />
        ) : activeTab === 'manpower' ? (
          <ManpowerDashboard manpower={manpower} employees={employees} externalMonthFilter={selectedMonth} />
        ) : (
          <JobNetDashboard jobNetData={filteredJobNetData} externalMonthFilter={selectedMonth} />
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
