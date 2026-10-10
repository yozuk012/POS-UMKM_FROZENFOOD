// src/app/settings/profile/stores/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStoreManagement } from '@/hooks/useAddStore'; 

// Import Layout & Components
import PageLayout from '@/components/PageLayout';
import StoreHeader from './components/StoreHeader';
import StoreList from './components/StoreList';
import StoreFormModal from './components/StoreFormModal';
import ActionDialog from './components/ActionDialog';
import { getActiveStoreId, setActiveStoreId, ACTIVE_STORE_EVENT } from '@/lib/activeStore';

export default function StoresSettingsPage() {
  // 1. Inisialisasi Hook
  const storeHook = useStoreManagement();

  // 2. State Data Toko (Real dari DB)
  const [stores, setStores] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  // 3. State UI untuk Modal Form (Add/Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [activeStoreId, setActiveStoreIdState] = useState(null);

  // 4. State UI untuk Dialog Konfirmasi (Toggle, Backup, Archive)
  const [actionDialog, setActionDialog] = useState({
    isOpen: false,
    type: null, // 'toggle', 'backup', 'archive'
    store: null,
  });
  
  // State khusus untuk input tanggal di modal Backup
  const [backupDates, setBackupDates] = useState({ from: '', to: '' });

  // --- FUNGSI FETCH DATA ---
  const fetchStores = useCallback(async () => {
    setIsFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapping status DB (is_active) ke UI ('active'/'inactive')
      const mappedStores = data.map((s) => ({
        ...s,
        status: s.is_active ? 'active' : 'inactive',
      }));

      setStores(mappedStores);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    setActiveStoreIdState(getActiveStoreId());
    const handleStoreChange = (event) => setActiveStoreIdState(event.detail || getActiveStoreId());
    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, []);

  // Auto-refresh list jika hook berhasil melakukan mutasi (add/edit/toggle/archive)
  useEffect(() => {
    if (storeHook.successMsg) {
      fetchStores();
      // Tutup modal form jika sedang dalam mode add/edit
      if (isFormModalOpen) {
        setTimeout(() => setIsFormModalOpen(false), 1500); 
      }
    }
  }, [storeHook.successMsg, isFormModalOpen, fetchStores]);

  // --- HANDLERS UI ---
  const openAddModal = () => {
    setModalMode('add');
    storeHook.resetForm();
    storeHook.prepareNewStore();
    setIsFormModalOpen(true);
  };

  const handleSwitchStore = (storeId) => {
    setActiveStoreId(storeId);
    setActiveStoreIdState(String(storeId));
  };

  const handleOpenEdit = (store) => {
    setModalMode('edit');
    setEditingStoreId(store.id);
    storeHook.loadStoreData(store);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    storeHook.resetForm();
    setEditingStoreId(null);
  };

  const handleRealSubmitForm = () => {
    if (modalMode === 'add') {
      storeHook.handleAddStore();
    } else {
      storeHook.handleUpdateStore(editingStoreId);
    }
  };

  // Handlers untuk Action Dialog
  const openActionDialog = (type, store) => {
    setActionDialog({ isOpen: true, type, store });
    if (type === 'backup') {
      // Set default tanggal backup (30 hari terakhir)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
      setBackupDates({
        from: thirtyDaysAgo.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      });
    }
  };

  const closeActionDialog = () => {
    setActionDialog({ isOpen: false, type: null, store: null });
  };

  const confirmAction = async () => {
    const { type, store } = actionDialog;
    if (!store) return;

    if (type === 'toggle') {
      await storeHook.handleToggleStatus(store.id, store.is_active);
    } else if (type === 'archive') {
      await storeHook.handleArchiveStore(store.id);
    } else if (type === 'backup') {
      await storeHook.handleRequestBackup(store.id, backupDates.from, backupDates.to);
    }
    
    closeActionDialog();
  };

  // --- KOMPUTASI STATS ---
  const totalStores = stores.length;
  const activeStores = stores.filter((s) => s.is_active).length;
  const maxLimit = 10;

  // --- KONFIGURASI DIALOG ---
  const getDialogConfig = () => {
    const { type, store } = actionDialog;
    if (!store) return {};

    if (type === 'toggle') {
      const isActive = store.is_active;
      return {
        title: isActive ? 'Nonaktifkan Toko?' : 'Aktifkan Toko?',
        description: isActive
          ? `Toko "${store.name}" akan dinonaktifkan sementara. Kasir tidak bisa menggunakan toko ini untuk transaksi, tetapi data laporan tetap aman.`
          : `Toko "${store.name}" akan diaktifkan kembali dan bisa digunakan untuk transaksi.`,
        confirmLabel: isActive ? 'Nonaktifkan' : 'Aktifkan',
        confirmColor: isActive ? 'red' : 'green',
      };
    } 
    
    if (type === 'archive') {
      return {
        title: 'Arsipkan / Tutup Permanen?',
        description: `Toko "${store.name}" akan ditutup permanen. Toko tidak akan muncul di sistem, namun data historis dan laporan keuangan tetap tersimpan untuk audit. Tindakan ini tidak dapat dibatalkan dengan mudah.`,
        confirmLabel: 'Ya, Arsipkan Toko',
        confirmColor: 'red',
      };
    } 
    
    if (type === 'backup') {
      return {
        title: 'Backup Data Toko (Excel)',
        description: `Unduh laporan lengkap untuk "${store.name}". Pilih rentang tanggal data yang ingin di-backup.`,
        confirmLabel: 'Proses Backup',
        confirmColor: 'blue',
      };
    }
    
    return {};
  };

  const dialogConfig = getDialogConfig();

  return (
    // === WRAPPER DENGAN PAGE LAYOUT ===
    <PageLayout title="Manajemen Toko">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* === SECTION 1: HEADER === */}
        <StoreHeader 
          totalStores={totalStores}
          activeStores={activeStores}
          maxLimit={maxLimit}
          onAddStoreClick={openAddModal}
          stores={stores}
          activeStoreId={activeStoreId}
          onSwitchStore={handleSwitchStore}
        />

        {/* === SECTION 2: LIST === */}
        {isFetching ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Memuat data toko...</p>
          </div>
        ) : (
          <StoreList 
            stores={stores}
            activeStoreId={activeStoreId}
            onSwitchStore={handleSwitchStore}
            onEdit={handleOpenEdit}
            onToggleStatus={(store) => openActionDialog('toggle', store)}
            onBackup={(store) => openActionDialog('backup', store)}
            onArchive={(store) => openActionDialog('archive', store)}
          />
        )}

        {/* === SECTION 3: MODAL FORM (ADD/EDIT) === */}
        <StoreFormModal
          isOpen={isFormModalOpen}
          onClose={closeFormModal}
          onSubmit={handleRealSubmitForm}
          mode={modalMode}
          isLoading={storeHook.isLoading}
          error={storeHook.error}
          successMsg={storeHook.successMsg}
          formData={storeHook.formData}
          updateField={storeHook.updateField}
          logoFile={storeHook.logoFile}
          setLogoFile={storeHook.setLogoFile}
          qrisFile={storeHook.qrisFile}
          setQrisFile={storeHook.setQrisFile}
          ownerInfo={storeHook.ownerInfo}
        />

        {/* === SECTION 4: ACTION CONFIRMATION DIALOGS === */}
        <ActionDialog
          isOpen={actionDialog.isOpen}
          onClose={closeActionDialog}
          onConfirm={confirmAction}
          title={dialogConfig.title}
          description={dialogConfig.description}
          confirmLabel={dialogConfig.confirmLabel}
          confirmColor={dialogConfig.confirmColor}
          isLoading={storeHook.isLoading}
        >
          {/* Konten tambahan khusus untuk modal Backup (Input Tanggal) */}
          {actionDialog.type === 'backup' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={backupDates.from}
                  onChange={(e) => setBackupDates(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={backupDates.to}
                  onChange={(e) => setBackupDates(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}
        </ActionDialog>

      </div>
    </PageLayout>
  );
}