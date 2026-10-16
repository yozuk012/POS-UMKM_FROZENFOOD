'use client';

import { FiClock, FiCheckCircle, FiXCircle, FiMinusCircle } from 'react-icons/fi';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status) => {
  const lowerStatus = status?.toLowerCase();
  if (lowerStatus === 'success') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><FiCheckCircle size={12} /> Sukses</span>;
  }
  if (lowerStatus === 'pending') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><FiClock size={12} /> Pending</span>;
  }
  if (lowerStatus === 'failed') {
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><FiXCircle size={12} /> Gagal</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><FiMinusCircle size={12} /> {status || 'Cash'}</span>;
};

export default function RecentSalesList({ sales }) {
  if (!sales || sales.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Riwayat Penjualan Terakhir</h2>
        <p className="text-gray-500 text-sm text-center py-8">Belum ada transaksi tercatat.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Riwayat Penjualan Terakhir</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Struk</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">#{sale.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(sale.sale_date)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">{sale.channel}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">{formatIDR(sale.grand_total)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">{getStatusBadge(sale.qris_status || sale.payment_method)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}