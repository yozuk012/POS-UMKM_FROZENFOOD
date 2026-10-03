// src/hooks/useBahanBaku.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/**
 * Custom hook untuk mengelola data Bahan Baku (Raw Materials).
 */
export default function useBahanBaku() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState(null);
  
  // State untuk menyimpan daftar bahan baku
  const [bahanBaku, setBahanBaku] = useState([]);
  
  // State untuk UI feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);

  // 1. FETCH: Ambil semua bahan baku berdasarkan store_id
  const fetchBahanBaku = async () => {
    setIsLoading(true);
    setError(null);

    if (!storeId) {
      setBahanBaku([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('raw_materials')
        .select(`
          *,
          inventory (
            qty_on_hand
          )
        `)
        .eq('store_id', storeId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      
      // Format data agar qty_on_hand menjadi angka biasa (bukan array)
      const formattedData = (data || []).map(item => ({
        ...item,
        qty_on_hand: item.inventory?.[0]?.qty_on_hand || 0
      }));
      
      setBahanBaku(formattedData);
    } catch (err) {
      console.error('Gagal mengambil data bahan baku:', err);
      setError('Gagal memuat data bahan baku.');
    } finally {
      setIsLoading(false);
    }
  };

  // Ambil store_id saat user login
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const fetchStore = async () => {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

      setStoreId(data?.id || null);
    };

    fetchStore();
  }, [user?.id]);

  // Jalankan fetch saat storeId sudah didapat
  useEffect(() => {
    if (storeId) {
      fetchBahanBaku();
    }
  }, [storeId]);

  // 2. CREATE: Tambah bahan baku baru + Stok Awal ke Inventory
  /**
   * @param {Object} data - { name, unit, cost_per_unit, is_perishable, shelf_life_days }
   * @param {number} initialStock - Jumlah stok awal yang langsung dimasukkan ke inventory
   */
  const addBahanBaku = async (data, initialStock = 0) => {
    setIsMutating(true);
    setError(null);

    try {
      // Langkah A: Insert ke tabel raw_materials dan ambil ID yang baru dibuat
      const { data: newMaterial, error: insertError } = await supabase
        .from('raw_materials')
        .insert({
          ...data,
          store_id: storeId,
          created_at: new Date().toISOString()
        })
        .select('id') // PENTING: Kita butuh ID ini untuk dimasukkan ke inventory
        .single();

      if (insertError) throw insertError;

      // Langkah B: Jika ada stok awal, langsung masukkan ke tabel inventory
      if (initialStock > 0) {
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            store_id: storeId,
            raw_material_id: newMaterial.id, // Hubungkan ke bahan baku yang baru dibuat
            product_id: null,                // Wajib null karena ini bahan baku, bukan produk jadi
            qty_on_hand: initialStock
          });

        if (inventoryError) {
          console.error('Gagal membuat stok awal di inventory:', inventoryError);
          // Kita tetap lanjut, agar bahan baku tetap tersimpan meski gagal catat stok
        }
      }

      // Refresh data setelah berhasil insert
      await fetchBahanBaku();
      
      return { 
        success: true, 
        message: initialStock > 0 
          ? `Bahan baku berhasil ditambahkan dengan stok awal ${initialStock} ${data.unit}!` 
          : 'Bahan baku berhasil ditambahkan!' 
      };
    } catch (err) {
      console.error('Gagal menambah bahan baku:', err);
      return { success: false, message: err.message || 'Gagal menambah bahan baku.' };
    } finally {
      setIsMutating(false);
    }
  };

  // 3. UPDATE: Edit bahan baku yang sudah ada
  /**
   * @param {number} id - ID bahan baku yang akan diupdate
  * @param {Object} data - Data master yang ingin diupdate
  * @param {number|null} stockQuantity - Stok terbaru, jika ikut diubah
   */
  const updateBahanBaku = async (id, data, stockQuantity = null) => {
    setIsMutating(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('raw_materials')
        .update(data)
        .eq('id', id)
        .eq('store_id', storeId); // Keamanan tambahan: hanya update milik toko sendiri

      if (updateError) throw updateError;

      if (stockQuantity !== null) {
        const { data: existingInventory, error: inventoryFetchError } = await supabase
          .from('inventory')
          .select('id')
          .eq('raw_material_id', id)
          .eq('store_id', storeId)
          .maybeSingle();

        if (inventoryFetchError) throw inventoryFetchError;

        const inventoryPayload = {
          store_id: storeId,
          raw_material_id: id,
          product_id: null,
          qty_on_hand: stockQuantity,
          last_updated: new Date().toISOString()
        };

        if (existingInventory) {
          const { error: inventoryUpdateError } = await supabase
            .from('inventory')
            .update(inventoryPayload)
            .eq('id', existingInventory.id);

          if (inventoryUpdateError) throw inventoryUpdateError;
        } else {
          const { error: inventoryInsertError } = await supabase
            .from('inventory')
            .insert(inventoryPayload);

          if (inventoryInsertError) throw inventoryInsertError;
        }
      }

      // Refresh data
      await fetchBahanBaku();
      
      return { success: true, message: 'Bahan baku berhasil diperbarui!' };
    } catch (err) {
      console.error('Gagal memperbarui bahan baku:', err);
      return { success: false, message: err.message || 'Gagal memperbarui bahan baku.' };
    } finally {
      setIsMutating(false);
    }
  };

  // 4. DELETE: Hapus bahan baku
  /**
   * @param {number} id - ID bahan baku yang akan dihapus
   */
  const deleteBahanBaku = async (id) => {
    setIsMutating(true);
    setError(null);

    try {
      // Hapus dari raw_materials
      const { error: deleteError } = await supabase
        .from('raw_materials')
        .delete()
        .eq('id', id)
        .eq('store_id', storeId);

      if (deleteError) throw deleteError;

      // OPSIONAL: Hapus juga dari inventory agar tidak ada data sampah (orphan data)
      await supabase
        .from('inventory')
        .delete()
        .eq('raw_material_id', id)
        .eq('store_id', storeId);

      // Refresh data
      await fetchBahanBaku();
      
      return { success: true, message: 'Bahan baku berhasil dihapus!' };
    } catch (err) {
      console.error('Gagal menghapus bahan baku:', err);
      return { success: false, message: err.message || 'Gagal menghapus bahan baku.' };
    } finally {
      setIsMutating(false);
    }
  };

  // Return semua state dan fungsi agar bisa digunakan di komponen UI
  return {
    bahanBaku,
    isLoading,
    isMutating,
    error,
    addBahanBaku,
    updateBahanBaku,
    deleteBahanBaku,
    refetch: fetchBahanBaku
  };
}