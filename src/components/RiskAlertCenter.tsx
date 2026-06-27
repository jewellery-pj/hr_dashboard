import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Factory,
  TrendingUp,
  Shield,
  Clock,
  Users,
  UserCog,
  Calendar,
  Siren,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2,
  Crown,
} from 'lucide-react';
import { Candidate, Resignation, Manpower } from '../data/mockData';

interface RiskAlertCenterProps {
  candidates: Candidate[];
  resignations: Resignation[];
  manpower: Manpower[];
}

type Severity = 'critical' | 'high' | 'moderate';
type RecoveryStatus = 'overdue' | 'in-progress' | 'pending';
type AlertType = 'staff-shortage' | 'turnover' | 'resignation-trend' | 'critical-vacant' | 'recruitment-backlog';

interface RiskAlert {
  id: string;
  icon: React.ElementType;
  message: string;
  department: string;
  alertType: AlertType;
  severity: Severity;
  responsibleManager: string;
  dueDate: string;
  recoveryStatus: RecoveryStatus;
  gapDetail: string;
  escalateToChairman: boolean;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[./-]/);
  if (parts.length < 3) return null;
  const p1 = parseInt(parts[0]);
  const p2 = parseInt(parts[1]);
  const p3 = parseInt(parts[2]);
  if (isNaN(p1) || isNaN(p2) || isNaN(p3)) return null;
  if (p3 > 31) {
    if (p1 > 12) return new Date(p3, p2 - 1, p1);
    return new Date(p3, p1 - 1, p2);
  }
  if (p1 > 12) return new Date(p3, p2 - 1, p1);
  return new Date(p3, p1 - 1, p2);
}

function daysSince(dateStr: string): number | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  return Math.max(0, (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function getRecoveryStatus(daysOpen: number): RecoveryStatus {
  if (daysOpen > 30) return 'overdue';
  if (daysOpen > 7) return 'in-progress';
  return 'pending';
}

function isCriticalPosition(position: string): boolean {
  const keywords = ['gm', 'general manager', 'manager', 'head', 'director', 'chief', 'officer', 'supervisor', 'leader'];
  return keywords.some(k => position.toLowerCase().includes(k));
}

export const RiskAlertCenter: React.FC<RiskAlertCenterProps> = ({ candidates, resignations, manpower }) => {
  const alerts = useMemo<RiskAlert[]>(() => {
    const result: RiskAlert[] = [];

    const deptVacancy = manpower.reduce((acc, m) => {
      const dept = m.department;
      const vacant = Math.max(0, (m.budgeted || 0) - (m.actual || 0));
      if (!acc[dept]) acc[dept] = { total: 0, vacant: 0, actual: 0 };
      acc[dept].total += m.budgeted || 0;
      acc[dept].vacant += vacant;
      acc[dept].actual += m.actual || 0;
      return acc;
    }, {} as Record<string, { total: number; vacant: number; actual: number }>);

    // 1. Department vacancy / staff shortage
    for (const [dept, data] of Object.entries(deptVacancy) as [string, { total: number; vacant: number; actual: number }][]) {
      if (data.vacant >= 5) {
        const severity: Severity = data.vacant >= 15 ? 'critical' : data.vacant >= 8 ? 'high' : 'moderate';
        result.push({
          id: `ALT-VAC-${dept}`,
          icon: Factory,
          message: `${dept} Vacancy — ${data.vacant} Posts`,
          department: dept,
          alertType: 'staff-shortage',
          severity,
          responsibleManager: `${dept} Head`,
          dueDate: severity === 'critical' ? '7 days' : '14 days',
          recoveryStatus: getRecoveryStatus(data.vacant * 2),
          gapDetail: `${data.vacant} vacant · ${data.actual}/${data.total} filled · ${data.total > 0 ? ((data.actual / data.total) * 100).toFixed(0) : 0}% fill`,
          escalateToChairman: false,
        });
      }
    }

    // 2. Department turnover
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
          alertType: 'turnover',
          severity,
          responsibleManager: `${dept} Head`,
          dueDate: '7 days',
          recoveryStatus: getRecoveryStatus(resCount * 5),
          gapDetail: `${turnoverRate.toFixed(1)}% turnover · ${resCount} exits · ${staff} staff`,
          escalateToChairman: false,
        });
      }
    }

    // 3. Security resignation trend
    const securityResignations = resignations.filter(r =>
      r.department.toLowerCase().includes('security')
    );
    if (securityResignations.length >= 3) {
      result.push({
        id: 'ALT-SEC-TREND',
        icon: Shield,
        message: 'Security Resignation Trend Increasing',
        department: 'Security',
        alertType: 'resignation-trend',
        severity: 'high',
        responsibleManager: 'Security Manager',
        dueDate: '14 days',
        recoveryStatus: getRecoveryStatus(securityResignations.length * 4),
        gapDetail: `${securityResignations.length} security exits`,
        escalateToChairman: false,
      });
    }

    // 4. Critical positions vacant > 45 days
    const vacantRows = manpower.filter(m => (m.budgeted || 0) > (m.actual || 0));
    const longVacantKeys = new Set<string>();

    for (const row of vacantRows) {
      const key = `${row.department}||${row.position}`;
      if (longVacantKeys.has(key)) continue;

      const pipeline = candidates.filter(
        c => c.finalStatus === 'In Progress' && c.department === row.department && c.position === row.position
      );
      const oldestDays = pipeline
        .map(c => daysSince(c.date))
        .filter((d): d is number => d !== null);
      const maxDays = oldestDays.length > 0 ? Math.max(...oldestDays) : null;

      const isCritical = isCriticalPosition(row.position);
      const vacantCount = Math.max(0, row.budgeted - row.actual);

      if ((maxDays !== null && maxDays >= 45) || (isCritical && vacantCount > 0 && maxDays === null && vacantCount >= 2)) {
        longVacantKeys.add(key);
        const daysLabel = maxDays !== null ? Math.round(maxDays) : '45+';
        result.push({
          id: `ALT-LONG-${row.department}-${row.position}`.replace(/\s+/g, '-'),
          icon: Clock,
          message: `Critical Position Vacant > ${daysLabel} Days — ${row.position}`,
          department: row.department,
          alertType: 'critical-vacant',
          severity: 'critical',
          responsibleManager: 'HR GM',
          dueDate: 'Immediate',
          recoveryStatus: maxDays !== null && maxDays >= 45 ? 'overdue' : 'pending',
          gapDetail: `${vacantCount} vacant · ${daysLabel} days open · ${row.actual}/${row.budgeted}`,
          escalateToChairman: true,
        });
      }
    }

    // 5. Recruitment backlog (posts in pipeline)
    const inProgress = candidates.filter(c => c.finalStatus === 'In Progress');
    const backlogPosts = new Set(inProgress.map(c => `${c.department}||${c.position}`)).size;
    const backlogCount = backlogPosts >= 10 ? backlogPosts : inProgress.length;

    if (backlogCount >= 10) {
      result.push({
        id: 'ALT-RECRUIT-BACKLOG',
        icon: Users,
        message: `Recruitment Backlog — ${backlogCount} Posts`,
        department: 'Recruitment',
        alertType: 'recruitment-backlog',
        severity: backlogCount >= 20 ? 'high' : 'moderate',
        responsibleManager: 'Recruitment Manager',
        dueDate: 'Weekly',
        recoveryStatus: 'in-progress',
        gapDetail: `${backlogCount} unique posts · ${inProgress.length} candidates in pipeline`,
        escalateToChairman: false,
      });
    }

    const severityOrder: Record<Severity, number> = { critical: 0, high: 1, moderate: 2 };
    return result.sort((a, b) => {
      if (a.escalateToChairman !== b.escalateToChairman) return a.escalateToChairman ? -1 : 1;
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [candidates, resignations, manpower]);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;
  const overdueCount = alerts.filter(a => a.recoveryStatus === 'overdue').length;
  const chairmanEscalations = alerts.filter(a => a.escalateToChairman);

  const severityConfig: Record<Severity, { label: string; dot: string; badge: string; border: string }> = {
    critical: { label: 'Critical', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', border: 'border-rose-200' },
    high: { label: 'High Risk', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-amber-200' },
    moderate: { label: 'Moderate', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200', border: 'border-blue-200' },
  };

  const recoveryStatusConfig: Record<RecoveryStatus, { label: string; badge: string; dot: string }> = {
    overdue: { label: 'Overdue', badge: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500' },
    'in-progress': { label: 'In Progress', badge: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-500' },
    pending: { label: 'Pending', badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  };

  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const alertDetailData = useMemo(() => {
    const deptStaffMap = manpower.reduce((acc, m) => {
      const dept = m.department;
      if (!acc[dept]) acc[dept] = { actual: 0, budgeted: 0 };
      acc[dept].actual += m.actual || 0;
      acc[dept].budgeted += m.budgeted || 0;
      return acc;
    }, {} as Record<string, { actual: number; budgeted: number }>);
    return { deptStaffMap };
  }, [manpower]);

  const renderAlertDetail = (alert: RiskAlert) => {
    if (alert.alertType === 'staff-shortage') {
      const deptData = alertDetailData.deptStaffMap[alert.department];
      if (!deptData) return null;
      const vacant = Math.max(0, deptData.budgeted - deptData.actual);
      const positions = manpower.filter(m => m.department === alert.department && (m.budgeted || 0) > (m.actual || 0));
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budgeted</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actual</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vacant</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm font-bold text-slate-700">{p.position}</span></div></td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums">{p.budgeted}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold tabular-nums">{p.actual}</td>
                  <td className="px-4 py-3 text-right text-sm font-black text-rose-600 tabular-nums">{Math.max(0, p.budgeted - p.actual)}</td>
                </tr>
              ))}
              {positions.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">{vacant} total vacant posts in {alert.department}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (alert.alertType === 'turnover' || alert.alertType === 'resignation-trend') {
      const deptRes = resignations.filter(r =>
        alert.alertType === 'resignation-trend'
          ? r.department.toLowerCase().includes('security')
          : r.department === alert.department
      );
      return (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0">
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody>
              {deptRes.slice(0, 50).map((r, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3 text-sm font-bold text-slate-700">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{r.position || r.designation || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{r.resignationDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (alert.alertType === 'recruitment-backlog') {
      const backlog = candidates.filter(c => c.finalStatus === 'In Progress');
      return (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0">
              <tr className="bg-slate-50/80">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</th>
              </tr>
            </thead>
            <tbody>
              {backlog.slice(0, 50).map((c, i) => (
                <tr key={i} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-4 py-3 text-sm font-bold text-slate-700">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (alert.alertType === 'critical-vacant') {
      return (
        <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Vacancy detail</p>
          <p className="text-sm font-bold text-rose-800">{alert.gapDetail}</p>
          <p className="text-xs text-rose-600 mt-1">{alert.department} · {alert.message}</p>
        </div>
      );
    }

    return null;
  };

  const headerGradient = criticalCount > 0 || chairmanEscalations.length > 0
    ? 'from-rose-900 via-rose-800 to-slate-900'
    : highCount > 0
    ? 'from-amber-900 via-amber-800 to-slate-900'
    : 'from-emerald-800 via-emerald-700 to-slate-800';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Chairman Alert Section */}
      <div className={`bg-gradient-to-br ${headerGradient} rounded-2xl p-6 md:p-8 text-white shadow-lg`}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-2">Chairman Alert Section</p>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">HR Risk Alert Center</h2>
            <p className="text-sm text-white/60 mt-2">{alerts.length} alerts · {criticalCount} critical · {overdueCount} overdue</p>
          </div>
          <div className="grid grid-cols-3 gap-2 flex-shrink-0">
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black text-rose-300">{criticalCount}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Critical</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black text-amber-300">{highCount}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">High Risk</p>
            </div>
            <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-black text-rose-400">{overdueCount}</p>
              <p className="text-[10px] font-bold text-white/50 uppercase">Overdue</p>
            </div>
          </div>
        </div>

        {chairmanEscalations.length > 0 && (
          <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-rose-500/25 rounded-xl border border-rose-400/30">
            <Bell className="w-4 h-4 text-rose-200 flex-shrink-0" />
            <p className="text-sm font-bold text-rose-100">
              {chairmanEscalations.length} chairman escalation(s) — {chairmanEscalations[0]?.gapDetail}
            </p>
          </div>
        )}
      </div>

      {/* Chairman Alert List — top priority view */}
      {alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">No Active Risk Alerts</p>
          <p className="text-sm text-slate-400 mt-1">All HR metrics within acceptable thresholds.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-rose-50/80 border-b border-rose-100 flex items-center gap-2">
              <Siren className="w-4 h-4 text-rose-500" />
              <h3 className="text-base font-bold text-slate-800">Active Alerts</h3>
              <span className="text-xs text-slate-400">{alerts.length} total</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {alerts.map((alert) => {
                const sc = severityConfig[alert.severity];
                return (
                  <li key={alert.id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sc.dot} ${alert.severity === 'critical' ? 'animate-pulse' : ''}`} />
                    <span className="text-sm font-bold text-slate-800 flex-1">{alert.message}</span>
                    {alert.escalateToChairman && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                        Chairman
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Alert Registry Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-800">Alert Registry</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click a row for details</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Alert</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Responsible</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Due</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => {
                    const sc = severityConfig[alert.severity];
                    const rc = recoveryStatusConfig[alert.recoveryStatus];
                    const isExpanded = expandedAlert === alert.id;
                    const Icon = alert.icon;
                    return (
                      <React.Fragment key={alert.id}>
                        <tr
                          className={`border-t border-slate-100 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'}`}
                          onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sc.badge}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{alert.message}</p>
                                <p className="text-[11px] text-slate-400">{alert.department}</p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-indigo-400 ml-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-300 ml-auto" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-slate-700">{alert.responsibleManager}</td>
                          <td className={`px-4 py-3.5 text-sm font-bold tabular-nums ${alert.recoveryStatus === 'overdue' ? 'text-rose-600' : 'text-slate-700'}`}>
                            {alert.dueDate}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${rc.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                              <span className="text-[10px] font-bold">{rc.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-slate-600 max-w-xs">{alert.gapDetail}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/40">
                            <td colSpan={5} className="px-6 py-4 border-t border-indigo-100">
                              {renderAlertDetail(alert)}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Ownership */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><UserCog className="w-3.5 h-3.5" /><strong className="text-slate-700">Accountable:</strong> HR GM</span>
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /><strong className="text-slate-700">Responsible:</strong> Concerned Department Heads</span>
      </div>
    </div>
  );
};
