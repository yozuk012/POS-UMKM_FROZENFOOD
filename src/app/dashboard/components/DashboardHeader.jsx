'use client';

import { FiCalendar } from 'react-icons/fi';

export default function DashboardHeader() {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Pantau performa toko dan keuangan UMKM Anda secara real-time.</p>
      </div>
      <div className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-lg border border-blue-100 w-fit">
        <FiCalendar className="text-lg" />
        <span className="font-medium text-sm capitalize">{today}</span>
      </div>
    </div>
  );
}