import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Factory,
  TrendingUp,
  Shield,
  Clock,
  Users,
  ArrowRight,
  UserCog,
  Calendar,
  Siren,
  Bell,
  Store,
  CheckCircle2,
  ChevronUp,
  Building2,
} from 'lucide-react';
import { Candidate, Resignation, Manpower } from '../data/mockData';

interface RiskAlertCenterProps {
  candidates: Candidate[];
  resignations: Resignation[];
  manpower: Manpower[];
}

type Severity = 'critical' | 'high' | 'moderate';
type RecoveryStatus = 'overdue' | 'in-progress' | 'pending';

interface RiskAlert {
  id: string;
  icon: React.ElementType;
  message: string;
  department: string;
  metric: string;
  value: string;
  severity: Severity;
  responsibleManager: string;
  dueDate: string;
  recoveryStatus: RecoveryStatus;
  recoveryAction: string;
}

function getRecoveryStatus(daysOpen: number): RecoveryStatus {
  if (daysOpen > 30) return 'overdue';
  if (daysOpen > 7) return 'in-progress';
  return 'pending';
}

export const RiskAlertCenter: React.FC<RiskAlertCenterProps> = ({ candidates, resignations, manpower }) => {
  const alerts = useMemo<RiskAlert[]>(() => {
    const result: RiskAlert[] = [];

    // 1. Department vacancy alerts from manpower data
    const deptVacancy = manpower.reduce((acc, m) => {
      const dept = m.department;
      const vacant = Math.max(0, (m.budgeted || 0) - (m.actual || 0));
      if (!acc[dept]) acc[dept] = { total: 0, vacant: 0, actual: 0 };
      acc[dept].total += m.budgeted || 0;
      acc[dept].vacant += vacant;
      acc[dept].actual += m.actual || 0;
      return acc;
    }, {} as Record<string, { total: number; vacant: number; actual: number }>);

    for (const [dept, data] of Object.entries(deptVacancy) as [string, { total: number; vacant: number; actual: number }][]) {
      if (data.vacant >= 5) {
        const severity: Severity = data.vacant >= 15 ? 'critical' : data.vacant >= 8 ? 'high' : 'moderate';
        result.push({
          id: `ALT-VAC-${dept}`,
          icon: Factory,
          message: `${dept} လူလိုအပ်မှု ${data.vacant} ယောက်`,
          department: dept,
          metric: 'Staff Shortage',
          value: `${data.vacant} positions`,
          severity,
          responsibleManager: `${dept} Manager`,
          dueDate: severity === 'critical' ? '7 Days' : '14 Days',
          recoveryStatus: getRecoveryStatus(data.vacant * 2),
          recoveryAction: `Fast-track recruitment for ${data.vacant} vacant positions in ${dept}. Current: ${data.actual}/${data.total} budgeted.`,
        });
      }
    }

    // 2. Department turnover alerts from resignation data
    const deptResignations = resignations.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const deptStaffCount = manpower.reduce((acc, m) => {
      acc[m.department] = (acc[m.department] || 0) + (m.actual || 0);
      return acc;
    }, {} as Record<string, number>);

    for (const [dept, resCount] of Object.entries(deptResignations) as [string, number][]) {
      const staff = deptStaffCount[dept] || 0;
      const turnoverRate = staff > 0 ? (resCount / staff) * 100 : 0;
      if (turnoverRate >= 15) {
        const severity: Severity = turnoverRate >= 25 ? 'critical' : 'high';
        result.push({
          id: `ALT-TUR-${dept}`,
          icon: TrendingUp,
          message: `${dept} Turnover Rate ${turnoverRate.toFixed(0)}%`,
          department: dept,
          metric: 'Turnover Rate',
          value: `${turnoverRate.toFixed(1)}%`,
          severity,
          responsibleManager: `${dept} Head`,
          dueDate: '7 Days',
          recoveryStatus: getRecoveryStatus(resCount * 5),
          recoveryAction: `Root cause review for ${resCount} resignations in ${dept}. Corrective action plan required within 7 days.`,
        });
      }
    }

    // 3. Security-specific resignation trend
    const securityResignations = resignations.filter(r =>
      r.department.toLowerCase().includes('security')
    );
    if (securityResignations.length >= 3) {
      result.push({
        id: 'ALT-SEC-TREND',
        icon: Shield,
        message: 'Security Resignation Trend Increasing',
        department: 'Security',
        metric: 'Resignation Trend',
        value: `${securityResignations.length} resignations`,
        severity: 'high',
        responsibleManager: 'Security Manager',
        dueDate: '14 Days',
        recoveryStatus: getRecoveryStatus(securityResignations.length * 4),
        recoveryAction: `Exit interview data analysis for ${securityResignations.length} security resignations. Shift rotation and retention bonus under review.`,
      });
    }

    // 4. Recruitment backlog — candidates stuck in pipeline
    const backlog = candidates.filter(c => c.finalStatus === 'In Progress').length;
    if (backlog >= 10) {
      result.push({
        id: 'ALT-RECRUIT-BACKLOG',
        icon: Users,
        message: `Recruitment Backlog ${backlog} Candidates`,
        department: 'Recruitment',
        metric: 'Backlog Volume',
        value: `${backlog} candidates`,
        severity: backlog >= 20 ? 'high' : 'moderate',
        responsibleManager: 'Recruitment Manager',
        dueDate: 'Weekly',
        recoveryStatus: 'in-progress',
        recoveryAction: `Weekly Progress Report for ${backlog} candidates in pipeline. Triage by priority and expedite final interviews.`,
      });
    }

    // 5. Long-vacant positions (budgeted but no actual for extended period)
    const longVacantDepts = (Object.entries(deptVacancy) as [string, { total: number; vacant: number; actual: number }][]).filter(([, d]) => {
      const vacancyRate = d.total > 0 ? (d.vacant / d.total) * 100 : 0;
      return vacancyRate >= 20 && d.vacant >= 3;
    });
    for (const [dept, data] of longVacantDepts as [string, { total: number; vacant: number; actual: number }][]) {
      const vacancyRate = data.total > 0 ? (data.vacant / data.total) * 100 : 0;
      result.push({
        id: `ALT-LONG-VAC-${dept}`,
        icon: Clock,
        message: `${dept} Critical Vacancy ${vacancyRate.toFixed(0)}%`,
        department: dept,
        metric: 'Vacancy Duration',
        value: `${data.vacant} vacant (${vacancyRate.toFixed(0)}%)`,
        severity: 'critical',
        responsibleManager: 'HR GM',
        dueDate: 'Immediate',
        recoveryStatus: 'overdue',
        recoveryAction: `ESCALATION: ${dept} has ${data.vacant} vacant positions (${vacancyRate.toFixed(0)}% vacancy rate). Chairman review required for positions vacant beyond threshold.`,
      });
    }

    // Sort: critical first, then high, then moderate
    const severityOrder: Record<Severity, number> = { critical: 0, high: 1, moderate: 2 };
    return result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [candidates, resignations, manpower]);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;
  const overdueCount = alerts.filter(a => a.recoveryStatus === 'overdue').length;
  const inProgressCount = alerts.filter(a => a.recoveryStatus === 'in-progress').length;

  const severityConfig: Record<Severity, { label: string; badge: string; border: string; bg: string; iconBg: string }> = {
    critical: { label: 'Critical', badge: 'bg-rose-100 text-rose-700 border-rose-300', border: 'border-rose-300', bg: 'bg-rose-50/40', iconBg: 'bg-rose-500 text-white' },
    high: { label: 'High Risk', badge: 'bg-amber-100 text-amber-700 border-amber-300', border: 'border-amber-300', bg: 'bg-amber-50/40', iconBg: 'bg-amber-500 text-white' },
    moderate: { label: 'Moderate', badge: 'bg-blue-100 text-blue-700 border-blue-300', border: 'border-blue-300', bg: 'bg-blue-50/40', iconBg: 'bg-blue-500 text-white' },
  };

  const recoveryStatusConfig: Record<RecoveryStatus, { label: string; badge: string; dot: string }> = {
    overdue: { label: 'Overdue', badge: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500' },
    'in-progress': { label: 'In Progress', badge: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-500' },
    pending: { label: 'Pending', badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  };

  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const alertDetailData = useMemo(() => {
    const deptStaffMap = manpower.reduce((acc, m) => {
      const dept = m.department;
      if (!acc[dept]) acc[dept] = { actual: 0, budgeted: 0 };
      acc[dept].actual += m.actual || 0;
      acc[dept].budgeted += m.budgeted || 0;
      return acc;
    }, {} as Record<string, { actual: number; budgeted: number }>);

    const deptResMap = resignations.reduce((acc, r) => {
      acc[r.department] = (acc[r.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { deptStaffMap, deptResMap };
  }, [manpower, resignations]);

  const renderAlertDetail = (alert: RiskAlert) => {
    if (alert.metric === 'Staff Shortage' || alert.metric === 'Vacancy Duration') {
      const deptData = alertDetailData.deptStaffMap[alert.department];
      if (!deptData) return null;
      const vacant = Math.max(0, deptData.budgeted - deptData.actual);
      const vacancyRate = deptData.budgeted > 0 ? (vacant / deptData.budgeted) * 100 : 0;
      const positions = manpower.filter(m => m.department === alert.department && (m.budgeted || 0) > (m.actual || 0));
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Budgeted</p><p className="text-xl font-black text-slate-900 tabular-nums">{deptData.budgeted}</p></div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Actual</p><p className="text-xl font-black text-slate-900 tabular-nums">{deptData.actual}</p></div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Vacant</p><p className="text-xl font-black text-rose-600 tabular-nums">{vacant}</p></div>
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100"><p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Vacancy %</p><p className="text-xl font-black text-rose-600 tabular-nums">{vacancyRate.toFixed(1)}%</p></div>
          </div>
          {positions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budgeted</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacant</th>
                </tr></thead>
                <tbody>
                  {positions.map((p, i) => (
                    <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm font-bold text-slate-700">{p.position}</span></div></td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{p.budgeted}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">{p.actual}</td>
                      <td className="px-4 py-3 text-right text-sm font-black text-rose-600 tabular-nums">{Math.max(0, p.budgeted - p.actual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    if (alert.metric === 'Turnover Rate' || alert.metric === 'Resignation Trend') {
      const deptRes = resignations.filter(r =>
        alert.metric === 'Resignation Trend'
          ? r.department.toLowerCase().includes('security')
          : r.department === alert.department
      );
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Resignations</p><p className="text-xl font-black text-rose-600 tabular-nums">{deptRes.length}</p></div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p><p className="text-lg font-black text-slate-900">{alert.department}</p></div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rate</p><p className="text-xl font-black text-rose-600 tabular-nums">{alert.value}</p></div>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0"><tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason</th>
              </tr></thead>
              <tbody>
                {deptRes.slice(0, 50).map((r, i) => (
                  <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-bold text-rose-600">{r.name.charAt(0)}</div><span className="text-sm font-bold text-slate-700">{r.name}</span></div></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.position || r.designation || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500"><div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" />{r.resignationDate}</div></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deptRes.length > 50 && <p className="text-xs text-slate-400 text-center py-3">Showing 50 of {deptRes.length}</p>}
          </div>
        </div>
      );
    }

    if (alert.metric === 'Backlog Volume') {
      const backlog = candidates.filter(c => c.finalStatus === 'In Progress');
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Backlog</p><p className="text-xl font-black text-amber-600 tabular-nums">{backlog.length}</p></div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sent to HOD</p><p className="text-xl font-black text-slate-900 tabular-nums">{backlog.filter(c => c.sentToHOD).length}</p></div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">1st Interview</p><p className="text-xl font-black text-slate-900 tabular-nums">{backlog.filter(c => c.firstInterview).length}</p></div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">2nd Interview</p><p className="text-xl font-black text-slate-900 tabular-nums">{backlog.filter(c => c.secondInterview).length}</p></div>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0"><tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">HOD</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">1st Int</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">2nd Int</th>
              </tr></thead>
              <tbody>
                {backlog.slice(0, 50).map((c, i) => (
                  <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">{c.name.charAt(0)}</div><span className="text-sm font-bold text-slate-700">{c.name}</span></div></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.department}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.position}</td>
                    <td className="px-4 py-3 text-center">{c.sentToHOD ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300 mx-auto">—</span>}</td>
                    <td className="px-4 py-3 text-center">{c.firstInterview ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300 mx-auto">—</span>}</td>
                    <td className="px-4 py-3 text-center">{c.secondInterview ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300 mx-auto">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {backlog.length > 50 && <p className="text-xs text-slate-400 text-center py-3">Showing 50 of {backlog.length}</p>}
          </div>
        </div>
      );
    }

    return null;
  };

  const selectedAlertData = alerts.find(a => a.id === selectedAlert);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 rounded-3xl p-8 md:p-10 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-500/30 backdrop-blur rounded-xl flex items-center justify-center">
                <Siren className="w-5 h-5 text-rose-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-rose-300/70">Chairman Alert Section</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">HR Risk Alert Center</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col items-center px-4 py-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-2xl font-black text-rose-300">{criticalCount}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 mt-1">Critical</span>
            </div>
            <div className="flex flex-col items-center px-4 py-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-2xl font-black text-amber-300">{highCount}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 mt-1">High Risk</span>
            </div>
            <div className="flex flex-col items-center px-4 py-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-2xl font-black text-rose-400">{overdueCount}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 mt-1">Overdue</span>
            </div>
            <div className="flex flex-col items-center px-4 py-3 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
              <span className="text-2xl font-black text-blue-300">{inProgressCount}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 mt-1">In Progress</span>
            </div>
          </div>
        </div>
        {overdueCount > 0 && (
          <div className="mt-6 flex items-center gap-3 px-5 py-3 bg-rose-500/20 backdrop-blur rounded-xl border border-rose-400/30 animate-pulse">
            <Bell className="w-5 h-5 text-rose-300 flex-shrink-0" />
            <p className="text-sm font-bold text-rose-100">
              {overdueCount} alerts OVERDUE — Chairman escalation required
            </p>
          </div>
        )}
      </div>

      {/* Alert Cards */}
      {alerts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-700">No Active Risk Alerts</p>
          <p className="text-sm text-slate-400 mt-2">All HR metrics are within acceptable thresholds.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-7 bg-rose-500 rounded-full" />
            <h3 className="text-xl font-bold text-slate-800">Active Alerts</h3>
            <span className="text-sm text-slate-400 font-medium">— Click any alert for details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {alerts.map((alert) => {
              const sc = severityConfig[alert.severity];
              const rc = recoveryStatusConfig[alert.recoveryStatus];
              const isActive = selectedAlert === alert.id;
              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-2xl border-2 ${sc.border} shadow-sm transition-all cursor-pointer overflow-hidden ${isActive ? 'shadow-lg ring-2 ring-indigo-200' : 'hover:shadow-md'}`}
                  onClick={() => setSelectedAlert(isActive ? null : alert.id)}
                >
                  <div className={`p-5 ${sc.bg} border-b ${sc.border}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${sc.iconBg} shadow-lg`}>
                        <alert.icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${sc.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${alert.severity === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                          <span className="text-[10px] font-bold uppercase">{sc.label}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">{alert.id}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-snug">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="font-bold text-slate-500">{alert.department}</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-bold text-slate-600 tabular-nums">{alert.value}</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Responsible</p>
                        <p className="text-xs font-bold text-slate-700">{alert.responsibleManager}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                        <p className={`text-xs font-bold tabular-nums ${alert.recoveryStatus === 'overdue' ? 'text-rose-600' : 'text-slate-700'}`}>{alert.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${rc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rc.dot} ${alert.recoveryStatus === 'overdue' ? 'animate-pulse' : ''}`} />
                        <span className="text-xs font-bold">{rc.label}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{alert.recoveryAction}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Section */}
      {selectedAlertData && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-7 bg-rose-500 rounded-full" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedAlertData.message} — Detail Breakdown</h3>
                <p className="text-slate-500 text-sm mt-0.5">{selectedAlertData.department} · {selectedAlertData.metric} · {selectedAlertData.value}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedAlert(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
              Close
            </button>
          </div>
          <div className="p-6">
            {renderAlertDetail(selectedAlertData)}
          </div>
        </div>
      )}

      {/* Ownership */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-7 bg-indigo-500 rounded-full" />
          <h3 className="text-xl font-bold text-slate-800">Ownership</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <UserCog className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Owner</p>
              <p className="text-lg font-bold text-slate-800">HR GM</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Overall risk escalation authority</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Co-Owner</p>
              <p className="text-lg font-bold text-slate-800">Concerned Department Heads</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Department-level recovery execution</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
