'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, uploadFile } from '@/lib/supabase';
import { useConvert } from './useConvertImages';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';
import { buildSeedCatalog, ensureUniqueSku, normalizeKey, slugify } from '@/lib/seedCatalog';

// Jumlah produk yang diproses bersamaan (upload gambar + insert) per batch
const SEED_CHUNK_SIZE = 5;

export function useSeedData() {
  const { convertToWebP } = useConvert();

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const catalog = useMemo(() => buildSeedCatalog(), []);

  const [store, setStore] = useState(null);
  const [existingStats, setExistingStats] = useState({ categories: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  const [isSeeding, setIsSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [log, setLog] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // ==========================================
  // 2. HELPER: LOG PROGRES
  // ==========================================
  const pushLog = useCallback((type, message) => {
    setLog((prev) =>
      [...prev, { type, message, time: new Date().toISOString() }].slice(-80)
    );
  }, []);

  // ==========================================
  // 3. HELPER: AMBIL TOKO AKTIF + STATISTIK
  // ==========================================
  const countStoreData = useCallback(async (storeId) => {
    const [categoryRes, productRes] = await Promise.all([
      supabase.from('categories').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
    ]);

    if (categoryRes.error) {
      throw new Error('Gagal menghitung kategori: ' + categoryRes.error.message);
    }
    if (productRes.error) {
      throw new Error('Gagal menghitung produk: ' + productRes.error.message);
    }

    return {
      categories: categoryRes.count || 0,
      products: productRes.count || 0,
    };
  }, []);

  // Ambil user id langsung dari Supabase (bukan dari objek `user` useAuth)
  // supaya identitasnya stabil dan tidak memicu re-render berantai.
  const getCurrentUserId = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    return currentUser?.id || null;
  }, []);

  const fetchActiveStore = useCallback(async (userId) => {
    if (!userId) return null;

    const { data, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name');

    if (storesError) throw new Error('Gagal memuat toko: ' + storesError.message);
    return resolveActiveStore(data || []);
  }, []);

  const loadContext = useCallback(async () => {
    // Await pertama dilakukan sebelum setState apa pun supaya efek ini tidak
    // memicu cascading render (aturan react-hooks/set-state-in-effect).
    const userId = await getCurrentUserId();

    if (!userId) {
      setStore(null);
      setExistingStats({ categories: 0, products: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const activeStore = await fetchActiveStore(userId);
      setStore(activeStore || null);
      setExistingStats(
        activeStore?.id ? await countStoreData(activeStore.id) : { categories: 0, products: 0 }
      );
    } catch (err) {
      console.error('Seed data context error:', err);
      setError(err.message || 'Gagal memuat data toko.');
    } finally {
      setLoading(false);
    }
  }, [getCurrentUserId, fetchActiveStore, countStoreData]);

  useEffect(() => {
    // loadContext() hanya memanggil setState setelah await pertama (ambil user
    // & toko dari Supabase), jadi tidak ada cascading render. Aturan
    // react-hooks/set-state-in-effect belum mengenali pola async ini.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContext();
    const handleStoreChange = () => loadContext();
    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [loadContext]);

  // ==========================================
  // 4. HELPER: UPLOAD GAMBAR SEED KE STORAGE
  // ==========================================
  const uploadSeedImage = useCallback(async (item) => {
    if (!item.image_local_url) throw new Error('file gambar tidak tersedia');

    // Gambar dibaca dari src/seeds/images melalui route API internal.
    const response = await fetch(item.image_local_url);
    if (!response.ok) {
      throw new Error(`file ${item.image_local_url} tidak ditemukan (HTTP ${response.status})`);
    }

    const blob = await response.blob();
    const sourceFile = new File([blob], item.image_file, { type: blob.type || 'image/jpeg' });

    // Optimasi ke WebP seperti proses unggah manual di form produk
    const converted = await convertToWebP(sourceFile, 0.8);
    if (!converted.success) throw new Error(converted.error);

    const fileName = `${slugify(item.name)}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const uploaded = await uploadFile(converted.file, 'product-toko', fileName);
    if (!uploaded.success) throw new Error(uploaded.error);

    return uploaded.url;
  }, [convertToWebP]);

  // ==========================================
  // 5. PROSES UTAMA: SEED KATEGORI + PRODUK
  // ==========================================
  const runSeed = useCallback(async (options = {}) => {
    const {
      uploadImages = true,
      createInventory = true,
      skipExisting = true,
    } = options;

    setIsSeeding(true);
    setError(null);
    setSummary(null);
    setProgress(0);
    setLog([]);

    const result = {
      storeName: '',
      categoriesCreated: 0,
      categoriesReused: 0,
      productsCreated: 0,
      productsSkipped: 0,
      productsFailed: 0,
      imagesUploaded: 0,
      imagesFailed: 0,
      inventoryCreated: 0,
      failedRows: [],
      finishedAt: null,
    };

    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
      if (catalog.products.length === 0) {
        throw new Error('Data seed kosong. Periksa kembali src/seeds/data.json.');
      }

      // --- STEP 1: Tentukan toko aktif ---
      setPhase('Menyiapkan toko aktif...');
      const activeStore = store || (await fetchActiveStore(userId));
      if (!activeStore?.id) {
        throw new Error('Tidak ada toko aktif. Buat toko terlebih dahulu di Pengaturan > Stores.');
      }

      const storeId = activeStore.id;
      result.storeName = activeStore.name || '-';

      // --- STEP 2: Kategori produk ---
      setPhase('Menyiapkan kategori produk...');
      const { data: existingCategories, error: categoryFetchError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', storeId);

      if (categoryFetchError) throw new Error('Gagal memuat kategori: ' + categoryFetchError.message);

      const categoryMap = new Map(
        (existingCategories || []).map((category) => [normalizeKey(category.name), category.id])
      );

      const newCategories = catalog.categories.filter(
        (category) => !categoryMap.has(normalizeKey(category.name))
      );

      if (newCategories.length > 0) {
        const { data: insertedCategories, error: categoryInsertError } = await supabase
          .from('categories')
          .insert(newCategories.map((category) => ({ store_id: storeId, name: category.name })))
          .select('id, name');

        if (categoryInsertError) throw new Error('Gagal menyimpan kategori: ' + categoryInsertError.message);

        (insertedCategories || []).forEach((category) => {
          categoryMap.set(normalizeKey(category.name), category.id);
        });
        result.categoriesCreated = (insertedCategories || []).length;
        pushLog('success', `${result.categoriesCreated} kategori baru dibuat.`);
      }

      result.categoriesReused = catalog.categories.length - result.categoriesCreated;
      if (result.categoriesReused > 0) {
        pushLog('info', `${result.categoriesReused} kategori sudah ada dan dipakai ulang.`);
      }

      // --- STEP 3: Siapkan daftar produk yang akan di-seed ---
      setPhase('Menyiapkan daftar produk...');
      const { data: existingProducts, error: productFetchError } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('store_id', storeId);

      if (productFetchError) throw new Error('Gagal memuat produk: ' + productFetchError.message);

      const existingNames = new Set(
        (existingProducts || []).map((product) => normalizeKey(product.name))
      );

      // SKU bersifat unik global, jadi ambil semua SKU milik user (semua cabang)
      const { data: skuRows, error: skuFetchError } = await supabase.from('products').select('sku');
      if (skuFetchError) throw new Error('Gagal memuat SKU produk: ' + skuFetchError.message);
      const usedSkus = new Set(
        (skuRows || []).map((row) => String(row.sku || '').toUpperCase()).filter(Boolean)
      );

      const productsToSeed = catalog.products.filter(
        (item) => !(skipExisting && existingNames.has(normalizeKey(item.name)))
      );

      result.productsSkipped = catalog.products.length - productsToSeed.length;
      if (result.productsSkipped > 0) {
        pushLog('info', `${result.productsSkipped} produk dilewati karena namanya sudah ada di toko ini.`);
      }

      if (productsToSeed.length === 0) {
        pushLog('info', 'Semua produk sudah pernah di-seed. Tidak ada data baru yang ditambahkan.');
      }

      // --- STEP 4: Simpan produk TANPA HARGA per batch ---
      let processed = 0;

      for (let start = 0; start < productsToSeed.length; start += SEED_CHUNK_SIZE) {
        const chunk = productsToSeed.slice(start, start + SEED_CHUNK_SIZE);
        const lastIndex = Math.min(start + chunk.length, productsToSeed.length);

        setPhase(`Memproses produk ${start + 1}-${lastIndex} dari ${productsToSeed.length}...`);

        const chunkResults = await Promise.all(
          chunk.map(async (item) => {
            try {
              // 4a. Gambar produk (opsional upload ke Supabase Storage)
              let imageUrl = null;

              if (item.image_file) {
                if (uploadImages) {
                  try {
                    imageUrl = await uploadSeedImage(item);
                    result.imagesUploaded += 1;
                  } catch (imageError) {
                    result.imagesFailed += 1;
                    imageUrl = item.image_local_url;
                    pushLog('error', `Gambar "${item.name}" gagal diunggah (${imageError.message}). Memakai path lokal.`);
                  }
                } else {
                  imageUrl = item.image_local_url;
                }
              }

              // 4b. Insert produk (base_price 0 & hpp 0)
              const payload = {
                store_id: storeId,
                category_id: categoryMap.get(normalizeKey(item.category_name)) || null,
                name: item.name,
                sku: ensureUniqueSku(item.sku, usedSkus),
                type: item.type,
                unit: item.unit,
                base_price: 0,
                hpp: 0,
                discount_pct: 0,
                online_markup_pct: 0,
                image_url: imageUrl,
                is_active: true,
              };

              const { data, error: insertError } = await supabase
                .from('products')
                .insert(payload)
                .select('id, name')
                .single();

              if (insertError) throw new Error(insertError.message);

              existingNames.add(normalizeKey(item.name));
              return { ok: true, product: data, item };
            } catch (rowError) {
              return { ok: false, item, message: rowError.message };
            }
          })
        );

        const createdIds = [];

        chunkResults.forEach((chunkResult) => {
          if (chunkResult.ok) {
            result.productsCreated += 1;
            createdIds.push(chunkResult.product.id);
          } else {
            result.productsFailed += 1;
            result.failedRows.push({
              name: chunkResult.item.name,
              sku: chunkResult.item.sku,
              reason: chunkResult.message,
            });
            pushLog('error', `Produk "${chunkResult.item.name}" gagal disimpan: ${chunkResult.message}`);
          }
        });

        // 4c. Inisialisasi stok awal produk baru
        if (createInventory && createdIds.length > 0) {
          const inventoryPayload = createdIds.map((productId) => ({
            store_id: storeId,
            product_id: productId,
            raw_material_id: null,
            qty_on_hand: 100,
            last_updated: new Date().toISOString(),
          }));

          const { error: inventoryError } = await supabase.from('inventory').insert(inventoryPayload);

          if (inventoryError) {
            pushLog('error', 'Gagal menyimpan baris stok produk baru: ' + inventoryError.message);
          } else {
            result.inventoryCreated += inventoryPayload.length;
          }
        }

        processed += chunk.length;
        setProgress(
          productsToSeed.length > 0 ? Math.round((processed / productsToSeed.length) * 100) : 100
        );
      }

      // --- STEP 5: Selesai ---
      result.finishedAt = new Date().toISOString();
      setProgress(100);
      setPhase('Selesai');
      setSummary(result);

      pushLog(
        'success',
        `Seed selesai: ${result.categoriesCreated} kategori & ${result.productsCreated} produk dibuat.`
      );

      if (result.productsFailed > 0) {
        pushLog('error', `${result.productsFailed} produk gagal disimpan. Cek daftar di bawah.`);
      }

      // Perbarui statistik data yang sudah ada di toko
      try {
        setExistingStats(await countStoreData(storeId));
      } catch (statsError) {
        console.warn('Gagal memperbarui statistik toko:', statsError);
      }

      return { success: true, ...result };
    } catch (err) {
      console.error('Seed data error:', err);
      setError(err.message || 'Terjadi kesalahan saat menjalankan seed data.');
      setSummary(result);
      return { success: false, message: err.message };
    } finally {
      setIsSeeding(false);
    }
  }, [catalog, store, getCurrentUserId, fetchActiveStore, countStoreData, pushLog, uploadSeedImage]);

  // ==========================================
  // 6. RETURN VALUES
  // ==========================================
  return {
    catalog,
    store,
    existingStats,
    loading,
    isSeeding,
    progress,
    phase,
    log,
    summary,
    error,
    runSeed,
    resetSummary: () => setSummary(null),
    resetLog: () => setLog([]),
    refreshStats: loadContext,
  };
}

export default useSeedData;

