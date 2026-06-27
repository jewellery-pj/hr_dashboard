import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrendData {
  month: string;
  cvs: number;
  hires: number;
}

interface TrendChartProps {
  data: TrendData[];
  embedded?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, embedded = false }) => {
  const chart = (
    <ResponsiveContainer width="100%" height={embedded ? 280 : '90%'}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="cvs"
            name="CVs Received"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="hires"
            name="Hires"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
    </ResponsiveContainer>
  );

  if (embedded) return <div className="h-[300px]">{chart}</div>;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
      <h3 className="text-base font-bold text-slate-800 mb-4">Monthly Trends</h3>
      {chart}
    </div>
  );
};
