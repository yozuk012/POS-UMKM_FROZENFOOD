// src/hooks/useHppProduk.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/**
 * Custom hook untuk mengelola daftar Produk & HPP
 */
export default function useHppProduk() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. FETCH: Ambil daftar produk jadi beserta kategori dan info HPP
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    if (!storeId) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          hpp,
          base_price,
          unit,
          is_active,
          category_id,
          categories (
            id,
            name
          )
        `)
        .eq('store_id', storeId)
        .eq('type', 'finished_good') // Hanya ambil produk jadi, bukan bahan baku
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Format data agar lebih mudah dibaca di UI
      const formattedData = (data || []).map(item => ({
        id: item.id,
        namaProduk: item.name,
        kategori: item.categories?.name || 'Tanpa Kategori',
        category_id: item.category_id,
        hpp: item.hpp || 0,
        base_price: item.base_price || 0,
        unit: item.unit || 'pcs',
        is_active: item.is_active
      }));

      setProducts(formattedData);
    } catch (err) {
      console.error('Gagal mengambil data produk:', err);
      setError('Gagal memuat daftar produk. Silakan refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    fetchProducts();
  }, [storeId]);

  // 2. DELETE: Hapus produk dari database
  /**
   * @param {number} id - ID produk yang akan dihapus
   */
  const deleteProduct = async (id) => {
    setIsLoading(true); // Gunakan isLoading sebagai indikator proses
    setError(null);

    try {
      // Catatan: Karena di schema database kita menggunakan ON DELETE CASCADE 
      // pada tabel recipes dan recipe_ingredients, menghapus product 
      // akan otomatis menghapus resep dan bahan-bahannya.
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('store_id', storeId); // Keamanan: pastikan hanya hapus milik toko sendiri

      if (deleteError) throw deleteError;

      // Refresh data setelah berhasil dihapus
      await fetchProducts();
      
      return { success: true, message: 'Produk berhasil dihapus!' };
    } catch (err) {
      console.error('Gagal menghapus produk:', err);
      return { success: false, message: err.message || 'Gagal menghapus produk.' };
    } finally {
      setIsLoading(false);
    }
  };

  // 3. UPDATE: (Opsional untuk nanti) Mengubah status aktif/non-aktif
  const toggleActiveStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchProducts(); // Refresh
      return { success: true };
    } catch (err) {
      console.error('Gagal update status:', err);
      return { success: false };
    }
  };

  return {
    products,
    isLoading,
    error,
    deleteProduct,
    toggleActiveStatus,
    refetch: fetchProducts
  };
}