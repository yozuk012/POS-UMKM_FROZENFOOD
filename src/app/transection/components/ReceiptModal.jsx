import React, { useRef } from 'react';

// Helper untuk format Rupiah
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

export default function ReceiptModal({ receiptData, onClose, onPrint }) {
  const receiptRef = useRef(null);

  if (!receiptData) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-md p-4 print:hidden">
      <div 
        ref={receiptRef}
        className="relative w-full max-w-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:w-full"
      >
        {/* Header Struk */}
        <div className="p-6 text-center border-b border-dashed border-gray-300 dark:border-gray-600">
          {receiptData.store.logo_url ? (
            <img 
              src={receiptData.store.logo_url} 
              alt="Logo Toko" 
              className="h-16 mx-auto mb-3 object-contain"
            />
          ) : (
            <div className="h-16 mx-auto mb-3 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full w-16">
              <span className="text-2xl font-bold text-gray-400">🏪</span>
            </div>
          )}
          
          <h2 className="text-xl font-bold uppercase tracking-wide">
            {receiptData.store.name || 'NAMA TOKO'}
          </h2>
          
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1 font-mono">
            <p>{receiptData.store.address || '-'}</p>
            <p>Telp: {receiptData.store.phone || '-'}</p>
          </div>
        </div>

        {/* Meta Transaksi */}
        <div className="px-6 py-4 text-sm font-mono space-y-2 border-b border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">No. Transaksi</span>
            <span className="font-semibold">{receiptData.transaction_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Tanggal</span>
            <span>{receiptData.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Kasir</span>
            <span>Admin</span> {/* Bisa diganti dengan data user yang login nanti */}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Pelanggan</span>
            <span className="font-semibold">{receiptData.customer_name || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Pembayaran</span>
            <span className="uppercase font-semibold">{receiptData.payment_method}</span>
          </div>
        </div>

        {/* Rincian Item */}
        <div className="px-6 py-4 font-mono text-sm">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider text-xs">
            Rincian Transaksi
          </h3>
          <div className="space-y-3">
            {receiptData.items.map((item, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex justify-between font-medium">
                  <span className="flex-1 truncate pr-2">{item.name}</span>
                  <span>{formatRupiah(item.line_total)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                  <span>{item.qty} x {formatRupiah(item.unit_price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total & Kembalian */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 font-mono text-sm space-y-2 border-t border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{formatRupiah(receiptData.subtotal)}</span>
          </div>
          
          {receiptData.discount > 0 && (
            <div className="flex justify-between text-red-500 dark:text-red-400">
              <span>Diskon</span>
              <span>- {formatRupiah(receiptData.discount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-300 dark:border-gray-600">
            <span>Total</span>
            <span>{formatRupiah(receiptData.grand_total)}</span>
          </div>
          
          <div className="flex justify-between text-gray-600 dark:text-gray-400 pt-2">
            <span>Dibayar</span>
            <span>{formatRupiah(receiptData.amount_paid)}</span>
          </div>
          
          <div className="flex justify-between text-green-600 dark:text-green-400 font-bold text-base">
            <span>Kembalian</span>
            <span>{formatRupiah(receiptData.change)}</span>
          </div>
        </div>

        {/* Footer / Aksi */}
        <div className="p-6 print:hidden">
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak Struk
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* CSS Khusus Print */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-ref, .receipt-ref * {
            visibility: visible;
          }
          .receipt-ref {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}