'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useOnlinePercentage() {
  const { user } = useAuth();

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [percentage, setPercentage] = useState('0'); // Disimpan sebagai string agar mudah di-handle di input
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // ==========================================
  // 2. FETCH DATA (READ)
  // ==========================================
  const fetchCurrentPercentage = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Ambil data dari toko yang sedang aktif
      const { data, error: fetchError } = await supabase
        .from('stores')
        .select('id, default_online_markup_pct')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = tidak ada row ditemukan
        throw new Error('Gagal memuat data persentase: ' + fetchError.message);
      }

      if (data) {
        setStoreId(data.id);
        // Jika null, defaultkan ke 0. Jika ada, ubah ke string untuk input field
        setPercentage(data.default_online_markup_pct !== null ? String(data.default_online_markup_pct) : '0');
      } else {
        setError('Toko aktif tidak ditemukan. Pastikan Anda telah membuat toko.');
      }
    } catch (err) {
      console.warn('Fetch percentage warning:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchCurrentPercentage();
    }
  }, [user?.id, fetchCurrentPercentage]);

  // ==========================================
  // 3. FORM HANDLERS
  // ==========================================
  const handleChange = (e) => {
    const value = e.target.value;
    
    // Hanya izinkan input angka (atau string kosong untuk menghapus semua)
    if (value === '' || /^\d+$/.test(value)) {
      setPercentage(value);
      setError(null);
      setSuccessMessage('');
    }
  };

  // ==========================================
  // 4. SUBMIT (UPDATE)
  // ==========================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const numValue = parseInt(percentage, 10);

    // Validasi
    if (isNaN(numValue)) return setError('Persentase harus berupa angka.');
    if (numValue < 0) return setError('Persentase tidak boleh negatif.');
    if (numValue > 100) return setError('Persentase maksimal adalah 100%.'); // Bisa diubah ke 500 jika bisnis mengizinkan markup >100%
    if (!storeId) return setError('Data toko tidak ditemukan. Silakan hubungi admin.');

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      const { error: updateError } = await supabase
        .from('stores')
        .update({ 
          default_online_markup_pct: numValue 
        })
        .eq('id', storeId);

      if (updateError) {
        throw new Error('Gagal memperbarui persentase: ' + updateError.message);
      }

      setSuccessMessage('Persentase harga online global berhasil diperbarui!');
      
      // Opsional: Refresh data untuk memastikan state sinkron
      await fetchCurrentPercentage();

    } catch (err) {
      console.warn('Submit percentage warning:', err.message);
      setError(err.message || 'Terjadi kesalahan saat menyimpan persentase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    loading,
    isSubmitting,
    error,
    successMessage,
    percentage,
    handleChange,
    handleSubmit,
  };
}

export default useOnlinePercentage;