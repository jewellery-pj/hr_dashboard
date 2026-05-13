import React from 'react';
import { Candidate } from '../data/mockData';

interface PivotTable3Props {
  candidates: Candidate[];
}

export const PivotTable3: React.FC<PivotTable3Props> = ({ candidates }) => {
  // Filter only joined candidates
  const joinedCandidates = candidates.filter(c => c.finalStatus === 'Joined' && c.joinedDate);

  // Get unique joined dates, positions, and departments
  const joinedDates = Array.from(new Set(joinedCandidates.map(c => c.joinedDate as string))).sort() as string[];
  const positions = Array.from(new Set(joinedCandidates.map(c => c.position))).sort() as string[];
  const departments = Array.from(new Set(joinedCandidates.map(c => c.department))).sort() as string[];

  // Target departments: show all departments that have joined candidates
  const targetDepts = departments;
  if (targetDepts.length === 0) return null;

  // Build grid: grid[joinedDate][position][dept] = count
  const grid: Record<string, Record<string, Record<string, number>>> = {};
  
  joinedCandidates.forEach(c => {
    const date = c.joinedDate as string;
    if (!grid[date]) grid[date] = {};
    if (!grid[date][c.position]) grid[date][c.position] = {};
    const dateGrid = grid[date];
    const posGrid = dateGrid[c.position];
    posGrid[c.department] = (posGrid[c.department] || 0) + 1;
  });

  // Calculate totals
  const dateTotals: Record<string, Record<string, number>> = {}; // dateTotals[date][dept]
  const grandTotals: Record<string, number> = {}; // grandTotals[dept]

  joinedDates.forEach(date => {
    dateTotals[date] = {};
    targetDepts.forEach(dept => {
      let sum = 0;
      positions.forEach(pos => {
        sum += grid[date]?.[pos]?.[dept] || 0;
      });
      dateTotals[date][dept] = sum;
      grandTotals[dept] = (grandTotals[dept] || 0) + sum;
    });
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">PivotTable 1 (Joined Date & Position vs Dept)</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            {/* Top Header */}
            <tr className="bg-indigo-50/50">
              <th className="border border-slate-300 p-1" colSpan={2}></th>
              <th className="border border-slate-300 p-1 text-right font-bold" rowSpan={2}>Dept:</th>
              {targetDepts.map(dept => (
                <th key={dept} className="border border-slate-300 p-1 text-left font-bold min-w-[100px]">
                  {dept}
                </th>
              ))}
              <th className="border border-slate-300 p-1 text-left font-bold bg-indigo-100/50 min-w-[100px]">Grand Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Sub Header Row */}
            <tr className="bg-indigo-50/50 font-bold">
              <td className="border border-slate-300 p-1">Joined Date</td>
              <td className="border border-slate-300 p-1">Position</td>
              <td className="border border-slate-300 p-1">Dept (Count All)</td>
              {targetDepts.map(dept => (
                <td key={dept} className="border border-slate-300 p-1"></td>
              ))}
              <td className="border border-slate-300 p-1"></td>
            </tr>

            {/* Data Rows */}
            {joinedDates.map(date => (
              <React.Fragment key={date}>
                {positions.filter(pos => grid[date]?.[pos]).map((pos, posIdx) => {
                  const rowTotal = targetDepts.reduce((sum, dept) => sum + (grid[date][pos][dept] || 0), 0);
                  if (rowTotal === 0) return null;

                  return (
                    <tr key={`${date}-${pos}`} className="hover:bg-slate-50">
                      {posIdx === 0 ? (
                        <td className="border border-slate-300 p-1 font-bold align-top" rowSpan={positions.filter(p => grid[date]?.[p]).length}>
                          ▼ {date}
                        </td>
                      ) : null}
                      <td className="border border-slate-300 p-1 text-slate-700 font-bold">
                        {pos}
                      </td>
                      <td className="border border-slate-300 p-1"></td>
                      {targetDepts.map(dept => (
                        <td key={dept} className="border border-slate-300 p-1 text-center">
                          {grid[date][pos][dept] || ''}
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
                  {targetDepts.map(dept => (
                    <td key={dept} className="border border-slate-300 p-1 text-center">
                      {dateTotals[date][dept] || ''}
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
            <tr className="bg-indigo-100/50 font-bold text-sm">
              <td className="border border-slate-300 p-1" colSpan={2}>Grand Total</td>
              <td className="border border-slate-300 p-1"></td>
              {targetDepts.map(dept => (
                <td key={dept} className="border border-slate-300 p-1 text-center">
                  {grandTotals[dept]}
                </td>
              ))}
              <td className="border border-slate-300 p-1 text-center text-indigo-700">
                {Object.values(grandTotals).reduce((a: number, b: number) => a + b, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
