import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';

/**
 * Hook khusus untuk mengelola Biaya Operasional Toko (Period Cost).
 * 
 * PERUBAHAN KONSEP:
 * Hook ini sekarang berdiri sendiri sebagai "Buku Catatan Pengeluaran Harian".
 * Data di sini TIDAK lagi dikaitkan secara paksa ke 1 batch produksi di halaman Hitung HPP.
 * Ini akan digunakan di halaman "/pengeluaran" dan diringkas di halaman "/report".
 */
export default function useHppOperasional() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState(null);
  
  // State untuk data operasional
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Helper: Mendapatkan tanggal hari ini dalam format YYYY-MM-DD (Aman untuk Timezone WIB)
  const getTodayLocal = () => {
    const now = new Date();
    return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const parseExpenseAmount = (value) => {
    const amount = Number(value);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error('Jumlah biaya harus berupa Rupiah bulat lebih dari 0.');
    }
    return amount;
  };

  // 1. Fetch Store ID saat user login & listen switch store
  useEffect(() => {
    if (!user?.id) {
      setStoreId(null);
      setExpenses([]);
      return;
    }

    const fetchStore = async () => {
      try {
        const { data: stores, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('id', { ascending: true });

        if (storeError) throw storeError;
        const activeStore = resolveActiveStore(stores);
        setStoreId(activeStore ? activeStore.id : null);
        if (!activeStore) {
          setExpenses([]);
        }
      } catch (err) {
        console.error('Gagal memuat data toko:', err);
      }
    };

    fetchStore();

    const handleStoreChange = () => {
      // KETIKA SWITCH TOKO: PENGELUARAN KOSONG
      setExpenses([]);
      fetchStore();
    };

    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [user?.id]);

  // 2. Fetch Data Operasional berdasarkan rentang tanggal
  const fetchExpenses = useCallback(async (startDate = null, endDate = null) => {
    if (!storeId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('operational_expenses')
        .select('*')
        .eq('store_id', storeId)
        .order('expense_date', { ascending: false });

      if (startDate) {
        query = query.gte('expense_date', startDate);
      }
      if (endDate) {
        query = query.lte('expense_date', endDate);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setExpenses(data || []);
    } catch (err) {
      console.error('Gagal memuat biaya operasional:', err);
      setError('Gagal memuat data biaya operasional.');
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  // Auto-fetch saat storeId siap (default: bulan ini)
  useEffect(() => {
    if (storeId) {
      const today = new Date();
      // Format YYYY-MM-DD yang aman untuk query Supabase
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toLocaleDateString('sv-SE');
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toLocaleDateString('sv-SE');
      
      fetchExpenses(firstDay, lastDay);
    } else {
      setExpenses([]);
      setIsLoading(false);
    }
  }, [storeId, fetchExpenses]);

  // 3. Tambah Biaya Operasional Baru
  const addExpense = async (expenseData) => {
    if (!storeId) {
      setError('Toko aktif tidak ditemukan.');
      return { success: false, message: 'Toko aktif tidak ditemukan.' };
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        store_id: storeId,
        // Gunakan tanggal hari ini jika tidak disediakan, dengan format lokal yang aman
        expense_date: expenseData.expense_date || getTodayLocal(),
        category: expenseData.category, 
        description: expenseData.description || '',
        amount: parseExpenseAmount(expenseData.amount),
      };

      const { data, error: insertError } = await supabase
        .from('operational_expenses')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state (prepend ke array agar muncul di paling atas list)
      setExpenses((prev) => [data, ...prev]);
      
      return { 
        success: true, 
        message: 'Pengeluaran berhasil dicatat!',
        data 
      };
    } catch (err) {
      console.error('Error saat menambah biaya operasional:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan data.');
      return { 
        success: false, 
        message: err.message || 'Terjadi kesalahan saat menyimpan data.' 
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Update Biaya Operasional
  const updateExpense = async (expenseId, updatedData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        expense_date: updatedData.expense_date || getTodayLocal(),
        category: updatedData.category,
        description: updatedData.description,
        amount: parseExpenseAmount(updatedData.amount),
      };

      const { data, error: updateError } = await supabase
        .from('operational_expenses')
        .update(payload)
        .eq('id', expenseId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === expenseId ? data : exp))
      );

      return { success: true, message: 'Data pengeluaran berhasil diperbarui!', data };
    } catch (err) {
      console.error('Error saat memperbarui biaya operasional:', err);
      setError(err.message || 'Terjadi kesalahan saat memperbarui data.');
      return { success: false, message: err.message || 'Terjadi kesalahan saat memperbarui data.' };
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Hapus Biaya Operasional
  const deleteExpense = async (expenseId) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('operational_expenses')
        .delete()
        .eq('id', expenseId);

      if (deleteError) throw deleteError;

      // Update local state
      setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
      
      return { success: true, message: 'Data pengeluaran berhasil dihapus!' };
    } catch (err) {
      console.error('Error saat menghapus biaya operasional:', err);
      setError(err.message || 'Terjadi kesalahan saat menghapus data.');
      return { 
        success: false, 
        message: err.message || 'Terjadi kesalahan saat menghapus data.' 
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Helper: Hitung Total Biaya Operasional dari data yang sedang di-load
  const totalOperationalCost = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  // 7. Helper: Menghitung alokasi biaya operasional per unit produksi (Untuk halaman Report)
  const getAllocatedOperationalHppPerUnit = (totalYield) => {
    if (!totalYield || totalYield <= 0) return 0;
    return totalOperationalCost / totalYield;
  };

  return {
    expenses,
    isLoading,
    isSubmitting,
    error,
    totalOperationalCost,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getAllocatedOperationalHppPerUnit,
  };
}