'use client';

import { useState } from 'react';
import { FiDatabase, FiShield } from 'react-icons/fi';

// Import Layout & Components
import PageLayout from '@/components/PageLayout';
import SeedSourceCard from './components/SeedSourceCard';
import SeedOptionsCard from './components/SeedOptionsCard';
import SeedPreviewTable from './components/SeedPreviewTable';
import SeedProgressCard from './components/SeedProgressCard';
import SeedSummaryCard from './components/SeedSummaryCard';

// Import Hooks
import useSeedData from '@/hooks/useSeedData';

export default function SeedDataPage() {
  // 1. Ambil katalog seed + fungsi eksekusi dari hook
  const {
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
    resetSummary,
  } = useSeedData();

  // 2. Opsi seed (dikontrol user sebelum dijalankan)
  const [options, setOptions] = useState({
    uploadImages: true,
    createInventory: true,
    skipExisting: true,
  });

  const handleOptionChange = (e) => {
    const { name, checked } = e.target;
    setOptions((prev) => ({ ...prev, [name]: checked }));
  };

  // 3. Konfirmasi sebelum menjalankan seed (proses menulis data ke database)
  const handleRun = async () => {
    if (isSeeding) return;

    const confirmMessage =
      `Jalankan seed data ke toko "${store?.name || '-'}"?\n\n` +
      `• ${catalog.categories.length} kategori\n` +
      `• ${catalog.products.length} produk (harga jual 0 & HPP 0)\n` +
      `• ${catalog.products.length} gambar produk\n\n` +
      `Produk yang namanya sudah ada akan dilewati. Lanjutkan?`;

    if (!window.confirm(confirmMessage)) return;

    await runSeed(options);
  };

  return (
    // === WRAPPER DENGAN PAGE LAYOUT ===
    <PageLayout title="Seed Data Produk">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Halaman */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <FiDatabase className="text-blue-600" size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Seed Data Katalog Produk</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Isi kategori dan produk awal dari data seed lokal dalam satu klik.
            </p>
          </div>
        </div>

        {/* Alert Keamanan */}
        <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <FiShield className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="text-xs sm:text-sm text-amber-800">
            <p className="font-semibold">Jalankan fitur ini hanya sekali per toko.</p>
            <p className="mt-0.5">
              Semua produk dimasukkan <strong>tanpa harga</strong> (Harga Jual 0 dan HPP 0) supaya
              Anda bisa mengisi harga sendiri lewat menu Produk dan Hitung HPP.
            </p>
          </div>
        </div>

        {/* Notifikasi Error */}
        {error && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <FiShield className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Kartu Sumber Data */}
        <SeedSourceCard
          catalog={catalog}
          store={store}
          existingStats={existingStats}
          loading={loading}
        />

        {/* Opsi Seed */}
        <SeedOptionsCard options={options} onChange={handleOptionChange} disabled={isSeeding} />

        {/* Tombol Eksekusi + Progress + Log */}
        <SeedProgressCard
          isSeeding={isSeeding}
          progress={progress}
          phase={phase}
          log={log}
          onRun={handleRun}
          disabled={loading || !store}
          totalProducts={catalog.products.length}
        />

        {/* Ringkasan Hasil */}
        <SeedSummaryCard summary={summary} onReset={resetSummary} />

        {/* Pratinjau Data */}
        <SeedPreviewTable products={catalog.products} />
      </div>
    </PageLayout>
  );
}
