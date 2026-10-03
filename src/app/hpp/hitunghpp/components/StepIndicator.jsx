// src/app/hpp/hitunghpp/components/StepIndicator.jsx
'use client';

import { FiArrowLeft } from 'react-icons/fi';

export default function StepIndicator({ currentStep, onBack }) {
  // Konfigurasi langkah
  const steps = [
    { num: 1, label: 'BAHAN BAKU' },
    { num: 2, label: 'OPERASIONAL' },
    { num: 3, label: 'HASIL HPP' }
  ];

  // Mencari label langkah saat ini
  const currentLabel = steps.find(s => s.num === currentStep)?.label || '';

  return (
    <header className="px-4 py-4">
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
          <h1 className="text-sm md:text-base font-bold text-white tracking-wider">HITUNG HPP</h1>
          <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
            {currentLabel}
          </h2>
        </div>
        
        {/* Spacer agar judul tetap di tengah */}
        <div className="w-10" /> 
      </div>

      {/* Progress Indicator (Garis & Lingkaran) */}
      <div className="flex items-center justify-center gap-1 md:gap-2">
        {steps.map((step, index) => (
          <div key={step.num} className="flex items-center">
            {/* Lingkaran Angka / Centang */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              currentStep >= step.num 
                ? 'bg-white text-blue-600 shadow-md scale-105' 
                : 'bg-blue-400/40 text-white/80'
            }`}>
              {/* Tampilkan centang jika langkah sudah dilewati, jika tidak tampilkan angka */}
              {currentStep > step.num ? '✓' : step.num}
            </div>
            
            {/* Garis Penghubung (tidak ditampilkan di langkah terakhir) */}
            {index < steps.length - 1 && (
              <div className={`w-12 md:w-20 h-1 mx-1 md:mx-2 rounded-full transition-all duration-300 ${
                currentStep > step.num ? 'bg-white' : 'bg-blue-400/40'
              }`} />
            )}
          </div>
        ))}
      </div>
    </header>
  );
}