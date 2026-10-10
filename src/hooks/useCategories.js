import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { ACTIVE_STORE_EVENT, resolveActiveStore } from '@/lib/activeStore';

export function useCategories() {
  const { user } = useAuth();

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [formData, setFormData] = useState({ store_id: '', name: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State (Dipindahkan ke sini agar page.js bersih)
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==========================================
  // 2. FETCH DATA (READ)
  // ==========================================
  const fetchStores = useCallback(async () => {
    if (!user?.id) {
      setStores([]);
      setCategories([]);
      return;
    }
    const { data, error } = await supabase
      .from('stores')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (!error && data && data.length > 0) {
      const activeStore = resolveActiveStore(data);
      setStores(activeStore ? [activeStore] : []);
    } else {
      setStores([]);
      setCategories([]);
    }
  }, [user?.id]);

  const fetchCategories = useCallback(async () => {
    if (!user?.id || stores.length === 0) {
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const storeIds = stores.map(s => s.id);

    const { data, error } = await supabase
      .from('categories')
      .select('*, stores(id, name)')
      .in('store_id', storeIds)
      .order('created_at', { ascending: false });

    if (!error) setCategories(data || []);
    else setCategories([]);
    setLoading(false);
  }, [user?.id, stores]);

  useEffect(() => { 
    if (user?.id) fetchStores(); 
    const handleStoreChange = () => {
      // Ketika switch toko: kategori kosong
      setCategories([]);
      fetchStores();
    };
    window.addEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
    return () => window.removeEventListener(ACTIVE_STORE_EVENT, handleStoreChange);
  }, [user?.id, fetchStores]);

  useEffect(() => { 
    if (stores.length > 0) {
      fetchCategories(); 
    } else {
      setCategories([]);
      setLoading(false);
    }
  }, [stores, fetchCategories]);

  // ==========================================
  // 3. FORM & MODAL HANDLERS
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const resetForm = () => {
    setFormData({ store_id: stores.length > 0 ? String(stores[0].id) : '', name: '' });
    setEditingId(null);
    setError(null);
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setFormData({ 
      store_id: category.store_id.toString(), 
      name: category.name 
    });
    setError(null);
  };

  // Modal Handlers
  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    startEdit(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  // ==========================================
  // 4. SUBMIT (CREATE / UPDATE)
  // ==========================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.store_id) { setError('Silakan pilih toko terlebih dahulu.'); return; }
    if (!formData.name.trim()) { setError('Nama kategori tidak boleh kosong.'); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = { store_id: formData.store_id, name: formData.name.trim() };

      if (editingId) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }

      closeModal(); // Tutup modal otomatis setelah sukses
      fetchCategories();
    } catch (err) {
      console.error('Submit category error:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 5. DELETE
  // ==========================================
  const deleteCategory = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert('Gagal menghapus: ' + error.message);
    else fetchCategories();
  };

  // ==========================================
  // 6. RETURN VALUES
  // ==========================================
  return {
    stores, categories, loading,
    formData, editingId, error, isSubmitting,
    isModalOpen, // <-- State Modal
    handleChange, handleSubmit, deleteCategory,
    openAddModal, openEditModal, closeModal, // <-- Handlers Modal
    refetch: fetchCategories,
  };
}

export default useCategories;