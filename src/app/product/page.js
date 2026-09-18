"use client";

import PageLayout from "@/components/PageLayout";
import useProducts from "@/hooks/useProducts";
import { 
  FaPlus, FaEdit, FaTrash, FaTimes, FaBoxOpen, FaCamera, FaGlobe 
} from "react-icons/fa";

export default function ProductsPage() {
  const {
    stores, categories, products, loading,
    formData, editingId, error, isSubmitting, isModalOpen,
    handleChange, handleFileChange, handleSubmit, deleteProduct,
    openAddModal, openEditModal, closeModal,
  } = useProducts();

  // Helper: Format Rupiah (Untuk tampilan data dari database yang masih berupa angka)
  const formatRupiah = (number) => {
    if (number === null || number === undefined || number === '') return "Rp 0";
    return "Rp " + Number(number).toLocaleString("id-ID");
  };

  // Helper: Parse angka dari string format "Rp 43.000" menjadi 43000 (Khusus kalkulasi UI di modal)
  const parseNumberUI = (val) => {
    if (!val) return 0;
    return Number(String(val).replace(/\D/g, '')) || 0;
  };

  // Helper: Hitung harga setelah diskon (Menggunakan data mentah dari database)
  const getDiscountedPrice = (basePrice, discountPct) => {
    const pct = parseFloat(discountPct) || 0;
    if (pct <= 0) return null;
    return parseFloat(basePrice) - (parseFloat(basePrice) * (pct / 100));
  };

  return (
    <PageLayout title="Manajemen Produk">
      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Daftar Produk</h1>
          <p className="text-gray-500 text-xs mt-0.5">Kelola stok, harga, dan foto produk Anda.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          <FaPlus size={12} />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* KONTEN UTAMA (Tabel / Card List) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Memuat data produk...
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaBoxOpen className="mx-auto text-3xl text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-700">Belum ada produk</p>
            <p className="text-xs mt-1">Klik tombol "Tambah Produk" untuk mulai berjualan.</p>
          </div>
        ) : (
          <>
            {/* === TAMPILAN MOBILE (Card List Compact) === */}
            <div className="md:hidden divide-y divide-gray-100">
              {products.map((prod) => {
                const finalPrice = getDiscountedPrice(prod.base_price, prod.discount_pct);
                return (
                  <div key={prod.id} className="p-3 flex gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-gray-200">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <FaBoxOpen className="text-gray-300 text-xl" />
                      )}
                    </div>
                    
                    {/* Info Produk */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{prod.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{prod.category_name} • {prod.unit}</p>
                      
                      {/* Harga & Diskon */}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {finalPrice ? (
                          <>
                            <span className="text-xs font-bold text-red-600">{formatRupiah(finalPrice)}</span>
                            <span className="text-[10px] text-gray-400 line-through">{formatRupiah(prod.base_price)}</span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-gray-800">{formatRupiah(prod.base_price)}</span>
                        )}
                      </div>
                      
                      {/* Stok, Online Badge & Aksi */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${prod.stock > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            Stok: {prod.stock}
                          </span>
                          {prod.has_online_price && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1">
                              <FaGlobe size={8} /> Online
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(prod)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <FaEdit size={12} />
                          </button>
                          <button onClick={() => deleteProduct(prod.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Harga</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Stok</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((prod) => {
                    const finalPrice = getDiscountedPrice(prod.base_price, prod.discount_pct);
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
                          {finalPrice ? (
                            <div>
                              <p className="text-sm font-bold text-red-600">{formatRupiah(finalPrice)}</p>
                              <p className="text-xs text-gray-400 line-through">{formatRupiah(prod.base_price)}</p>
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">{formatRupiah(prod.base_price)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${prod.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {prod.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {prod.has_online_price ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium bg-purple-50 text-purple-700">
                              <FaGlobe size={10} /> Online
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Offline</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openEditModal(prod)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <FaEdit size={14} />
                            </button>
                            <button onClick={() => deleteProduct(prod.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

      {/* === MODAL (Bottom Sheet Mobile / Center Desktop) === */}
      {isModalOpen && (
        <div className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center p-0 md:p-4">
          {/* Overlay Background */}
          <div 
            className="absolute inset-0 bg-black/10 md:bg-black/50 pointer-events-none md:pointer-events-auto transition-opacity" 
            onClick={closeModal} 
          />
          
          {/* Modal Box */}
          <form onSubmit={handleSubmit} className="relative bg-white w-full md:max-w-lg md:rounded-xl shadow-2xl rounded-t-2xl max-h-[90vh] flex flex-col border-t md:border border-gray-200 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 fade-in duration-200">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <h2 className="text-sm font-bold text-gray-800">
                {editingId ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button type="button" onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <FaTimes size={14} />
              </button>
            </div>

            {/* Body Modal (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                  <span className="font-bold">Error:</span> {error}
                </div>
              )}

              {/* SECTION 1: Info Dasar */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Info Dasar</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Toko <span className="text-red-500">*</span></label>
                    <select name="store_id" value={formData.store_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="">-- Pilih Toko --</option>
                      {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                    <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="">-- Pilih Kategori --</option>
                      {categories
                        .filter(c => c.store_id.toString() === formData.store_id)
                        .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nama Produk <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Misal: Nugget Ayam Original 500gr" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SKU / Kode Barang</label>
                    <input type="text" name="sku" value={formData.sku} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Satuan Jual</label>
                    <select name="unit" value={formData.unit} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                      <option value="pack">Pack</option>
                      <option value="pcs">Pcs</option>
                      <option value="box">Box</option>
                      <option value="kg">Kg</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Harga & Modal */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Harga & Modal</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Harga Asli <span className="text-red-500">*</span></label>
                    {/* PERBAIKAN: type="text" agar bisa menampilkan "Rp 43.000" */}
                    <input 
                      type="text" 
                      name="base_price" 
                      value={formData.base_price} 
                      onChange={handleChange} 
                      placeholder="Rp 0" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Diskon (%) <span className="text-gray-400 font-normal">(Opsional)</span></label>
                    <input type="number" name="discount_pct" value={formData.discount_pct} onChange={handleChange} placeholder="0" min="0" max="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">HPP (Modal) <span className="text-gray-400 font-normal">(Opsional)</span></label>
                    {/* PERBAIKAN: type="text" agar bisa menampilkan "Rp 30.000" */}
                    <input 
                      type="text" 
                      name="hpp" 
                      value={formData.hpp} 
                      onChange={handleChange} 
                      placeholder="Rp 0" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Stok & Penjualan Online */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Stok & Penjualan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stok Awal <span className="text-red-500">*</span></label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="0" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div className="flex flex-col justify-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                      <input type="checkbox" name="is_sell_online" checked={formData.is_sell_online} onChange={handleChange} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <FaGlobe size={12} className="text-purple-600" /> Jual di Aplikasi Online
                      </span>
                    </label>
                  </div>
                </div>

                {/* Input Markup Harga Online */}
                {formData.is_sell_online && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-medium text-purple-800 mb-1">
                      Kenaikan Harga Online (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        name="online_markup_pct" 
                        value={formData.online_markup_pct} 
                        onChange={handleChange} 
                        placeholder="25" 
                        min="0" 
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white" 
                      />
                      <span className="text-xs text-purple-600 font-medium whitespace-nowrap">
                        {/* PERBAIKAN: Menggunakan parseNumberUI agar kalkulasi tidak error (NaN) saat ada huruf "Rp" atau titik */}
                        (Est. Harga: {formatRupiah(parseNumberUI(formData.base_price) * (1 + (parseNumberUI(formData.online_markup_pct) / 100)))})
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-600 mt-1">
                      *Harga akan otomatis dinaikkan sebesar persentase ini untuk menutupi biaya admin marketplace.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 4: Foto Produk */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Foto Produk</h3>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.image_preview ? (
                      <img src={formData.image_preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <FaCamera className="text-gray-400 text-xl" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unggah Foto (Max 2MB)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange} 
                      className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Format: JPG, PNG. Gambar lama akan otomatis terhapus jika diganti.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50/80 shrink-0 rounded-b-xl md:rounded-b-xl">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Produk"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </PageLayout>
  );
}