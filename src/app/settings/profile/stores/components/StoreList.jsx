// src/app/settings/profile/stores/components/StoreList.jsx
'use client';

import StoreCard from './StoreCard';

export default function StoreList({ stores, onEdit, onToggleStatus, onBackup, onArchive, activeStoreId, onSwitchStore }) {
  // Empty State jika belum ada toko sama sekali
  if (!stores || stores.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Belum Ada Toko</h3>
        <p className="mt-1 text-sm text-gray-500">
          Anda belum menambahkan cabang toko. Klik tombol "Tambah Toko Baru" di atas untuk memulai.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          isActiveStore={String(store.id) === String(activeStoreId)}
          onSwitchStore={() => onSwitchStore && onSwitchStore(store.id)}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onBackup={onBackup}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}