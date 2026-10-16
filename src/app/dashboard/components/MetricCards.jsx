'use client';

import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiShoppingBag } from 'react-icons/fi';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export default function MetricCards({ metrics }) {
  const cards = [
    {
      title: 'Total Penjualan',
      value: metrics.totalPenjualan,
      icon: <FiShoppingBag className="text-blue-600" size={22} />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      title: 'Total Pengeluaran',
      value: metrics.totalPengeluaran,
      icon: <FiTrendingDown className="text-red-600" size={22} />,
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
    {
      title: 'Laba Kotor',
      value: metrics.labaKotor,
      icon: <FiDollarSign className="text-purple-600" size={22} />,
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      title: 'Laba Bersih',
      value: metrics.labaBersih,
      icon: <FiTrendingUp className="text-emerald-600" size={22} />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className={`bg-white p-5 rounded-xl border ${card.border} shadow-sm hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-sm font-medium">{card.title}</span>
            <div className={`p-2 rounded-lg ${card.bg}`}>
              {card.icon}
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{formatIDR(card.value)}</h3>
        </div>
      ))}
    </div>
  );
}