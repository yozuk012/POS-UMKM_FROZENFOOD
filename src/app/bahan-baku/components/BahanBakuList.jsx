// src/app/bahan-baku/components/BahanBakuList.jsx
'use client';

import { FiPackage, FiEdit2, FiTrash2, FiAlertCircle } from 'react-icons/fi';

export default function BahanBakuList({ 
  bahanBaku, 
  isLoading, 
  error, 
  onEdit, 
  onDelete 
}) {
  // Helper format rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  // State Loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
        <p>Memuat data bahan baku...</p>
      </div>
    );
  }

  // State Error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
        <FiAlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  // State Kosong (Belum ada data)
  if (bahanBaku.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur rounded-xl shadow-sm p-8 text-center border-2 border-dashed border-gray-300">
        <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-700 mb-1">Belum Ada Bahan Baku</h3>
        <p className="text-sm text-gray-500">
          Silakan klik tombol "Tambah Bahan Baku" untuk mulai mendaftarkan bahan mentah Anda.
        </p>
      </div>
    );
  }

  // Tampilan Daftar (Grid Cards)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bahanBaku.map((item) => {
        // Tentukan status stok untuk warna UI
        const stockQty = item.qty_on_hand || 0;
        const isLowStock = stockQty > 0 && stockQty <= 5; // Peringatan jika stok <= 5
        const hasStock = stockQty > 0;

        return (
          <div 
            key={item.id} 
            className="bg-white/95 backdrop-blur rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow flex flex-col justify-between"
          >
            {/* Header Card */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-lg truncate pr-2">
                  {item.name}
                </h3>
                {item.is_perishable && (
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                    Mudah Busuk
                  </span>
                )}
              </div>
              
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Satuan:</span>
                  <span className="font-semibold text-gray-700 capitalize">{item.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Harga Modal:</span>
                  <span className="font-bold text-blue-600">
                    {formatRupiah(item.cost_per_unit)} / {item.unit}
                  </span>
                </div>
                {item.shelf_life_days && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Masa Simpan:</span>
                    <span className="font-semibold text-gray-700">{item.shelf_life_days} hari</span>
                  </div>
                )}
              </div>

              {/* --- BARU: Indikator Stok Gudang --- */}
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Stok Gudang:</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                  hasStock 
                    ? (isLowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {hasStock ? `${stockQty} ${item.unit}` : 'Belum diinput'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => onEdit(item)}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold py-2 rounded-lg transition-colors text-sm"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Yakin ingin menghapus "${item.name}"? Stok di gudang juga akan dihapus.`)) {
                    onDelete(item.id);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 hover:bg-red-100 font-semibold py-2 rounded-lg transition-colors text-sm"
              >
                <FiTrash2 className="w-4 h-4" />
                Hapus
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}