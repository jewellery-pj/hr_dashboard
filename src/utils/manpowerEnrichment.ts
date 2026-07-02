import { Manpower, VacantListRow } from '../data/mockData';

/** Apply department-level sanctioned strength from Vacant List to manpower rows. */
export function enrichManpowerWithVacantList(
  manpower: Manpower[],
  vacantList: VacantListRow[],
): Manpower[] {
  if (vacantList.length === 0) return manpower;

  const budgetByDept = new Map(
    vacantList.map((row) => [row.department.trim(), row.sanctionedStrength]),
  );

  const actualByDept = new Map(
    vacantList.map((row) => [row.department.trim(), row.activeHeadcount]),
  );

  const deptTotals = new Map<string, { actual: number; rows: number }>();
  for (const row of manpower) {
    const dept = row.department.trim();
    const entry = deptTotals.get(dept) || { actual: 0, rows: 0 };
    entry.actual += row.actual || 0;
    entry.rows += 1;
    deptTotals.set(dept, entry);
  }

  return manpower.map((row) => {
    const dept = row.department.trim();
    const budget = budgetByDept.get(dept);
    if (budget === undefined) return row;

    const deptActual = actualByDept.get(dept) ?? deptTotals.get(dept)?.actual ?? row.actual;
    const deptRowCount = deptTotals.get(dept)?.rows || 1;
    const allocatedBudget = Math.round(budget / deptRowCount);
    const allocatedActual = Math.round(deptActual / deptRowCount);

    return {
      ...row,
      budgeted: allocatedBudget,
      actual: row.actual || allocatedActual,
      variance: (row.actual || allocatedActual) - allocatedBudget,
    };
  });
}
