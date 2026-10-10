import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { convertPurchaseToBase, getUnitDefinition } from '@/lib/rawMaterialUtils';
import { ACTIVE_STORE_EVENT, getActiveStoreId, resolveActiveStore } from '@/lib/activeStore';

const isMissingPurchaseMetadata = (error) => (
  /purchase_(unit|quantity|price)/.test(error?.message || '') &&
  (
    error?.code === 'PGRST204' ||
    error?.code === '42703' ||
    error?.status === 400 ||
    /schema cache|column .* not found|could not find/i.test(error?.message || '')
  )
);

const purchaseMetadataMigrationMessage = 'Database belum siap menyimpan satuan pembelian. Jalankan RAW_MATERIAL_UNIT_MIGRATION.sql di Supabase, lalu refresh aplikasi.';

/**
 * Custom hook untuk mengelola data Bahan Baku (Raw Materials).
 * FITUR BARU: Auto Konversi ke Satuan Terkecil (Sesuai saran Dosen).
 * UI mengirim data beli (misal: 1 kg, Rp 45.000), Hook mengonversi ke (1000 gram, Rp 45).
 */
export default function useBahanBaku() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState(null);
  
  const [bahanBaku, setBahanBaku] = useState([]);
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

  // Ambil store_id saat user login & listen switch store
  useEffect(() => {
    if (!user?.id) {
      setStoreId(null);
      setBahanBaku([]);
      return;
    }

    const fetchStore = async () => {
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('id', { ascending: true });

      const activeStore = resolveActiveStore(stores);
      setStoreId(activeStore ? activeStore.id : null);
      if (!activeStore) {
        setBahanBaku([]);
      }
    };

    fetchStore();

    const handleStoreChange = () => {
      // KETIKA SWITCH TOKO: BAHAN BAKU KOSONG
      setBahanBaku([]);
      fetchStore();
    };

    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [user?.id]);

  useEffect(() => {
    if (storeId) {
      fetchBahanBaku();
    } else {
      setBahanBaku([]);
    }
  }, [storeId]);

  // ==========================================
  // 2. CREATE: Tambah bahan baku baru + Stok Awal
  // ==========================================
  /**
   * @param {Object} formData - { name, satuan_beli, qty_beli, total_harga_beli, is_perishable, shelf_life_days }
   * @param {number} initialStockInput - Stok awal dalam SATUAN BELI (misal: 1 jika beli 1 kg)
   */
  const addBahanBaku = async (formData, initialStockInput = 0) => {
    setIsMutating(true);
    setError(null);

    try {
      // LANGKAH A: Auto Konversi Data
      const konversi = convertPurchaseToBase({
        quantity: formData.qty_beli,
        unit: formData.satuan_beli,
        totalPrice: formData.total_harga_beli
      });

      // LANGKAH B: Insert ke tabel raw_materials (DATA SUDAH DALAM SATUAN TERKECIL)
      const materialPayload = {
          store_id: storeId,
          name: formData.name,
          unit: konversi.baseUnit,
          cost_per_unit: konversi.costPerBaseUnit,
          purchase_unit: konversi.purchaseUnit,
          purchase_quantity: konversi.purchaseQuantity,
          purchase_price: konversi.purchasePrice,
          is_perishable: formData.is_perishable || false,
          shelf_life_days: formData.shelf_life_days || null,
          created_at: new Date().toISOString()
      };

      const { data: newMaterial, error: insertError } = await supabase
        .from('raw_materials')
        .insert(materialPayload)
        .select('id')
        .single();

      if (isMissingPurchaseMetadata(insertError)) {
        throw new Error(purchaseMetadataMigrationMessage);
      }

      if (insertError) throw insertError;

      // LANGKAH C: Masukkan stok awal ke inventory (Harus dikonversi juga ke satuan terkecil!)
      if (initialStockInput > 0) {
        const stockTersimpan = Math.round(initialStockInput * konversi.factor);

        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            store_id: storeId,
            raw_material_id: newMaterial.id,
            product_id: null,
            qty_on_hand: stockTersimpan,
            last_updated: new Date().toISOString()
          });

        if (inventoryError) {
          console.error('Gagal membuat stok awal di inventory:', inventoryError);
        }
      }

      await fetchBahanBaku();
      
      return { 
        success: true, 
        message: 'Bahan baku berhasil ditambahkan.'
      };
    } catch (err) {
      console.error('Gagal menambah bahan baku:', err);
      return { success: false, message: err.message || 'Gagal menambah bahan baku.' };
    } finally {
      setIsMutating(false);
    }
  };

  // ==========================================
  // 3. UPDATE: Edit bahan baku yang sudah ada
  // ==========================================
  /**
   * @param {number} id - ID bahan baku
   * @param {Object} data - Data yang diupdate. Jika update harga, gunakan format { satuan_beli, qty_beli, total_harga_beli } agar terkonversi otomatis.
   * @param {number|null} stockQuantityInput - Stok terbaru dalam SATUAN BELI asli.
   */
  const updateBahanBaku = async (id, data, stockQuantityInput = null) => {
    setIsMutating(true);
    setError(null);

    try {
      let payloadToUpdate = { ...data };

      // Jika user mengupdate data harga/satuan, lakukan konversi ulang
      if (data.satuan_beli && data.qty_beli && data.total_harga_beli) {
        const konversi = convertPurchaseToBase({
          quantity: data.qty_beli,
          unit: data.satuan_beli,
          totalPrice: data.total_harga_beli
        });
        payloadToUpdate = {
          unit: konversi.baseUnit,
          cost_per_unit: konversi.costPerBaseUnit,
          purchase_unit: konversi.purchaseUnit,
          purchase_quantity: konversi.purchaseQuantity,
          purchase_price: konversi.purchasePrice,
          name: data.name || payloadToUpdate.name,
          is_perishable: data.is_perishable,
          shelf_life_days: data.shelf_life_days
        };
      }

      const { error: updateError } = await supabase
        .from('raw_materials')
        .update(payloadToUpdate)
        .eq('id', id)
        .eq('store_id', storeId);

      if (isMissingPurchaseMetadata(updateError)) {
        throw new Error(purchaseMetadataMigrationMessage);
      }

      if (updateError) throw updateError;

      // Update stok di inventory jika ada perubahan
      if (stockQuantityInput !== null) {
        const { data: existingInventory } = await supabase
          .from('inventory')
          .select('id')
          .eq('raw_material_id', id)
          .eq('store_id', storeId)
          .is('product_id', null)
          .maybeSingle();

        const inventoryPayload = {
          store_id: storeId,
          raw_material_id: id,
          product_id: null,
          qty_on_hand: Math.round(
            Math.max(0, Number(stockQuantityInput) || 0) *
            getUnitDefinition(data.satuan_beli).factor
          ),
          last_updated: new Date().toISOString()
        };

        if (existingInventory) {
          await supabase.from('inventory').update(inventoryPayload).eq('id', existingInventory.id);
        } else {
          await supabase.from('inventory').insert(inventoryPayload);
        }
      }

      await fetchBahanBaku();
      return { success: true, message: 'Bahan baku berhasil diperbarui!' };
    } catch (err) {
      console.error('Gagal memperbarui bahan baku:', err);
      return { success: false, message: err.message || 'Gagal memperbarui bahan baku.' };
    } finally {
      setIsMutating(false);
    }
  };

  // ==========================================
  // 4. DELETE: Hapus bahan baku
  // ==========================================
  const deleteBahanBaku = async (id) => {
    setIsMutating(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('raw_materials')
        .delete()
        .eq('id', id)
        .eq('store_id', storeId);

      if (deleteError) throw deleteError;

      await supabase
        .from('inventory')
        .delete()
        .eq('raw_material_id', id)
        .eq('store_id', storeId);

      await fetchBahanBaku();
      return { success: true, message: 'Bahan baku berhasil dihapus!' };
    } catch (err) {
      console.error('Gagal menghapus bahan baku:', err);
      return { success: false, message: err.message || 'Gagal menghapus bahan baku.' };
    } finally {
      setIsMutating(false);
    }
  };

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