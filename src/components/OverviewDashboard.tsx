import React, { useMemo } from 'react';
import {
  LogOut,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Users,
  Building2,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Candidate, Resignation, ExitInterview, Manpower, EmployeeRecord } from '../data/mockData';
import { MONTH_ORDER } from '../utils/dateUtils';
import {
  OperationalShell,
  OperationalHeader,
  OperationalSection,
  OperationalOwnership,
  OperationalTableWrap,
  OperationalTable,
  OperationalThead,
  OperationalTh,
  OperationalAlert,
} from './OperationalLayout';

interface OverviewDashboardProps {
  candidates: Candidate[];
  allCandidates: Candidate[];
  resignations: Resignation[];
  allResignations: Resignation[];
  exitInterviews: ExitInterview[];
  manpower: Manpower[];
  employees: EmployeeRecord[];
  selectedMonth: string;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  candidates,
  allCandidates,
  resignations,
  allResignations,
  exitInterviews,
  manpower,
  employees,
  selectedMonth,
}) => {
  const periodLabel = selectedMonth === 'All' ? 'All months' : selectedMonth;

  const stats = useMemo(() => {
    const hired = candidates.filter(c => c.finalStatus === 'Joined').length;
    const resigned = resignations.length;
    const totalBudgeted = manpower.reduce((sum, m) => sum + (m.budgeted || 0), 0);
    const totalActual = employees.length > 0
      ? employees.length
      : manpower.reduce((sum, m) => sum + (m.actual || 0), 0);
    const hasBudgetData = totalBudgeted > 0;
    const turnoverRate = totalActual > 0 ? (resigned / totalActual) * 100 : 0;

    return {
      hired,
      resigned,
      netChange: hired - resigned,
      totalActual,
      hasBudgetData,
      turnoverRate,
      cvReceived: candidates.length,
      exitInterviewCount: exitInterviews.length,
      inPipeline: candidates.filter(c => c.finalStatus === 'In Progress').length,
    };
  }, [candidates, resignations, exitInterviews, manpower, employees]);

  const trendData = useMemo(() =>
    MONTH_ORDER.map(month => ({
      month,
      Hired: allCandidates.filter(c => c.month === month && c.finalStatus === 'Joined').length,
      Resigned: allResignations.filter(r => r.month === month).length,
    })),
  [allCandidates, allResignations]);

  const deptActivityData = useMemo(() => {
    const depts = Array.from(new Set([
      ...candidates.map(c => c.department),
      ...resignations.map(r => r.department),
    ])).filter(d => d !== 'Unknown');

    return depts.map(dept => {
      const hired = candidates.filter(c => c.department === dept && c.finalStatus === 'Joined').length;
      const resigned = resignations.filter(r => r.department === dept).length;
      const total = hired + resigned;
      return {
        department: dept,
        hired,
        resigned,
        net: hired - resigned,
        pct: total > 0 ? (resigned / total) * 100 : 0,
      };
    }).sort((a, b) => (b.hired + b.resigned) - (a.hired + a.resigned)).slice(0, 10);
  }, [candidates, resignations]);

  const pipelineRows = useMemo(() => {
    const total = candidates.length || 1;
    return [
      { stage: 'CV Received', count: candidates.length },
      { stage: 'Sent to HOD', count: candidates.filter(c => c.sentToHOD).length },
      { stage: 'Interviews', count: candidates.filter(c => c.firstInterview || c.secondInterview).length },
      { stage: 'Hired', count: candidates.filter(c => c.finalStatus === 'Joined').length },
    ].map(r => ({ ...r, pct: (r.count / total) * 100 }));
  }, [candidates]);

  return (
    <OperationalShell>
      <OperationalHeader
        eyebrow="HR Operations"
        title="Overview Dashboard"
        subtitle={`${periodLabel} · ${stats.totalActual} staff · live data`}
        gradient="indigo"
        metrics={[
          { value: stats.hired, label: 'Hired', accentClass: 'text-emerald-300' },
          { value: stats.resigned, label: 'Resigned', accentClass: 'text-rose-300' },
          { value: stats.netChange >= 0 ? `+${stats.netChange}` : stats.netChange, label: 'Net Change' },
          { value: `${stats.turnoverRate.toFixed(1)}%`, label: 'Turnover' },
        ]}
        alert={
          !stats.hasBudgetData ? (
            <OperationalAlert tone="amber">
              <span className="text-sm font-bold">Approved headcount budget not loaded — variance hidden until budget data is connected.</span>
            </OperationalAlert>
          ) : undefined
        }
      />

      <OperationalSection title="Staff Movement Summary" subtitle={`Period: ${periodLabel}`}>
        <OperationalTableWrap>
          <OperationalTable>
            <OperationalThead>
              <OperationalTh>Metric</OperationalTh>
              <OperationalTh align="right">Count</OperationalTh>
              <OperationalTh align="right">Notes</OperationalTh>
            </OperationalThead>
            <tbody>
              <tr className="border-t border-slate-100"><td className="px-4 py-3 text-sm font-bold text-slate-800">Hires</td><td className="px-4 py-3 text-sm font-black text-right tabular-nums text-emerald-600">{stats.hired}</td><td className="px-4 py-3 text-xs text-slate-500 text-right">{stats.cvReceived} CVs received</td></tr>
              <tr className="border-t border-slate-100"><td className="px-4 py-3 text-sm font-bold text-slate-800">Resignations</td><td className="px-4 py-3 text-sm font-black text-right tabular-nums text-rose-600">{stats.resigned}</td><td className="px-4 py-3 text-xs text-slate-500 text-right">{stats.exitInterviewCount} exit interviews</td></tr>
              <tr className="border-t border-slate-100"><td className="px-4 py-3 text-sm font-bold text-slate-800">Net Change</td><td className="px-4 py-3 text-sm font-black text-right tabular-nums">{stats.netChange >= 0 ? `+${stats.netChange}` : stats.netChange}</td><td className="px-4 py-3 text-xs text-slate-500 text-right">{stats.inPipeline} in pipeline</td></tr>
              <tr className="border-t border-slate-100"><td className="px-4 py-3 text-sm font-bold text-slate-800">Headcount</td><td className="px-4 py-3 text-sm font-black text-right tabular-nums">{stats.totalActual}</td><td className="px-4 py-3 text-xs text-slate-500 text-right">{stats.hasBudgetData ? 'Budget connected' : 'Actual only'}</td></tr>
            </tbody>
          </OperationalTable>
        </OperationalTableWrap>
      </OperationalSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OperationalSection title="Staff Movement Trend" subtitle="Full-year hires vs resignations">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="Hired" stroke="#10b981" strokeWidth={2} fill="#10b98120" />
                <Area type="monotone" dataKey="Resigned" stroke="#f43f5e" strokeWidth={2} fill="#f43f5e20" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </OperationalSection>

        <OperationalSection title="Recruitment Pipeline" subtitle={`${periodLabel} · Stage | Count | %`}>
          <OperationalTableWrap>
            <OperationalTable>
              <OperationalThead>
                <OperationalTh>Stage</OperationalTh>
                <OperationalTh align="right">Count</OperationalTh>
                <OperationalTh align="right">%</OperationalTh>
              </OperationalThead>
              <tbody>
                {pipelineRows.map(row => (
                  <tr key={row.stage} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 text-sm font-semibold text-slate-700">{row.stage}</td>
                    <td className="px-4 py-2.5 text-sm font-black text-right tabular-nums">{row.count}</td>
                    <td className="px-4 py-2.5 text-sm font-bold text-right tabular-nums text-slate-500">{row.pct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </OperationalTable>
          </OperationalTableWrap>
        </OperationalSection>
      </div>

      <OperationalSection title="Department Activity" subtitle="Hires vs resignations by department">
        <OperationalTableWrap>
          <OperationalTable>
            <OperationalThead>
              <OperationalTh>Department</OperationalTh>
              <OperationalTh align="right">Hired</OperationalTh>
              <OperationalTh align="right">Resigned</OperationalTh>
              <OperationalTh align="right">Net</OperationalTh>
            </OperationalThead>
            <tbody>
              {deptActivityData.map(row => (
                <tr key={row.department} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.department}</td>
                  <td className="px-4 py-3 text-sm font-black text-right tabular-nums text-emerald-600">+{row.hired}</td>
                  <td className="px-4 py-3 text-sm font-black text-right tabular-nums text-rose-600">-{row.resigned}</td>
                  <td className={`px-4 py-3 text-sm font-black text-right tabular-nums ${row.net >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                    {row.net >= 0 ? `+${row.net}` : row.net}
                  </td>
                </tr>
              ))}
            </tbody>
          </OperationalTable>
        </OperationalTableWrap>
      </OperationalSection>

      <OperationalOwnership items={[
        { icon: Users, label: 'Primary', value: 'HR Operations' },
        { icon: Building2, label: 'Oversight', value: 'HR GM' },
        { icon: UserPlus, label: 'Period', value: periodLabel },
      ]} />
    </OperationalShell>
  );
};
