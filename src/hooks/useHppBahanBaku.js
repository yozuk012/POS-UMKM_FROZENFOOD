import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { convertToBaseQuantity } from '@/lib/rawMaterialUtils';
import { getRecommendedPrice } from '@/lib/productUtils';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';

const isMissingPurchaseMetadata = (error) => (
  /purchase_(unit|quantity|price)/.test(error?.message || '') &&
  (
    error?.code === 'PGRST204' ||
    error?.code === '42703' ||
    error?.status === 400 ||
    /schema cache|column .* not found|could not find/i.test(error?.message || '')
  )
);

/**
 * Hook khusus untuk mengelola dan menyimpan data HPP BAHAN BAKU & Resep.
 * CATATAN: Kolom 'hpp' di database tetap murni bahan baku. 
 * Namun, 'base_price' (harga jual default) sekarang dihitung berdasarkan HPP SEJATI 
 * dengan Margin 50% agar UMKM tidak rugi dan sesuai dengan rekomendasi UI.
 */
export default function useHppBahanBaku() {
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

        // Ambil store_id aktif
        const { data: stores, error: storeError } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('id', { ascending: true });

        if (storeError) throw storeError;
        const storeData = resolveActiveStore(stores);
        if (!storeData) {
          setStoreId(null);
          setRawMaterials([]);
          setCategories([]);
          return;
        }

        setStoreId(storeData.id);

        // Ambil semua bahan baku
        let { data: materialsData, error: materialsError } = await supabase
          .from('raw_materials')
          .select('id, name, unit, cost_per_unit, purchase_unit, purchase_quantity, purchase_price')
          .eq('store_id', storeData.id)
          .order('name', { ascending: true });

        if (isMissingPurchaseMetadata(materialsError)) {
          ({ data: materialsData, error: materialsError } = await supabase
            .from('raw_materials')
            .select('id, name, unit, cost_per_unit')
            .eq('store_id', storeData.id)
            .order('name', { ascending: true }));
        }

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

    const handleStoreChange = () => {
      // KETIKA SWITCH TOKO: BAHAN BAKU & KATEGORI RESEP KOSONG
      setRawMaterials([]);
      setCategories([]);
      fetchData();
    };

    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [user?.id]);

  // 2. Fungsi Utama: Submit Data HPP BAHAN BAKU & Resep ke Supabase
  const submitHPP = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!storeId) throw new Error('Toko aktif tidak ditemukan.');

      // Validasi & Pembulatan: Pastikan HPP per produk adalah angka valid
      const calculatedHpp = Math.round(Number(formData.hppPerProduk));
      if (!calculatedHpp || calculatedHpp <= 0) {
        throw new Error('HPP per produk harus lebih dari 0.');
      }

      // --- PERHITUNGAN HARGA JUAL DEFAULT YANG AMAN (HPP SEJATI) ---
      const totalBiayaOperasional = Number(formData.totalBiayaOperasional) || 0;
      const jumlahProduk = Number(formData.jumlahProduk) || 1;
      
      // HPP Sejati = HPP Bahan Baku + (Total Operasional / Jumlah Produk)
      const hppSejatiPerUnit = calculatedHpp + (totalBiayaOperasional / jumlahProduk);
      const hppSejatiRounded = Math.round(hppSejatiPerUnit);
      
      // PERUBAHAN DI SINI: Harga jual default = HPP Sejati + Margin 50% (Bukan lagi 35%)
      // Ini agar sesuai dengan rekomendasi "Paling Aman" di UI Step 2
      const safeBasePrice = Number.isFinite(Number(formData.hargaRekomendasi))
        ? Math.round(Number(formData.hargaRekomendasi))
        : getRecommendedPrice(hppSejatiRounded);

      // Langkah 1: Cari atau Buat Produk
      let productId = null;

      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('name', formData.namaProduk)
        .eq('store_id', storeId)
        .maybeSingle();

      if (existingProduct) {
        productId = existingProduct.id;
        // Update HPP produk 
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            hpp: calculatedHpp,          // <--- TETAP HANYA MODAL BAHAN BAKU (Sesuai Dosen)
            base_price: safeBasePrice,   // <--- HARGA AMAN BERDASARKAN MARGIN 50%
            category_id: formData.categoryId ? parseInt(formData.categoryId, 10) : null
          })
          .eq('id', productId);

        if (updateError) throw new Error('Gagal memperbarui HPP produk: ' + updateError.message);
      } else {
        // --- LOGIKA OTOMATISASI (SMART DEFAULTS) ---
        const cleanName = formData.namaProduk.replace(/\s+/g, '').toUpperCase();
        const prefix = cleanName.substring(0, 3) || 'PRD';
        const uniqueId = Date.now().toString().slice(-6);
        const autoSku = `${prefix}-${uniqueId}`;
        
        const { data: newProduct, error: insertProductError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            category_id: formData.categoryId ? parseInt(formData.categoryId, 10) : null,
            name: formData.namaProduk,
            sku: autoSku,
            type: 'finished_good',
            hpp: calculatedHpp,          // <--- TETAP HANYA MODAL BAHAN BAKU
            base_price: safeBasePrice,   // <--- HARGA AMAN BERDASARKAN MARGIN 50%
            is_active: true,
            unit: formData.satuanProduk || 'pcs' 
          })
          .select('id')
          .single();
          
        if (insertProductError) throw new Error('Gagal membuat produk baru: ' + insertProductError.message);
        productId = newProduct.id;
      }

      // Langkah 2: Pastikan record inventory ada untuk produk jadi ini
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
            raw_material_id: null, // Pastikan null karena ini produk jadi
            qty_on_hand: 0, // Stok awal 0, akan bertambah saat produksi
            last_updated: new Date().toISOString(),
          });

        if (inventoryInsertError) {
          throw new Error('Gagal mengisi stok awal produk: ' + inventoryInsertError.message);
        }
      }

      // Langkah 3: Cek apakah resep sudah ada untuk produk ini (UPSERT Logic)
      const { data: existingRecipe, error: recipeCheckError } = await supabase
        .from('recipes')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      if (recipeCheckError) throw new Error('Gagal memeriksa resep: ' + recipeCheckError.message);

      let previousIngredients = [];
      if (existingRecipe) {
        const { data: oldIngredients, error: oldIngredientsError } = await supabase
          .from('recipe_ingredients')
          .select('raw_material_id, qty_needed, unit')
          .eq('recipe_id', existingRecipe.id);

        if (oldIngredientsError) {
          throw new Error('Gagal membaca bahan baku resep lama: ' + oldIngredientsError.message);
        }

        previousIngredients = oldIngredients || [];
      }

      const totalHppBahanBakuBatch = Math.round(calculatedHpp * jumlahProduk);
      const today = new Date().toISOString().split('T')[0]; 
      let recipeId;

      if (existingRecipe) {
        // --- UPDATE RESEP YANG SUDAH ADA ---
        recipeId = existingRecipe.id;
        
        const { error: updateRecipeError } = await supabase
          .from('recipes')
          .update({
            total_hpp: totalHppBahanBakuBatch,
            yield_qty: jumlahProduk, 
            total_yield: Number(formData.totalYield) || jumlahProduk,
            effective_date: today,
            notes: formData.catatanResep || 'Resep bahan baku diperbarui'
          })
          .eq('id', recipeId);

        if (updateRecipeError) throw new Error('Gagal memperbarui resep: ' + updateRecipeError.message);

        // Hapus bahan baku lama agar tidak dobel saat di-insert ulang
        const { error: deleteOldIngredientsError } = await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', recipeId);
          
        if (deleteOldIngredientsError) throw new Error('Gagal menghapus bahan baku lama: ' + deleteOldIngredientsError.message);

      } else {
        // --- INSERT RESEP BARU ---
        const { data: newRecipe, error: insertRecipeError } = await supabase
          .from('recipes')
          .insert({
            product_id: productId,
            total_hpp: totalHppBahanBakuBatch,
            yield_qty: jumlahProduk, 
            total_yield: Number(formData.totalYield) || jumlahProduk,
            effective_date: today,
            notes: formData.catatanResep || 'Resep bahan baku baru'
          })
          .select('id')
          .single();

        if (insertRecipeError) throw new Error('Gagal menyimpan resep baru: ' + insertRecipeError.message);
        recipeId = newRecipe.id;
      }

      // Langkah 4: Insert bahan baku baru (Bulk Insert)
      const ingredientsPayload = formData.bahanBakuList.map(bahan => ({
        recipe_id: recipeId,
        raw_material_id: parseInt(bahan.raw_material_id, 10), 
        qty_needed: parseFloat(bahan.qty_needed),
        unit: bahan.unit // Satuan resep (bukan satuan beli)
      }));

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsPayload);

      if (ingredientsError) throw new Error('Gagal menyimpan detail bahan baku: ' + ingredientsError.message);

      // Hanya kurangi selisih pemakaian agar menyimpan ulang resep tidak mengurangi stok dua kali.
      const stockChanges = new Map();
      previousIngredients.forEach((ingredient) => {
        const materialId = Number(ingredient.raw_material_id);
        stockChanges.set(
          materialId,
          (stockChanges.get(materialId) || 0) -
          convertToBaseQuantity(ingredient.qty_needed, ingredient.unit)
        );
      });
      ingredientsPayload.forEach((ingredient) => {
        const materialId = Number(ingredient.raw_material_id);
        stockChanges.set(
          materialId,
          (stockChanges.get(materialId) || 0) +
          convertToBaseQuantity(ingredient.qty_needed, ingredient.unit)
        );
      });

      for (const [rawMaterialId, change] of stockChanges) {
        if (change === 0) continue;

        const { data: inventory, error: inventoryLookupError } = await supabase
          .from('inventory')
          .select('id, qty_on_hand')
          .eq('store_id', storeId)
          .eq('raw_material_id', rawMaterialId)
          .is('product_id', null)
          .maybeSingle();

        if (inventoryLookupError) {
          throw new Error('Gagal memeriksa stok bahan baku: ' + inventoryLookupError.message);
        }

        const currentQty = Number(inventory?.qty_on_hand || 0);
        const newQty = currentQty - change;
        if (newQty < 0) {
          throw new Error(`Stok bahan baku tidak cukup untuk ${rawMaterialId}. Tersedia ${currentQty}, dibutuhkan ${change}.`);
        }

        if (!inventory) {
          throw new Error(`Stok bahan baku untuk ID ${rawMaterialId} belum diinput.`);
        }

        const { error: inventoryUpdateError } = await supabase
          .from('inventory')
          .update({ qty_on_hand: newQty, last_updated: new Date().toISOString() })
          .eq('id', inventory.id);

        if (inventoryUpdateError) {
          throw new Error('Gagal mengurangi stok bahan baku: ' + inventoryUpdateError.message);
        }
      }

      return { 
        success: true, 
        message: 'HPP Bahan Baku berhasil dihitung dan disimpan dengan harga jual yang aman (Margin 50%)!',
        productId,
        recipeId
      };

    } catch (err) {
      console.error('Error saat submit HPP Bahan Baku:', err);
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