'use client';

import { FiTrendingDown, FiInfo } from 'react-icons/fi';

export default function ExpenseSummary({ totalOperationalCost, isLoading }) {
  
  // Helper format rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka || 0);
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white animate-pulse">
        <div className="h-6 bg-white/20 rounded w-1/3 mb-2"></div>
        <div className="h-10 bg-white/20 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
      {/* Dekorasi Background */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <FiTrendingDown className="w-5 h-5 text-orange-100" />
          <h3 className="text-sm md:text-base font-semibold text-orange-100 tracking-wide uppercase">
            Total Pengeluaran Operasional Bulan Ini
          </h3>
        </div>
        
        <div className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
          {formatRupiah(totalOperationalCost)}
        </div>

        <div className="mt-4 flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <FiInfo className="w-5 h-5 text-orange-200 flex-shrink-0 mt-0.5" />
          <p className="text-xs md:text-sm text-orange-50 leading-relaxed">
            Angka ini adalah akumulasi biaya tidak langsung (Listrik, Gas, Sewa, Gaji, dll) 
            yang akan dikurangkan dari Laba Kotor Anda di halaman Laporan untuk mendapatkan <strong>Laba Bersih</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}