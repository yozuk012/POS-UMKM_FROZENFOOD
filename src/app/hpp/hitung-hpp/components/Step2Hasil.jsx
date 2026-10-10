'use client';

import { FiCheckCircle, FiArrowLeft, FiSave, FiTrendingUp, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { getRecommendedPrice } from '@/lib/productUtils';

export default function Step2Hasil({
  namaProduk,
  jumlahProduk,
  totalHppBahanBaku,
  isSubmitting,
  onSubmit,
  onBack
}) {
  // 1. Kalkulasi HPP Bahan Baku Per Unit
  const qty = parseFloat(jumlahProduk) || 1;
  const hppPerUnit = totalHppBahanBaku / qty;

  // 2. Kalkulasi Saran Harga Jual 
  // Kita gunakan margin yang lebih tinggi (50% - 75%) sebagai "pengaman" 
  // untuk menutup biaya operasional yang dicatat di halaman terpisah.
  const hitungMargin = (persen, gunakanHargaBulat = false) => {
    const hargaJual = gunakanHargaBulat
      ? getRecommendedPrice(hppPerUnit, persen)
      : hppPerUnit * (1 + persen / 100);
    const profitPerProduk = hargaJual - hppPerUnit;
    const totalProfit = profitPerProduk * qty;
    
    return {
      hargaJual: Math.round(hargaJual),
      profitPerProduk: Math.round(profitPerProduk),
      totalProfit: Math.round(totalProfit)
    };
  };

  const saranHarga = {
    margin35: hitungMargin(35), // Minimum
    margin50: hitungMargin(50, true), // Rekomendasi (Aman untuk operasional)
    margin75: hitungMargin(75), // Premium
  };

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
    const confirmMsg = `Anda akan menyimpan:\n\n` +
      `• Produk: ${namaProduk}\n` +
      `• HPP Bahan Baku: ${formatRupiah(hppPerUnit)} / ${qty} unit\n` +
      `• Total Modal Bahan: ${formatRupiah(totalHppBahanBaku)}\n\n` +
      `Catatan: Jangan lupa catat biaya operasional (gas, listrik, dll) di halaman Pengeluaran agar laporan laba rugi akurat.\n\n` +
      `Lanjutkan penyimpanan?`;
      
    if (window.confirm(confirmMsg)) {
      onSubmit();
    }
  };

  return (
    <main className="px-4 py-6 space-y-6">
      
      {/* 1. Ringkasan Perhitungan HPP */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-5 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiCheckCircle className="text-blue-600" />
          Rincian HPP: {namaProduk || 'Produk Baru'}
        </h3>
        
        <div className="space-y-4">
          {/* Breakdown Batch */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Modal 1 Batch</p>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Total Biaya Bahan Baku:</span>
              <span className="font-bold text-gray-800 text-lg">{formatRupiah(totalHppBahanBaku)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-600 text-sm">Jumlah Hasil (Yield):</span>
              <span className="font-semibold text-blue-700">{qty} unit</span>
            </div>
          </div>

          {/* HPP PER UNIT Highlight */}
          <div className="flex justify-between items-center py-4 bg-blue-50 rounded-xl px-5 border border-blue-200">
            <div className="flex flex-col">
              <span className="text-blue-800 font-bold text-lg">HPP BAHAN / Unit</span>
              <span className="text-xs text-blue-600 font-medium">Modal murni bahan baku</span>
            </div>
            <span className="font-bold text-3xl text-blue-700">{formatRupiah(hppPerUnit)}</span>
          </div>

          {/* Edukasi Operasional */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
            <FiAlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800 mb-1">Penting: Biaya Operasional</p>
              <p className="text-xs text-orange-700 leading-relaxed">
                Biaya seperti Gas, Listrik, Air, dan Kemasan <strong>tidak termasuk</strong> di angka HPP di atas. 
                Pastikan Anda mencatatnya di halaman <strong>Pengeluaran</strong>. 
                Gunakan rekomendasi harga jual di bawah ini (Margin 50%+) agar tetap profit setelah dikurangi biaya operasional.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Saran Harga Jual (Berdasarkan HPP Bahan + Buffer Operasional) */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-green-600 w-5 h-5" />
          <h3 className="text-lg font-bold text-gray-800">Rekomendasi Harga Jual</h3>
        </div>
        
        <div className="space-y-3">
          {/* Margin 35% */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-center mb-2">
              <span className="bg-yellow-500 text-white px-3 py-1 rounded-md text-xs font-bold">
                MARGIN 35% (Minimal)
              </span>
              <span className="text-gray-800 font-bold text-lg">
                {formatRupiah(saranHarga.margin35.hargaJual)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Profit kotor/unit: <span className="font-bold text-green-700">{formatRupiah(saranHarga.margin35.profitPerProduk)}</span>
            </p>
          </div>

          {/* Margin 50% (REKOMENDASI) */}
          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 shadow-sm transition-transform hover:scale-[1.02] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              PALING AMAN
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="bg-green-600 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" /> MARGIN 50% (Rekomendasi)
              </span>
              <span className="text-gray-800 font-bold text-xl">
                {formatRupiah(saranHarga.margin50.hargaJual)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Profit kotor/unit: <span className="font-bold text-green-700">{formatRupiah(saranHarga.margin50.profitPerProduk)}</span> 
              <span className="block mt-1 text-green-800 font-medium">✓ Cukup untuk menutup estimasi biaya operasional</span>
            </p>
          </div>

          {/* Margin 75% */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-center mb-2">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-bold">
                MARGIN 75% (Premium)
              </span>
              <span className="text-gray-800 font-bold text-lg">
                {formatRupiah(saranHarga.margin75.hargaJual)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Profit kotor/unit: <span className="font-bold text-green-700">{formatRupiah(saranHarga.margin75.profitPerProduk)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Tombol Aksi */}
      <div className="space-y-3 pb-8">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
              : 'bg-green-600 hover:bg-green-700 text-white transform active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              MENYIMPAN DATA PRODUK & RESEP...
            </>
          ) : (
            <>
              <FiSave className="w-5 h-5" />
              SIMPAN PRODUK & RESEP
            </>
          )}
        </button>
        
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FiArrowLeft className="w-5 h-5" />
          KEMBALI KE STEP 1
        </button>
      </div>
    </main>
  );
}