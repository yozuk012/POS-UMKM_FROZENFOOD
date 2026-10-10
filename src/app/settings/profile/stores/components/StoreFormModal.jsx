// src/app/settings/profile/stores/components/StoreFormModal.jsx
'use client';

import { useEffect, useState } from 'react';

export default function StoreFormModal({
  isOpen,
  onClose,
  onSubmit,
  mode, // 'add' atau 'edit'
  isLoading,
  error,
  successMsg,
  formData,
  updateField,
  logoFile,
  setLogoFile,
  qrisFile,
  setQrisFile,
  ownerInfo,
}) {
  // State internal khusus untuk preview gambar (ini adalah urusan UI, bukan business logic)
  const [logoPreview, setLogoPreview] = useState(null);
  const [qrisPreview, setQrisPreview] = useState(null);

  // Reset preview saat modal dibuka/ditutup atau data awal berubah
  useEffect(() => {
    if (isOpen) {
      setLogoPreview(formData.logo_url || null);
      setQrisPreview(formData.qris_code_url || null);
    }
  }, [isOpen, formData.logo_url, formData.qris_code_url]);

  // Handle pemilihan file untuk preview
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setQrisFile(file);
      setQrisPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'edit' ? 'Edit Detail Toko' : 'Tambah Cabang Toko Baru'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body Modal (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Notifikasi Error / Success */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{successMsg}</div>
          )}

          {/* SECTION 1: Informasi Dasar & Alamat */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Informasi Dasar</h3>
            {mode === 'add' && (ownerInfo?.full_name || ownerInfo?.phone) && (
              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-semibold">Data pemilik dari profil utama</p>
                <p>Nama Pemilik: {ownerInfo.full_name || '-'}</p>
                <p>No. Telepon: {ownerInfo.phone || '-'}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Contoh: Cabang Jakarta Selatan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Lokasi</label>
                <select
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                  <option value="frozen_food">Outlet Frozen Food</option>
                  <option value="gudang">Gudang / Pusat Produksi</option>
                  <option value="outlet">Outlet / Cabang Biasa</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
                <textarea
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Branding & QRIS */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Branding & Pembayaran Digital</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo Toko</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
                    Pilih Gambar
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                  </label>
                </div>
              </div>

              {/* Upload QRIS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gambar QRIS</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                    {qrisPreview ? (
                      <img src={qrisPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                    )}
                  </div>
                  {mode === 'edit' && (
                    <label className="cursor-pointer px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
                      Pilih QRIS
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'qris')} />
                    </label>
                  )}
                </div>
              </div>

              {mode === 'add' && formData.qris_code_url && (
                <p className="md:col-span-2 text-xs text-blue-700">
                  QRIS cabang utama digunakan sebagai default. Tidak perlu upload QRIS cabang baru.
                </p>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Merchant QRIS (Opsional)</label>
                <input
                  type="text"
                  value={formData.qris_merchant_id}
                  onChange={(e) => updateField('qris_merchant_id', e.target.value)}
                  placeholder="Contoh: ID.MERCHANT.12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Keuangan & Rekening */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pengaturan Harga & Rekening</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Markup Harga Online Default (%)</label>
                <input
                  type="number"
                  value={formData.default_online_markup_pct}
                  onChange={(e) => updateField('default_online_markup_pct', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Persentase kenaikan harga otomatis untuk penjualan via Shopee/Grab/Gojek.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => updateField('bank_name', e.target.value)}
                  placeholder="BCA / Mandiri / BRI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => updateField('account_number', e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemilik Rek.</label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => updateField('account_name', e.target.value)}
                  placeholder="Atas nama rekening"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Menyimpan...' : (mode === 'edit' ? 'Perbarui Toko' : 'Simpan Toko')}
          </button>
        </div>
      </div>
    </div>
  );
}