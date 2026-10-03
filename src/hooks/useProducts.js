'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadFile } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useConvert } from './useConvert';

export function useProducts() {
  const { user } = useAuth();
  const { convertToWebP } = useConvert();

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all'); 
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const initialFormData = {
    store_id: '',
    category_id: '',
    name: '',
    sku: '',
    unit: 'pack',
    stock: '0',
    is_active: true,
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
  const parseNumber = (val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const cleaned = String(val).replace(/\D/g, '');
    return parseFloat(cleaned) || 0;
  };

  const parseDecimal = (val) => {
    if (val === '' || val === null || val === undefined) return 0;
    return Number(val) || 0;
  };

  // ==========================================
  // 3. HELPER: HAPUS GAMBAR DARI STORAGE
  // ==========================================
  const deleteImageFromStorage = async (imageUrl) => {
    if (!imageUrl) return;
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/product-toko/'); 
      if (pathParts.length > 1) {
        const filePath = `product-toko/${pathParts[1]}`; 
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
    const { data } = await supabase
      .from('stores')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
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
      setTotalItems(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const storeIds = stores.map(s => s.id);
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from('products')
      .select(`
        *,
        categories ( name ),
        inventory ( qty_on_hand ),
        product_prices ( channel, price, platform_fee_pct )
      `, { count: 'exact' })
      .in('store_id', storeIds)
      .order('created_at', { ascending: false });

    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
    }

    if (filterCategory && filterCategory !== 'all') {
      query = query.eq('category_id', filterCategory);
    }

    // Filter Channel
    if (filterChannel === 'online' || filterChannel === 'offline') {
      const { data: userProducts } = await supabase.from('products').select('id').in('store_id', storeIds);
      const userProductIds = userProducts ? userProducts.map(p => p.id) : [-1];

      const { data: priceData } = await supabase
        .from('product_prices')
        .select('product_id, channel')
        .in('product_id', userProductIds);

      const onlineProductIds = new Set(
        (priceData || []).filter(p => p.channel === 'online').map(p => p.product_id)
      );

      if (filterChannel === 'online') {
        const allowedIds = Array.from(onlineProductIds);
        query = query.in('id', allowedIds.length > 0 ? allowedIds : [-1]);
      } else if (filterChannel === 'offline') {
        const offlineIds = userProducts
          ? userProducts.filter(p => !onlineProductIds.has(p.id)).map(p => p.id)
          : [-1];
        query = query.in('id', offlineIds.length > 0 ? offlineIds : [-1]);
      }
    }

    if (filterStatus !== 'all') {
      query = query.eq('is_active', filterStatus === 'active');
    }

    query = query.range(from, to);
    const { data, error, count } = await query;

    if (error) {
      console.error('Fetch products error:', error);
      setTotalItems(0);
    } else {
      const mappedProducts = (data || []).map(p => {
        const prices = p.product_prices || [];
        const onlinePriceData = prices.find(pp => pp.channel === 'online');
        const offlinePriceData = prices.find(pp => pp.channel === 'offline');

        return {
          ...p,
          category_name: p.categories?.name || 'Tanpa Kategori',
          stock: Array.isArray(p.inventory) ? (p.inventory[0]?.qty_on_hand || 0) : (p.inventory?.qty_on_hand || 0),
          has_online_price: !!onlinePriceData,
          online_price: onlinePriceData ? onlinePriceData.price : 0,
          display_offline_price: offlinePriceData ? offlinePriceData.price : p.base_price,
        };
      });
      setProducts(mappedProducts);
      setTotalItems(count || 0);
    }
    setLoading(false);
  }, [user?.id, stores, currentPage, searchQuery, filterCategory, filterChannel, filterStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterChannel, filterStatus]);

  useEffect(() => { 
    if (user?.id) fetchStores(); 
  }, [user?.id, fetchStores]);

  useEffect(() => { 
    if (stores.length > 0) { 
      fetchCategories(); 
      fetchProducts(); 
    } 
  }, [stores, fetchCategories, fetchProducts]);

  // ==========================================
  // 5. FORM HANDLERS
  // ==========================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => {
      let finalValue = type === 'checkbox' ? checked : value;
      
      const updates = { [name]: finalValue };

      // --- LOGIKA SKU ---
      if (name === 'name' && !editingId) {
        const cleanName = finalValue.trim();
        const prefix = cleanName.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const safePrefix = prefix.length > 0 ? prefix : 'SKU';
        const oldSuffix = prev.sku.includes('-') ? prev.sku.split('-').pop() : Date.now().toString().slice(-5);
        updates.sku = `${safePrefix}-${oldSuffix}`;
      }

      return { ...prev, ...updates };
    });
    setError(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { 
      setError('Ukuran foto maksimal 2MB'); 
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

    setFormData(prev => ({
      ...prev,
      image_file: conversionResult.file,
      image_preview: URL.createObjectURL(conversionResult.file)
    }));
    setError(null);
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      store_id: stores.length > 0 ? String(stores[0].id) : '', // Auto-select toko pertama
      sku: `SKU-${Date.now().toString().slice(-4)}`
    });
    setEditingId(null);
    setExistingImageUrl(null);
    setError(null);
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setExistingImageUrl(product.image_url);

    setFormData({
      store_id: product.store_id ? String(product.store_id) : '',
      category_id: product.category_id ? String(product.category_id) : '',
      name: product.name,
      sku: product.sku || '',
      unit: product.unit,
      base_price: String(product.base_price || 0),
      hpp: String(product.hpp || 0),
      discount_pct: String(product.discount_pct || 0),
      stock: String(product.stock || 0),
      is_active: product.is_active !== false,
      image_file: null,
      image_preview: product.image_url || null,
    });
    setError(null);
  };

  const openAddModal = () => { resetForm(); setIsModalOpen(true); };
  const openEditModal = (product) => { startEdit(product); setIsModalOpen(true); };
  const closeModal = () => { resetForm(); setIsModalOpen(false); };
  
  const resetFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterChannel('all');
    setFilterStatus('all');
  };

  // ==========================================
  // 6. SUBMIT (CREATE / UPDATE)
  // ==========================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.store_id) return setError('Pilih toko terlebih dahulu.');
    if (!formData.category_id) return setError('Pilih kategori produk.');
    if (!formData.name.trim()) return setError('Nama produk wajib diisi.');

    const stockVal = parseNumber(formData.stock);
    const basePrice = parseDecimal(formData.base_price);

    if (stockVal < 0) return setError('Stok tidak boleh minus.');

    setIsSubmitting(true);
    setError(null);

    try {
      let finalImageUrl = existingImageUrl;
      if (formData.image_file) {
        if (existingImageUrl) await deleteImageFromStorage(existingImageUrl); 
        
        const fileName = `prod-${Date.now()}-${formData.image_file.name.replace(/\s/g, '-')}`;
        const uploadResult = await uploadFile(formData.image_file, 'product-toko', fileName);
        if (!uploadResult.success) throw new Error('Gagal upload foto: ' + uploadResult.error);
        finalImageUrl = uploadResult.url;
      }

      const productPayload = {
        store_id: parseInt(formData.store_id),
        category_id: parseInt(formData.category_id),
        name: formData.name.trim(),
        sku: formData.sku.trim() || `SKU-${Date.now()}`,
        type: 'finished_good',
        unit: formData.unit,
        base_price: 0,
        ...(editingId && {
          base_price: basePrice,
        }),
        image_url: finalImageUrl,
        is_active: formData.is_active !== false,
      };

      let productId = editingId;

      if (editingId) {
        const { error } = await supabase.from('products').update(productPayload).eq('id', editingId);
        if (error) throw new Error('Gagal update produk: ' + error.message);
      } else {
        const { data, error } = await supabase.from('products').insert(productPayload).select().single();
        if (error) throw new Error('Gagal insert produk: ' + error.message);
        productId = data.id;
      }

      // Update Inventory
      const { data: existingInv } = await supabase.from('inventory').select('id').eq('product_id', productId).maybeSingle();
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

      closeModal();
      fetchProducts(); 

    } catch (err) {
      console.error('Submit product error:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProductStatus = async (product) => {
    const nextStatus = !product.is_active;
    if (!window.confirm(`Yakin ingin ${nextStatus ? 'mengaktifkan' : 'menonaktifkan'} produk "${product.name}"?`)) return;

    const { error } = await supabase.from('products').update({ is_active: nextStatus }).eq('id', product.id);
    if (error) {
      alert(`Gagal: ${error.message}`);
    } else {
      fetchProducts();
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Yakin ingin menghapus produk ini secara permanen?')) return;

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

  return {
    stores, categories, products, loading,
    formData, editingId, error, isSubmitting, isModalOpen,
    searchQuery, setSearchQuery,
    filterCategory, setFilterCategory,
    filterChannel, setFilterChannel,
    filterStatus, setFilterStatus,
    currentPage, setCurrentPage,
    totalItems, itemsPerPage,
    resetFilters,
    handleChange, handleFileChange, handleSubmit, deleteProduct, toggleProductStatus,
    openAddModal, openEditModal, closeModal,
  };
}

export default useProducts;