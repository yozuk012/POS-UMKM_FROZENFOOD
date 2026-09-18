// src/hooks/useProducts.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadFile } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useConvert } from './useConvert'; // <-- BARU: Import hook konversi

export function useProducts() {
  const { user } = useAuth();
  const { convertToWebP } = useConvert(); // <-- BARU: Inisialisasi hook konversi

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const initialFormData = {
    store_id: '',
    category_id: '',
    name: '',
    sku: '',
    unit: 'pack',
    base_price: '',
    hpp: '', 
    discount_pct: '', 
    stock: '',
    is_sell_online: false,
    online_markup_pct: '25', 
    image_file: null,
    image_preview: null,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==========================================
  // 2. HELPER: FORMAT & PARSE ANGKA
  // ==========================================
  const formatCurrencyInput = (val) => {
    if (val === '' || val === null || val === undefined) return '';
    const digits = String(val).replace(/\D/g, '');
    if (!digits) return '';
    return 'Rp ' + Number(digits).toLocaleString('id-ID');
  };

  const parseNumber = (val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const cleaned = String(val).replace(/\D/g, '');
    return parseFloat(cleaned) || 0;
  };

  // ==========================================
  // 3. HELPER: HAPUS GAMBAR DARI STORAGE
  // ==========================================
  const deleteImageFromStorage = async (imageUrl) => {
    if (!imageUrl) return;
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/UMKM-POS/'); // Sesuaikan dengan bucket Anda
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        const { error } = await supabase.storage.from('UMKM-POS').remove([filePath]);
        if (error) console.warn('Gagal hapus gambar lama:', error.message);
      }
    } catch (err) {
      console.error('Error parsing image URL for deletion:', err);
    }
  };

  // ==========================================
  // 4. FETCH DATA (READ)
  // ==========================================
  const fetchStores = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('stores').select('id, name').eq('user_id', user.id).eq('is_active', true);
    if (data) setStores(data);
  }, [user?.id]);

  const fetchCategories = useCallback(async () => {
    if (!user?.id || stores.length === 0) return;
    const storeIds = stores.map(s => s.id);
    const { data } = await supabase.from('categories').select('id, name, store_id').in('store_id', storeIds);
    if (data) setCategories(data);
  }, [user?.id, stores]);

  const fetchProducts = useCallback(async () => {
    if (!user?.id || stores.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const storeIds = stores.map(s => s.id);

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories ( name ),
        inventory ( qty_on_hand ),
        product_prices ( channel, price, platform_fee_pct )
      `)
      .in('store_id', storeIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch products error:', error);
    } else {
      const mappedProducts = (data || []).map(p => {
        const prices = p.product_prices || [];
        const onlinePriceData = prices.find(pp => pp.channel === 'online');

        return {
          ...p,
          category_name: p.categories?.name || 'Tanpa Kategori',
          stock: Array.isArray(p.inventory) ? (p.inventory[0]?.qty_on_hand || 0) : (p.inventory?.qty_on_hand || 0),
          has_online_price: !!onlinePriceData,
          online_price: onlinePriceData ? onlinePriceData.price : 0,
        };
      });
      setProducts(mappedProducts);
    }
    setLoading(false);
  }, [user?.id, stores]);

  useEffect(() => { if (user?.id) fetchStores(); }, [user?.id, fetchStores]);
  useEffect(() => { if (stores.length > 0) { fetchCategories(); fetchProducts(); } }, [stores, fetchCategories, fetchProducts]);

  // ==========================================
  // 5. FORM HANDLERS
  // ==========================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => {
      let finalValue = type === 'checkbox' ? checked : value;
      
      if (name === 'base_price' || name === 'hpp') {
        finalValue = formatCurrencyInput(finalValue);
      }
      
      const updates = { [name]: finalValue };

      if (name === 'name' && !editingId) {
        const prefix = finalValue.trim().substring(0, 3).toUpperCase();
        const currentSuffix = prev.sku.includes('-') ? prev.sku.split('-')[1] : Date.now();
        updates.sku = prefix ? `${prefix}-${currentSuffix}` : `SKU-${currentSuffix}`;
      }

      return { ...prev, ...updates };
    });
    setError(null);
  };

  // <-- BARU: handleFileChange dengan Konversi WebP Otomatis
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi awal ukuran (maksimal 2MB sebelum konversi)
    if (file.size > 2 * 1024 * 1024) { 
      setError('Ukuran foto maksimal 2MB'); 
      e.target.value = ''; // Reset input file
      return; 
    }

    setError('Sedang mengoptimalkan gambar...'); // Feedback UX

    // Proses konversi ke WebP (kualitas 80%)
    const conversionResult = await convertToWebP(file, 0.8);

    if (!conversionResult.success) {
      setError(conversionResult.error);
      e.target.value = ''; // Reset input file jika gagal
      return;
    }

    // Jika berhasil, simpan file WebP yang sudah dikonversi
    const webpFile = conversionResult.file;

    setFormData(prev => ({
      ...prev,
      image_file: webpFile,
      image_preview: URL.createObjectURL(webpFile)
    }));
    setError(null);
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      sku: `SKU-${Date.now()}`
    });
    setEditingId(null);
    setExistingImageUrl(null);
    setError(null);
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setExistingImageUrl(product.image_url);
    
    const safeCategoryId = product.category_id ? String(product.category_id) : '';
    const safeStoreId = product.store_id ? String(product.store_id) : '';

    let markupPct = '25';
    if (product.has_online_price && product.base_price > 0) {
      const calculatedMarkup = ((product.online_price / product.base_price) - 1) * 100;
      markupPct = Math.round(calculatedMarkup).toString();
    }

    setFormData({
      store_id: safeStoreId,
      category_id: safeCategoryId,
      name: product.name,
      sku: product.sku || '',
      unit: product.unit,
      base_price: formatCurrencyInput(product.base_price),
      hpp: product.hpp ? formatCurrencyInput(product.hpp) : '',
      discount_pct: product.discount_pct ? product.discount_pct.toString() : '0',
      stock: product.stock.toString(),
      is_sell_online: Boolean(product.has_online_price),
      online_markup_pct: markupPct,
      image_file: null,
      image_preview: product.image_url || null,
    });
    setError(null);
  };

  const openAddModal = () => { resetForm(); setIsModalOpen(true); };
  const openEditModal = (product) => { startEdit(product); setIsModalOpen(true); };
  const closeModal = () => { resetForm(); setIsModalOpen(false); };

  // ==========================================
  // 6. SUBMIT (CREATE / UPDATE)
  // ==========================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.store_id) return setError('Pilih toko terlebih dahulu.');
    if (!formData.category_id) return setError('Pilih kategori produk.');
    if (!formData.name.trim()) return setError('Nama produk wajib diisi.');

    const basePrice = parseNumber(formData.base_price);
    const hppVal = formData.hpp ? parseNumber(formData.hpp) : null;
    const discountVal = parseNumber(formData.discount_pct);
    const stockVal = parseNumber(formData.stock);
    const markupVal = parseNumber(formData.online_markup_pct);

    if (basePrice <= 0) return setError('Harga asli wajib diisi dan harus lebih dari 0.');
    if (stockVal < 0) return setError('Stok tidak boleh minus.');
    if (discountVal < 0 || discountVal > 100) return setError('Persentase diskon harus antara 0 - 100.');

    setIsSubmitting(true);
    setError(null);

    try {
      // A. HANDLE GAMBAR (File di sini sudah berupa .webp hasil konversi)
      let finalImageUrl = existingImageUrl;
      if (formData.image_file) {
        if (existingImageUrl) {
          await deleteImageFromStorage(existingImageUrl); 
        }
        // Nama file akan otomatis berakhiran .webp
        const fileName = `prod-${Date.now()}-${formData.image_file.name.replace(/\s/g, '-')}`;
        const uploadResult = await uploadFile(formData.image_file, 'product-toko', fileName);
        if (!uploadResult.success) throw new Error('Gagal upload foto: ' + uploadResult.error);
        finalImageUrl = uploadResult.url;
      }

      // B. PERSIAPAN PAYLOAD PRODUK
      const productPayload = {
        store_id: parseInt(formData.store_id),
        category_id: parseInt(formData.category_id),
        name: formData.name.trim(),
        sku: formData.sku.trim() || `SKU-${Date.now()}`,
        type: 'finished_good',
        unit: formData.unit,
        base_price: basePrice,
        hpp: hppVal,
        discount_pct: discountVal,
        image_url: finalImageUrl,
        is_active: true,
      };

      let productId = editingId;

      // C. SAVE PRODUK
      if (editingId) {
        const { error } = await supabase.from('products').update(productPayload).eq('id', editingId);
        if (error) throw new Error('Gagal update produk: ' + error.message);
      } else {
        const { data, error } = await supabase.from('products').insert(productPayload).select().single();
        if (error) throw new Error('Gagal insert produk: ' + error.message);
        productId = data.id;
      }

      // D. SAVE INVENTORY (Stok)
      const { data: existingInv } = await supabase
        .from('inventory')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      const inventoryPayload = {
        store_id: parseInt(formData.store_id),
        product_id: productId,
        qty_on_hand: stockVal,
        last_updated: new Date().toISOString(),
      };

      if (existingInv) {
        const { error } = await supabase.from('inventory').update(inventoryPayload).eq('id', existingInv.id);
        if (error) throw new Error('Gagal update stok: ' + error.message);
      } else {
        const { error } = await supabase.from('inventory').insert(inventoryPayload);
        if (error) throw new Error('Gagal insert stok: ' + error.message);
      }

      // E. SAVE PRODUCT PRICES (Dengan Logika Markup)
      if (formData.is_sell_online) {
        const onlinePrice = basePrice * (1 + (markupVal / 100));
        
        const pricePayload = {
          product_id: productId,
          channel: 'online',
          price: onlinePrice,
          platform_fee_pct: 5,
        };
        
        const { error } = await supabase.from('product_prices').upsert(pricePayload, { onConflict: 'product_id,channel' });
        if (error) throw new Error('Gagal simpan harga online: ' + error.message);
      } else if (editingId) {
        await supabase.from('product_prices').delete().eq('product_id', productId).eq('channel', 'online');
      }

      closeModal();
      fetchProducts();

    } catch (err) {
      console.error('Submit product error:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 7. DELETE
  // ==========================================
  const deleteProduct = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini? Stok, harga, dan foto juga akan dihapus permanen.')) return;

    const productToDelete = products.find(p => p.id === id);
    if (productToDelete?.image_url) {
      await deleteImageFromStorage(productToDelete.image_url);
    }

    await supabase.from('product_prices').delete().eq('product_id', id);
    await supabase.from('inventory').delete().eq('product_id', id);
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      fetchProducts();
    }
  };

  // ==========================================
  // 8. RETURN VALUES
  // ==========================================
  return {
    stores, categories, products, loading,
    formData, editingId, error, isSubmitting, isModalOpen,
    handleChange, handleFileChange, handleSubmit, deleteProduct,
    openAddModal, openEditModal, closeModal,
  };
}

export default useProducts;