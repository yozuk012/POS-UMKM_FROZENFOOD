'use client';

import {
  FiDownload,
  FiAlertCircle,
  FiLoader,
  FiClock,
  FiDatabase,
  FiTrendingUp,
  FiPackage,
  FiFileText,
  FiAlertTriangle,
} from 'react-icons/fi';

export default function BackupHistoryTable({
  backups = [],
  isLoading,
  isProcessing,
  downloadBackupFile,
  storeName = '',
}) {
  const formatFileSize = (sizeKb) => {
    if (!sizeKb) return '-';
    if (sizeKb < 1024) return `${sizeKb} KB`;
    return `${(sizeKb / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeInfo = (type) => {
    const types = {
      EXPORT_SALES: { label: 'Laporan Penjualan', fileLabel: 'Laporan Penjualan', icon: FiTrendingUp, color: 'text-blue-600' },
      EXPORT_MASTER: { label: 'Master Data', fileLabel: 'Master Data', icon: FiDatabase, color: 'text-purple-600' },
      EXPORT_INVENTORY: { label: 'Stok Fisik', fileLabel: 'Stok Master Data', icon: FiPackage, color: 'text-orange-600' },
      EXPORT_EXPENSES: { label: 'Biaya Operasional', fileLabel: 'Biaya Operasional', icon: FiFileText, color: 'text-pink-600' },
      EXPORT_FULL: { label: 'Full Backup', fileLabel: 'Full', icon: FiDatabase, color: 'text-gray-800' },
      IMPORT_MASTER_DATA: { label: 'Impor Master Data', fileLabel: 'Master Data', icon: FiDatabase, color: 'text-green-700' },
      IMPORT_HISTORICAL_SALES: { label: 'Impor Transaksi', fileLabel: 'Transaksi', icon: FiTrendingUp, color: 'text-green-700' },
      IMPORT_INITIAL_INVENTORY: { label: 'Impor Stok Awal', fileLabel: 'Stok Awal', icon: FiPackage, color: 'text-green-700' },
    };

    return (
      types[type] || {
        label: type || 'Tidak Diketahui',
        fileLabel: 'Data',
        icon: FiFileText,
        color: 'text-gray-500',
      }
    );
  };

  const getStatusBadge = (status) => {
    const statuses = {
      completed: { label: 'Selesai', class: 'bg-green-100 text-green-800' },
      completed_with_errors: { label: 'Selesai (Ada Error)', class: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'Gagal', class: 'bg-red-100 text-red-800' },
      pending: { label: 'Menunggu', class: 'bg-gray-100 text-gray-800' },
      processing: { label: 'Memproses', class: 'bg-blue-100 text-blue-800' },
    };

    return statuses[status] || { label: status || 'Tidak Diketahui', class: 'bg-gray-100 text-gray-800' };
  };

  const isImport = (type) => type && type.startsWith('IMPORT_');

  const pad2 = (value) => String(value).padStart(2, '0');

  const sanitizeFileName = (value) =>
    String(value || 'Toko')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

  const buildDateStamp = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
  };

  // Nama file unduhan: "<Nama Toko> Backups <Jenis Data> <tanggal>.xlsx"
  // fileLabel disamakan dengan SCOPE_LABELS di hooks/useBackupsData.js agar
  // konsisten dengan nama file hasil ekspor.
  const buildDownloadName = (backup) => {
    const typeInfo = getTypeInfo(backup.backup_type);
    const label = typeInfo.fileLabel || typeInfo.label;
    return `${sanitizeFileName(storeName || 'Toko')} Backups ${label} ${buildDateStamp(backup.created_at)}.xlsx`;
  };

  // Nama file log error impor: "<Nama Toko> Log Error Impor <tanggal>.xlsx"
  const buildErrorLogName = (backup) =>
    `${sanitizeFileName(storeName || 'Toko')} Log Error Impor ${buildDateStamp(backup.created_at)}.xlsx`;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <FiLoader className="animate-spin mx-auto text-blue-500 mb-3" size={32} />
        <p className="text-gray-500 text-sm">Memuat riwayat backup...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FiClock className="text-gray-600 shrink-0" size={20} />
          Riwayat Aktivitas Backup & Impor
        </h2>
        <span className="text-xs text-gray-500">Menampilkan {backups.length} aktivitas terakhir</span>
      </div>

      {backups.length === 0 ? (
        <div className="p-8 sm:p-12 text-center">
          <FiAlertTriangle className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">Belum ada riwayat aktivitas</p>
          <p className="text-gray-400 text-sm mt-1">
            Mulai dengan mengekspor atau mengimpor data Anda menggunakan panel di atas.
          </p>
        </div>
      ) : (
        <>
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktivitas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ukuran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {backups.map((backup) => {
                const typeInfo = getTypeInfo(backup.backup_type);
                const statusBadge = getStatusBadge(backup.status);
                const TypeIcon = typeInfo.icon;
                const isImportType = isImport(backup.backup_type);

                return (
                  <tr key={backup.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(backup.created_at)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`flex items-center gap-2 text-sm font-medium ${
                          isImportType ? 'text-green-700' : 'text-blue-700'
                        }`}
                      >
                        {isImportType ? (
                          <span className="px-2 py-0.5 bg-green-100 rounded text-xs uppercase">
                            Impor
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-100 rounded text-xs uppercase">
                            Ekspor
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-800">
                        <TypeIcon className={typeInfo.color} size={16} />
                        {typeInfo.label}
                      </div>

                      {backup.date_from && backup.date_to && (
                        <p className="text-xs text-gray-400 mt-0.5 ml-6">
                          {new Date(backup.date_from).toLocaleDateString('id-ID')} -{' '}
                          {new Date(backup.date_to).toLocaleDateString('id-ID')}
                        </p>
                      )}

                      {backup.import_summary && (
                        <p className="text-xs text-gray-500 mt-1">
                          ✓ {backup.import_summary.success ?? 0} sukses | ✗ {backup.import_summary.failed ?? 0} gagal
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(backup.file_size_kb)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.class}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {backup.file_url &&
                          (backup.status === 'completed' || backup.status === 'completed_with_errors') &&
                          !isImportType && (
                            <button
                              onClick={() =>
                                downloadBackupFile(backup.file_url, buildDownloadName(backup))
                              }
                              disabled={isProcessing}
                              title={buildDownloadName(backup)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors text-xs"
                            >
                              <FiDownload size={14} />
                              Unduh
                            </button>
                          )}

                        {backup.status === 'completed_with_errors' &&
                          backup.error_log_url &&
                          isImportType && (
                            <button
                              onClick={() =>
                                downloadBackupFile(backup.error_log_url, buildErrorLogName(backup))
                              }
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50 transition-colors text-xs"
                              title={buildErrorLogName(backup)}
                            >
                              <FiAlertCircle size={14} />
                              Log Error
                            </button>
                          )}

                        {(backup.status === 'failed' ||
                          backup.status === 'pending' ||
                          backup.status === 'processing') && (
                          <span className="text-xs text-gray-400 italic">Tidak tersedia</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Tampilan Kartu untuk Layar Kecil (Mobile) */}
        <div className="md:hidden divide-y divide-gray-200">
          {backups.map((backup) => {
            const typeInfo = getTypeInfo(backup.backup_type);
            const statusBadge = getStatusBadge(backup.status);
            const TypeIcon = typeInfo.icon;
            const isImportType = isImport(backup.backup_type);
            const canDownload =
              backup.file_url &&
              (backup.status === 'completed' || backup.status === 'completed_with_errors') &&
              !isImportType;

            return (
              <div key={backup.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <TypeIcon className={`${typeInfo.color} shrink-0`} size={16} />
                      <span className="truncate">{typeInfo.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(backup.created_at)}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.class}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span
                    className={`px-2 py-0.5 rounded uppercase ${
                      isImportType ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isImportType ? 'Impor' : 'Ekspor'}
                  </span>
                  <span>Ukuran: {formatFileSize(backup.file_size_kb)}</span>
                  {backup.date_from && backup.date_to && (
                    <span>
                      Periode: {new Date(backup.date_from).toLocaleDateString('id-ID')} -{' '}
                      {new Date(backup.date_to).toLocaleDateString('id-ID')}
                    </span>
                  )}
                </div>

                {backup.import_summary && (
                  <p className="text-xs text-gray-500">
                    ✓ {backup.import_summary.success ?? 0} sukses | ✗ {backup.import_summary.failed ?? 0} gagal
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {canDownload && (
                    <button
                      onClick={() => downloadBackupFile(backup.file_url, buildDownloadName(backup))}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors text-xs"
                    >
                      <FiDownload size={14} />
                      Unduh
                    </button>
                  )}

                  {backup.status === 'completed_with_errors' && backup.error_log_url && isImportType && (
                    <button
                      onClick={() => downloadBackupFile(backup.error_log_url, buildErrorLogName(backup))}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50 transition-colors text-xs"
                    >
                      <FiAlertCircle size={14} />
                      Log Error
                    </button>
                  )}

                  {(backup.status === 'failed' ||
                    backup.status === 'pending' ||
                    backup.status === 'processing') && (
                    <span className="text-xs text-gray-400 italic">File tidak tersedia</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </>

      )}
    </div>
  );
}