'use client';

import { FiPackage, FiPlus, FiTrash2, FiLayers, FiInfo } from 'react-icons/fi';
import { convertToBaseQuantity, formatCompactRupiah, getPurchaseDisplay } from '@/lib/rawMaterialUtils';

export default function Step1BahanBaku({
  // State Produk & Resep
  namaProduk, setNamaProduk,
  categoryId, setCategoryId,
  categories,
  jumlahProduk, setJumlahProduk,
  satuanProduk, setSatuanProduk,
  
  // State Bahan Baku
  bahanBakuList, setBahanBakuList,
  rawMaterials,
  totalPembelianBahan,
  
  // Actions
  onNext
}) {
  
  // Tambah card bahan baku baru
  const handleAddBahanBaku = () => {
    setBahanBakuList(prev => [
      ...prev,
      { 
        id: Date.now(), 
        raw_material_id: '', 
        namaBahan: '', 
        satuanBeli: '',   // Satuan asli dari database (misal: 'kg')
        satuan: 'gram',   // Satuan yang dipakai di resep (default: 'gram')
        qty_needed: '', 
        cost_per_unit: 0, 
        hargaBeli: '0' 
      }
    ]);
  };

  // --- FUNGSI BARU: Logika Konversi Satuan Otomatis ---
  const hitungSubtotal = (qty, costPerUnit, satuanResep) => {
    const qtyDalamSatuanDasar = convertToBaseQuantity(qty, satuanResep);
    return qtyDalamSatuanDasar * costPerUnit;
  };

  // Update field bahan baku dengan AUTO-CALCULATE & KONVERSI
  const handleBahanBakuChange = (id, field, value) => {
    setBahanBakuList(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // 1. Jika user memilih bahan dari dropdown
          if (field === 'raw_material_id') {
            const selectedMaterial = rawMaterials.find(m => m.id.toString() === value);
            if (selectedMaterial) {
              updatedItem.namaBahan = selectedMaterial.name;
              updatedItem.satuanBeli = selectedMaterial.unit; // Simpan satuan DB (misal: 'kg')
              updatedItem.cost_per_unit = Number(selectedMaterial.cost_per_unit) || 0;
              
              // Auto-set satuan resep yang paling masuk akal
              if (selectedMaterial.unit.toLowerCase() === 'kg') {
                updatedItem.satuan = 'gram';
              } else if (selectedMaterial.unit.toLowerCase() === 'liter') {
                updatedItem.satuan = 'ml';
              } else {
                updatedItem.satuan = selectedMaterial.unit;
              }
              
              // Hitung ulang jika qty sudah ada
              const qty = parseFloat(updatedItem.qty_needed) || 0;
              updatedItem.hargaBeli = hitungSubtotal(qty, updatedItem.cost_per_unit, updatedItem.satuan).toString();
            }
          }
          
          // 2. Jika user mengubah Qty atau Satuan Resep, hitung ulang
          if ((field === 'qty_needed' || field === 'satuan') && updatedItem.cost_per_unit > 0) {
            const qty = parseFloat(updatedItem.qty_needed) || 0;
            updatedItem.hargaBeli = hitungSubtotal(
              qty,
              updatedItem.cost_per_unit,
              updatedItem.satuan
            ).toString();
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Hapus card bahan baku
  const handleDeleteBahanBaku = (id) => {
    if (bahanBakuList.length > 1) {
      setBahanBakuList(prev => prev.filter(item => item.id !== id));
    } else {
      alert('Minimal harus ada 1 bahan baku dalam resep.');
    }
  };

  // Validasi sebelum lanjut ke Step 2
  const handleLanjut = () => {
    if (!namaProduk.trim()) {
      alert('Mohon masukkan nama produk terlebih dahulu.');
      return;
    }
    if (!categoryId) {
      alert('Mohon pilih kategori produk.');
      return;
    }
    if (!jumlahProduk || parseFloat(jumlahProduk) <= 0) {
      alert('Jumlah hasil produksi (yield) harus lebih dari 0.');
      return;
    }
    
    const hasEmptyBahan = bahanBakuList.some(item => !item.raw_material_id || !item.qty_needed || parseFloat(item.qty_needed) <= 0);
    if (hasEmptyBahan) {
      alert('Mohon pilih bahan baku dan masukkan jumlah yang dibutuhkan dengan benar.');
      return;
    }
    
    onNext();
  };

  // Format rupiah untuk display
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  // Hitung estimasi HPP per unit di Step 1 (untuk preview user)
  const estimasiHppPerUnit = parseFloat(jumlahProduk) > 0 ? (totalPembelianBahan / parseFloat(jumlahProduk)) : 0;

  return (
    <main className="px-4 py-6 space-y-6">
      
      {/* 1. Informasi Produk & Header Resep */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <FiPackage className="text-blue-600 w-5 h-5" />
          <h3 className="text-lg font-bold text-gray-800">Informasi Produk & Batch</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nama Produk */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Nama Produk Jadi</label>
            <input
              type="text"
              value={namaProduk}
              onChange={(e) => setNamaProduk(e.target.value)}
              placeholder="Contoh: Dimsum Ayam Udang Premium"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Kategori Produk</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Jumlah Hasil Produksi (Yield) */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Jumlah Hasil (Yield)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={jumlahProduk}
                onChange={(e) => setJumlahProduk(e.target.value)}
                placeholder="20"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={satuanProduk}
                onChange={(e) => setSatuanProduk(e.target.value)}
                placeholder="pcs"
                className="w-24 px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-center font-medium text-gray-600"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Berapa unit yang dihasilkan dari resep ini?</p>
          </div>
        </div>
      </div>

      {/* 2. Cards Bahan Baku */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FiLayers className="text-blue-600" /> Komposisi Bahan Baku
          </h3>
        </div>

        {bahanBakuList.map((item, index) => (
          <div key={item.id} className="bg-white/95 backdrop-blur rounded-xl shadow-md p-5 border border-gray-100 relative group">
            <div className="absolute top-4 right-4 text-xs font-bold text-gray-400">#{index + 1}</div>
            
            <div className="space-y-4">
              {/* Dropdown Pilih Bahan Baku */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Pilih Bahan Baku</label>
                <select
                  value={item.raw_material_id}
                  onChange={(e) => handleBahanBakuChange(item.id, 'raw_material_id', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Pilih Bahan --</option>
                  {rawMaterials.map(material => (
                    (() => {
                      const purchaseDisplay = getPurchaseDisplay(material);
                      return (
                        <option key={material.id} value={material.id}>
                          {material.name} ({formatCompactRupiah(purchaseDisplay.price)} / {purchaseDisplay.quantity} {purchaseDisplay.unit})
                        </option>
                      );
                    })()
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Jumlah Dibutuhkan</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.qty_needed}
                    onChange={(e) => handleBahanBakuChange(item.id, 'qty_needed', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Satuan Resep</label>
                  <select
                    value={item.satuan || 'gram'}
                    onChange={(e) => handleBahanBakuChange(item.id, 'satuan', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="gram">gram</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="liter">liter</option>
                    <option value="pcs">pcs</option>
                    <option value="lembar">lembar</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Subtotal Biaya Bahan</label>
                  <input
                    type="text"
                    value={formatRupiah(item.hargaBeli)}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-blue-50 text-blue-800 font-bold cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                    <FiInfo className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>Dihitung: {convertToBaseQuantity(item.qty_needed, item.satuan).toLocaleString('id-ID')} {item.satuanBeli} × Rp {Number(item.cost_per_unit).toLocaleString('id-ID')}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteBahanBaku(item.id)}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-1 border border-red-100"
                  title="Hapus bahan"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Tombol Tambah Bahan */}
      <button
        onClick={handleAddBahanBaku}
        className="w-full bg-white/60 backdrop-blur border-2 border-dashed border-blue-300 hover:bg-blue-50 hover:border-blue-400 text-blue-700 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <FiPlus className="w-5 h-5" />
        TAMBAH BAHAN LAIN
      </button>

      {/* 4. Ringkasan Perhitungan (Preview) */}
      {totalPembelianBahan > 0 && parseFloat(jumlahProduk) > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-5 text-white">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-blue-400/50 pb-3">
              <span className="text-blue-100 font-medium">Total HPP Bahan Baku (1 Batch):</span>
              <span className="text-xl font-bold">{formatRupiah(totalPembelianBahan)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-100 font-medium">Estimasi HPP per {satuanProduk || 'unit'}:</span>
              <span className="text-2xl font-bold text-yellow-300">{formatRupiah(estimasiHppPerUnit)}</span>
            </div>
            {/* PERUBAHAN TEKS DI SINI */}
            <p className="text-xs text-blue-200 mt-2 italic flex items-center gap-1">
              <FiInfo className="w-3 h-3" />
              Biaya operasional (listrik, gas, dll) dicatat terpisah di halaman Pengeluaran.
            </p>
          </div>
        </div>
      )}

      {/* 5. Tombol Lanjut (PERUBAHAN TEKS DI SINI) */}
      <button
        onClick={handleLanjut}
        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
      >
        LANJUT KE STEP 2 (HASIL)
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </main>
  );
}