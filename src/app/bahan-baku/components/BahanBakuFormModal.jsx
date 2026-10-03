// src/app/bahan-baku/components/BahanBakuFormModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

export default function BahanBakuFormModal({ 
  isOpen, 
  onClose, 
  editingItem, 
  onSubmit, 
  isSubmitting 
}) {
  // State Form (Ditambahkan initialStock)
  const [formData, setFormData] = useState({
    name: '',
    unit: 'pcs',
    cost_per_unit: '',
    is_perishable: false,
    shelf_life_days: '',
    initialStock: '' // Baru: Untuk stok awal saat pembuatan
  });

  // Reset atau isi form saat modal dibuka / item berubah
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        // Mode Edit: Isi dengan data yang ada (Stok awal tidak diedit di sini)
        setFormData({
          name: editingItem.name || '',
          unit: editingItem.unit || 'pcs',
          cost_per_unit: editingItem.cost_per_unit || '',
          is_perishable: editingItem.is_perishable || false,
          shelf_life_days: editingItem.shelf_life_days || '',
          initialStock: String(editingItem.qty_on_hand ?? 0)
        });
      } else {
        // Mode Tambah: Reset form
        setFormData({
          name: '',
          unit: 'pcs',
          cost_per_unit: '',
          is_perishable: false,
          shelf_life_days: '',
          initialStock: '0'
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
    if (!formData.name.trim() || !formData.unit.trim() || !formData.cost_per_unit) {
      alert('Mohon lengkapi Nama, Satuan, dan Harga Modal!');
      return;
    }

    // Siapkan payload (konversi tipe data agar sesuai database dan hook)
    const payload = {
      name: formData.name.trim(),
      unit: formData.unit.trim().toLowerCase(),
      cost_per_unit: parseFloat(formData.cost_per_unit),
      is_perishable: formData.is_perishable,
      shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null,
      initialStock: parseFloat(formData.initialStock) || 0
    };

    onSubmit(payload);
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
              placeholder="Contoh: Semangka, Gula Pasir, Cup Plastik"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Satuan */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Satuan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="pcs, kg, liter"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Harga Modal per Satuan */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Harga Modal <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="cost_per_unit"
                value={formData.cost_per_unit}
                onChange={handleChange}
                placeholder="15000"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg animate-fadeIn">
            <label className="block text-blue-800 text-sm font-semibold mb-1">
              {editingItem ? 'Stok Gudang' : 'Stok Awal di Gudang'} <span className="text-red-500">*</span>
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
              {editingItem
                ? 'Masukkan jumlah stok fisik terbaru di gudang.'
                : 'Jumlah fisik barang yang langsung dimasukkan ke inventory.'}
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
            <label htmlFor="is_perishable" className="text-gray-700 font-medium cursor-pointer select-none">
              Bahan ini mudah busuk/rusak (Perishable)
            </label>
          </div>

          {/* Masa Simpan (Muncul jika checkbox dicentang) */}
          {formData.is_perishable && (
            <div className="animate-slideDown">
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Masa Simpan Ideal (Hari)
              </label>
              <input
                type="number"
                name="shelf_life_days"
                value={formData.shelf_life_days}
                onChange={handleChange}
                placeholder="Contoh: 7"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
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