// src/app/hpp/hitunghpp/components/Step1BahanBaku.jsx
'use client';

import { FiShoppingBag, FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Step1BahanBaku({
  namaProduk,
  setNamaProduk,
  bahanBakuList,
  setBahanBakuList,
  rawMaterials,
  totalPembelianBahan,
  onNext
}) {
  // Tambah card bahan baku baru
  const handleAddBahanBaku = () => {
    setBahanBakuList(prev => [
      ...prev,
      { id: Date.now(), raw_material_id: '', namaBahan: '', satuan: '', qty_needed: 1, cost_per_unit: 0, hargaBeli: '' }
    ]);
  };

  // Update field bahan baku dengan AUTO-CALCULATE
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
              updatedItem.satuan = selectedMaterial.unit;
              updatedItem.cost_per_unit = selectedMaterial.cost_per_unit || 0;
              // AUTO HITUNG: Qty x Harga Satuan
              const qty = parseFloat(updatedItem.qty_needed) || 1;
              updatedItem.hargaBeli = (qty * updatedItem.cost_per_unit).toString();
            }
          }
          
          // 2. Jika user mengubah Qty, hitung ulang Harga Beli secara otomatis
          if (field === 'qty_needed' && updatedItem.cost_per_unit > 0) {
            const qty = parseFloat(value) || 0;
            updatedItem.hargaBeli = (qty * updatedItem.cost_per_unit).toString();
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
      alert('Minimal harus ada 1 bahan baku');
    }
  };

  // Validasi sebelum lanjut
  const handleLanjut = () => {
    if (!namaProduk.trim()) {
      alert('Mohon masukkan nama produk terlebih dahulu');
      return;
    }
    const hasEmptyBahan = bahanBakuList.some(item => !item.raw_material_id || !item.qty_needed);
    if (hasEmptyBahan) {
      alert('Mohon pilih bahan baku dan masukkan jumlah yang dibutuhkan');
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

  return (
    <main className="px-4 py-6 space-y-4">
      {/* Informasi Produk */}
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <FiShoppingBag className="text-blue-600 w-5 h-5" />
          <h3 className="text-lg font-bold text-gray-800">Informasi Produk</h3>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Nama Produk Jadi
          </label>
          <input
            type="text"
            value={namaProduk}
            onChange={(e) => setNamaProduk(e.target.value)}
            placeholder="Contoh: Salad Buah, Lumpia"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Cards Bahan Baku */}
      <div className="space-y-4">
        {bahanBakuList.map((item) => (
          <div key={item.id} className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
            <div className="space-y-4">
              {/* Dropdown Pilih Bahan Baku */}
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Pilih Bahan Baku
                </label>
                <select
                  value={item.raw_material_id}
                  onChange={(e) => handleBahanBakuChange(item.id, 'raw_material_id', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Pilih Bahan --</option>
                  {rawMaterials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} (Rp {material.cost_per_unit}/{material.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Jumlah Dibutuhkan
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.qty_needed}
                    onChange={(e) => handleBahanBakuChange(item.id, 'qty_needed', e.target.value)}
                    placeholder="0.5"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={item.satuan}
                    onChange={(e) => handleBahanBakuChange(item.id, 'satuan', e.target.value)}
                    placeholder="kg, pcs, liter"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none"
                    readOnly
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    Harga Beli Aktual (Total)
                  </label>
                  <input
                    type="number"
                    value={item.hargaBeli}
                    onChange={(e) => handleBahanBakuChange(item.id, 'hargaBeli', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    *Otomatis: {item.qty_needed} {item.satuan} x Rp {item.cost_per_unit}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteBahanBaku(item.id)}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-1"
                  title="Hapus bahan"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tombol Tambah Bahan */}
      <button
        onClick={handleAddBahanBaku}
        className="w-full bg-white/20 backdrop-blur border-2 border-dashed border-white/50 hover:bg-white/30 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <FiPlus className="w-5 h-5" />
        TAMBAH BAHAN LAIN
      </button>

      {/* Total Pembelian Bahan */}
      {totalPembelianBahan > 0 && (
        <div className="bg-blue-50/95 backdrop-blur rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-700 font-semibold">Total Pembelian Bahan:</span>
            <span className="text-2xl font-bold text-blue-700">{formatRupiah(totalPembelianBahan)}</span>
          </div>
        </div>
      )}

      {/* Tombol Lanjut */}
      <button
        onClick={handleLanjut}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg transition-colors"
      >
        LANJUT KE STEP 2
      </button>
    </main>
  );
}