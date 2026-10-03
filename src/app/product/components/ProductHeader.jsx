"use client";

import { FaPlus } from "react-icons/fa";

export default function ProductHeader({ openAddModal }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Daftar Produk</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Kelola stok, harga, dan foto produk Anda.
        </p>
      </div>
      <button
        onClick={openAddModal}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        aria-label="Tambah produk baru"
      >
        <FaPlus size={12} />
        <span>Tambah Produk</span>
      </button>
    </div>
  );
}