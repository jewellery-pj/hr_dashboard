import {
  SALARY_HIGH_THRESHOLD,
  SUPERVISOR_HIGH_THRESHOLD,
  CAREER_GROWTH_THRESHOLD,
} from './exitReasons';
import { formatGap } from './metricGap';

export interface OffTargetRow {
  id: string;
  entity?: string;
  metric: string;
  now: string;
  target: string;
  gap: string;
}

export function buildExitReasonOffTarget(
  reasonBreakdown: { reason: string; count: number; pct: number }[],
): OffTargetRow[] {
  const configs = [
    { reason: 'Salary', threshold: SALARY_HIGH_THRESHOLD },
    { reason: 'Supervisor Issue', threshold: SUPERVISOR_HIGH_THRESHOLD },
    { reason: 'Career Growth', threshold: CAREER_GROWTH_THRESHOLD },
  ];

  return configs.flatMap(({ reason, threshold }) => {
    const row = reasonBreakdown.find(r => r.reason === reason);
    if (!row || row.pct < threshold) return [];
    return [{
      id: reason,
      metric: reason,
      now: `${row.count} (${row.pct.toFixed(0)}%)`,
      target: `Max ${threshold}%`,
      gap: formatGap(row.pct, threshold, false, '%', 0),
    }];
  });
}

export function getDeptOffTargetRows(dept: {
  department: string;
  overallGrade: string;
  overallScore: number;
  turnoverRate: number;
  vacancyRate: number;
}): OffTargetRow[] {
  const rows: OffTargetRow[] = [];
  if (dept.overallGrade === 'C' || dept.overallGrade === 'D') {
    rows.push({
      id: `${dept.department}-grade`,
      entity: dept.department,
      metric: 'Productivity Grade',
      now: dept.overallGrade,
      target: 'Min B',
      gap: formatGap(dept.overallScore, 2.5, true, ' pts', 1),
    });
  }
  if (dept.turnoverRate > 10) {
    rows.push({
      id: `${dept.department}-turnover`,
      entity: dept.department,
      metric: 'Turnover',
      now: `${dept.turnoverRate.toFixed(1)}%`,
      target: 'Max 10%',
      gap: formatGap(dept.turnoverRate, 10, false, '%'),
    });
  }
  if (dept.vacancyRate > 5) {
    rows.push({
      id: `${dept.department}-vacancy`,
      entity: dept.department,
      metric: 'Vacancy Rate',
      now: `${dept.vacancyRate.toFixed(1)}%`,
      target: 'Max 5%',
      gap: formatGap(dept.vacancyRate, 5, false, '%'),
    });
  }
  return rows;
}

export function getBranchOffTargetRows(branch: {
  branch: string;
  score: string;
  turnoverRate: number;
  vacancyRate: number;
  attendance: number;
}): OffTargetRow[] {
  const rows: OffTargetRow[] = [];
  if (branch.score === 'C' || branch.score === 'D') {
    rows.push({
      id: `${branch.branch}-score`,
      entity: branch.branch,
      metric: 'Branch Score',
      now: branch.score,
      target: 'Min B',
      gap: branch.score === 'D' ? 'Critical grade' : 'At risk grade',
    });
  }
  if (branch.turnoverRate > 10) {
    rows.push({
      id: `${branch.branch}-turnover`,
      entity: branch.branch,
      metric: 'Turnover',
      now: `${branch.turnoverRate.toFixed(1)}%`,
      target: 'Max 10%',
      gap: formatGap(branch.turnoverRate, 10, false, '%'),
    });
  }
  if (branch.vacancyRate > 5) {
    rows.push({
      id: `${branch.branch}-vacancy`,
      entity: branch.branch,
      metric: 'Vacancy Rate',
      now: `${branch.vacancyRate.toFixed(1)}%`,
      target: 'Max 5%',
      gap: formatGap(branch.vacancyRate, 5, false, '%'),
    });
  }
  if (branch.attendance < 90) {
    rows.push({
      id: `${branch.branch}-attendance`,
      entity: branch.branch,
      metric: 'Attendance',
      now: `${branch.attendance.toFixed(1)}%`,
      target: 'Min 90%',
      gap: formatGap(branch.attendance, 90, true, '%'),
    });
  }
  return rows;
}

export function getManagerOffTargetRows(manager: {
  department: string;
  overallGrade: string;
  overallScore: number;
  turnoverRate: number;
  vacancyRate: number;
}): OffTargetRow[] {
  const rows: OffTargetRow[] = [];
  if (manager.overallGrade === 'C' || manager.overallGrade === 'D') {
    rows.push({
      id: `${manager.department}-grade`,
      entity: manager.department,
      metric: 'Leadership Grade',
      now: manager.overallGrade,
      target: 'Min B',
      gap: formatGap(manager.overallScore, 2.5, true, ' pts', 1),
    });
  }
  if (manager.turnoverRate > 10) {
    rows.push({
      id: `${manager.department}-turnover`,
      entity: manager.department,
      metric: 'Turnover',
      now: `${manager.turnoverRate.toFixed(1)}%`,
      target: 'Max 10%',
      gap: formatGap(manager.turnoverRate, 10, false, '%'),
    });
  }
  if (manager.vacancyRate > 5) {
    rows.push({
      id: `${manager.department}-vacancy`,
      entity: manager.department,
      metric: 'Vacancy Rate',
      now: `${manager.vacancyRate.toFixed(1)}%`,
      target: 'Max 5%',
      gap: formatGap(manager.vacancyRate, 5, false, '%'),
    });
  }
  return rows;
}

export function getManpowerOffTargetRows(dept: {
  department: string;
  budget: number;
  actual: number;
  gap: number;
  shortage: number;
  fillRate: number;
}): OffTargetRow[] {
  if (dept.budget <= 0) return [];
  if (dept.shortage <= 0 && dept.gap >= 0) return [];
  return [{
    id: dept.department,
    entity: dept.department,
    metric: 'Headcount Gap',
    now: `${dept.actual}/${dept.budget}`,
    target: 'Budget met',
    gap: dept.shortage > 0
      ? `${dept.shortage} short · ${dept.fillRate.toFixed(0)}% fill`
      : `${dept.gap > 0 ? '+' : ''}${dept.gap} vs budget`,
  }];
}

export function getSuccessionOffTargetRows(row: {
  id: string;
  position: string;
  isVacant: boolean;
  successor: string | null;
  readiness: number;
  budgeted?: number;
  actual?: number;
}): OffTargetRow[] {
  const rows: OffTargetRow[] = [];
  if (row.isVacant) {
    const open = row.budgeted !== undefined && row.actual !== undefined
      ? Math.max(0, row.budgeted - row.actual)
      : null;
    rows.push({
      id: `${row.id}-vacant`,
      entity: row.position,
      metric: 'Position Status',
      now: open !== null ? `${row.actual}/${row.budgeted}` : 'Vacant',
      target: 'Filled',
      gap: open !== null ? `${open} open` : 'No holder',
    });
  }
  if (!row.isVacant && !row.successor) {
    rows.push({
      id: `${row.id}-successor`,
      entity: row.position,
      metric: 'Successor',
      now: '0',
      target: '≥1',
      gap: 'None identified',
    });
  }
  if (!row.isVacant && row.readiness < 80) {
    rows.push({
      id: `${row.id}-readiness`,
      entity: row.position,
      metric: 'Readiness',
      now: `${row.readiness}%`,
      target: 'Min 80%',
      gap: formatGap(row.readiness, 80, true, '%', 0),
    });
  }
  return rows;
}

export function flattenOffTarget<T>(
  items: T[],
  getRows: (item: T) => OffTargetRow[],
): OffTargetRow[] {
  return items.flatMap(item => getRows(item));
}
