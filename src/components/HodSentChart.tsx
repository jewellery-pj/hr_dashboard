import React, { useMemo } from 'react';
import { Candidate } from '../data/mockData';

interface HodSentChartProps {
  candidates: Candidate[];
}

export const HodSentChart: React.FC<HodSentChartProps> = ({ candidates }) => {
  const data = useMemo(() => {
    const sentCandidates = candidates.filter(c => c.sentToHOD);
    const deptCounts: Record<string, number> = {};
    
    sentCandidates.forEach(c => {
      deptCounts[c.department] = (deptCounts[c.department] || 0) + 1;
    });
    
    return Object.entries(deptCounts)
      .map(([dept, count]) => ({
        department: dept,
        count
      }))
      .sort((a, b) => b.count - a.count);
  }, [candidates]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Sent to HOD by Department</h3>
          <p className="text-xs text-slate-500 mt-1">Total CVs forwarded to department heads</p>
        </div>
      </div>
      
      <div className="overflow-hidden border border-slate-100 rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600">Department (HOD)</th>
              <th className="px-4 py-3 font-semibold text-slate-600 text-right">Sent Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-700 font-medium">{item.department}</td>
                <td className="px-4 py-3 text-slate-900 font-bold text-right">
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs">
                    {item.count} CVs
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">
                  No data available for the selected period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
