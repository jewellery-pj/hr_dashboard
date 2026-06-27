import React, { useMemo, useState, useEffect } from 'react';
import { Filter, Send, UserCog, Briefcase } from 'lucide-react';
import { Candidate } from '../data/mockData';
import { MONTH_ORDER } from '../utils/dateUtils';
import { HiringFunnel } from './HiringFunnel';
import { TrendChart } from './TrendChart';
import { PivotTable2 } from './PivotTable2';
import { PivotTable3 } from './PivotTable3';
import {
  OperationalShell,
  OperationalHeader,
  OperationalSection,
  OperationalOwnership,
  FilterField,
  filterSelectClass,
  OperationalTableWrap,
  OperationalTable,
  OperationalThead,
  OperationalTh,
} from './OperationalLayout';

interface RecruitmentDashboardProps {
  candidates: Candidate[];
  allCandidates: Candidate[];
  selectedMonth: string;
}

export const RecruitmentDashboard: React.FC<RecruitmentDashboardProps> = ({
  candidates,
  allCandidates,
  selectedMonth,
}) => {
  const [selectedDept, setSelectedDept] = useState('');

  const periodLabel = selectedMonth === 'All' ? 'All months' : selectedMonth;

  const stats = useMemo(() => ({
    totalCV: candidates.length,
    sentToHOD: candidates.filter(c => c.sentToHOD).length,
    firstInterview: candidates.filter(c => c.firstInterview).length,
    secondInterview: candidates.filter(c => c.secondInterview).length,
    hired: candidates.filter(c => c.finalStatus === 'Joined').length,
    rejected: candidates.filter(c => c.finalStatus === 'Rejected').length,
  }), [candidates]);

  const funnelData = useMemo(() => [
    { name: 'CV Received', value: stats.totalCV, color: '#6366f1' },
    { name: 'Sent to HOD', value: stats.sentToHOD, color: '#818cf8' },
    { name: '1st Interview', value: stats.firstInterview, color: '#a5b4fc' },
    { name: '2nd Interview', value: stats.secondInterview, color: '#c7d2fe' },
    { name: 'Joined', value: stats.hired, color: '#10b981' },
  ], [stats]);

  const trendData = useMemo(() =>
    MONTH_ORDER.map(month => ({
      month,
      cvs: allCandidates.filter(c => c.month === month).length,
      hires: allCandidates.filter(c => c.month === month && c.finalStatus === 'Joined').length,
    })),
  [allCandidates]);

  const departments = useMemo(() =>
    Array.from(new Set(candidates.map(c => c.department))).sort(),
  [candidates]);

  useEffect(() => {
    if (departments.length > 0 && !selectedDept) setSelectedDept(departments[0]);
  }, [departments, selectedDept]);

  const positionsByDept = useMemo(() => {
    if (!selectedDept) return [];
    const counts = candidates
      .filter(c => c.department === selectedDept)
      .reduce((acc, c) => {
        acc[c.position] = (acc[c.position] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => Number(b.count) - Number(a.count));
  }, [candidates, selectedDept]);

  const totalInDept = useMemo(() =>
    candidates.filter(c => c.department === selectedDept).length,
  [candidates, selectedDept]);

  const pipelineRows = useMemo(() => [
    { stage: 'CV Received', count: stats.totalCV, pct: 100 },
    { stage: 'Sent to HOD', count: stats.sentToHOD, pct: stats.totalCV ? (stats.sentToHOD / stats.totalCV) * 100 : 0 },
    { stage: '1st Interview', count: stats.firstInterview, pct: stats.totalCV ? (stats.firstInterview / stats.totalCV) * 100 : 0 },
    { stage: '2nd Interview', count: stats.secondInterview, pct: stats.totalCV ? (stats.secondInterview / stats.totalCV) * 100 : 0 },
    { stage: 'Joined', count: stats.hired, pct: stats.totalCV ? (stats.hired / stats.totalCV) * 100 : 0 },
    { stage: 'Rejected', count: stats.rejected, pct: stats.totalCV ? (stats.rejected / stats.totalCV) * 100 : 0 },
  ], [stats]);

  const conversionRate = stats.totalCV > 0 ? ((stats.hired / stats.totalCV) * 100).toFixed(0) : '0';

  return (
    <OperationalShell>
      <OperationalHeader
        eyebrow="Hiring Pipeline"
        title="Recruitment Dashboard"
        subtitle={`${stats.totalCV} applicants · ${periodLabel} · live data`}
        gradient="indigo"
        metrics={[
          { value: stats.totalCV, label: 'Total CV' },
          { value: stats.hired, label: 'Hired', accentClass: 'text-emerald-300' },
          { value: `${conversionRate}%`, label: 'Conversion' },
          { value: stats.rejected, label: 'Rejected', accentClass: 'text-rose-300' },
        ]}
      />

      <OperationalSection title="Recruitment Pipeline Summary" subtitle="Stage | Count | % of CVs">
        <OperationalTableWrap>
          <OperationalTable>
            <OperationalThead>
              <OperationalTh>Stage</OperationalTh>
              <OperationalTh align="right">Count</OperationalTh>
              <OperationalTh align="right">%</OperationalTh>
            </OperationalThead>
            <tbody>
              {pipelineRows.map(row => (
                <tr key={row.stage} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.stage}</td>
                  <td className="px-4 py-3 text-sm font-black text-slate-900 text-right tabular-nums">{row.count}</td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-600 text-right tabular-nums">{row.pct.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </OperationalTable>
        </OperationalTableWrap>
      </OperationalSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OperationalSection title="Hiring Funnel" subtitle="Visual stage breakdown">
          <HiringFunnel data={funnelData} embedded />
        </OperationalSection>
        <OperationalSection title="Monthly Trend" subtitle="Full-year CVs vs hires">
          <TrendChart data={trendData} embedded />
        </OperationalSection>
      </div>

      <OperationalSection
        title="Applicants by Department"
        subtitle={`Position breakdown · ${selectedDept || '—'}`}
        headerAction={
          <div className="relative">
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className={`${filterSelectClass} pr-9 font-semibold text-indigo-600 min-w-[160px]`}
            >
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <Filter className="w-3.5 h-3.5 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        }
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-700">{selectedDept}</span>
          <span className="text-sm font-black text-indigo-600 tabular-nums">{totalInDept} applicants</span>
        </div>
        {positionsByDept.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No applicants in this department</p>
        ) : (
          <OperationalTableWrap>
            <OperationalTable>
              <OperationalThead>
                <OperationalTh>Position</OperationalTh>
                <OperationalTh align="right">Count</OperationalTh>
              </OperationalThead>
              <tbody>
                {positionsByDept.map(row => (
                  <tr key={row.name} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{row.name}</td>
                    <td className="px-4 py-3 text-sm font-black text-slate-900 text-right tabular-nums">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </OperationalTable>
          </OperationalTableWrap>
        )}
      </OperationalSection>

      <div className="space-y-6">
        <PivotTable2 candidates={candidates} />
        <PivotTable3 candidates={candidates} />
      </div>

      <OperationalOwnership items={[
        { icon: Send, label: 'Primary', value: 'Recruitment Team' },
        { icon: UserCog, label: 'Co-Owner', value: 'Department HODs' },
        { icon: Briefcase, label: 'Source', value: 'Live recruitment sheet' },
      ]} />
    </OperationalShell>
  );
};
