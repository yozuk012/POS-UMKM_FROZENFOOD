"use client";

import { FaBoxOpen, FaEdit, FaTrash, FaPowerOff, FaGlobe, FaExclamation, FaPlus } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";

// Helper lokal
const formatRupiah = (number) => {
  if (number === null || number === undefined || number === "") return "Rp 0";
  return "Rp " + Number(number).toLocaleString("id-ID");
};

const getDiscountedPrice = (price, discountPct) => {
  const pct = parseFloat(discountPct) || 0;
  if (pct <= 0) return null;
  return Math.round(parseFloat(price) - (parseFloat(price) * (pct / 100)));
};

// BATAS STOK MENIPIS (Bisa Anda ubah sesuai kebutuhan, misal: 5, 10, atau 15)
const LOW_STOCK_LIMIT = 10;

export default function ProductList({
  loading,
  products,
  searchQuery,
  filterCategory,
  filterChannel,
  filterStatus,
  openEditModal,
  toggleProductStatus,
  deleteProduct,
  onOpenCopyModal,
  openAddModal,
}) {
  const hasActiveFilters =
    searchQuery ||
    filterCategory !== "all" ||
    filterChannel !== "all" ||
    filterStatus !== "all";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      {loading ? (
        <div className="p-8 text-center text-gray-500 text-sm min-h-[200px] flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          Memuat data produk...
        </div>
      ) : products.length === 0 ? (
        <div className="p-10 text-center text-gray-500 min-h-[220px] flex flex-col items-center justify-center">
          <FaBoxOpen className="text-4xl text-gray-300 mb-3" />
          <p className="text-base font-bold text-gray-800">
            {hasActiveFilters ? "Tidak ada produk yang cocok dengan filter." : "Belum Ada Produk"}
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            {hasActiveFilters
              ? "Coba ubah kata kunci atau reset filter Anda."
              : 'Belum ada produk di cabang ini. Anda dapat menyalin data produk dari cabang lain (termasuk resep & bahan baku) atau menambahkan produk baru.'}
          </p>
          {!hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              {onOpenCopyModal && (
                <button
                  type="button"
                  onClick={onOpenCopyModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold text-sm transition-colors border border-blue-200 active:scale-95 cursor-pointer shadow-xs"
                >
                  <FiCopy className="w-4 h-4 text-blue-600" />
                  <span>Salin Produk dari Cabang Lain</span>
                </button>
              )}
              {openAddModal && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-semibold text-sm transition-colors shadow-sm active:scale-95 cursor-pointer"
                >
                  <FaPlus className="w-3.5 h-3.5" />
                  <span>Tambah Produk Baru</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* === TAMPILAN MOBILE (Card List Compact) === */}
          <div className="md:hidden divide-y divide-gray-100">
            {products.map((prod) => {
              const offlineFinalPrice = getDiscountedPrice(prod.base_price, prod.discount_pct);
              const onlineFinalPrice = prod.has_online_price 
                ? getDiscountedPrice(prod.online_price, prod.discount_pct) 
                : null;

              return (
                <div key={prod.id} className="p-3 flex gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-gray-200">
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <FaBoxOpen className="text-gray-300 text-xl" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{prod.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{prod.category_name} • {prod.unit}</p>
                    
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-medium w-12">Offline:</span>
                        {offlineFinalPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-red-600">{formatRupiah(offlineFinalPrice)}</span>
                            <span className="text-[10px] text-gray-400 line-through">{formatRupiah(prod.base_price)}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-800">{formatRupiah(prod.base_price)}</span>
                        )}
                      </div>

                      {prod.has_online_price && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-purple-600 font-medium w-12 flex items-center gap-1">
                            <FaGlobe size={8} /> Online:
                          </span>
                          {onlineFinalPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-purple-700">{formatRupiah(onlineFinalPrice)}</span>
                              <span className="text-[10px] text-gray-400 line-through">{formatRupiah(prod.online_price)}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-purple-700">{formatRupiah(prod.online_price)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        {/* PERBAIKAN: Logika Badge Stok (Habis / Menipis / Aman) */}
                        {prod.stock === 0 ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-50 text-red-700 border border-red-100">
                            Habis
                          </span>
                        ) : prod.stock <= LOW_STOCK_LIMIT ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                            <FaExclamation size={8} /> Sisa {prod.stock}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-green-50 text-green-700 border border-green-100">
                            Stok: {prod.stock}
                          </span>
                        )}

                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${prod.is_active !== false ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {prod.is_active !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(prod)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="Edit produk">
                          <FaEdit size={12} />
                        </button>
                        <button onClick={() => toggleProductStatus(prod)} title={prod.is_active !== false ? 'Nonaktifkan produk' : 'Aktifkan produk'} className={`p-1.5 rounded-lg transition-colors ${prod.is_active !== false ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`} aria-label="Toggle status produk">
                          <FaPowerOff size={12} />
                        </button>
                        <button onClick={() => deleteProduct(prod.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Hapus produk">
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* === TAMPILAN DESKTOP (Tabel) === */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produk</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Harga (Offline / Online)</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Stok</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((prod) => {
                  const offlineFinalPrice = getDiscountedPrice(prod.base_price, prod.discount_pct);
                  const onlineFinalPrice = prod.has_online_price 
                    ? getDiscountedPrice(prod.online_price, prod.discount_pct) 
                    : null;

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-gray-200">
                            {prod.image_url ? (
                              <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <FaBoxOpen className="text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{prod.name}</p>
                            <p className="text-xs text-gray-500">{prod.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{prod.category_name}</td>
                      
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium w-14">Offline:</span>
                            {offlineFinalPrice ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-red-600">{formatRupiah(offlineFinalPrice)}</span>
                                <span className="text-xs text-gray-400 line-through">{formatRupiah(prod.base_price)}</span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-gray-900">{formatRupiah(prod.base_price)}</span>
                            )}
                          </div>
                          
                          {prod.has_online_price && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-purple-600 font-medium w-14 flex items-center gap-1">
                                <FaGlobe size={10} /> Online:
                              </span>
                              {onlineFinalPrice ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-purple-700">{formatRupiah(onlineFinalPrice)}</span>
                                  <span className="text-xs text-gray-400 line-through">{formatRupiah(prod.online_price)}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-bold text-purple-700">{formatRupiah(prod.online_price)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* PERBAIKAN: Kolom Stok dengan Logika Peringatan */}
                      <td className="px-4 py-3 text-center">
                        {prod.stock === 0 ? (
                          <span className="text-xs px-2 py-1 rounded font-medium bg-red-50 text-red-700">
                            Habis
                          </span>
                        ) : prod.stock <= LOW_STOCK_LIMIT ? (
                          <span className="text-xs px-2 py-1 rounded font-medium bg-amber-50 text-amber-700 flex items-center justify-center gap-1">
                            <FaExclamation size={10} /> Sisa {prod.stock}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded font-medium bg-green-50 text-green-700">
                            {prod.stock}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${prod.is_active !== false ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {prod.is_active !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditModal(prod)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="Edit produk">
                            <FaEdit size={14} />
                          </button>
                          <button onClick={() => toggleProductStatus(prod)} title={prod.is_active !== false ? 'Nonaktifkan produk' : 'Aktifkan produk'} className={`p-1.5 rounded-lg transition-colors ${prod.is_active !== false ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`} aria-label="Toggle status produk">
                            <FaPowerOff size={14} />
                          </button>
                          <button onClick={() => deleteProduct(prod.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Hapus produk">
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}