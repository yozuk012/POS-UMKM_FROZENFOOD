"use client";

import Image from 'next/image';
import { FaGlobe, FaStore, FaExclamation } from "react-icons/fa";

export default function TransactionProductGrid({ 
  products, 
  onAddToCart, 
  isLoading, 
  channel = 'all' 
}) {
  
  const formatRupiah = (number) => {
    if (number === null || number === undefined || isNaN(number)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-sm text-gray-500 font-medium">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-gray-500 bg-gray-50 rounded-lg m-4 border border-dashed border-gray-300">
        <div className="bg-gray-100 p-4 rounded-full mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-700">Tidak ada produk ditemukan</p>
        <p className="text-sm text-gray-500 mt-1 text-center px-4">
          Coba ubah filter atau tambahkan produk baru.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {products.map((product) => {
        // 1. Normalisasi data harga
        const prices = Array.isArray(product.product_prices) ? product.product_prices : [];
        let displayPrice = Number(product.base_price) || 0;
        let isOnlineMode = false;

        if (channel === 'online') {
          const onlinePriceData = prices.find(p => {
            const cleanChannel = p?.channel ? String(p.channel).toLowerCase().trim() : '';
            return ['online', 'shopee', 'tokopedia', 'grabmart', 'gojek'].includes(cleanChannel);
          });
          
          if (onlinePriceData) {
            displayPrice = Number(onlinePriceData.price) || displayPrice;
            isOnlineMode = true;
          }
        } else {
          const offlinePriceData = prices.find(p => {
            const cleanChannel = p?.channel ? String(p.channel).toLowerCase().trim() : '';
            return cleanChannel === 'offline';
          });
          
          if (offlinePriceData) {
            displayPrice = Number(offlinePriceData.price) || displayPrice;
          }
          isOnlineMode = false;
        }

        // 2. Hitung diskon
        const discountPct = Number(product.discount_pct) || 0;
        const hasDiscount = discountPct > 0;
        const finalPrice = hasDiscount 
          ? Math.round(displayPrice - (displayPrice * (discountPct / 100))) 
          : displayPrice;

        // 3. PERBAIKAN: Logika Stok
        const stock = product.stock || 0;
        const isOutOfStock = stock === 0;
        const isLowStock = stock > 0 && stock <= 10;

        return (
          <div
            key={product.id}
            // Mencegah klik jika stok habis
            onClick={() => !isOutOfStock && onAddToCart(product)}
            className={`
              bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col group transition-all duration-200
              ${isOutOfStock 
                ? 'opacity-60 grayscale border-gray-200 cursor-not-allowed' 
                : 'hover:shadow-lg hover:border-blue-300 cursor-pointer active:scale-[0.98]'
              }
            `}
          >
            <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className={`object-cover transition-transform duration-200 ${!isOutOfStock && 'group-hover:scale-105'}`}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                {hasDiscount && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                    -{discountPct}%
                  </span>
                )}
                
                {isOnlineMode ? (
                  <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                    <FaGlobe size={8} /> Online
                  </span>
                ) : (
                  <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                    <FaStore size={8} /> Offline
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 flex-1 flex flex-col">
              <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight mb-1 min-h-[2.5rem]">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                {product.sku} • {product.unit}
              </p>
              
              <div className="flex-1"></div>
              
              <div className="mt-2 space-y-1">
                {hasDiscount && (
                  <p className="text-xs text-gray-400 line-through">
                    {formatRupiah(displayPrice)}
                  </p>
                )}
                
                <p className={`text-lg font-bold ${hasDiscount ? 'text-red-600' : (isOnlineMode ? 'text-purple-700' : 'text-blue-600')}`}>
                  {formatRupiah(finalPrice)}
                </p>
                
                {/* PERBAIKAN: Indikator Stok di Kartu */}
                <div className={`text-xs font-medium px-2 py-1.5 rounded-md flex items-center gap-1.5 w-fit ${
                  isOutOfStock 
                    ? 'bg-red-50 text-red-600 border border-red-100' 
                    : isLowStock 
                      ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                      : 'bg-green-50 text-green-700 border border-green-100'
                }`}>
                  {isOutOfStock ? (
                    <>Stok Habis</>
                  ) : isLowStock ? (
                    <>
                      <FaExclamation size={10} /> Sisa {stock}
                    </>
                  ) : (
                    <>Stok: {stock}</>
                  )}
                </div>

                {/* PERBAIKAN: Tombol Tambah dengan kondisi disabled */}
                <button 
                  disabled={isOutOfStock}
                  className={`
                    w-full text-sm font-semibold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm mt-2
                    ${isOutOfStock 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hover:shadow-md'
                    }
                  `}
                >
                  {isOutOfStock ? (
                    "Stok Habis"
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Tambah</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}