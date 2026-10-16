'use client';

import { FiAward } from 'react-icons/fi';

const formatIDR = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export default function TopProductsCarousel({ products }) {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiAward className="text-yellow-500" /> Top 5 Produk Terlaris
        </h2>
        <p className="text-gray-500 text-sm text-center py-8">Belum ada data produk terlaris bulan ini.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FiAward className="text-yellow-500" /> Top 5 Produk Terlaris (Bulan Ini)
      </h2>
      {/* Overflow-x-auto dengan snap-x untuk efek carousel horizontal yang smooth */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {products.map((product, index) => (
          <div key={index} className="min-w-[220px] bg-gray-50 rounded-lg p-4 border border-gray-100 snap-start hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                <h4 className="text-sm font-semibold text-gray-800 truncate" title={product.name}>{product.name}</h4>
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-gray-200">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Terjual:</span>
                <span className="font-medium text-gray-900">{product.totalQty} pcs</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Omzet:</span>
                <span className="font-medium text-emerald-600">{formatIDR(product.totalRevenue)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}