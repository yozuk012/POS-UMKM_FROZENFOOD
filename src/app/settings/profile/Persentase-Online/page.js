'use client';

import { FiArrowLeft, FiUser, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiPackage, FiDollarSign, FiInfo, FiEye, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import useGlobalOnlineMarkup from '@/hooks/useGlobalOnlineMarkup';

// Helper: Format Rupiah
const formatRupiah = (number) => {
  if (number === null || number === undefined) return 'Rp 0';
  return 'Rp ' + Math.round(number).toLocaleString('id-ID');
};

// Helper: Format Angka dengan pemisah ribuan
const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '0';
  return Number(number).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export default function PersentaseOnlinePage() {
  const router = useRouter();
  
  const {
    products,
    loading,
    error,
    successMessage,
    newPercentage,
    handlePercentageChange,
    generatePreview,
    applyGlobalMarkup,
    resetForm,
    previewData,
    showPreview,
    summaryStats,
    isSubmitting,
    progress,
    onlyAffectedCount,
  } = useGlobalOnlineMarkup();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white disabled:opacity-50"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white text-center">PERSENTASE<br />ONLINE GLOBAL</h1>
          <div className="w-10" />
        </div>

        {/* Info Box */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex gap-3">
            <FiInfo className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <p className="text-white text-sm leading-relaxed">
              Ubah persentase markup untuk <strong>semua produk online</strong> sekaligus. 
              Cocok untuk menyesuaikan harga saat ada perubahan biaya platform (Shopee, Grab, dll).
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        
        {/* Loading State */}
        {loading && (
          <div className="bg-white/90 rounded-2xl p-8 text-center shadow-lg">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 text-sm">Memuat data produk...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 flex gap-2 items-start shadow-lg">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-300 text-green-700 rounded-xl p-4 flex gap-2 items-start shadow-lg">
            <FiCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Stats Cards */}
            {summaryStats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FiPackage className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-500 font-medium">Total Produk</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{summaryStats.total_products}</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FiTrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-500 font-medium">Rata-rata Markup</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{summaryStats.avg_markup}%</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">📉</span>
                    <span className="text-xs text-gray-500 font-medium">Markup Terendah</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{summaryStats.min_markup}%</p>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">📈</span>
                    <span className="text-xs text-gray-500 font-medium">Markup Tertinggi</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">{summaryStats.max_markup}%</p>
                </div>
              </div>
            )}

            {/* Form Section */}
            <div className="bg-white/95 rounded-2xl p-5 shadow-xl">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiDollarSign className="w-5 h-5 text-blue-600" />
                Atur Persentase Baru
              </h2>

              {/* Percentage Input */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Persentase Markup Online Baru
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newPercentage}
                    onChange={handlePercentageChange}
                    placeholder="Contoh: 25"
                    className="w-full px-4 py-4 pr-12 rounded-xl border-2 border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-lg font-semibold disabled:opacity-50"
                    disabled={isSubmitting}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                    %
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Masukkan angka 0-500 (contoh: 25 untuk markup 25%)
                </p>
              </div>

              {/* Info: Jumlah produk terpengaruh */}
              {newPercentage && summaryStats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>{summaryStats.will_change}</strong> dari <strong>{summaryStats.total_products}</strong> produk akan terpengaruh.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Preview Button */}
                <button
                  type="button"
                  onClick={generatePreview}
                  disabled={!newPercentage || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 font-bold py-3 px-6 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiEye className="w-5 h-5" />
                  <span>Preview Perubahan Harga</span>
                </button>

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={applyGlobalMarkup}
                  disabled={!newPercentage || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Menerapkan... {progress}%</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-5 h-5" />
                      <span>Terapkan ke Semua Produk</span>
                    </>
                  )}
                </button>

                {/* Reset Button */}
                {(newPercentage || showPreview) && !isSubmitting && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                    <span className="text-sm">Reset Form</span>
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {isSubmitting && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Mengupdate {Math.round((progress / 100) * onlyAffectedCount)} dari {onlyAffectedCount} produk...
                  </p>
                </div>
              )}
            </div>

            {/* Preview Section */}
            {showPreview && previewData.length > 0 && (
              <div className="bg-white/95 rounded-2xl shadow-xl overflow-hidden">
                {/* Preview Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FiEye className="w-5 h-5 text-white" />
                      <h3 className="text-white font-bold text-base">Preview Perubahan</h3>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {previewData.length} produk
                    </span>
                  </div>
                </div>

                {/* Preview Info */}
                <div className="bg-yellow-50 border-b border-yellow-200 px-5 py-3">
                  <p className="text-xs text-yellow-800 leading-relaxed">
                    <strong>⚠️ Perhatian:</strong> Ini hanya preview. Harga belum diubah. 
                    Klik &quot;Terapkan ke Semua Produk&quot; untuk menyimpan perubahan.
                  </p>
                </div>

                {/* Preview List */}
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                  {previewData.map((product) => {
                    const isPriceUp = product.price_difference > 0;
                    const isPriceDown = product.price_difference < 0;
                    const isPriceSame = product.price_difference === 0;

                    return (
                      <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                        {/* Product Name */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm">{product.name}</h4>
                            <p className="text-xs text-gray-500">SKU: {product.sku || '-'}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            isPriceUp ? 'bg-green-100 text-green-700' :
                            isPriceDown ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {isPriceUp ? `+${formatNumber(product.price_change_pct, 1)}%` :
                             isPriceDown ? `${formatNumber(product.price_change_pct, 1)}%` :
                             'Sama'}
                          </span>
                        </div>

                        {/* Price Comparison */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {/* Before */}
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <p className="text-[10px] text-gray-500 font-semibold mb-0.5">SEBELUM ({product.current_markup_pct}%)</p>
                            <p className="text-sm font-bold text-gray-700">{formatRupiah(product.current_online_price)}</p>
                          </div>

                          {/* After */}
                          <div className={`rounded-lg p-2.5 ${
                            isPriceUp ? 'bg-green-50' :
                            isPriceDown ? 'bg-red-50' :
                            'bg-gray-50'
                          }`}>
                            <p className="text-[10px] text-gray-500 font-semibold mb-0.5">SESUDAH ({product.new_markup_pct}%)</p>
                            <p className={`text-sm font-bold ${
                              isPriceUp ? 'text-green-700' :
                              isPriceDown ? 'text-red-700' :
                              'text-gray-700'
                            }`}>
                              {formatRupiah(product.new_online_price)}
                            </p>
                          </div>
                        </div>

                        {/* Difference */}
                        {!isPriceSame && (
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-gray-500">Selisih:</span>
                            <span className={`font-bold ${
                              isPriceUp ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isPriceUp ? '+' : ''}{formatRupiah(product.price_difference)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Preview Footer Summary */}
                <div className="bg-gray-50 border-t border-gray-200 px-5 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total perubahan:</span>
                    <span className="font-bold text-gray-800">
                      {previewData.filter(p => p.price_difference !== 0).length} produk berubah
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Products List (Collapsible) */}
            {!showPreview && products.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FiPackage className="w-4 h-4 text-blue-600" />
                  Markup Online Saat Ini
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {products.slice(0, 10).map((product) => (
                    <div key={product.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatRupiah(product.base_price)} → {formatRupiah(product.current_online_price)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-blue-600 ml-2 flex-shrink-0">
                        {product.current_markup_pct}%
                      </span>
                    </div>
                  ))}
                  {products.length > 10 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{products.length - 10} produk lainnya...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && !error && (
              <div className="bg-white/90 rounded-2xl p-8 text-center shadow-lg">
                <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Belum ada produk aktif</p>
                <p className="text-gray-500 text-sm mt-1">
                  Tambahkan produk terlebih dahulu untuk menggunakan fitur ini
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Spacing */}
      <div className="h-8" />
    </div>
  );
}