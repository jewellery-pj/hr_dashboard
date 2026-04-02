import React, { useMemo } from 'react';
import { Candidate } from '@/src/data/mockData';

interface PivotTableProps {
  candidates: Candidate[];
}

export const PivotTable: React.FC<PivotTableProps> = ({ candidates }) => {
  const { positions, departments, grid, grandTotals, rowTotals } = useMemo(() => {
    const posSet = new Set<string>();
    const deptSet = new Set<string>();
    
    candidates.forEach(c => {
      posSet.add(c.position);
      deptSet.add(c.department);
    });

    const sortedPos = Array.from(posSet).sort();
    const sortedDept = Array.from(deptSet).sort();

    const dataGrid: Record<string, Record<string, number>> = {};
    const colTotals: Record<string, number> = {};
    const rTotals: Record<string, number> = {};
    let total = 0;

    sortedPos.forEach(p => {
      dataGrid[p] = {};
      rTotals[p] = 0;
      sortedDept.forEach(d => {
        dataGrid[p][d] = 0;
        if (!colTotals[d]) colTotals[d] = 0;
      });
    });

    candidates.forEach(c => {
      dataGrid[c.position][c.department]++;
      colTotals[c.department]++;
      rTotals[c.position]++;
      total++;
    });

    return {
      positions: sortedPos,
      departments: sortedDept,
      grid: dataGrid,
      grandTotals: colTotals,
      rowTotals: rTotals,
      total
    };
  }, [candidates]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">PivotTable1 (Position vs Department)</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-white">
              <th className="border border-slate-300 p-1 text-left font-bold min-w-[150px] bg-slate-50">ရာထူး (Position)</th>
              {departments.map(dept => (
                <th key={dept} className="border border-slate-300 p-1 text-center font-bold min-w-[80px]">
                  {dept}
                </th>
              ))}
              <th className="border border-slate-300 p-1 text-center font-bold bg-slate-100 min-w-[80px]">Grand Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-50 font-bold">
              <td className="border border-slate-300 p-1">ဌာန (Count All)</td>
              {departments.map(dept => (
                <td key={dept} className="border border-slate-300 p-1"></td>
              ))}
              <td className="border border-slate-300 p-1"></td>
            </tr>
            {positions.map(pos => (
              <tr key={pos} className="hover:bg-slate-50 transition-colors">
                <td className="border border-slate-300 p-1 font-medium bg-white">{pos}</td>
                {departments.map(dept => (
                  <td key={dept} className="border border-slate-300 p-1 text-center text-slate-900">
                    {grid[pos][dept] || ''}
                  </td>
                ))}
                <td className="border border-slate-300 p-1 text-center font-bold bg-slate-50">
                  {rowTotals[pos]}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold">
              <td className="border border-slate-300 p-1">Grand Total</td>
              {departments.map(dept => (
                <td key={dept} className="border border-slate-300 p-1 text-center">
                  {grandTotals[dept]}
                </td>
              ))}
              <td className="border border-slate-300 p-1 text-center text-indigo-600">
                {candidates.length}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
