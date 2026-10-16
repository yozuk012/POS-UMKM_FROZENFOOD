'use client';

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useActiveStore } from "@/lib/activeStore";
import { supabase } from "@/lib/supabase";
import { FiCalendar, FiAlertCircle } from "react-icons/fi";

// Import 4 Komponen Dashboard yang sudah kita buat
import MetricCards from "./components/MetricCards";
import MonthlyPerformanceChart from "./components/MonthlyPerformanceChart";
import RecentSalesList from "./components/RecentSalesList";
import TopProductsCarousel from "./components/TopProductsCarousel";

const getDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    start: getDateInputValue(startOfMonth),
    end: getDateInputValue(today),
  };
};

export default function DashboardPage() {
  const { user, merchant, loading: authLoading } = useAuth();
  const { storeId } = useActiveStore();
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [activeStoreName, setActiveStoreName] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadActiveStoreName = async () => {
      if (!storeId) {
        if (isMounted) setActiveStoreName('');
        return;
      }

      const { data, error: storeError } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .maybeSingle();

      if (storeError) {
        console.error('Gagal memuat nama toko aktif:', storeError);
        return;
      }

      if (isMounted) setActiveStoreName(data?.name || '');
    };

    loadActiveStoreName();
    return () => {
      isMounted = false;
    };
  }, [storeId]);

  // 2. Panggil hook useDashboard untuk mengambil data real-time
  const {
    metrics,
    monthlyPerformance,
    recentSales,
    topProducts,
    isLoading: dashboardLoading,
    error
  } = useDashboard(storeId, user?.id, dateRange);

  // Gabungkan loading state dari Auth dan Dashboard
  const isLoading = authLoading || dashboardLoading;

  // Fallback jika data merchant belum tersedia
  const storeName = activeStoreName || merchant?.store_name || "Toko Anda";
  const userName = merchant?.full_name || user?.email?.split('@')[0] || "Pengguna";

  // Format tanggal hari ini
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // --- HANDLE LOADING STATE ---
  if (isLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Memuat data dashboard & keuangan...</p>
        </div>
      </PageLayout>
    );
  }

  // --- HANDLE ERROR STATE ---
  if (error) {
    return (
      <PageLayout title="Dashboard">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
          <FiAlertCircle className="text-red-500 mt-1" size={24} />
          <div>
            <h3 className="text-red-800 font-semibold">Gagal Memuat Data Dashboard</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <p className="text-red-500 text-xs mt-2">Pastikan koneksi internet stabil atau coba refresh halaman.</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // --- TAMPILAN UTAMA ---
  return (
    <PageLayout title="Dashboard">

      {/* 1. Header Sambutan Dinamis + Tanggal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
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
        <div className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-lg border border-blue-100 w-fit">
          <FiCalendar className="text-lg" />
          <span className="font-medium text-sm capitalize">{today}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Periode Dashboard</h2>
            <p className="text-xs text-gray-500 mt-1">Pilih tanggal untuk menyesuaikan seluruh data dashboard.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-medium text-gray-500" htmlFor="dashboard-start-date">Dari</label>
            <input
              id="dashboard-start-date"
              type="date"
              value={dateRange.start}
              onChange={(event) => setDateRange((current) => ({ ...current, start: event.target.value }))}
              className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <label className="text-xs font-medium text-gray-500" htmlFor="dashboard-end-date">Sampai</label>
            <input
              id="dashboard-end-date"
              type="date"
              value={dateRange.end}
              onChange={(event) => setDateRange((current) => ({ ...current, end: event.target.value }))}
              className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        {dateRange.start > dateRange.end && (
          <p className="text-xs text-red-600 mt-2">Tanggal mulai harus sama atau sebelum tanggal selesai.</p>
        )}
      </div>

      {/* 2. Kartu Metrik Keuangan (Dinamis dari useDashboard) */}
      <MetricCards metrics={metrics} />

      {/* 3. Grafik Performa Bulanan */}
      <MonthlyPerformanceChart data={monthlyPerformance} title="Performa Keuangan pada Periode Terpilih" />

      {/* 4. Grid Bawah: Riwayat Penjualan & Top Produk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Riwayat Penjualan Terakhir (Mengambil 2/3 lebar di layar besar) */}
        <div className="lg:col-span-2">
          <RecentSalesList sales={recentSales} />
        </div>

        {/* Top Produk Terlaris (Mengambil 1/3 lebar di layar besar, Carousel di HP) */}
        <div className="lg:col-span-1">
          <TopProductsCarousel products={topProducts} />
        </div>

      </div>
    </PageLayout>
  );
}