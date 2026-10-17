'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiSave, FiCalendar, FiTag, FiDollarSign, FiFileText, FiX, FiAlertCircle } from 'react-icons/fi';
import { MAX_TEXT_LENGTH, validateSafeText } from '@/lib/inputValidation';

// Pemisah ribuan mengikuti format Indonesia (titik), sama seperti tampilan Rupiah
// lain di aplikasi. Ganti menjadi ',' bila ingin format "1,000,000".
const THOUSAND_SEPARATOR = '.';

export default function ExpenseForm({ onSubmit, isSubmitting, editingItem, onCancel }) {
  const today = new Date().toLocaleDateString('sv-SE');

  const [formData, setFormData] = useState({
    date: today,
    category: '',
    amount: '',
    description: ''
  });

  // Pesan error dihitung otomatis dari isi keterangan.
  // Input yang mengandung perintah SQL / script langsung ditandai merah.
  const descriptionError = useMemo(() => {
    if (!formData.description) return '';
    const check = validateSafeText(formData.description, {
      label: 'Keterangan',
      maxLength: MAX_TEXT_LENGTH
    });
    return check.isValid ? '' : check.message;
  }, [formData.description]);

  const categories = [
    'Gas LPG',
    'Listrik & Air',
    'Kemasan (Cup, Plastik, Stiker)',
    'Tenaga Kerja / Gaji Harian',
    'Sewa Tempat',
    'Pemasaran / Iklan',
    'Perawatan Peralatan',
    'Transportasi / Bensin',
    'Lainnya'
  ];

  // Auto-isi form saat ada item yang diedit
  useEffect(() => {
    if (editingItem) {
      setFormData({
        date: editingItem.expense_date || today,
        category: editingItem.category || '',
        amount: String(editingItem.amount || ''),
        description: editingItem.description || ''
      });
    } else {
      // Reset form saat mode edit dibatalkan
      setFormData({
        date: today,
        category: '',
        amount: '',
        description: ''
      });
    }
  }, [editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Format ribuan untuk tampilan input nominal: 250000 -> "250.000"
  // State tetap menyimpan digit mentah agar perhitungan Number() di submit aman.
  const formatRibuan = (value) =>
    String(value ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, THOUSAND_SEPARATOR);

  // Handler khusus nominal: hanya terima digit, lalu simpan sebagai angka mentah.
  const handleAmountChange = (e) => {
    const digits = e.target.value
      .replace(/\D/g, '')
      .replace(/^0+(?=\d)/, '')
      .slice(0, 15);
    setFormData(prev => ({ ...prev, amount: digits }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.category) {
      alert('Mohon pilih kategori pengeluaran.');
      return;
    }

    // Tolak kategori/keterangan yang berisi perintah SQL atau script
    const categoryCheck = validateSafeText(formData.category, { label: 'Kategori pengeluaran' });
    if (!categoryCheck.isValid) {
      alert(categoryCheck.message);
      return;
    }

    const descriptionCheck = validateSafeText(formData.description, {
      label: 'Keterangan',
      maxLength: MAX_TEXT_LENGTH
    });
    if (!descriptionCheck.isValid) {
      alert(descriptionCheck.message);
      return;
    }

    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
      alert('Mohon masukkan jumlah pengeluaran yang valid (lebih dari 0).');
      return;
    }

    onSubmit({
      expense_date: formData.date,
      category: categoryCheck.value,
      amount,
      description: descriptionCheck.value
    });

    // Reset form setelah submit berhasil
    setFormData({
      date: today,
      category: '',
      amount: '',
      description: ''
    });
  };

  return (
    <div className={`bg-white rounded-2xl shadow-md p-6 border transition-all ${
      editingItem ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-100'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${editingItem ? 'bg-orange-100' : 'bg-blue-100'}`}>
            <FiSave className={`w-5 h-5 ${editingItem ? 'text-orange-600' : 'text-blue-600'}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            {editingItem ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
          </h3>
        </div>
        
        {editingItem && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
          >
            <FiX className="w-4 h-4" />
            Batal Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Baris 1: Tanggal & Kategori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-gray-500" />
              Tanggal Pengeluaran
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center gap-2">
              <FiTag className="w-4 h-4 text-gray-500" />
              Kategori Pengeluaran <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris 2: Jumlah Nominal */}
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center gap-2">
            <FiDollarSign className="w-4 h-4 text-gray-500" />
            Jumlah Nominal (Rp) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
            <input
              type="text"
              name="amount"
              value={formData.amount ? formatRibuan(formData.amount) : ''}
              onChange={handleAmountChange}
              placeholder="0"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Jumlah nominal pengeluaran"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-gray-800"
              required
            />
          </div>
        </div>

        {/* Baris 3: Keterangan */}
        <div>
          <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center gap-2">
            <FiFileText className="w-4 h-4 text-gray-500" />
            Keterangan / Catatan <span className="text-gray-400 font-normal">(Opsional)</span>
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Contoh: Beli gas elpiji 3kg untuk produksi minggu ini"
            maxLength={MAX_TEXT_LENGTH}
            aria-invalid={Boolean(descriptionError)}
            aria-describedby="description-help"
            className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${
              descriptionError
                ? 'border-red-400 bg-red-50 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {descriptionError ? (
            <p id="description-help" className="text-xs text-red-600 mt-1.5 font-medium flex items-start gap-1.5">
              <FiAlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{descriptionError}</span>
            </p>
          ) : (
            <p id="description-help" className="text-xs text-gray-500 mt-1.5">
              Hanya teks biasa. Perintah SQL dan script tidak diizinkan.
            </p>
          )}
        </div>

        {/* Tombol Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed text-gray-200' 
              : editingItem 
                ? 'bg-orange-600 hover:bg-orange-700 text-white transform active:scale-[0.98]'
                : 'bg-blue-600 hover:bg-blue-700 text-white transform active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Menyimpan Data...
            </>
          ) : (
            <>
              <FiSave className="w-5 h-5" />
              {editingItem ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}