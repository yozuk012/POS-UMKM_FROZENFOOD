"use client";

import { FaPlus } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";

export default function ProductHeader({ openAddModal, onOpenCopyModal }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Daftar Produk</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Kelola stok, harga, dan foto produk Anda.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {onOpenCopyModal && (
          <button
            onClick={onOpenCopyModal}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg shadow-xs transition-colors"
            title="Salin produk dari cabang lain"
          >
            <FiCopy size={13} className="text-blue-600" />
            <span>Salin Produk</span>
          </button>
        )}
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          aria-label="Tambah produk baru"
        >
          <FaPlus size={12} />
          <span>Tambah Produk</span>
        </button>
      </div>
    </div>
  );
}