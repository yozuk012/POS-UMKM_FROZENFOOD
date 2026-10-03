"use client";

import React from "react";

// Helper function untuk format angka ke Rupiah
const formatRupiah = (number) => {
  if (number === null || number === undefined) return "0";
  return new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

// Komponen Kecil untuk Kartu Statistik
const SummaryCard = ({ title, value, isCurrency = false, highlight = false }) => {
  const displayValue = isCurrency ? `Rp ${formatRupiah(value)}` : value;

  return (
    <div
      className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl shadow-sm transition-transform hover:scale-[1.02] ${
        highlight 
          ? "bg-blue-50 border border-blue-100" // Highlight untuk Laba
          : "bg-white border border-gray-100" // Lebih rapi dengan warna putih
      }`}
    >
      <span className={`text-[10px] sm:text-xs mb-1 text-center leading-tight ${highlight ? "text-blue-700 font-semibold" : "text-gray-500 font-medium"}`}>
        {title}
      </span>
      <span className={`text-sm sm:text-base lg:text-lg font-bold text-center break-words ${highlight ? "text-blue-900" : "text-gray-900"}`}>
        {displayValue}
      </span>
    </div>
  );
};

export default function ReportSummaryCards({ summary }) {
  // Data dummy untuk "Produk Tersedia" karena belum ada di hook useReport
  // Nanti bisa diganti dengan data real dari inventory
  const availableProducts = 15; 

  return (
    <div className="px-4 sm:px-6 py-4 bg-gray-50/50">
      
      {/* Grid: 2 Kolom (Mobile), 3 Kolom (Tablet), 6 Kolom (Desktop Large) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
        <SummaryCard title="Produk Terjual" value={summary.totalProducts || 0} />
        <SummaryCard title="Total Penjualan" value={summary.totalSales} isCurrency />
        <SummaryCard title="Biaya Operasional" value={summary.totalOps} isCurrency />
        
        <SummaryCard title="Total Modal (HPP)" value={summary.totalHpp} isCurrency />
        <SummaryCard title="Total Transaksi" value={summary.totalTransactions || 0} /> 
        <SummaryCard title="Produk Tersedia" value={availableProducts} />
      </div>

      {/* Laba Kotor & Bersih */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200">
        <SummaryCard 
          title="Laba Kotor" 
          value={summary.grossProfit} 
          isCurrency 
          highlight 
        />
        <SummaryCard 
          title="Laba Bersih" 
          value={summary.netProfit} 
          isCurrency 
          highlight 
        />
      </div>

    </div>
  );
}