import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PositionData {
  position: string;
  applicants: number;
  hires: number;
}

interface PositionChartProps {
  data: PositionData[];
}

export const PositionChart: React.FC<PositionChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Position-wise Breakdown</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="position"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            interval={0}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
          <Bar
            dataKey="applicants"
            name="Applicants"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            barSize={24}
          />
          <Bar
            dataKey="hires"
            name="Hires"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
