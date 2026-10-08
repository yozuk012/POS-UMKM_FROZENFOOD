'use client';

import { FiCalendar, FiEdit2, FiTrash2, FiInbox, FiTag } from 'react-icons/fi';

export default function ExpenseList({ expenses, isLoading, onEdit, onDelete }) {
  
  // Helper format rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  // Helper format tanggal (Indonesia)
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Handle Hapus dengan Konfirmasi
  const handleDeleteClick = (item) => {
    if (window.confirm(`Yakin ingin menghapus pengeluaran "${item.category}" sebesar ${formatRupiah(item.amount)}?`)) {
      onDelete(item.id);
    }
  };

  // State Loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/6 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // State Kosong (Belum ada data)
  if (!isLoading && expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-10 border border-gray-100 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <FiInbox className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 mb-1">Belum Ada Pengeluaran</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Gunakan formulir di atas untuk mulai mencatat biaya operasional toko Anda hari ini.
        </p>
      </div>
    );
  }

  // Tampilan Daftar (List)
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FiInbox className="text-blue-600" />
          Riwayat Pengeluaran
        </h3>
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
          {expenses.length} Catatan
        </span>
      </div>

      <div className="space-y-3">
        {expenses.map((item) => (
          <div 
            key={item.id} 
            className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 transition-all duration-200"
          >
            {/* Sisi Kiri: Info Pengeluaran */}
            <div className="flex-1 mb-3 md:mb-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  <FiTag className="w-3 h-3 text-gray-500" />
                  {item.category}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {formatDate(item.expense_date)}
                </span>
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-600 mt-1 pl-0.5">
                  {item.description}
                </p>
              )}
            </div>

            {/* Sisi Kanan: Nominal & Aksi */}
            <div className="flex items-center justify-between md:justify-end gap-4">
              <span className="text-lg font-bold text-red-600 whitespace-nowrap">
                - {formatRupiah(item.amount)}
              </span>
              
              <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(item)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Edit"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(item)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}