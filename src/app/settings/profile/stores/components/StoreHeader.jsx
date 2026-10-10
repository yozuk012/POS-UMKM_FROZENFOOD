// src/app/settings/profile/stores/components/StoreHeader.jsx
'use client';

export default function StoreHeader({ totalStores, activeStores, maxLimit, onAddStoreClick, stores, activeStoreId, onSwitchStore }) {
  // Hitung persentase atau sisa slot untuk info visual
  const remainingSlots = maxLimit - totalStores;
  const isLimitReached = remainingSlots <= 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Kiri: Judul & Deskripsi */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Cabang Toko</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola profil, alamat, dan informasi pembayaran untuk setiap cabang usaha Anda.
          </p>
        </div>

        {/* Kanan: Tombol Aksi */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="sr-only">Toko aktif</span>
            <select
              value={activeStoreId || stores.find((store) => store.is_active)?.id || ''}
              onChange={(event) => onSwitchStore(event.target.value)}
              className="max-w-44 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={!stores.length}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id} disabled={!store.is_active}>
                  {store.name}{store.is_active ? '' : ' (Nonaktif)'}
                </option>
              ))}
            </select>
          </label>
          {/* Badge Ringkasan */}
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <div className={`w-2 h-2 rounded-full ${activeStores > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {activeStores} Aktif
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">
              {totalStores}/{maxLimit} Toko
            </span>
          </div>

          {/* Tombol Tambah Toko */}
          <button
            onClick={onAddStoreClick}
            disabled={isLimitReached}
            className={`
              inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all
              ${isLimitReached 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'}
            `}
          >
            {/* Icon Plus (Inline SVG agar tidak perlu install library icon) */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {isLimitReached ? 'Limit Tercapai' : 'Tambah Toko Baru'}
          </button>
        </div>
      </div>

      {/* Notifikasi jika limit hampir atau sudah tercapai (Opsional tapi bagus untuk UX) */}
      {remainingSlots <= 2 && remainingSlots > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-yellow-800">
            Perhatian: Anda hanya memiliki <strong>{remainingSlots} sisa slot</strong> untuk menambah toko baru.
          </p>
        </div>
      )}
    </div>
  );
}