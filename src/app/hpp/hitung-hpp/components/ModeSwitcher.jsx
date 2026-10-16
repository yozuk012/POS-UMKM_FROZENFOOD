// src/app/hpp/hitung-hpp/components/ModeSwitcher.jsx
'use client';

import { FiList, FiZap } from 'react-icons/fi';

// Dua cara input HPP:
// - detail : input bahan baku 1 per 1 (resep rinci, stok bahan ikut terpotong)
// - cepat  : akumulasi modal, HPP = Total Modal : Jumlah Hasil
const MODES = [
  { id: 'detail', label: 'INPUT 1 PER 1', icon: FiList },
  { id: 'cepat', label: 'MODE CEPAT', icon: FiZap }
];

export default function ModeSwitcher({ modeInput, setModeInput, disabled = false }) {
  return (
    <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <FiZap className="text-blue-600 w-4 h-4" />
          Pilih Cara Input HPP
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">
          {modeInput === 'cepat' ? 'Akumulasi' : 'Rinci'}
        </span>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg">
        {MODES.map(mode => {
          const Icon = mode.icon;
          const isActive = modeInput === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => setModeInput(mode.id)}
              className={`flex-1 px-3 py-2 text-xs md:text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${
                isActive
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {mode.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
        {modeInput === 'cepat'
          ? 'Mode cepat (akumulasi): HPP per unit = Total Modal : Jumlah Hasil. Cocok kalau rincian bahan baku tidak dicatat.'
          : 'Mode rinci: catat setiap bahan baku satu per satu agar resep tersimpan dan stok bahan ikut terpotong otomatis.'}
      </p>
    </div>
  );
}
