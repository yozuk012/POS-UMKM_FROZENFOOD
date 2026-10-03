"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function ProductPagination({
  currentPage,
  setCurrentPage,
  totalItems,
  itemsPerPage,
  loading,
  displayedCount, // Ini akan menerima nilai products.length dari parent
}) {
  // Hitung total halaman
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 mt-auto">
      {/* Info Jumlah Data */}
      <p className="text-xs text-gray-600 mb-3 sm:mb-0">
        Menampilkan{" "}
        <span className="font-semibold text-gray-900">{displayedCount}</span>{" "}
        dari{" "}
        <span className="font-semibold text-gray-900">{totalItems}</span>{" "}
        produk
      </p>

      {/* Kontrol Navigasi */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1 || loading}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          aria-label="Halaman sebelumnya"
        >
          <FaChevronLeft size={10} /> Prev
        </button>

        <span className="text-xs font-medium text-gray-700 px-2 bg-white border border-gray-200 rounded-lg py-1.5">
          Hal. {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage * itemsPerPage >= totalItems || loading}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          aria-label="Halaman berikutnya"
        >
          Next <FaChevronRight size={10} />
        </button>
      </div>
    </div>
  );
}