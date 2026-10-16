'use client';

import { FiSliders } from 'react-icons/fi';

const OPTIONS = [
  {
    name: 'uploadImages',
    label: 'Unggah gambar produk ke Supabase Storage',
    description:
      'Gambar dioptimasi ke WebP lalu diunggah ke folder product-toko (seperti saat menambah produk manual). Jika dimatikan, produk memakai gambar dari src/seeds/images.',
  },
  {
    name: 'createInventory',
    label: 'Buat baris stok awal (0) untuk setiap produk',
    description:
      'Sama seperti perilaku form produk: setiap produk baru langsung punya baris di tabel inventory dengan qty 0.',
  },
  {
    name: 'skipExisting',
    label: 'Lewati produk yang namanya sudah ada',
    description:
      'Mencegah data dobel. Matikan hanya jika Anda memang ingin membuat duplikat dengan nama sama.',
  },
];

export default function SeedOptionsCard({ options, onChange, disabled }) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiSliders className="text-blue-600" size={20} />
        Opsi Seed
      </h2>

      <div className="space-y-3">
        {OPTIONS.map((option) => (
          <label
            key={option.name}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
            } border-gray-200`}
          >
            <input
              type="checkbox"
              name={option.name}
              checked={options[option.name]}
              onChange={onChange}
              disabled={disabled}
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span>
              <span className="block text-sm font-medium text-gray-800">{option.label}</span>
              <span className="block text-xs text-gray-500 mt-0.5">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
