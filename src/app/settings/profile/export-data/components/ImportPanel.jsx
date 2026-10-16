'use client';

import { useState, useRef } from 'react';
import {
  FiUpload,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiFileText,
  FiInfo,
  FiDownload,
} from 'react-icons/fi';

export default function ImportPanel({ isProcessing, handleImport, error, setError }) {
  const [scope, setScope] = useState('master_data');
  const [file, setFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  // Handle saat user memilih file dari explorer
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSuccessMessage('');
      setImportSummary(null);
    }
  };

  // Handle saat user drag & drop file
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      setSuccessMessage('');
      setImportSummary(null);
    } else {
      if (setError) setError('Hanya file .xlsx atau .csv yang diperbolehkan.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setImportSummary(null);
    if (setError) setError(null);

    if (!file) {
      if (setError) setError('Silakan pilih file Excel atau CSV terlebih dahulu.');
      return;
    }

    // Panggil fungsi import dari hook useBackupsData
    const result = await handleImport(file, scope);

    if (result.success) {
      setImportSummary({ success: result.successCount, failed: result.failedCount });
      setSuccessMessage(result.message);

      // Reset file input setelah sukses
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    // Placeholder: Nanti bisa diarahkan ke file publik di folder /public atau di-generate via library xlsx
    alert('Fitur download template akan segera tersedia. Untuk saat ini, silakan gunakan format kolom yang sama persis dengan data yang pernah Anda ekspor.');
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiUpload className="text-green-600" size={20} />
        Pengaturan Impor Data
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Notifikasi Error */}
        {error && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <FiAlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Notifikasi Sukses & Ringkasan */}
        {successMessage && (
          <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
            <FiCheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
            <div className="text-xs sm:text-sm text-green-700">
              <p className="font-medium">{successMessage}</p>
              {importSummary && (
                <p className="mt-1 text-xs">
                  Detail: <strong>{importSummary.success}</strong> data berhasil, <strong>{importSummary.failed}</strong> data gagal.
                  {importSummary.failed > 0 && ' Silakan cek tabel riwayat di bawah untuk mengunduh log error.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pilihan Kategori Impor */}
        <div>
          <label htmlFor="importScope" className="block text-sm font-medium text-gray-700 mb-1">
            Kategori Data yang Diimpor
          </label>
          <select
            id="importScope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            disabled={isProcessing}
          >
            <option value="master_data">Master Data (Produk)</option>
            <option value="historical_sales" disabled>Data Transaksi Lampau (Segera Hadir)</option>
            <option value="initial_inventory" disabled>Stok Awal / Stock Opname (Segera Hadir)</option>
          </select>
        </div>

        {/* Info Box / Peringatan Aturan Impor */}
        <div className="p-3 sm:p-4 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-3">
          <FiInfo className="text-blue-500 shrink-0 mt-0.5" size={18} />
          <div className="text-xs sm:text-sm text-blue-700">
            {scope === 'master_data' && (
              <>
                <p><strong>Aturan Impor Master Data:</strong> Sistem akan memperbarui data yang sudah ada berdasarkan <code className="bg-blue-100 px-1 rounded">SKU</code>. Jika SKU tidak ditemukan, data baru akan ditambahkan.</p>
                <p className="mt-2">Kolom wajib pada baris judul: <strong>SKU</strong> dan <strong>Nama Produk</strong>. Kolom lain yang dikenali:</p>
                <ul className="mt-1 ml-4 list-disc space-y-0.5">
                  <li>Harga Jual (Rp) <span className="text-blue-500">(format lama: &quot;Harga Base&quot;)</span></li>
                  <li>HPP (Rp)</li>
                  <li>Satuan</li>
                  <li>Jual Online? (Ya / Tidak)</li>
                  <li>Status Aktif (Ya / Tidak)</li>
                </ul>
                <p className="mt-2">Gunakan sheet <strong>Master Produk</strong> dari hasil ekspor sebagai template impor.</p>
              </>
            )}
            {scope === 'historical_sales' && (
              <p><strong>Aturan Impor Transaksi:</strong> Data yang diimpor <strong>TIDAK</strong> akan memotong stok fisik. Fitur ini murni hanya untuk melengkapi laporan keuangan historis dari sistem lama.</p>
            )}
            {scope === 'initial_inventory' && (
              <p><strong>Aturan Impor Stok:</strong> Data ini akan menimpa (overwrite) jumlah stok fisik saat ini di sistem. Gunakan ini hanya untuk Stock Opname awal atau koreksi stok massal.</p>
            )}
          </div>
        </div>

        {/* Area Upload File (Drag & Drop) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload File (.xlsx / .csv)
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-green-500 transition-colors cursor-pointer bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Hidden Input File */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />

            <FiFileText className="mx-auto text-gray-400 mb-2" size={32} />

            {file ? (
              <p className="text-sm text-gray-700 font-medium truncate">{file.name}</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-green-600">Klik untuk memilih</span> atau drag & drop file di sini
                </p>
                <p className="text-xs text-gray-500 mt-1">Hanya mendukung file Excel (.xlsx) atau CSV (.csv)</p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 font-medium"
          >
            <FiDownload size={14} />
            Download Template Format Excel
          </button>
        </div>

        {/* Tombol Aksi */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isProcessing || !file}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isProcessing ? (
              <>
                <FiLoader className="animate-spin" size={18} />
                Memproses & Validasi Data...
              </>
            ) : (
              <>
                <FiUpload size={18} />
                Mulai Impor Data
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}