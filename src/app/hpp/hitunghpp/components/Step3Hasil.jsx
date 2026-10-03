// src/app/hpp/hitunghpp/components/Step3Hasil.jsx
'use client';

import { FiCheckCircle, FiArrowLeft, FiSave, FiTrendingUp } from 'react-icons/fi';

export default function Step3Hasil({
  namaProduk,
  jumlahProduk,
  totalPembelianBahan,
  totalBiayaLain,
  biayaProduksiTotal,
  hppPerProduk,
  saranHargaJual,
  isSubmitting,
  onSubmit,
  onBack
}) {
  // Helper format rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  // Handle tombol submit
  const handleSubmit = () => {
    if (window.confirm(`Apakah Anda yakin ingin menyimpan HPP untuk "${namaProduk}" sebesar ${formatRupiah(hppPerProduk)} per unit?`)) {
      onSubmit();
    }
  };

  return (
    <main className="px-4 py-6 space-y-4">
      
      {/* Ringkasan Perhitungan */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiCheckCircle className="text-blue-600" />
          Hasil Perhitungan: {namaProduk}
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Total Pembelian Bahan Baku:</span>
            <span className="font-semibold text-gray-800">{formatRupiah(totalPembelianBahan)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Total Biaya Operasional:</span>
            <span className="font-semibold text-gray-800">{formatRupiah(totalBiayaLain)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Total Biaya Produksi (1 Batch):</span>
            <span className="font-semibold text-gray-800">{formatRupiah(biayaProduksiTotal)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Jumlah Produk Dihasilkan (Yield):</span>
            <span className="font-semibold text-gray-800">{jumlahProduk} unit</span>
          </div>
          
          {/* HPP Final */}
          <div className="flex justify-between items-center py-4 bg-blue-50 rounded-lg px-4 mt-4 border border-blue-100">
            <span className="text-gray-800 font-bold text-lg">HPP per Produk:</span>
            <span className="font-bold text-3xl text-blue-600">{formatRupiah(hppPerProduk)}</span>
          </div>
        </div>
      </div>

      {/* Saran Harga Jual (Margin) */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-green-600" />
          Saran Harga Jual
        </h3>
        
        <div className="space-y-4">
          {/* Margin 25% */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs font-bold">
                MARGIN 25%
              </span>
              <span className="text-gray-700 font-semibold text-lg">
                {formatRupiah(saranHargaJual.margin25.hargaJual)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Profit per unit: <span className="font-bold text-green-700">{formatRupiah(saranHargaJual.margin25.profitPerProduk)}</span> | 
              Total Profit: <span className="font-bold text-green-700">{formatRupiah(saranHargaJual.margin25.totalProfit)}</span>
            </p>
          </div>

          {/* Margin 35% */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="bg-green-500 text-white px-3 py-1 rounded-md text-xs font-bold">
                MARGIN 35% (Rekomendasi)
              </span>
              <span className="text-gray-700 font-semibold text-lg">
                {formatRupiah(saranHargaJual.margin35.hargaJual)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Profit per unit: <span className="font-bold text-green-700">{formatRupiah(saranHargaJual.margin35.profitPerProduk)}</span> | 
              Total Profit: <span className="font-bold text-green-700">{formatRupiah(saranHargaJual.margin35.totalProfit)}</span>
            </p>
          </div>

          {/* Margin 50% */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-bold">
                MARGIN 50%
              </span>
              <span className="text-gray-700 font-semibold text-lg">
                {formatRupiah(saranHargaJual.margin50.hargaJual)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Profit per unit: <span className="font-bold text-green-700">{formatRupiah(saranHargaJual.margin50.profitPerProduk)}</span> | 
              Total Profit: <span className="font-bold text-green-700">{formatRupiah(saranHargaJual.margin50.totalProfit)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="space-y-3 pb-8">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              MENYIMPAN KE DATABASE...
            </>
          ) : (
            <>
              <FiSave className="w-5 h-5" />
              SUBMIT & SIMPAN HPP
            </>
          )}
        </button>
        
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FiArrowLeft className="w-5 h-5" />
          KEMBALI KE STEP 2
        </button>
      </div>
    </main>
  );
}