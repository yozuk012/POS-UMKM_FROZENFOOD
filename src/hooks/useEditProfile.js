'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadFile } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useConvert } from './useConvertImages'; // Pastikan path ini sesuai dengan project Anda

export function useEditProfile() {
  const { user } = useAuth();
  const { convertToWebP } = useConvert();

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // State khusus untuk tabel merchants
  const [merchantForm, setMerchantForm] = useState({
    full_name: '',
    phone: '',
    store_name: '', // Nama Brand Utama
  });

  // State khusus untuk tabel stores (Toko Aktif)
  const [storeForm, setStoreForm] = useState({
    id: null,
    name: '', // Nama Cabang/Toko
    address: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    default_online_markup_pct: 0,
    qris_merchant_id: '',
  });

  // State untuk manajemen file gambar
  const [imageFiles, setImageFiles] = useState({
    logo: null,
    qris: null,
  });
  
  const [imagePreviews, setImagePreviews] = useState({
    logo: null,
    qris: null,
  });

  const [existingUrls, setExistingUrls] = useState({
    logo: null,
    qris: null,
  });

  // ==========================================
  // 2. FETCH DATA (READ)
  // ==========================================
  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Data Merchants
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchants')
        .select('full_name, phone, store_name, store_logo_url')
        .eq('id', user.id)
        .single();

      if (merchantError) throw new Error('Gagal memuat data pemilik: ' + merchantError.message);

      // 2. Fetch Data Stores (Ambil yang is_active = true sebagai profil utama)
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, address, logo_url, qris_code_url, qris_merchant_id, bank_name, account_number, account_name, default_online_markup_pct')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single(); // Jika ada banyak toko aktif, ini akan error. Pastikan user hanya punya 1 toko aktif untuk diedit di halaman ini, atau ubah jadi .limit(1)

      if (storeError && storeError.code !== 'PGRST116') { // PGRST116 = tidak ada row ditemukan
        throw new Error('Gagal memuat data toko: ' + storeError.message);
      }

      // Populate State
      if (merchantData) {
        setMerchantForm({
          full_name: merchantData.full_name || '',
          phone: merchantData.phone || '',
          store_name: merchantData.store_name || '',
        });
        setImagePreviews(prev => ({ ...prev, logo: merchantData.store_logo_url }));
        setExistingUrls(prev => ({ ...prev, logo: merchantData.store_logo_url }));
      }

      if (storeData) {
        setStoreForm({
          id: storeData.id,
          name: storeData.name || '',
          address: storeData.address || '',
          bank_name: storeData.bank_name || '',
          account_number: storeData.account_number || '',
          account_name: storeData.account_name || '',
          default_online_markup_pct: storeData.default_online_markup_pct || 0,
          qris_merchant_id: storeData.qris_merchant_id || '',
        });
        setImagePreviews(prev => ({ ...prev, logo: storeData.logo_url || prev.logo }));
        setImagePreviews(prev => ({ ...prev, qris: storeData.qris_code_url }));
        setExistingUrls(prev => ({ ...prev, logo: storeData.logo_url, qris: storeData.qris_code_url }));
      }

    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
    }
  }, [user?.id, fetchProfileData]);

  // ==========================================
  // 3. HELPER: HAPUS GAMBAR DARI STORAGE
  // ==========================================
  const deleteImageFromStorage = async (imageUrl, folderName) => {
    if (!imageUrl) return;
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split(`/${folderName}/`); 
      if (pathParts.length > 1) {
        const filePath = `${folderName}/${pathParts[1]}`; 
        const { error } = await supabase.storage.from('UMKM-POS').remove([filePath]);
        if (error) console.warn(`Gagal hapus gambar lama di ${folderName}:`, error.message);
      }
    } catch (err) {
      console.error(`Error parsing image URL for deletion (${folderName}):`, err);
    }
  };

  // ==========================================
  // 4. FORM HANDLERS
  // ==========================================
  const handleMerchantChange = (e) => {
    const { name, value } = e.target;
    setMerchantForm(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMessage('');
  };

  const handleStoreChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    setStoreForm(prev => ({ ...prev, [name]: finalValue }));
    setError(null);
    setSuccessMessage('');
  };

  const handleFileChange = async (e, fieldType) => {
    // fieldType = 'logo' atau 'qris'
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { 
      setError(`Ukuran file ${fieldType === 'logo' ? 'Logo' : 'QRIS'} maksimal 2MB`); 
      e.target.value = ''; 
      return; 
    }

    setError('Sedang mengoptimalkan gambar...'); 
    const conversionResult = await convertToWebP(file, 0.8);

    if (!conversionResult.success) {
      setError(conversionResult.error);
      e.target.value = ''; 
      return;
    }

    setImageFiles(prev => ({ ...prev, [fieldType]: conversionResult.file }));
    setImagePreviews(prev => ({ ...prev, [fieldType]: URL.createObjectURL(conversionResult.file) }));
    setError(null);
  };

  const resetQrisFile = () => {
    if (imagePreviews.qris?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviews.qris);
    }

    setImageFiles(prev => ({ ...prev, qris: null }));
    setImagePreviews(prev => ({ ...prev, qris: existingUrls.qris || null }));
    setError(null);
    setSuccessMessage('');
  };

  // ==========================================
  // 5. SUBMIT (UPDATE)
  // ==========================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validasi Dasar
    if (!merchantForm.full_name.trim()) return setError('Nama pemilik wajib diisi.');
    if (!storeForm.name.trim()) return setError('Nama toko wajib diisi.');
    if (!storeForm.id) return setError('Data toko tidak ditemukan. Pastikan Anda memiliki toko yang aktif.');

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      let finalLogoUrl = existingUrls.logo;
      let finalQrisUrl = existingUrls.qris;

      // 1. Handle Upload Logo Toko (jika ada file baru)
      if (imageFiles.logo) {
        if (existingUrls.logo) await deleteImageFromStorage(existingUrls.logo, 'logo-toko');
        const fileName = `logo-${Date.now()}-${imageFiles.logo.name.replace(/\s/g, '-')}`;
        const uploadResult = await uploadFile(imageFiles.logo, 'logo-toko', fileName);
        if (!uploadResult.success) throw new Error('Gagal upload logo: ' + uploadResult.error);
        finalLogoUrl = uploadResult.url;
      }

      // 2. Handle Upload QRIS (jika ada file baru)
      if (imageFiles.qris) {
        if (existingUrls.qris) await deleteImageFromStorage(existingUrls.qris, 'qris-umkm');
        const fileName = `qris-${Date.now()}-${imageFiles.qris.name.replace(/\s/g, '-')}`;
        const uploadResult = await uploadFile(imageFiles.qris, 'qris-umkm', fileName);
        if (!uploadResult.success) throw new Error('Gagal upload QRIS: ' + uploadResult.error);
        finalQrisUrl = uploadResult.url;
      }

      // 3. Update Tabel Merchants
      const { error: merchantError } = await supabase
        .from('merchants')
        .update({
          full_name: merchantForm.full_name.trim(),
          phone: merchantForm.phone.trim(),
          store_name: merchantForm.store_name.trim(),
          store_logo_url: finalLogoUrl, // Opsional: jika ingin logo brand utama juga tersimpan di sini
        })
        .eq('id', user.id);

      if (merchantError) throw new Error('Gagal memperbarui data pemilik: ' + merchantError.message);

      // 4. Update Tabel Stores
      const storePayload = {
        name: storeForm.name.trim(),
        address: storeForm.address.trim(),
        bank_name: storeForm.bank_name.trim(),
        account_number: storeForm.account_number.trim(),
        account_name: storeForm.account_name.trim(),
        default_online_markup_pct: parseInt(storeForm.default_online_markup_pct) || 0,
        qris_merchant_id: storeForm.qris_merchant_id.trim(),
        logo_url: finalLogoUrl,
        qris_code_url: finalQrisUrl,
      };

      const { error: storeError } = await supabase
        .from('stores')
        .update(storePayload)
        .eq('id', storeForm.id);

      if (storeError) throw new Error('Gagal memperbarui data toko: ' + storeError.message);

      // 5. Sukses
      setSuccessMessage('Profil berhasil diperbarui!');
      
      // Refresh data untuk memastikan state sinkron dengan database
      await fetchProfileData();

      // Reset file input state agar tidak ter-upload ulang jika user submit lagi tanpa ganti file
      setImageFiles({ logo: null, qris: null });

    } catch (err) {
      console.error('Submit profile error:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    loading,
    isSubmitting,
    error,
    successMessage,
    merchantForm,
    storeForm,
    imagePreviews,
    handleMerchantChange,
    handleStoreChange,
    handleFileChange,
    resetQrisFile,
    handleSubmit,
    
  };
}

export default useEditProfile;