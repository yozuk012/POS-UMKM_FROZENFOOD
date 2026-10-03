// src/app/hpp/hppproduk/components/HPPProductList.jsx
'use client';

import { FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi';

export default function HPPProductList({ 
  products, 
  isLoading, 
  error, 
  onEdit, 
  onDelete, 
  formatRupiah 
}) {
  // 1. Tampilan Loading
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
        <p className="font-medium">Memuat daftar produk...</p>
      </div>
    );
  }

  // 2. Tampilan Error
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl flex items-center gap-3">
        <FiPackage className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  // 3. Tampilan Kosong (Empty State)
  if (!isLoading && products.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-lg font-semibold">Tidak ada produk HPP</p>
        <p className="text-gray-400 text-sm mt-1">
          Mulai hitung HPP di menu "Hitung HPP" untuk menambahkan produk ke sini.
        </p>
      </div>
    );
  }

  // 4. Tampilan Daftar Produk (List)
  return (
    <div className="space-y-3 pb-24 md:pb-0">
      {products.map((item) => (
        <div 
          key={item.id} 
          className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            
            {/* Thumbnail / Ikon Produk */}
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-yellow-200 shadow-sm">
              {/* Jika nanti ada fitur upload gambar, ganti ini dengan <img src={item.image} /> */}
              <span className="text-3xl" role="img" aria-label="produk">🍽️</span>
            </div>

            {/* Info Produk */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 text-lg truncate">
                {item.namaProduk}
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                {item.kategori}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  HPP
                </span>
                <p className="text-sm font-bold text-blue-700">
                  {formatRupiah(item.hpp)} <span className="text-gray-500 font-normal text-xs">/ {item.unit}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => onEdit(item)}
                className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors shadow-sm"
                title="Edit Resep & HPP"
              >
                <FiEdit2 className="w-4 h-4" />
                EDIT
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm(`Yakin ingin menghapus "${item.namaProduk}"? Data resep terkait juga akan terhapus.`)) {
                    onDelete(item.id);
                  }
                }}
                className="flex items-center justify-center gap-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs px-3 py-2 rounded-lg transition-colors shadow-sm"
                title="Hapus Produk"
              >
                <FiTrash2 className="w-4 h-4" />
                HAPUS
              </button>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}