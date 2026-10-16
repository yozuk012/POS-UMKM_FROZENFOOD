'use client';

import { useState } from 'react';
import {
  FiDownload,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiFileText,
} from 'react-icons/fi';

// Label jenis data — harus sama dengan SCOPE_LABELS di hooks/useBackupsData.js
// agar nama file yang dipratinjau sesuai dengan nama file hasil ekspor.
const SCOPE_FILE_LABELS = {
  sales_report: 'Laporan Penjualan',
  master_data: 'Master Data',
  inventory: 'Stok Master Data',
  expenses: 'Biaya Operasional',
  full_backup: 'Full',
};

const sanitizeFileName = (value) =>
  String(value || 'Toko')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

export default function ExportPanel({ isProcessing, handleExport, error, setError, storeName }) {
  // State lokal untuk form
  const [scope, setScope] = useState('sales_report');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Daftar scope yang membutuhkan filter tanggal
  const needsDateFilter = ['sales_report', 'expenses'].includes(scope);

  // Pratinjau nama file yang akan diunduh, contoh: "Frozen Abercio Food Backups Full.xlsx"
  const previewFileName = `${sanitizeFileName(storeName || 'Nama Toko')} Backups ${
    SCOPE_FILE_LABELS[scope] || 'Data'
  }.xlsx`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset notifikasi sebelumnya
    setSuccessMessage('');
    if (setError) setError(null);

    // Validasi tanggal jika diperlukan
    if (needsDateFilter && (!dateFrom || !dateTo)) {
      if (setError) {
        setError('Silakan pilih rentang tanggal (Dari dan Sampai) untuk laporan ini.');
      }
      return;
    }

    if (needsDateFilter && dateFrom > dateTo) {
      if (setError) setError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
      return;
    }

    // Panggil fungsi export dari hook useBackupsData
    const result = await handleExport(scope, dateFrom || null, dateTo || null);

    if (result.success) {
      setSuccessMessage(result.message || 'Data berhasil diekspor dan siap diunduh!');
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiDownload className="text-blue-600" size={20} />
        Pengaturan Ekspor Data
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Notifikasi Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <FiAlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Notifikasi Sukses */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
            <FiCheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Pilihan Jenis Data (Scope) */}
        <div>
          <label htmlFor="scope" className="block text-sm font-medium text-gray-700 mb-1">
            Jenis Data yang Diekspor
          </label>
          <select
            id="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isProcessing}
          >
            <option value="sales_report">Laporan Penjualan (Transaksi)</option>
            <option value="master_data">Master Data (Produk, Resep, Bahan Baku)</option>
            <option value="inventory">Stok Saat Ini (Inventory Snapshot)</option>
            <option value="expenses">Biaya Operasional</option>
            <option value="full_backup">Full Backup (Semua Data)</option>
          </select>

          {/* Deskripsi dinamis berdasarkan pilihan */}
          <p className="mt-1.5 text-xs text-gray-500 italic">
            {scope === 'sales_report' &&
              '1 file Excel berisi sheet Ringkasan + Detail Penjualan (nama produk, channel, metode bayar, diskon, dan potongan platform sudah dalam bahasa Indonesia).'}
            {scope === 'master_data' &&
              '1 file Excel berisi sheet Ringkasan, Master Produk, Bahan Baku, Kategori, dan Resep — semua kolom memakai istilah yang mudah dipahami.'}
            {scope === 'inventory' &&
              '1 file Excel berisi sheet Ringkasan + Stok Master Data (nama item, satuan, jumlah stok, dan estimasi nilai stok).'}
            {scope === 'expenses' &&
              '1 file Excel berisi sheet Ringkasan + Biaya Operasional berdasarkan rentang tanggal yang dipilih.'}
            {scope === 'full_backup' &&
              '1 file Excel berisi 5 sheet: Ringkasan, Master Produk, Bahan & Resep, Riwayat Penjualan, serta Stok & Operasional.'}
          </p>

          {/* Pratinjau nama file yang akan diunduh */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-2">
            <FiFileText className="text-blue-500 shrink-0 mt-0.5" size={16} />
            <div className="min-w-0">
              <p className="text-xs text-blue-700 font-medium">Nama file yang akan diunduh:</p>
              <p className="text-xs sm:text-sm text-blue-900 font-semibold break-all">{previewFileName}</p>
            </div>
          </div>
        </div>

        {/* Filter Tanggal (Hanya muncul jika scope membutuhkan) */}
        {needsDateFilter && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md border border-gray-100">
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                id="dateFrom"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isProcessing}
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                id="dateTo"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isProcessing}
              />
            </div>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isProcessing ? (
              <>
                <FiLoader className="animate-spin" size={18} />
                Membuat file backup...
              </>
            ) : (
              <>
                <FiDownload size={18} />
                Ekspor & Unduh File Excel
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}