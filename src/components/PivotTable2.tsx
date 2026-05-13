import React from 'react';
import { Candidate } from '../data/mockData';

interface PivotTable2Props {
  candidates: Candidate[];
}

export const PivotTable2: React.FC<PivotTable2Props> = ({ candidates }) => {
  // Get unique dates, departments, and positions
  const dates = Array.from(new Set(candidates.map(c => c.date))).sort() as string[];
  const departments = Array.from(new Set(candidates.map(c => c.department))).sort() as string[];
  const positions = Array.from(new Set(candidates.map(c => c.position))).sort() as string[];

  // Target positions: show all positions
  const targetPositions = positions;
  if (targetPositions.length === 0) return null;

  // Build grid: grid[date][dept][position] = count
  const grid: Record<string, Record<string, Record<string, number>>> = {};
  
  candidates.forEach(c => {
    if (!grid[c.date]) grid[c.date] = {};
    if (!grid[c.date][c.department]) grid[c.date][c.department] = {};
    const dateGrid = grid[c.date];
    const deptGrid = dateGrid[c.department];
    deptGrid[c.position] = (deptGrid[c.position] || 0) + 1;
  });

  // Calculate totals
  const dateTotals: Record<string, Record<string, number>> = {}; // dateTotals[date][position]
  const grandTotals: Record<string, number> = {}; // grandTotals[position]

  dates.forEach(date => {
    dateTotals[date] = {};
    targetPositions.forEach(pos => {
      let sum = 0;
      departments.forEach(dept => {
        sum += grid[date]?.[dept]?.[pos] || 0;
      });
      dateTotals[date][pos] = sum;
      grandTotals[pos] = (grandTotals[pos] || 0) + sum;
    });
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">PivotTable2 (Date & Dept vs Position)</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            {/* Top Header */}
            <tr className="bg-white">
              <th className="border border-slate-300 p-1" colSpan={2}></th>
              <th className="border border-slate-300 p-1 text-right font-bold bg-slate-50" rowSpan={2}>ရာထူး:</th>
              {targetPositions.map(pos => (
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
              <td className="border border-slate-300 p-1 text-lg">CV ရရှိသည့် ရက်</td>
              <td className="border border-slate-300 p-1 text-lg">ဌာန</td>
              <td className="border border-slate-300 p-1">ရာထူး: (Count All)</td>
              {targetPositions.map(pos => (
                <td key={pos} className="border border-slate-300 p-1"></td>
              ))}
              <td className="border border-slate-300 p-1"></td>
            </tr>

            {/* Data Rows */}
            {dates.map(date => (
              <React.Fragment key={date}>
                {departments.filter(dept => grid[date]?.[dept]).map((dept, deptIdx) => {
                  const rowTotal = targetPositions.reduce((sum, pos) => sum + (grid[date][dept][pos] || 0), 0);
                  if (rowTotal === 0) return null;

                  return (
                    <tr key={`${date}-${dept}`} className="hover:bg-slate-50">
                      {deptIdx === 0 ? (
                        <td className="border border-slate-300 p-1 font-bold align-top" rowSpan={departments.filter(d => grid[date]?.[d]).length}>
                          ▼ {date}
                        </td>
                      ) : null}
                      <td className="border border-slate-300 p-1 text-slate-700">
                        {dept}
                      </td>
                      <td className="border border-slate-300 p-1"></td>
                      {targetPositions.map(pos => (
                        <td key={pos} className="border border-slate-300 p-1 text-center">
                          {grid[date][dept][pos] || ''}
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
                  {targetPositions.map(pos => (
                    <td key={pos} className="border border-slate-300 p-1 text-center">
                      {dateTotals[date][pos] || ''}
                    </td>
                  ))}
                  <td className="border border-slate-300 p-1 text-center">
                    {Object.values(dateTotals[date]).reduce((a: number, b: number) => a + b, 0)}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold text-sm">
              <td className="border border-slate-300 p-1" colSpan={2}>Grand Total</td>
              <td className="border border-slate-300 p-1"></td>
              {targetPositions.map(pos => (
                <td key={pos} className="border border-slate-300 p-1 text-center">
                  {grandTotals[pos]}
                </td>
              ))}
              <td className="border border-slate-300 p-1 text-center text-indigo-600">
                {Object.values(grandTotals).reduce((a: number, b: number) => a + b, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
