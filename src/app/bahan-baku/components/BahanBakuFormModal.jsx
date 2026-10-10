'use client';

import { useState, useEffect } from 'react';
import { FiX, FiInfo } from 'react-icons/fi';
import { getPurchaseEditValues } from '@/lib/rawMaterialUtils';

export default function BahanBakuFormModal({ 
  isOpen, 
  onClose, 
  editingItem, 
  onSubmit, 
  isSubmitting 
}) {
  // State Form: Disesuaikan dengan logika Auto Konversi
  const [formData, setFormData] = useState({
    name: '',
    qty_beli: '1',          // Jumlah yang dibeli (misal: 1)
    satuan_beli: 'kg',      // Satuan saat membeli (dropdown)
    total_harga_beli: '',   // Total harga yang dibayar (misal: 45000)
    initialStock: '0',      // Stok awal (dalam satuan beli yang sama, misal: 1)
    is_perishable: false,
    shelf_life_days: ''
  });

  // Reset atau isi form saat modal dibuka / item berubah
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        const purchaseValues = getPurchaseEditValues(editingItem);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          name: editingItem.name || '',
          qty_beli: String(purchaseValues.quantity),
          satuan_beli: purchaseValues.unit || 'kg',
          total_harga_beli: String(purchaseValues.price || ''),
          initialStock: String(purchaseValues.stock),
          is_perishable: editingItem.is_perishable || false,
          shelf_life_days: editingItem.shelf_life_days || ''
        });
      } else {
        // Mode Tambah: Reset form ke default belanja
        setFormData({
          name: '',
          qty_beli: '1',
          satuan_beli: 'kg',
          total_harga_beli: '',
          initialStock: '0',
          is_perishable: false,
          shelf_life_days: ''
        });
      }
    }
  }, [isOpen, editingItem]);

  // Handle perubahan input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasi sederhana
    if (!formData.name.trim() || !formData.qty_beli || !formData.satuan_beli || !formData.total_harga_beli) {
      alert('Mohon lengkapi Nama, Jumlah Beli, Satuan, dan Total Harga Beli!');
      return;
    }

    // Siapkan payload PERSIS seperti yang diharapkan oleh useBahanBaku.js
    const payload = {
      name: formData.name.trim(),
      satuan_beli: formData.satuan_beli.toLowerCase(),
      qty_beli: parseFloat(formData.qty_beli),
      total_harga_beli: parseFloat(formData.total_harga_beli),
      is_perishable: formData.is_perishable,
      shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null
    };

    const initialStockInput = parseFloat(formData.initialStock) || 0;

    // Kirim ke parent (yang akan memanggil hook useBahanBaku)
    onSubmit(payload, initialStockInput);
  };

  // Jika modal tidak terbuka, jangan render apa-apa
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header Modal */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">
            {editingItem ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
          </h3>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-white/80 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Body Modal (Form) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Nama Bahan */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Nama Bahan Baku <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Daging Ayam Giling, Tepung Tapioka"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Baris 1: Jumlah Beli & Satuan Beli */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Isi Pembelian <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="qty_beli"
                value={formData.qty_beli}
                onChange={handleChange}
                placeholder="1"
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Satuan Pembelian <span className="text-red-500">*</span>
              </label>
              <select
                name="satuan_beli"
                value={formData.satuan_beli}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="gram">Gram (g)</option>
                <option value="liter">Liter (L)</option>
                <option value="ml">Mililiter (ml)</option>
                <option value="pack">Pack / Bungkus</option>
                <option value="lembar">Lembar</option>
                <option value="pcs">Pcs / Butir</option>
              </select>
            </div>
          </div>

          {/* Total Harga Beli */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-1">
              Harga Total Pembelian (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="total_harga_beli"
              value={formData.total_harga_beli}
              onChange={handleChange}
              placeholder="Contoh: 45000"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <FiInfo className="w-3 h-3" />
              Contoh: isi 1 kg dengan harga 15000 akan dihitung sebagai Rp15/gram di database.
            </p>
          </div>

          {/* Stok Awal */}
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
            <label className="block text-blue-800 text-sm font-semibold mb-1">
              Stok Awal Gudang <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="initialStock"
              value={formData.initialStock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            />
            <p className="text-xs text-blue-600 mt-1">
              Masukkan stok dalam <strong>{formData.satuan_beli}</strong>. Contoh: punya 100 kg, ketik 100.
            </p>
          </div>

          {/* Checkbox Mudah Busuk */}
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
            <input
              type="checkbox"
              name="is_perishable"
              id="is_perishable"
              checked={formData.is_perishable}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_perishable" className="text-gray-700 font-medium cursor-pointer select-none text-sm">
              Bahan ini mudah busuk/rusak (Perishable)
            </label>
          </div>

          {/* Masa Simpan (Muncul jika checkbox dicentang) */}
          {formData.is_perishable && (
            <div className="animate-fadeIn">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Masa Simpan Ideal (Hari)
              </label>
              <input
                type="number"
                name="shelf_life_days"
                value={formData.shelf_life_days}
                onChange={handleChange}
                placeholder="Contoh: 3"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                editingItem ? 'Simpan Perubahan' : 'Tambah & Stok'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}