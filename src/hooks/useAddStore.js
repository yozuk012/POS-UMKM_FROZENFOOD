// src/hooks/useAddStore.js
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

// LIMIT TOKO DIUBAH MENJADI 10 (Sesuai saran bisnis)
const MAX_STORE_LIMIT = 10; 

export function useStoreManagement() {
  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = useState({
    name: '', type: 'frozen_food', address: '',
    logo_url: '', qris_code_url: '', qris_merchant_id: '',
    default_online_markup_pct: 0, bank_name: '', account_number: '', account_name: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [qrisFile, setQrisFile] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [ownerInfo, setOwnerInfo] = useState({ full_name: '', phone: '' });

  // --- HELPER FUNCTIONS ---
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '', type: 'frozen_food', address: '',
      logo_url: '', qris_code_url: '', qris_merchant_id: '',
      default_online_markup_pct: 0, bank_name: '', account_number: '', account_name: '',
    });
    setLogoFile(null);
    setQrisFile(null);
    setError(null);
    setSuccessMsg('');
  };

  const prepareNewStore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi berakhir. Silakan login ulang.');

      const [{ data: merchant, error: merchantError }, { data: primaryStore, error: storeError }] = await Promise.all([
        supabase.from('merchants').select('full_name, phone').eq('id', user.id).maybeSingle(),
        supabase
          .from('stores')
          .select('qris_code_url, qris_merchant_id, bank_name, account_number, account_name')
          .eq('user_id', user.id)
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      if (merchantError) throw merchantError;
      if (storeError) throw storeError;

      setOwnerInfo({
        full_name: merchant?.full_name || '',
        phone: merchant?.phone || '',
      });
      setFormData((previous) => ({
        ...previous,
        qris_code_url: primaryStore?.qris_code_url || '',
        qris_merchant_id: primaryStore?.qris_merchant_id || '',
        bank_name: primaryStore?.bank_name || '',
        account_number: primaryStore?.account_number || '',
        account_name: primaryStore?.account_name || merchant?.full_name || '',
      }));
    } catch (error) {
      setError(error.message || 'Gagal memuat default cabang utama.');
    }
  };

  // Upload File ke Supabase Storage
  const uploadFile = async (file, bucket, folder) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: false });

    if (uploadError) throw new Error(`Gagal upload: ${uploadError.message}`);
    
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  // --- 1. TAMBAH TOKO BARU (ADD) ---
  const handleAddStore = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi berakhir. Silakan login ulang.');

      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (merchantError) throw merchantError;
      if (!merchant) {
        throw new Error('Profil merchant belum tersedia. Silakan logout dan daftar ulang.');
      }

      // Cek Limit Maksimal
      const { count, error: countError } = await supabase
        .from('stores').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      
      if (countError) throw countError;
      if (count >= MAX_STORE_LIMIT) {
        throw new Error(`Maksimal penambahan toko adalah ${MAX_STORE_LIMIT} cabang. Silakan arsipkan toko yang tidak terpakai.`);
      }

      if (!formData.name.trim() || !formData.address.trim()) {
        throw new Error('Nama dan Alamat Toko wajib diisi.');
      }

      // Upload Files ke folder masing-masing di bucket UMKM-POS
      let logoUrl = formData.logo_url;
      let qrisUrl = formData.qris_code_url;

      if (logoFile) logoUrl = await uploadFile(logoFile, 'UMKM-POS', `logo-toko/${user.id}`);
      if (qrisFile) {
        qrisUrl = await uploadFile(qrisFile, 'UMKM-POS', `qris-umkm/${user.id}`);
      }

      const payload = {
        user_id: user.id,
        name: formData.name.trim(),
        type: formData.type,
        address: formData.address.trim(),
        logo_url: logoUrl,
        qris_code_url: qrisUrl,
        qris_merchant_id: formData.qris_merchant_id.trim() || null,
        default_online_markup_pct: Number(formData.default_online_markup_pct) || 0,
        bank_name: formData.bank_name.trim() || null,
        account_number: formData.account_number.trim() || null,
        account_name: formData.account_name.trim() || null,
        is_active: true,
      };

      const { error: insertError } = await supabase.from('stores').insert(payload);
      if (insertError) throw insertError;

      setSuccessMsg('Toko berhasil ditambahkan!');
      setTimeout(resetForm, 2000);

    } catch (err) {
      console.error('Gagal menambahkan toko:', err);
      const errorDetails = [err.message, err.details, err.hint].filter(Boolean).join(' ');
      setError(errorDetails || 'Terjadi kesalahan saat menambahkan toko.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. EDIT TOKO (UPDATE) ---
  const handleUpdateStore = async (storeId) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi berakhir.');

      let logoUrl = formData.logo_url;
      let qrisUrl = formData.qris_code_url;

      // Upload file baru jika ada
      if (logoFile) logoUrl = await uploadFile(logoFile, 'UMKM-POS', `logo-toko/${user.id}`);
      if (qrisFile) {
        qrisUrl = await uploadFile(qrisFile, 'UMKM-POS', `qris-umkm/${user.id}`);
      }

      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        address: formData.address.trim(),
        logo_url: logoUrl,
        qris_code_url: qrisUrl,
        qris_merchant_id: formData.qris_merchant_id.trim() || null,
        default_online_markup_pct: Number(formData.default_online_markup_pct) || 0,
        bank_name: formData.bank_name.trim() || null,
        account_number: formData.account_number.trim() || null,
        account_name: formData.account_name.trim() || null,
      };

      const { error: updateError } = await supabase.from('stores').update(payload).eq('id', storeId);
      if (updateError) throw updateError;

      setSuccessMsg('Data toko berhasil diperbarui!');
      setTimeout(resetForm, 2000);

    } catch (err) {
      setError(err.message || 'Gagal memperbarui data toko.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. NONAKTIFKAN / AKTIFKAN TOKO SEMENTARA (TOGGLE STATUS) ---
  const handleToggleStatus = async (storeId, currentStatus) => {
    setIsLoading(true);
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase.from('stores').update({ is_active: newStatus }).eq('id', storeId);
      if (error) throw error;
      
      setSuccessMsg(`Toko berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'} sementara.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. ARSIPKAN / HAPUS PERMANEN (SOFT DELETE) ---
  // Kita tidak pakai DELETE SQL, tapi set is_active = false dan bisa ditambah kolom is_archived jika perlu.
  // Di sini kita set is_active = false sebagai penanda "Tutup Permanen".
  const handleArchiveStore = async (storeId) => {
    setIsLoading(true);
    try {
      // Jika di masa depan Anda menambah kolom `is_archived` (boolean), update di sini.
      // Untuk saat ini, kita pakai is_active = false.
      const { error } = await supabase.from('stores').update({ is_active: false }).eq('id', storeId);
      if (error) throw error;
      
      setSuccessMsg('Toko telah diarsipkan (ditutup permanen). Data laporan tetap aman.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. REQUEST BACKUP OTOMATIS (EXCEL) ---
  // Fungsi ini mencatat permintaan backup ke tabel `backups`. 
  // (Proses generate Excel sebenarnya dilakukan di background/API route, hook ini hanya memicu request).
  const handleRequestBackup = async (storeId, dateFrom, dateTo) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const backupPayload = {
        store_id: storeId,
        user_id: user.id,
        backup_type: 'full_report_excel',
        file_format: 'xlsx',
        date_from: dateFrom,
        date_to: dateTo,
        status: 'pending', // Nanti diupdate jadi 'completed' oleh background job
        created_at: new Date(),
      };

      const { error } = await supabase.from('backups').insert(backupPayload);
      if (error) throw error;

      setSuccessMsg('Permintaan backup sedang diproses. Silakan cek halaman riwayat backup.');
    } catch (err) {
      setError('Gagal membuat permintaan backup: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOAD DATA UNTUK EDIT ---
  const loadStoreData = (store) => {
    setFormData({
      name: store.name || '',
      type: store.type || 'frozen_food',
      address: store.address || '',
      logo_url: store.logo_url || '',
      qris_code_url: store.qris_code_url || '',
      qris_merchant_id: store.qris_merchant_id || '',
      default_online_markup_pct: store.default_online_markup_pct || 0,
      bank_name: store.bank_name || '',
      account_number: store.account_number || '',
      account_name: store.account_name || '',
    });
  };

  return {
    formData, updateField, resetForm, loadStoreData, prepareNewStore, ownerInfo,
    logoFile, setLogoFile, qrisFile, setQrisFile,
    isLoading, error, successMsg,
    handleAddStore, handleUpdateStore, handleToggleStatus, handleArchiveStore, handleRequestBackup
  };
}