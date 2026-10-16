'use client';

import { useState } from 'react';
import { FiEye, FiSearch } from 'react-icons/fi';

const PREVIEW_LIMIT = 12;

export default function SeedPreviewTable({ products }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(keyword) ||
          product.sku.toLowerCase().includes(keyword) ||
          product.category_name.toLowerCase().includes(keyword)
      )
    : products;

  const visible = isOpen ? filtered : filtered.slice(0, PREVIEW_LIMIT);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FiEye className="text-blue-600" size={20} />
          Pratinjau Data Produk
        </h2>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors shrink-0"
        >
          {isOpen ? 'Tampilkan lebih sedikit' : `Tampilkan semua (${filtered.length})`}
        </button>
      </div>

      {/* Pencarian */}
      <div className="relative mb-3">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama, SKU, atau kategori..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-lg">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Produk</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">SKU</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Kategori</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Satuan</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Harga</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map((product) => (
              <tr key={product.sku} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-800">{product.name}</td>
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{product.sku}</td>
                <td className="px-3 py-2 text-gray-500">{product.category_name}</td>
                <td className="px-3 py-2 text-gray-500">{product.unit}</td>
                <td className="px-3 py-2 text-right text-gray-400">0</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500 text-xs">
                  Tidak ada produk yang cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isOpen && filtered.length > PREVIEW_LIMIT && (
        <p className="text-xs text-gray-500 mt-2">
          Menampilkan {visible.length} dari {filtered.length} produk.
        </p>
      )}
    </div>
  );
}
