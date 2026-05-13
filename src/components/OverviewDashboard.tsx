import React, { useMemo } from 'react';
import { 
  Users, 
  LogOut, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { Candidate, Resignation, ExitInterview, Manpower } from '../data/mockData';

interface OverviewDashboardProps {
  candidates: Candidate[];
  resignations: Resignation[];
  exitInterviews: ExitInterview[];
  manpower: Manpower[];
  selectedMonth: string;
}

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ 
  candidates, 
  resignations, 
  exitInterviews, 
  manpower,
  selectedMonth 
}) => {
  const filteredCandidates = useMemo(() => {
    if (!selectedMonth) return candidates;
    const selectedDate = new Date(selectedMonth);
    const monthAbbrev = selectedDate.toLocaleString('en-US', { month: 'short' });
    return candidates.filter(c => c.month === monthAbbrev);
  }, [candidates, selectedMonth]);

  const filteredResignations = useMemo(() => {
    if (!selectedMonth) return resignations;
    const selectedDate = new Date(selectedMonth);
    const monthAbbrev = selectedDate.toLocaleString('en-US', { month: 'short' });
    return resignations.filter(r => r.month === monthAbbrev);
  }, [resignations, selectedMonth]);

  const filteredManpower = useMemo(() => {
    if (!selectedMonth) return manpower;
    const selectedDate = new Date(selectedMonth);
    const monthAbbrev = selectedDate.toLocaleString('en-US', { month: 'short' });
    return manpower.filter(m => m.month === monthAbbrev);
  }, [manpower, selectedMonth]);

  const stats = useMemo(() => {
    const hired = filteredCandidates.filter(c => c.finalStatus === 'Joined').length;
    const resigned = filteredResignations.length;
    const netChange = hired - resigned;
    
    const totalBudgeted = filteredManpower.reduce((sum, m) => sum + (m.budgeted || 0), 0);
    const totalActual = filteredManpower.reduce((sum, m) => sum + (m.actual || 0), 0);
    const variance = totalActual - totalBudgeted;

    return {
      hired,
      resigned,
      netChange,
      totalBudgeted,
      totalActual,
      variance,
      cvReceived: filteredCandidates.length,
      exitInterviews: filteredResignations.filter(r => exitInterviews.some(e => e.name === r.name)).length
    };
  }, [filteredCandidates, filteredResignations, filteredManpower, exitInterviews]);

  const trendData = useMemo(() => {
    return MONTH_ORDER.map(month => {
      const hired = candidates.filter(c => c.month === month && c.finalStatus === 'Joined').length;
      const resigned = resignations.filter(r => r.month === month).length;
      return {
        month,
        Hired: hired,
        Resigned: resigned,
        Net: hired - resigned
      };
    });
  }, [candidates, resignations]);

  const deptActivityData = useMemo(() => {
    let monthAbbrev = selectedMonth;
    if (selectedMonth) {
      const selectedDate = new Date(selectedMonth);
      monthAbbrev = selectedDate.toLocaleString('en-US', { month: 'short' });
    }

    const depts = Array.from(new Set([
      ...candidates.map(c => c.department),
      ...resignations.map(r => r.department)
    ])).filter(d => d !== 'Unknown');

    return depts.map(dept => ({
      name: dept,
      Hired: candidates.filter(c => c.department === dept && c.finalStatus === 'Joined' && (!selectedMonth || c.month === monthAbbrev)).length,
      Resigned: resignations.filter(r => r.department === dept && (!selectedMonth || r.month === monthAbbrev)).length
    })).sort((a, b) => (b.Hired + b.Resigned) - (a.Hired + a.Resigned)).slice(0, 8);
  }, [candidates, resignations, selectedMonth]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Total Hires" 
          value={stats.hired} 
          icon={<UserPlus className="w-6 h-6 text-emerald-500" />}
          subValue={`${stats.cvReceived} CVs Received`}
          color="emerald"
        />
        <SummaryCard 
          title="Total Resignations" 
          value={stats.resigned} 
          icon={<LogOut className="w-6 h-6 text-rose-500" />}
          subValue={`${stats.exitInterviews} Exit Interviews`}
          color="rose"
        />
        <SummaryCard 
          title="Net Staff Change" 
          value={stats.netChange} 
          icon={stats.netChange >= 0 ? <TrendingUp className="w-6 h-6 text-indigo-500" /> : <TrendingDown className="w-6 h-6 text-amber-500" />}
          subValue={stats.netChange >= 0 ? "Growth" : "Decrease"}
          color={stats.netChange >= 0 ? "indigo" : "amber"}
          isTrend
        />
        <SummaryCard 
          title="Manpower Variance" 
          value={stats.variance} 
          icon={<AlertCircle className="w-6 h-6 text-blue-500" />}
          subValue={`${stats.totalActual} / ${stats.totalBudgeted} Budget`}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hires vs Resignations Trend */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Staff Movement Trend</h3>
              <p className="text-slate-500 text-sm mt-1">Monthly comparison of hires and resignations</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-slate-400">Hired</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full" />
                <span className="text-slate-400">Resigned</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="Hired" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHired)" />
                <Area type="monotone" dataKey="Resigned" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorResigned)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Activity */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Top Active Departments</h3>
          <p className="text-slate-500 text-sm mb-8">Hires and Resignations by Dept</p>
          
          <div className="space-y-6">
            {deptActivityData.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700 truncate max-w-[150px]">{dept.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 font-bold">+{dept.Hired}</span>
                    <span className="text-rose-500 font-bold">-{dept.Resigned}</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${(dept.Hired / (dept.Hired + dept.Resigned || 1)) * 100}%` }} 
                  />
                  <div 
                    className="h-full bg-rose-500 transition-all duration-1000" 
                    style={{ width: `${(dept.Resigned / (dept.Hired + dept.Resigned || 1)) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recruitment Funnel Summary */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800">Recruitment Pipeline</h3>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider">Current Month</span>
          </div>
          <div className="space-y-4">
            <PipelineItem label="CV Received" value={filteredCandidates.length} total={filteredCandidates.length} color="indigo" />
            <PipelineItem label="Sent to HOD" value={filteredCandidates.filter(c => c.sentToHOD).length} total={filteredCandidates.length} color="indigo" />
            <PipelineItem label="Interviews" value={filteredCandidates.filter(c => c.firstInterview || c.secondInterview).length} total={filteredCandidates.length} color="indigo" />
            <PipelineItem label="Hired" value={filteredCandidates.filter(c => c.finalStatus === 'Joined').length} total={filteredCandidates.length} color="emerald" />
          </div>
        </div>

        {/* Manpower Health */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800">Manpower Health</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">Status</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Budgeted</p>
              <p className="text-3xl font-black text-slate-800">{stats.totalBudgeted}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Actual</p>
              <p className="text-3xl font-black text-slate-800">{stats.totalActual}</p>
            </div>
            <div className="col-span-2 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Variance</p>
                <p className={`text-2xl font-black ${stats.variance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {stats.variance > 0 ? `+${stats.variance}` : stats.variance}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.variance < 0 ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
                {stats.variance < 0 ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon, subValue, color, isTrend }: any) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between mb-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-${color}-100 bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      {isTrend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${value >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {value >= 0 ? 'Up' : 'Down'}
        </div>
      )}
    </div>
    <div>
      <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h4>
      <p className="text-4xl font-black text-slate-900 tracking-tight">{value > 0 && isTrend ? `+${value}` : value}</p>
      <p className="text-slate-500 text-sm mt-2 font-medium">{subValue}</p>
    </div>
  </div>
);

const PipelineItem = ({ label, value, total, color }: any) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm font-bold">
      <span className="text-slate-600">{label}</span>
      <span className={`text-${color}-600`}>{value}</span>
    </div>
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={`h-full bg-${color}-500 transition-all duration-1000`} 
        style={{ width: `${(value / (total || 1)) * 100}%` }} 
      />
    </div>
  </div>
);
