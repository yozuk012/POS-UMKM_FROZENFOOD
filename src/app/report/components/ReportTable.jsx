"use client";

import React, { useState, useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

// Helper untuk format tanggal (DD-MM-YYYY)
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Helper untuk format Rupiah
const formatRupiah = (number) => {
  if (number === null || number === undefined) return "0";
  return new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

export default function ReportTable({ reports = [], loading }) {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(reports.length / itemsPerPage);

  // Reset page ke 1 saat data filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [reports]);

  // Derived state for current page items
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentReports = reports.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
        <span className="ml-3 text-gray-600 text-sm">Memuat data laporan...</span>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 px-4 text-center">
        <p className="text-base font-medium mb-1">Tidak ada data laporan</p>
        <p className="text-xs">Coba ubah filter tanggal atau channel penjualan.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4 bg-white">
      
      {/* Tampilan Mobile: List/Cards */}
      <div className="block sm:hidden space-y-3">
        {currentReports.map((report, index) => (
          <div 
            key={report.orderId + "-" + index}
            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-gray-900 text-sm">#{report.orderId}</span>
                <p className="text-xs text-gray-500">{formatDate(report.dateTime)}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900 text-sm">{formatRupiah(report.totalSales)}</span>
                <p className="text-xs text-gray-500 truncate max-w-[150px]">{report.customerName}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                report.channel === 'Online' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {report.channel}
              </span>
              
              <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                report.status.includes('Gagal') 
                  ? 'bg-red-100 text-red-800' 
                  : report.status.includes('Pending') 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
              }`}>
                {report.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tampilan Desktop: Tabel */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">No</th>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">Order Id</th>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">Customer</th>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">Date</th>
              <th scope="col" className="px-4 py-3 font-bold text-right whitespace-nowrap">Amount</th>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">Status</th>
              <th scope="col" className="px-4 py-3 font-bold whitespace-nowrap">Jenis</th>
            </tr>
          </thead>
          <tbody>
            {currentReports.map((report, index) => (
              <tr 
                key={report.orderId + "-" + index} 
                className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  {startIndex + index + 1}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  #{report.orderId}
                </td>
                <td className="px-4 py-3 whitespace-nowrap max-w-[150px] truncate" title={report.customerName}>
                  {report.customerName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(report.dateTime)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                  {formatRupiah(report.totalSales)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    report.status.includes('Gagal') 
                      ? 'bg-red-100 text-red-800' 
                      : report.status.includes('Pending') 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    report.channel === 'Online' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {report.channel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 bg-gray-50 px-4 py-3 border border-gray-200 rounded-lg">
          <span className="text-xs sm:text-sm text-gray-700">
            Menampilkan <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(startIndex + itemsPerPage, reports.length)}</span> dari <span className="font-semibold">{reports.length}</span> data
          </span>
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
            >
              <HiChevronLeft className="w-5 h-5 sm:mr-1" />
              <span className="hidden sm:inline text-sm font-medium">Sebelumnya</span>
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
            >
              <span className="hidden sm:inline text-sm font-medium">Selanjutnya</span>
              <HiChevronRight className="w-5 h-5 sm:ml-1" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}