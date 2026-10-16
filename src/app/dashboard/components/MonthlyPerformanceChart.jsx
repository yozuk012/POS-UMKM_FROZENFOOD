'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color }} className="flex justify-between gap-4 mb-1 last:mb-0">
            <span>{pld.name}:</span>
            <span className="font-medium">{formatIDR(pld.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MonthlyPerformanceChart({ data, title = 'Performa Keuangan' }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(1)}jt`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="sales" name="Penjualan" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
            <Bar dataKey="expenses" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
            <Bar dataKey="profit" name="Laba Bersih" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}