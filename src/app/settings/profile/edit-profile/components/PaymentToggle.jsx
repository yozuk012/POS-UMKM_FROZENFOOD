'use client';

import { FiCreditCard } from 'react-icons/fi';

/**
 * PaymentToggle
 * Komponen presentasional untuk tombol switch menampilkan/menyembunyikan detail pembayaran.
 * 
 * @param {boolean} isOpen - Status apakah detail pembayaran sedang ditampilkan (dari state hook)
 * @param {function} onToggle - Fungsi handler dari hook untuk mengubah status (misal: () => setShowBankDetails(prev => !prev))
 */
export default function PaymentToggle({ isOpen, onToggle }) {
  return (
    <div 
      className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-4 rounded-xl cursor-pointer border border-white/20 hover:bg-white/20 transition-colors duration-200"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        // Aksesibilitas: Memungkinkan toggle menggunakan keyboard (Enter atau Spasi)
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-expanded={isOpen}
    >
      <div className="flex items-center gap-3">
        <FiCreditCard className="text-white w-5 h-5" />
        <span className="text-white font-medium">Edit Detail Pembayaran</span>
      </div>
      
      {/* Switch Toggle UI */}
      <div 
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${isOpen ? 'bg-blue-600' : 'bg-gray-400'}`}
        role="switch"
        aria-checked={isOpen}
      >
        <span 
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${isOpen ? 'translate-x-6' : 'translate-x-1'}`} 
        />
      </div>
    </div>
  );
}