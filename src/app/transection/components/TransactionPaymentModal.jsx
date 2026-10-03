"use client";

import { useState, useEffect } from 'react';

export default function TransactionPaymentModal({ 
  isOpen, 
  onClose, 
  grandTotal, 
  customerName, 
  channel,
  storeQrisUrl, 
  storeInfo,
  onConfirmPayment 
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState(0);
  const [referenceNumber, setReferenceNumber] = useState(''); // Tetap digunakan untuk QRIS
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrisConfirmed, setQrisConfirmed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('cash');
      setCashReceived(0);
      setReferenceNumber('');
      setIsProcessing(false);
      setQrisConfirmed(false);
      setImageError(false);
      setCopySuccess(false);
    }
  }, [isOpen]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(number);
  };

  const change = cashReceived - grandTotal;

  // PERBAIKAN: Transfer langsung valid tanpa perlu input teks
  const isMethodValid = () => {
    if (paymentMethod === 'cash') return cashReceived >= grandTotal;
    if (paymentMethod === 'qris') return qrisConfirmed;
    if (paymentMethod === 'transfer') return true; 
    return false;
  };

  const canSubmit = isMethodValid() && !isProcessing;

  const handleQuickCash = (amount) => {
    if (amount === 'pas') setCashReceived(grandTotal);
    else setCashReceived(prev => prev + amount);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsProcessing(true);

    // Generate reference otomatis untuk Transfer agar database tetap rapi
    let finalReference = '';
    if (paymentMethod === 'qris') finalReference = referenceNumber;
    if (paymentMethod === 'transfer') finalReference = `TRF-${Date.now().toString().slice(-6)}`;

    const paymentData = {
      payment_method: paymentMethod,
      cash_received: paymentMethod === 'cash' ? cashReceived : 0,
      reference_number: finalReference,
      qris_status: paymentMethod === 'qris' ? 'success' : null,
      qris_paid_at: paymentMethod === 'qris' ? new Date().toISOString() : null,
    };

    await onConfirmPayment(paymentData);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            💳 Pembayaran
          </h2>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="text-white hover:bg-blue-700 p-1.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body Modal (Scrollable) */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Info Total & Customer */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Total Tagihan</p>
                <p className="text-2xl font-extrabold text-blue-800 mt-1">{formatRupiah(grandTotal)}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-blue-200 flex flex-col gap-1 text-xs text-blue-700">
              <p>Pelanggan: <span className="font-semibold">{customerName || 'Umum / Walk-in'}</span></p>
              <p>Channel: <span className="font-semibold capitalize">{channel === 'all' ? 'Offline' : channel}</span></p>
            </div>
          </div>

          {/* Pilihan Metode Pembayaran */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'cash' 
                    ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">💵</span>
                <span>Tunai</span>
              </button>
              <button
                onClick={() => setPaymentMethod('qris')}
                className={`py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'qris' 
                    ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">📱</span>
                <span>QRIS</span>
              </button>
              <button
                onClick={() => setPaymentMethod('transfer')}
                className={`py-3 px-2 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                  paymentMethod === 'transfer' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">🏦</span>
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* --- KONTEN BERDASARKAN METODE --- */}

          {/* 1. TUNAI */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Uang Diterima</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">Rp</span>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-bold text-gray-800 outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleQuickCash(20000)} className="py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">+20rb</button>
                <button onClick={() => handleQuickCash(50000)} className="py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">+50rb</button>
                <button onClick={() => handleQuickCash(100000)} className="py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">+100rb</button>
                <button onClick={() => handleQuickCash('pas')} className="py-2 text-xs font-semibold bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors">Uang Pas</button>
              </div>

              <div className={`p-4 rounded-xl border-2 flex justify-between items-center transition-colors ${
                change >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <span className="text-sm font-semibold text-gray-600">Kembalian</span>
                <span className={`text-xl font-extrabold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatRupiah(Math.abs(change))}
                </span>
              </div>
              {change < 0 && (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Uang yang diterima kurang!
                </p>
              )}
            </div>
          )}

          {/* 2. QRIS */}
          {paymentMethod === 'qris' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5 text-center">
                <h3 className="text-sm font-bold text-purple-800 mb-4">Scan QRIS untuk Pembayaran</h3>
                
                {storeQrisUrl && !imageError ? (
                  <div className="bg-white p-3 rounded-xl inline-block shadow-sm border border-purple-100">
                    <img 
                      src={storeQrisUrl} 
                      alt="QRIS Code" 
                      className="w-48 h-48 object-contain mx-auto"
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 w-48 h-48 rounded-xl flex flex-col items-center justify-center mx-auto p-4">
                    <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500 font-medium text-center">
                      {imageError ? 'Gagal memuat QRIS.<br/>Periksa URL di Database.' : 'QRIS belum diatur.<br/>Hubungi admin.'}
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-purple-600 mt-4 font-medium">
                  Pastikan nominal di aplikasi e-wallet pelanggan sesuai.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setQrisConfirmed(true);
                    setReferenceNumber('QRIS-' + Date.now().toString().slice(-6));
                  }}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    qrisConfirmed 
                      ? 'bg-green-100 text-green-700 border-2 border-green-500 cursor-default' 
                      : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
                  }`}
                  disabled={qrisConfirmed}
                >
                  {qrisConfirmed ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Pembayaran Diverifikasi
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Konfirmasi Pembayaran Diterima
                    </>
                  )}
                </button>
                {qrisConfirmed && (
                  <p className="text-xs text-gray-500 text-center bg-gray-50 py-2 rounded-lg border border-gray-200">
                    Ref ID: <span className="font-mono font-semibold text-gray-700">{referenceNumber}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 3. TRANSFER (TANPA INPUT TEKS, LANGSUNG VERIFIKASI) */}
          {paymentMethod === 'transfer' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  Informasi Rekening {storeInfo?.name || 'Toko'}
                </h4>
                
                <div className="space-y-3 text-sm bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Bank</span>
                    <span className="font-bold text-gray-800">
                      {storeInfo?.bank_name || <span className="text-red-500 italic">Belum Diatur</span>}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">No. Rekening</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 font-mono">
                        {storeInfo?.account_number || <span className="text-red-500 italic">Belum Diatur</span>}
                      </span>
                      {storeInfo?.account_number && (
                        <button 
                          onClick={() => copyToClipboard(storeInfo.account_number)}
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                          title="Salin Nomor Rekening"
                        >
                          {copySuccess ? (
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Atas Nama</span>
                    <span className="font-bold text-gray-800 text-right">
                      {storeInfo?.account_name || <span className="text-red-500 italic">Belum Diatur</span>}
                    </span>
                  </div>
                </div>
                
                {!storeInfo?.bank_name && (
                  <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1 bg-amber-50 p-2 rounded border border-amber-100">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Silakan atur data rekening di menu Pengaturan Toko.
                  </p>
                )}

                {/* PERBAIKAN UX: Reminder untuk Kasir agar tidak tertipu bukti transfer palsu */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold">Penting:</span> Pastikan kasir telah menerima notifikasi dana masuk atau memeriksa mutasi rekening sebelum mengklik tombol di bawah.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-5 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses Transaksi...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Proses & Selesaikan
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}