// src/app/hpp/hppproduk/page.js
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import useHppProduk from '@/hooks/useHppProduk';

// Import Komponen UI
import HPPHeader from './components/HPPHeader';
import HPPProductList from './components/HPPProductList';

// Import Icons
import { FiPlus } from 'react-icons/fi';

export default function HPPProdukPage() {
  const router = useRouter();
  
  // 1. Panggil Hook untuk mengambil data dari Supabase
  const { products, isLoading, error, deleteProduct } = useHppProduk();

  // 2. State Lokal untuk UI
  const [selectedKategori, setSelectedKategori] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 3. Ekstrak Kategori Unik dari Data Produk (Otomatis)
  const kategoriList = useMemo(() => {
    const uniqueKategori = [...new Set(products.map(p => p.kategori).filter(Boolean))];
    return uniqueKategori.sort();
  }, [products]);

  // 4. Filter Produk berdasarkan Kategori yang dipilih
  const filteredProducts = useMemo(() => {
    if (!selectedKategori) return products;
    return products.filter(item => item.kategori === selectedKategori);
  }, [products, selectedKategori]);

  // 5. Handler untuk Tombol Edit
  const handleEdit = (item) => {
    const params = new URLSearchParams({
      productId: String(item.id),
      namaProduk: item.namaProduk,
    });

    router.push(`/hpp/hitung-hpp?${params.toString()}`);
  };

  // 6. Handler untuk Tombol Hapus
  const handleDelete = async (id) => {
    const result = await deleteProduct(id);
    if (!result.success) {
      alert(`Gagal menghapus: ${result.message}`);
    }
    // Jika sukses, hook akan otomatis me-refresh daftar (tidak perlu alert sukses)
  };

  // 7. Helper Format Rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  return (
    <PageLayout title="HPP Produk">
      <div className="min-h-screen bg-gray-50 -mx-4 -mt-4 md:-mx-6 md:-mt-6 relative">
        
        {/* Header & Filter Kategori */}
        <HPPHeader 
          onBack={() => router.back()}
          selectedKategori={selectedKategori}
          setSelectedKategori={setSelectedKategori}
          kategoriList={kategoriList}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
        />

        {/* Area Daftar Produk */}
        <main className="px-4 py-6">
          <HPPProductList 
            products={filteredProducts}
            isLoading={isLoading}
            error={error}
            onEdit={handleEdit}
            onDelete={handleDelete}
            formatRupiah={formatRupiah}
          />
        </main>

        {/* Floating Action Button (FAB) untuk Tambah HPP Baru */}
        {/* Menggantikan tombol "LANJUT" yang kurang logis di halaman daftar */}
        <button
          onClick={() => router.push('/hpp/hitung-hpp')}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-full shadow-xl transition-all flex items-center gap-2 z-30 hover:scale-105 active:scale-95"
          title="Hitung HPP Produk Baru"
        >
          <FiPlus className="w-5 h-5" />
          <span className="hidden md:inline">TAMBAH HPP BARU</span>
          <span className="md:hidden">TAMBAH</span>
        </button>

      </div>
    </PageLayout>
  );
}