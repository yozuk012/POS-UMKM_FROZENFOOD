'use client';

import { FiImage, FiTrash2, FiCreditCard, FiUser, FiHash } from 'react-icons/fi';

/**
 * PaymentDetailsForm
 * Komponen presentasional untuk detail pembayaran (QRIS & Rekening Bank).
 * Disesuaikan dengan kolom di tabel 'stores' pada database.
 * 
 * @param {string} qrisPreview - URL preview gambar QRIS
 * @param {string} qrisError - Pesan error validasi QRIS (jika ada)
 * @param {Object} formData - Object berisi { qris_merchant_id, bank_name, account_number, account_name }
 * @param {Function} onFileChange - Handler saat file QRIS dipilih
 * @param {Function} onRemoveQris - Handler saat tombol hapus QRIS diklik
 * @param {Function} onInputChange - Handler saat input text berubah
 */
export default function PaymentDetailsForm({
  qrisPreview,
  qrisError,
  formData,
  onFileChange,
  onRemoveQris,
  onInputChange,
}) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* 1. Upload Gambar QRIS */}
      <div>
        <label className="block text-white text-sm font-bold mb-2 tracking-wide">
          GAMBAR QRIS
        </label>
        <div className="relative">
          {/* Dropzone Area */}
          <label className="flex flex-col items-center justify-center w-full h-44 bg-white/90 rounded-xl shadow-sm cursor-pointer overflow-hidden hover:bg-white transition-colors">
            {qrisPreview ? (
              <img
                src={qrisPreview}
                alt="Preview QRIS"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <>
                <FiImage className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-500">
                  Ketuk untuk pilih gambar QRIS
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  JPG, PNG, atau WEBP (maks 2MB)
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          </label>

          {/* Tombol Hapus QRIS */}
          {qrisPreview && (
            <button
              type="button"
              onClick={onRemoveQris}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md transition-colors"
              aria-label="Hapus gambar QRIS"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error Message QRIS */}
        {qrisError && (
          <div className="mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {qrisError}
          </div>
        )}
        <p className="text-xs text-white/80 mt-2">
          Unggah foto atau screenshot kode QRIS toko.
        </p>
      </div>

      {/* 2. ID Merchant QRIS (Sesuai DB: qris_merchant_id) */}
      <div>
        <label className="block text-white text-sm font-bold mb-2 tracking-wide">
          ID MERCHANT QRIS <span className="font-normal text-white/60">(Opsional)</span>
        </label>
        <div className="relative">
          <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="qris_merchant_id"
            value={formData.qris_merchant_id || ''}
            onChange={onInputChange}
            placeholder="Masukkan ID Merchant QRIS"
            className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* 3. Nama Bank (Sesuai DB: bank_name) */}
      <div>
        <label className="block text-white text-sm font-bold mb-2 tracking-wide">
          NAMA BANK
        </label>
        <div className="relative">
          <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="bank_name"
            value={formData.bank_name || ''}
            onChange={onInputChange}
            placeholder="Contoh: BCA, Mandiri, BRI"
            className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* 4. Nomor Rekening (Sesuai DB: account_number) */}
      <div>
        <label className="block text-white text-sm font-bold mb-2 tracking-wide">
          NOMOR REKENING
        </label>
        <div className="relative">
          <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="account_number"
            value={formData.account_number || ''}
            onChange={onInputChange}
            placeholder="Masukkan nomor rekening"
            className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* 5. Nama Pemilik Rekening (Sesuai DB: account_name) */}
      <div>
        <label className="block text-white text-sm font-bold mb-2 tracking-wide">
          NAMA PEMILIK REKENING
        </label>
        <div className="relative">
          <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="account_name"
            value={formData.account_name || ''}
            onChange={onInputChange}
            placeholder="Masukkan nama sesuai buku rekening"
            className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

    </div>
  );
}