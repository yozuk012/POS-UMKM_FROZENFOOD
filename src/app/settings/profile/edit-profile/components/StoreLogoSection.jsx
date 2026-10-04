'use client';

import { FiUser, FiCamera } from 'react-icons/fi';

/**
 * StoreLogoSection
 * Komponen presentasional untuk menampilkan dan mengunggah Logo Toko.
 * 
 * @param {string} logoPreview - URL gambar preview logo (dari state hook)
 * @param {string} storeName - Nama toko/brand untuk ditampilkan di bawah logo (opsional)
 * @param {function} onLogoChange - Fungsi handler dari hook saat file dipilih
 */
export default function StoreLogoSection({ logoPreview, storeName, onLogoChange }) {
  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative group">
        {/* Lingkaran Logo */}
        <div className="w-28 h-28 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-lg overflow-hidden border-4 border-white dark:border-gray-600 transition-all group-hover:shadow-xl">
          {logoPreview ? (
            <img 
              src={logoPreview} 
              alt="Logo Toko" 
              className="w-full h-full object-cover"
            />
          ) : (
            <FiUser className="w-14 h-14 text-gray-400 dark:text-gray-500" />
          )}
        </div>
        
        {/* Tombol Edit Icon (Overlay) */}
        <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full cursor-pointer transition-colors shadow-md border-2 border-white dark:border-gray-800 flex items-center justify-center">
          <FiCamera className="w-5 h-5" />
          <input 
            type="file" 
            accept="image/*" 
            onChange={onLogoChange}
            className="hidden"
            aria-label="Ubah logo toko"
          />
        </label>
      </div>
      
      {/* Teks Nama Toko (Opsional, untuk konteks visual) */}
      {storeName && (
        <p className="mt-3 text-center text-gray-700 dark:text-gray-200 text-sm font-semibold">
          {storeName}
        </p>
      )}
      
      <p className="text-center text-gray-500 dark:text-gray-400 text-xs mt-1">
        Ketuk ikon kamera untuk ubah Logo
      </p>
    </div>
  );
}