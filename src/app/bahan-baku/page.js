'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';

// PERBAIKAN: Pastikan path import sesuai dengan nama file hook Anda
import useBahanBaku from '@/hooks/useBahanBaku';

import BahanBakuList from './components/BahanBakuList';
import BahanBakuFormModal from './components/BahanBakuFormModal';
import { FiPlus, FiSearch, FiArrowLeft } from 'react-icons/fi';

export default function BahanBakuPage() {
  const router = useRouter();
  
  // 1. Panggil Hook
  const { 
    bahanBaku, 
    isLoading, 
    isMutating, 
    error, 
    addBahanBaku, 
    updateBahanBaku, 
    deleteBahanBaku 
  } = useBahanBaku();

  // 2. State Lokal untuk UI
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 

  // 3. Filter Data berdasarkan Search (Case-insensitive)
  const filteredBahanBaku = bahanBaku.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 4. Handler untuk Tombol Edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // 5. Handler untuk Tombol Hapus
  const handleDelete = async (id) => {
    // Konfirmasi ganda untuk mencegah hapus tidak sengaja
    const isConfirmed = window.confirm('Yakin ingin menghapus bahan baku ini? Data stok di inventory juga akan ikut terhapus.');
    if (!isConfirmed) return;

    const result = await deleteBahanBaku(id);
    if (result.success) {
      alert(result.message);
    } else {
      alert(`Gagal menghapus: ${result.message}`);
    }
  };

  // 6. Handler untuk Tombol Tambah (Membuka Modal)
  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // 7. Handler Submit Form dari Modal
  const handleSubmitForm = async (payload, initialStockInput = 0) => {
    let result;
    
    if (editingItem) {
      // --- MODE EDIT ---
      // Pisahkan initialStock (yang di sini berfungsi sebagai update stok) dari data master
      result = await updateBahanBaku(editingItem.id, payload, parseFloat(initialStockInput));
    } else {
      // --- MODE TAMBAH ---
      // Pisahkan initialStock agar bisa dikirim sebagai parameter ke-2 ke hook
      result = await addBahanBaku(payload, parseFloat(initialStockInput));
    }

    if (result.success) {
      alert(result.message);
      setIsModalOpen(false); // Tutup modal jika sukses
      setEditingItem(null);
    } else {
      alert(`Gagal menyimpan: ${result.message}`);
    }
  };

  return (
    <PageLayout title="Bahan Baku">
      <div className="min-h-screen bg-gray-50 -mx-4 -mt-4 md:-mx-6 md:-mt-6 p-4 md:p-6">
        
        {/* Header Halaman */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <button 
              onClick={() => router.back()} 
              className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-2 text-sm font-medium transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Bahan Baku</h1>
            <p className="text-sm text-gray-500">Kelola stok bahan mentah, kemasan, dan harga modal Anda</p>
          </div>

          <button
            onClick={handleAddNew}
            disabled={isMutating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <FiPlus className="w-5 h-5" />
            Tambah Bahan Baku
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama bahan baku (contoh: Tepung, Gula)..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm transition-all"
          />
        </div>

        {/* Area Daftar Bahan Baku */}
        <BahanBakuList 
          bahanBaku={filteredBahanBaku}
          isLoading={isLoading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Modal Form */}
        <BahanBakuFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          editingItem={editingItem}
          onSubmit={handleSubmitForm}
          isSubmitting={isMutating}
        />

      </div>
    </PageLayout>
  );
}