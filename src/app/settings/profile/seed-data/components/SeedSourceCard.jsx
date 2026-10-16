'use client';

import {
  FiDatabase,
  FiPackage,
  FiLayers,
  FiImage,
  FiInfo,
  FiLoader,
  FiAlertTriangle,
} from 'react-icons/fi';

// Helper: Format angka
const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

// Helper: Format tanggal
const formatDate = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

// Kartu kecil untuk statistik
function StatBox({ icon: Icon, label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className={`p-2 rounded-lg shrink-0 ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-800 leading-tight">{formatNumber(value)}</p>
        <p className="text-xs text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function SeedSourceCard({ catalog, store, existingStats, loading }) {
  const totalImages = catalog.products.filter((product) => product.image_file).length;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiDatabase className="text-blue-600" size={20} />
        Sumber Data Seed
      </h2>

      {/* Info sumber data */}
      <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-3">
        <FiInfo className="text-blue-600 shrink-0 mt-0.5" size={18} />
        <div className="text-xs sm:text-sm text-blue-800 space-y-1">
          <p>
            <strong>{catalog.restaurant?.name || 'Katalog seed lokal'}</strong>
            {catalog.restaurant?.address ? ` — ${catalog.restaurant.address}` : ''}
          </p>
          <p>
            Diambil dari <code className="bg-blue-100 px-1 rounded">src/seeds/data.json</code> pada{' '}
            {formatDate(catalog.scrapedAt)}.
          </p>
          <p>
            Produk dimasukkan <strong>tanpa harga</strong> (Harga Jual = 0 dan HPP = 0) agar Anda
            bisa mengisi harga sendiri setelah data masuk.
          </p>
        </div>
      </div>

      {/* Statistik katalog seed */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <StatBox icon={FiLayers} label="Kategori" value={catalog.categories.length} tone="blue" />
        <StatBox icon={FiPackage} label="Produk unik" value={catalog.products.length} tone="green" />
        <StatBox icon={FiImage} label="Gambar tersedia" value={totalImages} tone="gray" />
        <StatBox
          icon={FiAlertTriangle}
          label={`Duplikat dibuang (dari ${formatNumber(catalog.totalSourceItems)} item)`}
          value={catalog.duplicatesRemoved}
          tone="amber"
        />
      </div>

      {/* Daftar kategori */}
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Kategori yang akan dibuat:</p>
        <div className="flex flex-wrap gap-2">
          {catalog.categories.map((category) => (
            <span
              key={category.name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
            >
              {category.name}
              <span className="text-gray-400">({category.product_count})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Target toko + data existing */}
      <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500">Toko tujuan (toko aktif)</p>
          {loading ? (
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <FiLoader className="animate-spin" size={14} /> Memuat toko...
            </p>
          ) : (
            <p className="text-sm font-semibold text-gray-800 mt-1">{store?.name || 'Tidak ada toko aktif'}</p>
          )}
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500">Data yang sudah ada di toko ini</p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            {formatNumber(existingStats.categories)} kategori • {formatNumber(existingStats.products)} produk
          </p>
        </div>
      </div>
    </div>
  );
}
