// src/app/transection/components/TransactionItemDiscount.jsx
//
// Panel "Diskon Cepat" untuk SATU item keranjang.
// Kasir mengisi NOMINAL (Rp), bukan persentase:
//   - mode "Potongan (Rp)"   -> kasir mengetik potongan, mis. 5.000
//   - mode "Harga Jual (Rp)" -> kasir mengetik harga akhir, mis. 25.000
// Keduanya menghasilkan hal yang sama: harga 30.000 dikurangi 5.000 = 25.000.
// Potongan dihitung PER PCS (qty x potongan) dan hanya tersedia di cabang utama
// (pengecekan cabang dilakukan oleh TransactionOrderSummary / useTransaction).
'use client';

import { useState } from 'react';
import { FiCheck, FiTag, FiTrash2, FiX } from 'react-icons/fi';
import {
  QUICK_DISCOUNT_MODE,
  formatRupiah,
  parseNumberUI,
  resolveQuickDiscount,
} from '@/lib/productUtils';

// Tombol cepat nominal potongan yang paling sering dipakai kasir.
const PRESET_DISCOUNTS = [1000, 2000, 5000, 10000];

export default function TransactionItemDiscount({ item, onApply, onClear }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(QUICK_DISCOUNT_MODE.POTONGAN);
  const [draft, setDraft] = useState('');

  const normalPrice = Number(item.base_unit_price) || Number(item.unit_price) || 0;
  const currentDiscount = Number(item.quick_discount) || 0;
  const qty = Number(item.qty) || 0;

  // Buka panel: draft selalu dimulai dari diskon yang sedang aktif.
  const openPanel = () => {
    setMode(QUICK_DISCOUNT_MODE.POTONGAN);
    setDraft(currentDiscount > 0 ? String(currentDiscount) : '');
    setIsOpen(true);
  };

  const inputValue = parseNumberUI(draft);
  const hasInput = draft.trim() !== '';
  const preview = resolveQuickDiscount({ normalPrice, mode, value: inputValue });
  const canSave = hasInput && preview.isValid;
  const finalUnitPrice = canSave ? preview.finalPrice : normalPrice;
  const presets = PRESET_DISCOUNTS.filter((amount) => amount <= normalPrice);

  const handleSave = () => {
    if (!canSave) return;
    onApply(preview.discount);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setDraft('');
    setIsOpen(false);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setDraft('');
  };

  // ---------------------------------------------------------------
  // Tampilan tertutup: tombol kecil "Diskon Cepat"
  // ---------------------------------------------------------------
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={openPanel}
        title="Beri potongan harga (Rp) untuk item ini"
        className={`mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
          currentDiscount > 0
            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <FiTag className="h-3 w-3" />
        {currentDiscount > 0
          ? `Diskon ${formatRupiah(currentDiscount)}/pcs`
          : 'Diskon Cepat'}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
      {/* Pilihan mode input */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex overflow-hidden rounded-md border border-amber-200 bg-white">
          <button
            type="button"
            onClick={() => switchMode(QUICK_DISCOUNT_MODE.POTONGAN)}
            className={`px-2 py-1 text-[11px] font-semibold transition-colors ${
              mode === QUICK_DISCOUNT_MODE.POTONGAN
                ? 'bg-amber-500 text-white'
                : 'text-gray-600 hover:bg-amber-50'
            }`}
          >
            Potongan (Rp)
          </button>
          <button
            type="button"
            onClick={() => switchMode(QUICK_DISCOUNT_MODE.HARGA)}
            className={`px-2 py-1 text-[11px] font-semibold transition-colors ${
              mode === QUICK_DISCOUNT_MODE.HARGA
                ? 'bg-amber-500 text-white'
                : 'text-gray-600 hover:bg-amber-50'
            }`}
          >
            Harga Jual (Rp)
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          title="Tutup tanpa menyimpan"
          className="rounded p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>

      {/* Input nominal */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
          Rp
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={inputValue > 0 ? inputValue.toLocaleString('id-ID') : ''}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={mode === QUICK_DISCOUNT_MODE.POTONGAN ? '5000' : '25000'}
          className="w-full rounded-lg border border-amber-200 bg-white py-2 pl-10 pr-3 text-sm font-bold text-gray-800 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-300"
        />
      </div>

      {/* Tombol nominal cepat (mode potongan) */}
      {mode === QUICK_DISCOUNT_MODE.POTONGAN && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setDraft(String(amount))}
              className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                inputValue === amount
                  ? 'border-amber-400 bg-amber-500 text-white'
                  : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-100'
              }`}
            >
              -{formatRupiah(amount)}
            </button>
          ))}
        </div>
      )}

      {/* Pratinjau perhitungan */}
      <div className="space-y-1 rounded-md border border-amber-100 bg-white p-2 text-[11px]">
        <div className="flex justify-between text-gray-500">
          <span>Harga normal / pcs</span>
          <span className="font-semibold text-gray-700">{formatRupiah(normalPrice)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Potongan / pcs</span>
          <span className={`font-semibold ${canSave && preview.discount > 0 ? 'text-red-600' : 'text-gray-700'}`}>
            {canSave && preview.discount > 0 ? `-${formatRupiah(preview.discount)}` : formatRupiah(0)}
          </span>
        </div>
        <div className="flex justify-between border-t border-amber-100 pt-1">
          <span className="font-semibold text-gray-700">Harga jual / pcs</span>
          <span className="font-bold text-blue-700">{formatRupiah(finalUnitPrice)}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>
            Total {qty} {item.unit || 'pcs'}
          </span>
          <span className="font-bold text-blue-600">{formatRupiah(finalUnitPrice * qty)}</span>
        </div>
      </div>

      {/* Pesan validasi */}
      {hasInput && !preview.isValid && (
        <p className="text-[11px] font-medium leading-snug text-red-600">
          {mode === QUICK_DISCOUNT_MODE.POTONGAN
            ? `Potongan tidak boleh melebihi harga normal (${formatRupiah(normalPrice)}).`
            : `Harga jual tidak boleh lebih dari harga normal (${formatRupiah(normalPrice)}).`}
        </p>
      )}

      {/* Aksi */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-500 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          <FiCheck className="h-3.5 w-3.5" />
          Terapkan
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={currentDiscount === 0}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiTrash2 className="h-3.5 w-3.5" />
          Hapus
        </button>
      </div>

      <p className="text-[10px] leading-snug text-amber-700">
        Potongan dihitung <strong>per pcs</strong> (qty &times; potongan) dan hanya tersedia di
        Cabang Utama.
      </p>
    </div>
  );
}
