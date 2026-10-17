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
      <div className="min-h-screen bg-gray-50 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
        
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
        <main className="px-4 py-6 max-w-4xl mx-auto">

          {/* Tombol tambah di atas daftar (konsisten dengan halaman lain) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-800">Daftar Produk HPP</h2>
              <p className="text-sm text-gray-500 break-words">
                {filteredProducts.length} produk
                {selectedKategori ? ` · Kategori: ${selectedKategori}` : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/hpp/hitung-hpp')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
              title="Hitung HPP Produk Baru"
            >
              <FiPlus className="w-5 h-5" />
              <span>Tambah HPP Baru</span>
            </button>
          </div>

          <HPPProductList 
            products={filteredProducts}
            isLoading={isLoading}
            error={error}
            onEdit={handleEdit}
            onDelete={handleDelete}
            formatRupiah={formatRupiah}
          />
        </main>

      </div>
    </PageLayout>
  );
}