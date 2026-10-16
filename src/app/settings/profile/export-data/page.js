'use client';

import { useState, useEffect } from 'react';
import {
  FiDownload,
  FiUpload,
  FiFileText,
  FiShield,
} from 'react-icons/fi';

// Import Layout & Components
import PageLayout from '@/components/PageLayout';
import ExportPanel from './components/ExportPanel';
import ImportPanel from './components/ImportPanel';
import BackupHistoryTable from './components/BackupHistoryTable';

// Import Hooks & Libs 
import { useBackupsData } from '@/hooks/useBackupsData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useActiveStore, resolveActiveStore, setActiveStoreId } from '@/lib/activeStore';

export default function ExportDataPage() {
  const [activeTab, setActiveTab] = useState('export');
  
  // 1. Ambil data user dan store aktif
  const { user } = useAuth();
  const { storeId: persistedStoreId } = useActiveStore();
  
  const userId = user?.id;

  // Fallback: jika belum ada toko aktif yang tersimpan di localStorage
  // (mis. user baru login dan belum pernah switch toko), pilih toko aktif
  // pertama dari database — sama seperti pola hook lain di aplikasi ini.
  useEffect(() => {
    if (!userId || persistedStoreId) return;

    let isCancelled = false;

    const resolveStore = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, is_active')
        .eq('user_id', userId)
        .order('id', { ascending: true });

      if (isCancelled || error) return;

      const activeStore = resolveActiveStore(data);
      // Simpan ke active store global (localStorage + event) agar seluruh
      // aplikasi memakai toko yang sama. useActiveStore() akan ikut re-render.
      if (activeStore) setActiveStoreId(activeStore.id);
    };

    resolveStore();

    return () => {
      isCancelled = true;
    };
  }, [userId, persistedStoreId]);

  // storeId yang dipakai: toko aktif dari useActiveStore() (pilihan user
  // atau hasil fallback di atas)
  const storeId = persistedStoreId;

  // 2. Panggil custom hook useBackupsData
  const {
    backups,
    storeName,
    isLoading,
    isProcessing,
    error,
    setError,
    handleExport,
    handleImport,
    downloadBackupFile
  } = useBackupsData(storeId, userId);

  return (
    // === WRAPPER DENGAN PAGE LAYOUT ===
    <PageLayout title="Backup & Impor Data">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      
        {/* Header Halaman */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <FiFileText className="text-blue-600" size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Manajemen Backup & Impor Data</h1>
            <p className="text-xs sm:text-sm text-gray-500">Amankan data toko Anda atau pulihkan data dari file cadangan.</p>
          </div>
        </div>

        {/* Alert Keamanan (Sangat disarankan untuk UX) */}
        <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <FiShield className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="text-xs sm:text-sm text-amber-800">
            <p className="font-semibold">Catatan Keamanan & Privasi:</p>
            <p className="mt-0.5">File backup yang diunduh mungkin berisi data sensitif (seperti detail produk, harga, dan nomor rekening bank). Pastikan Anda menyimpan file di tempat yang aman dan tidak membagikannya kepada pihak yang tidak berkepentingan.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex sm:space-x-6 min-w-max sm:min-w-0" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 sm:flex-none justify-center whitespace-nowrap py-3 px-4 sm:px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiDownload size={18} />
              Ekspor Data
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 sm:flex-none justify-center whitespace-nowrap py-3 px-4 sm:px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'import'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FiUpload size={18} />
              Impor Data
            </button>
          </nav>
        </div>

        {/* Konten Tab (Panel) */}
        <div className="min-h-[300px]">
          {activeTab === 'export' ? (
            <ExportPanel
              isProcessing={isProcessing}
              handleExport={handleExport}
              error={error}
              setError={setError}
              storeName={storeName}
            />
          ) : (
            <ImportPanel
              isProcessing={isProcessing}
              handleImport={handleImport}
              error={error}
              setError={setError}
            />
          )}
        </div>

        {/* Tabel Riwayat Aktivitas */}
        <BackupHistoryTable
          backups={backups}
          isLoading={isLoading}
          isProcessing={isProcessing}
          downloadBackupFile={downloadBackupFile}
          storeName={storeName}
        />

      </div>
    </PageLayout>
  );
}