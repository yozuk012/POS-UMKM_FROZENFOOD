"use client";

import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  // Ambil data user, merchant, dan status loading dari hook useAuth
  const { user, merchant, loading } = useAuth();

  // Tampilkan loading state sementara data diambil dari Supabase
  if (loading) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Memuat data toko...</p>
        </div>
      </PageLayout>
    );
  }

  // Fallback jika data merchant belum tersedia
  const storeName = merchant?.store_name || "Toko Anda";
  const userName = merchant?.full_name || user?.email?.split('@')[0] || "Pengguna";

  return (
    <PageLayout title="Dashboard">
      {/* Header Sambutan Dinamis */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Halo, {userName}! 👋
        </h1>
        <p className="text-gray-600 mt-2 flex flex-wrap items-center gap-2">
          Selamat datang di dashboard 
          <span className="font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
            {storeName}
          </span>
        </p>
      </div>

      {/* Kartu Ringkasan (Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Card 1: Penjualan Hari Ini */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Penjualan Hari Ini</h3>
              <p className="text-2xl font-bold text-gray-800 mt-1">Rp 0</p>
              <p className="text-xs text-green-600 mt-1">↑ 0% dari kemarin</p>
            </div>
            <div className="p-3 bg-green-100 text-green-600 rounded-full text-2xl">
              💰
            </div>
          </div>
        </div>

        {/* Card 2: Total Produk Aktif */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Produk</h3>
              <p className="text-2xl font-bold text-gray-800 mt-1">0 Item</p>
              <p className="text-xs text-gray-400 mt-1">Produk jadi & bahan baku</p>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full text-2xl">
              📦
            </div>
          </div>
        </div>

        {/* Card 3: Peringatan Stok */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Stok Menipis / Expired</h3>
              <p className="text-2xl font-bold text-red-600 mt-1">0 Item</p>
              <p className="text-xs text-red-500 mt-1">Perlu perhatian segera</p>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-full text-2xl">
              ⚠️
            </div>
          </div>
        </div>

      </div>

      {/* Area untuk Grafik atau Tabel Transaksi Terakhir nanti */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Transaksi Terakhir</h2>
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          Belum ada transaksi hari ini.
        </div>
      </div>
    </PageLayout>
  );
}