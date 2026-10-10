"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import useCategories from "@/hooks/useCategories";
import CopyDataModal from "@/components/CopyDataModal";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaFolderOpen } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";

export default function CategoriesPage() {
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // Ambil semua state dan handler dari hook
  const {
    stores, categories, loading, formData, editingId, error, isSubmitting, isModalOpen,
    handleChange, handleSubmit, deleteCategory,
    openAddModal, openEditModal, closeModal, refetch
  } = useCategories();

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <PageLayout title="Kategori Produk">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Manajemen Kategori</h1>
          <p className="text-gray-500 text-xs mt-0.5">Kelompokkan produk agar rapi saat transaksi.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCopyModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg shadow-xs transition-colors"
            title="Salin kategori dari cabang lain"
          >
            <FiCopy size={13} className="text-blue-600" />
            <span>Salin Kategori</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <FaPlus size={12} />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Memuat data...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaFolderOpen className="mx-auto text-3xl text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-700">Belum ada kategori</p>
            <p className="text-xs mt-1">Klik tombol &quot;Tambah&quot; atau salin dari cabang toko lain.</p>
            <button
              onClick={() => setIsCopyModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 mt-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <FiCopy size={13} />
              <span>Salin Kategori dari Cabang Lain</span>
            </button>
          </div>
        ) : (
          <>
            {/* TAMPILAN MOBILE (Card List Compact) */}
            <div className="md:hidden divide-y divide-gray-100">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{cat.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded truncate max-w-[100px] font-medium">
                        {cat.stores?.name}
                      </span>
                      <span className="text-[10px] text-gray-400">{formatDate(cat.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditModal(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <FaEdit size={14} />
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* TAMPILAN DESKTOP (Tabel) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">No</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Nama Kategori</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Nama Toko</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((cat, index) => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-sm text-gray-600">{index + 1}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{cat.name}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                          {cat.stores?.name}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-500">{formatDate(cat.created_at)}</td>
                      <td className="px-4 py-2.5 text-sm text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditModal(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <FaEdit size={14} />
                          </button>
                          <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL (Center on all devices) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity" 
            onClick={closeModal} 
          />
          
          {/* Modal Box */}
          <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-md rounded-xl shadow-xl max-h-[85vh] flex flex-col border border-gray-200">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 shrink-0">
              <h2 className="text-sm font-bold text-gray-800">
                {editingId ? "Edit Kategori" : "Tambah Kategori"}
              </h2>
              <button type="button" onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <FaTimes size={14} />
              </button>
            </div>

            {/* Body Modal (Scrollable jika konten panjang) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pilih Toko *</label>
                <select
                  name="store_id"
                  value={formData.store_id}
                  onChange={handleChange}
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">-- Pilih Toko --</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Misal: Nugget & Sosis"
                  className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL SALIN KATEGORI */}
      <CopyDataModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        type="categories"
        title="Kategori"
        onCopySuccess={refetch}
      />
    </PageLayout>
  );
}