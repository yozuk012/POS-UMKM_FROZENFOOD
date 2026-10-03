// src/app/hpp/hppproduk/components/HPPHeader.jsx
'use client';

import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';

export default function HPPHeader({ 
  onBack, 
  selectedKategori, 
  setSelectedKategori, 
  kategoriList, 
  isDropdownOpen, 
  setIsDropdownOpen 
}) {
  return (
    <header className="bg-gradient-to-b from-blue-600 to-blue-500 px-4 py-4 rounded-b-3xl shadow-md">
      {/* Baris Atas: Tombol Kembali & Judul */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          aria-label="Kembali"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <h1 className="text-sm font-bold text-white tracking-wider">HPP</h1>
          <h2 className="text-2xl font-bold text-white">PRODUK</h2>
        </div>
        
        {/* Spacer agar judul tetap di tengah */}
        <div className="w-10" />
      </div>

      {/* Dropdown Filter Kategori */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-white/90 hover:bg-white text-gray-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-between transition-colors shadow-sm border border-white/20"
        >
          <span className="truncate">
            {selectedKategori || 'Semua Kategori'}
          </span>
          <FiChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 max-h-60 overflow-y-auto animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setSelectedKategori('');
                setIsDropdownOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-gray-50 ${
                !selectedKategori ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Semua Kategori
            </button>
            
            {kategoriList.length === 0 && !selectedKategori && (
              <div className="px-4 py-3 text-sm text-gray-400 italic">
                Belum ada kategori
              </div>
            )}

            {kategoriList.map((kategori, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setSelectedKategori(kategori);
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                  selectedKategori === kategori ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {kategori}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}