'use client';

import { FiUser, FiMapPin, FiPhone, FiBriefcase } from 'react-icons/fi';

/**
 * BasicInfoForm
 * Komponen presentasional untuk input data dasar pemilik dan toko.
 * 
 * @param {Object} formData - Object berisi { fullName, storeName, address, phoneNumber }
 * @param {Function} onChange - Fungsi handler dari hook untuk update state
 */
export default function BasicInfoForm({ formData, onChange }) {
  return (
    <div className="space-y-5">
      
      {/* 1. Nama Lengkap Pemilik (Tabel: merchants) */}
      <div>
        <label className="block text-white text-sm font-bold mb-2 tracking-wide">
          NAMA LENGKAP PEMILIK
        </label>
        <div className="relative">
          <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="fullName"
            value={formData.fullName || ''}
            onChange={onChange}
            placeholder="Masukkan nama lengkap Anda"
            className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            required
          />
        </div>
      </div>

      {/* 2. Nama Toko (Tabel: stores) */}
      <div>
        <label className="block text-white text-sm font-bold mb-2 tracking-wide">
          NAMA TOKO / CABANG
        </label>
        <div className="relative">
          <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="storeName"
            value={formData.storeName || ''}
            onChange={onChange}
            placeholder="Masukkan nama toko"
            className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            required
          />
        </div>
      </div>

      {/* 3. Alamat Toko (Tabel: stores) */}
      <div>
        <label className="block text-white text-sm font-bold mb-2 tracking-wide">
          ALAMAT TOKO
        </label>
        <div className="relative">
          <FiMapPin className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
          <textarea
            name="address"
            value={formData.address || ''}
            onChange={onChange}
            placeholder="Masukkan alamat lengkap toko"
            rows={3}
            className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none transition-all"
            required
          />
        </div>
      </div>

      {/* 4. Nomor Telepon (Tabel: merchants) */}
      <div>
        <label className="block text-white text-sm font-bold mb-2 tracking-wide">
          NOMOR TELEPON / WHATSAPP
        </label>
        <div className="relative">
          <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber || ''}
            onChange={onChange}
            placeholder="Contoh: 081234567890"
            className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            required
          />
        </div>
      </div>

    </div>
  );
}