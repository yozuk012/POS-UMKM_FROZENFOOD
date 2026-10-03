// src/app/transection/components/TransactionOrderSummary.jsx
import { FiShoppingCart, FiX, FiCreditCard } from 'react-icons/fi';

export default function TransactionOrderSummary({ 
  cartItems, 
  updateQty, 
  removeItem, 
  clearCart,
  subtotal,
  grandTotal, // Langsung menggunakan grandTotal dari hook (yang sudah memperhitungkan diskon produk)
  customerName,
  setCustomerName,
  onCheckout 
}) {
  // Helper format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="w-full md:w-[400px] bg-white flex flex-col h-full border-l border-gray-200">
      
      {/* 1. Header Keranjang (Tidak akan mengecil/shrink) */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FiShoppingCart className="w-5 h-5 text-gray-700" /> Keranjang
            <span className="text-xs font-normal text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">
              {cartItems.length} item
            </span>
          </h2>
          {cartItems.length > 0 && (
            <button 
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors font-medium"
            >
              Kosongkan
            </button>
          )}
        </div>
        
        {/* Input Nama Customer */}
        <div className="relative">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nama Pelanggan (Opsional)"
            className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* 2. List Item di Keranjang (Area yang bisa di-scroll) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-3">
              <FiShoppingCart className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600">Keranjang masih kosong</p>
            <p className="text-xs text-gray-400 mt-1">Klik produk di sebelah kiri untuk menambahkan</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 pr-2">
                  <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.sku} • {formatRupiah(item.unit_price)}/{item.unit}
                    {/* Tampilkan badge diskon jika ada */}
                    {item.discount_pct > 0 && (
                      <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                        -{item.discount_pct}%
                      </span>
                    )}
                  </p>
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                  title="Hapus item"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                {/* Quantity Controls */}
                <div className="flex items-center border border-gray-300 rounded-md bg-white overflow-hidden">
                  <button 
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-sm font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-sm font-semibold text-gray-800 min-w-[40px] text-center border-x border-gray-200">
                    {item.qty}
                  </span>
                  <button 
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-sm font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
                
                {/* Harga Total Item */}
                <p className="text-sm font-bold text-blue-600">
                  {formatRupiah(item.unit_price * item.qty)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Footer: Total & Tombol Bayar (Tidak akan mengecil/shrink) */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4 shrink-0">
        
        {/* Total Harga (Langsung menampilkan grandTotal, tanpa input manual) */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-base font-bold text-gray-800">Total Harga</span>
          <span className="text-2xl font-extrabold text-blue-600">{formatRupiah(grandTotal)}</span>
        </div>

        {/* Tombol Checkout */}
        <button
          onClick={onCheckout}
          disabled={cartItems.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <FiCreditCard className="h-5 w-5" />
          Bayar Sekarang
        </button>
      </div>
    </div>
  );
}