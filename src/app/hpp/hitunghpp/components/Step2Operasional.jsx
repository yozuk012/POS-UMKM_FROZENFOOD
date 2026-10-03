// src/app/hpp/hitunghpp/components/Step2Operasional.jsx
'use client';

import { FiPackage, FiUsers } from 'react-icons/fi';

export default function Step2Operasional({
  jumlahProduk,
  setJumlahProduk,
  selectedCategoryId,
  setSelectedCategoryId,
  categories, // Data dari useHitungHpp
  biayaOperasional,
  setBiayaOperasional,
  onNext
}) {
  // Handle input operasional
  const handleOperasionalChange = (e) => {
    const { name, value } = e.target;
    setBiayaOperasional(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validasi sebelum lanjut ke Step 3
  const handleLanjut = () => {
    const jumlahNum = parseFloat(jumlahProduk);
    if (!jumlahProduk || jumlahNum <= 0) {
      alert('Mohon masukkan jumlah produk yang dihasilkan (harus lebih dari 0)');
      return;
    }

    if (!selectedCategoryId) {
      alert('Mohon pilih kategori produk');
      return;
    }

    onNext();
  };

  return (
    <main className="px-4 py-6 space-y-4">

      {/* Detail Produksi */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <FiPackage className="text-blue-600 w-5 h-5" />
          <h3 className="text-lg font-bold text-gray-800">Detail Produksi</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Jumlah Produk yang Dihasilkan (Yield)
            </label>
            <input
              type="number"
              value={jumlahProduk}
              onChange={(e) => setJumlahProduk(e.target.value)}
              placeholder="Contoh: 10, 20, 50"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Contoh: Dari bahan yang dibeli bisa menghasilkan 10 cup Jus Semangka
            </p>
          </div>

          {/* Dropdown Kategori Produk */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Kategori Produk
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Biaya Operasional */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <FiUsers className="text-blue-600 w-5 h-5" />
          <h3 className="text-lg font-bold text-gray-800">Biaya Operasional (Opsional)</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Biaya Tenaga Kerja (Total per Batch)
            </label>
            <input
              type="number"
              name="tenagaKerja"
              value={biayaOperasional.tenagaKerja}
              onChange={handleOperasionalChange}
              placeholder="Rp 50000"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Total upah untuk membuat batch ini. Sistem akan otomatis membaginya per unit.
            </p>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Biaya Overhead (Total per Batch)
            </label>
            <input
              type="number"
              name="overhead"
              value={biayaOperasional.overhead}
              onChange={handleOperasionalChange}
              placeholder="Rp 20000"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Estimasi biaya listrik, gas, kemasan, dll untuk batch ini.
            </p>
          </div>
        </div>
      </div>

      {/* Tombol Lanjut */}
      <button
        onClick={handleLanjut}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg transition-colors"
      >
        LANJUT KE STEP 3 (HASIL)
      </button>
    </main>
  );
}