// src/app/history/components/HistoryList.jsx
"use client";

import React from "react";
import { HiCalendar, HiInbox } from "react-icons/hi";

// Helper: warna badge status
const getStatusStyle = (status = "") => {
  if (status.includes("Gagal")) return "bg-red-100 text-red-800";
  if (status.includes("Pending")) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
};

// Helper: warna badge channel
const getChannelStyle = (channel) =>
  channel === "online" ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-700";

// Helper: format Rupiah
const formatRupiah = (number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(number || 0);

const formatItems = (items = []) =>
  items.map((item) => `${item.name} x ${item.qty}`).join(", ");

/* ========== Sub-Komponen: Card untuk Mobile ========== */
const HistoryCard = ({ item, index }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{index + 1}.</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">#{item.orderId}</p>
          <p className="text-xs text-gray-500 truncate">{item.customerName}</p>
          <p className="text-xs text-gray-700 truncate" title={formatItems(item.items)}>
            {formatItems(item.items) || "Tidak ada detail produk"}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-gray-900">Rp {formatRupiah(item.totalAmount)}</p>
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${getChannelStyle(item.channel)}`}>
          {item.channel === "online" ? "Online" : "Offline"}
        </span>
      </div>
    </div>
    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
      <span className="text-xs text-gray-500">
        {item.date} • {item.time}
      </span>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(item.status)}`}>
        {item.status}
      </span>
    </div>
  </div>
);

/* ========== Sub-Komponen: Tabel untuk Desktop ========== */
const HistoryTable = ({ items }) => (
  <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
    <table className="min-w-full text-sm text-left text-gray-700">
      <thead className="text-xs uppercase bg-gray-100 border-b border-gray-200">
        <tr>
          <th className="px-4 py-2.5 font-bold whitespace-nowrap">No</th>
          <th className="px-4 py-2.5 font-bold whitespace-nowrap">Order Id</th>
          <th className="px-4 py-2.5 font-bold whitespace-nowrap">Customer</th>
          <th className="px-4 py-2.5 font-bold whitespace-nowrap">Produk</th>
          <th className="px-4 py-2.5 font-bold whitespace-nowrap">Date</th>
          <th className="px-4 py-2.5 font-bold whitespace-nowrap">Jam</th>
          <th className="px-4 py-2.5 font-bold whitespace-nowrap">Status</th>
          <th className="px-4 py-2.5 font-bold text-right whitespace-nowrap">Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.orderId} className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{index + 1}</td>
            <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">#{item.orderId}</td>
            <td className="px-4 py-2.5 whitespace-nowrap max-w-[160px] truncate" title={item.customerName}>
              {item.customerName}
            </td>
            <td className="px-4 py-2.5 max-w-[220px]" title={formatItems(item.items)}>
              <span className="block truncate">
                {formatItems(item.items) || "Tidak ada detail produk"}
              </span>
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap">{item.date}</td>
            <td className="px-4 py-2.5 whitespace-nowrap">{item.time}</td>
            <td className="px-4 py-2.5 whitespace-nowrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(item.status)}`}>
                {item.status}
              </span>
            </td>
            <td className="px-4 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
              Rp {formatRupiah(item.totalAmount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ========== Sub-Komponen: Section per Bulan ========== */
const MonthSection = ({ monthKey, items }) => (
  <section>
    {/* Header Bulan */}
    <div className="flex items-center justify-between mb-2">
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800">
        <HiCalendar className="w-4 h-4 text-blue-800" />
        {monthKey}
      </h2>
      <span className="text-xs text-gray-500">{items.length} transaksi</span>
    </div>

    {items.length === 0 ? (
      <p className="text-xs text-gray-400 italic bg-white border border-dashed border-gray-200 rounded-lg px-4 py-3">
        Tidak ada transaksi pada bulan ini.
      </p>
    ) : (
      <>
        {/* Mobile: Card List */}
        <div className="sm:hidden space-y-2">
          {items.map((item, index) => (
            <HistoryCard key={item.orderId} item={item} index={index} />
          ))}
        </div>
        {/* Desktop: Tabel */}
        <HistoryTable items={items} />
      </>
    )}
  </section>
);

/* ========== Komponen Utama ========== */
export default function HistoryList({ paginatedData, loading }) {
  
  // State Loading
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
        <span className="ml-3 text-sm text-gray-600">Memuat riwayat...</span>
      </div>
    );
  }

  const monthKeys = Object.keys(paginatedData || {});
  const hasAnyData = monthKeys.some((key) => (paginatedData[key] || []).length > 0);

  // State Kosong
  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 px-4 text-center">
        <HiInbox className="w-10 h-10 text-gray-300 mb-2" />
        <p className="text-base font-medium">Tidak ada riwayat transaksi</p>
        <p className="text-xs mt-1">pada periode yang dipilih.</p>
      </div>
    );
  }

  // Render Section per Bulan
  return (
    <div className="px-4 sm:px-6 py-4 space-y-6">
      {monthKeys.map((monthKey) => (
        <MonthSection 
          key={monthKey} 
          monthKey={monthKey} 
          items={paginatedData[monthKey] || []} 
        />
      ))}
    </div>
  );
}