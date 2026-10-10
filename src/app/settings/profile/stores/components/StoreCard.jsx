// src/app/settings/profile/stores/components/StoreCard.jsx
'use client';

import { useState, useRef, useEffect } from 'react';

export default function StoreCard({ store, isActiveStore, onSwitchStore, onEdit, onToggleStatus, onBackup, onArchive }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Tutup dropdown otomatis jika user klik di luar area dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Konfigurasi Visual Badge Status
  const statusConfig = {
    active: { label: 'Aktif', color: 'bg-green-100 text-green-800' },
    inactive: { label: 'Nonaktif', color: 'bg-gray-100 text-gray-800' },
    archived: { label: 'Diarsipkan', color: 'bg-red-100 text-red-800' },
  };

  const currentStatus = statusConfig[store.status] || statusConfig.inactive;

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all p-5 flex flex-col ${
      isActiveStore ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-gray-100 hover:shadow-md'
    }`}>
      
      {/* Header Card: Logo & Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {isActiveStore && (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-600 text-white">
              Toko Aktif
            </span>
          )}
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${currentStatus.color}`}>
            {currentStatus.label}
          </span>
        </div>
      </div>

      {/* Info Toko */}
      <div className="flex-1 mb-4">
        <h3 className="text-lg font-bold text-gray-900 truncate" title={store.name}>
          {store.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2" title={store.address}>
          {store.address || 'Alamat belum diisi'}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <span className="px-2 py-0.5 bg-gray-50 rounded border border-gray-100 capitalize">
            {store.type || 'frozen_food'}
          </span>
        </div>
      </div>

      {/* Footer Card: Action Menu (Dropdown) */}
      <div className="border-t border-gray-100 pt-3 flex items-center justify-between relative" ref={dropdownRef}>
        <div>
          {!isActiveStore && store.is_active && onSwitchStore && (
            <button
              onClick={onSwitchStore}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Switch ke Toko Ini
            </button>
          )}
        </div>

        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors ml-auto"
          title="Menu Aksi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute bottom-12 right-0 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
            {!isActiveStore && store.is_active && onSwitchStore && (
              <>
                <button
                  onClick={() => { onSwitchStore(); setIsDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Switch ke Toko Ini
                </button>
                <div className="border-t border-gray-100 my-1"></div>
              </>
            )}
            <button onClick={() => { onEdit(store); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              Edit Toko
            </button>
            <button onClick={() => { onToggleStatus(store); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {store.status === 'active' ? 'Nonaktifkan Sementara' : 'Aktifkan Kembali'}
            </button>
            <button onClick={() => { onBackup(store); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Backup Data (Excel)
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button onClick={() => { onArchive(store); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Arsipkan / Tutup Permanen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}