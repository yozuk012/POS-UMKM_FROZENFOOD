// src/hooks/useHitungHpp.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export default function useHitungHpp() {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState(null);
  // State untuk data referensi (Dropdown)
  const [rawMaterials, setRawMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // State untuk status proses
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch Data Referensi saat komponen mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!user?.id) {
          setRawMaterials([]);
          setCategories([]);
          return;
        }

        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (storeError) throw storeError;
        if (!storeData) {
          setStoreId(null);
          setRawMaterials([]);
          setCategories([]);
          return;
        }

        setStoreId(storeData.id);

        // Ambil semua bahan baku aktif
        const { data: materialsData, error: materialsError } = await supabase
          .from('raw_materials')
          .select('id, name, unit, cost_per_unit')
          .eq('store_id', storeData.id)
          .order('name', { ascending: true });

        if (materialsError) throw materialsError;
        setRawMaterials(materialsData || []);

        // Ambil semua kategori
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('store_id', storeData.id)
          .order('name', { ascending: true });

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

      } catch (err) {
        console.error('Gagal memuat data referensi:', err);
        setError('Gagal memuat data bahan baku atau kategori. Silakan refresh halaman.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // 2. Fungsi Utama: Submit Data HPP ke Supabase
  const submitHPP = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!storeId) throw new Error('Toko aktif tidak ditemukan.');

      // Langkah 1: Cari atau Buat Produk
      let productId = null;

      // Cek produk existing berdasarkan nama
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('name', formData.namaProduk)
        .eq('store_id', storeId)
        .maybeSingle();

      if (existingProduct) {
        productId = existingProduct.id;
        // Update HPP produk yang sudah ada
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            hpp: formData.hppPerProduk,
            base_price: Math.round(formData.hppPerProduk * 1.35),
            category_id: formData.categoryId 
          })
          .eq('id', productId);

        if (updateError) throw new Error('Gagal memperbarui HPP produk: ' + updateError.message);
      } else {
        // --- LOGIKA OTOMATISASI (SMART DEFAULTS) ---
        
        // 1. Auto Generate SKU Dinamis (3 huruf pertama nama produk + 6 digit unik)
        // Contoh: "Salad Buah" -> "SAL", "Lumpia" -> "LUM"
        const cleanName = formData.namaProduk.replace(/\s+/g, '').toUpperCase();
        const prefix = cleanName.substring(0, 3) || 'PRD'; // Fallback ke 'PRD' jika nama < 3 huruf
        const uniqueId = Date.now().toString().slice(-6);
        const autoSku = `${prefix}-${uniqueId}`;
        
        // 2. Auto Harga Jual (Default margin 35% dari HPP agar tidak rugi)
        const defaultBasePrice = formData.hppPerProduk * 1.35; 

        // Buat produk baru
        const { data: newProduct, error: insertProductError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            category_id: formData.categoryId,
            name: formData.namaProduk,
            sku: autoSku,                      // <--- SKU DINAMIS (SAL-xxx, LUM-xxx)
            type: 'finished_good',
            hpp: formData.hppPerProduk,
            base_price: defaultBasePrice,      // <--- HARGA JUAL OTOMATIS (Margin 35%)
            is_active: true,
            unit: 'pcs' 
          })
          .select('id')
          .single();
          
        if (insertProductError) throw new Error('Gagal membuat produk baru: ' + insertProductError.message);
        productId = newProduct.id;
      }

      // Buat stok awal produk jika belum memiliki record inventory.
      const { data: existingInventory, error: inventoryLookupError } = await supabase
        .from('inventory')
        .select('id')
        .eq('product_id', productId)
        .eq('store_id', storeId)
        .maybeSingle();

      if (inventoryLookupError) {
        throw new Error('Gagal memeriksa stok produk: ' + inventoryLookupError.message);
      }

      if (!existingInventory) {
        const { error: inventoryInsertError } = await supabase
          .from('inventory')
          .insert({
            store_id: storeId,
            product_id: productId,
            qty_on_hand: 100,
            last_updated: new Date().toISOString(),
          });

        if (inventoryInsertError) {
          throw new Error('Gagal mengisi stok awal produk: ' + inventoryInsertError.message);
        }
      }

      // Langkah 2: Insert ke tabel `recipes`
      // Hitung total modal untuk 1 batch produksi (HPP per unit x Jumlah unit)
      // Ini adalah cara paling akurat karena formData.hppPerProduk sudah dihitung frontend
      const totalHppBatch = formData.hppPerProduk * formData.jumlahProduk;
      
      // Ambil tanggal hari ini dalam format YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0]; 

      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          product_id: productId,
          total_hpp: totalHppBatch, 
          yield_qty: formData.jumlahProduk, 
          effective_date: today, 
          notes: formData.totalBiayaLain > 0 
            ? `Termasuk biaya operasional: Rp ${formData.totalBiayaLain}` 
            : 'Tanpa biaya operasional tambahan'
        })
        .select('id')
        .single();

      if (recipeError) throw new Error('Gagal menyimpan resep: ' + recipeError.message);
      const recipeId = recipeData.id;

      // Langkah 3: Insert ke tabel `recipe_ingredients` (Bulk Insert)
      const ingredientsPayload = formData.bahanBakuList.map(bahan => ({
        recipe_id: recipeId,
        raw_material_id: parseInt(bahan.raw_material_id),
        qty_needed: parseFloat(bahan.qty_needed),
        unit: bahan.unit
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsPayload);

      if (ingredientsError) throw new Error('Gagal menyimpan detail bahan baku: ' + ingredientsError.message);

      return { 
        success: true, 
        message: 'HPP berhasil dihitung dan disimpan ke database!',
        productId 
      };

    } catch (err) {
      console.error('Error saat submit HPP:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan data.');
      return { 
        success: false, 
        message: err.message || 'Terjadi kesalahan saat menyimpan data.' 
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    rawMaterials,
    categories,
    isLoading,
    isSubmitting,
    error,
    submitHPP
  };
}