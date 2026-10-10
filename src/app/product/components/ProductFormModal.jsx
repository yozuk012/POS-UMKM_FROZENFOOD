"use client";

import { FaTimes, FaCamera, FaCheckCircle, FaBan } from "react-icons/fa";

export default function ProductFormModal({
  isModalOpen,
  closeModal,
  editingId,
  handleSubmit,
  error,
  isSubmitting,
  formData,
  handleChange,
  handleFileChange,
  stores,
  categories,
}) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/10 md:bg-black/50 pointer-events-none md:pointer-events-auto transition-opacity"
        onClick={closeModal}
      />

      {/* Modal Content */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white w-full md:max-w-lg md:rounded-xl shadow-2xl rounded-t-2xl max-h-[90vh] flex flex-col border-t md:border border-gray-200 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 fade-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-bold text-gray-800">
            {editingId ? "Edit Produk" : "Tambah Produk Baru"}
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Tutup modal"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* SECTION 1: Info Dasar */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">
              Info Dasar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Toko <span className="text-red-500">*</span>
                </label>
                <select
                  name="store_id"
                  value={formData.store_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">-- Pilih Toko --</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories
                    .filter((c) => c.store_id.toString() === formData.store_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Misal: Nugget Ayam Original 500gr"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  SKU / Kode Barang
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  placeholder="Otomatis atau ketik manual"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Satuan Jual
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="pack">Pack</option>
                  <option value="pcs">Pcs</option>
                  <option value="box">Box</option>
                  <option value="kg">Kg</option>
                </select>
              </div>
            </div>
          </div>

          {editingId && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">
                Harga & HPP
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Harga Offline
                  </label>
                  <input
                    type="number"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    HPP Modal
                  </label>
                  <input
                    type="number"
                    value={formData.hpp}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Hanya harga offline yang dapat diubah di halaman ini. HPP diperbarui dari menu Hitung HPP.
              </p>
            </div>
          )}

          {/* SECTION 2: Stok & Penjualan */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">
              Stok & Penjualan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Stok Awal <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2 rounded-lg border border-gray-200 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_online"
                    checked={formData.is_online}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Masukkan ke penjualan online
                  </span>
                </label>
                {formData.is_online && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Persentase kenaikan harga online
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="online_markup_pct"
                        value={formData.online_markup_pct}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Toggle Status Aktif/Nonaktif */}
              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    {formData.is_active ? (
                      <FaCheckCircle size={12} className="text-green-600" />
                    ) : (
                      <FaBan size={12} className="text-red-500" />
                    )}
                    {formData.is_active ? "Produk Aktif" : "Produk Nonaktif"}
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* SECTION 3: Foto Produk */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">
              Foto Produk
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                {formData.image_preview ? (
                  <img
                    src={formData.image_preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaCamera className="text-gray-400 text-xl" />
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Unggah Foto (Max 2MB)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Format: JPG, PNG, WEBP. Gambar lama akan otomatis terhapus jika diganti.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
  );
}