import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface FunnelData {
  name: string;
  value: number;
  color: string;
}

interface HiringFunnelProps {
  data: FunnelData[];
  embedded?: boolean;
}

export const HiringFunnel: React.FC<HiringFunnelProps> = ({ data, embedded = false }) => {
  const chart = (
    <ResponsiveContainer width="100%" height={embedded ? 280 : '90%'}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            width={120}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList dataKey="value" position="right" style={{ fill: '#334155', fontWeight: 600 }} />
          </Bar>
        </BarChart>
    </ResponsiveContainer>
  );

  if (embedded) return <div className="h-[300px]">{chart}</div>;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[400px]">
      <h3 className="text-base font-bold text-slate-800 mb-4">Hiring Funnel</h3>
      {chart}
    </div>
  );
};
