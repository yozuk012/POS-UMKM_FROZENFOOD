'use client';

import { useState } from 'react';
import { FiBox, FiShoppingCart } from 'react-icons/fi';
import PageLayout from '@/components/PageLayout';
import useTransaction from '@/hooks/useTransaction';
import TransactionFilters from './components/TransactionFilters';
import TransactionProductGrid from './components/TransactionProductGrid';
import TransactionOrderSummary from './components/TransactionOrderSummary';
import TransactionPaymentModal from './components/TransactionPaymentModal';
import ReceiptModal from './components/ReceiptModal'; 

export default function TransactionPage() {
  const transaction = useTransaction();
  
  // State untuk toggle tampilan di Mobile (Produk vs Keranjang)
  const [showCart, setShowCart] = useState(false);

  // Helper untuk menghitung total item di keranjang
  const totalCartItems = transaction.cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <PageLayout title="Transaksi Kasir">
      
      {/* TOMBOL TOGGLE MOBILE (Produk vs Keranjang) */}
      <div className="md:hidden flex gap-2 mb-3">
        <button
          onClick={() => setShowCart(false)}
          className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            !showCart 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <FiBox className="w-5 h-5" />
          <span>Produk</span>
        </button>
        <button
          onClick={() => setShowCart(true)}
          className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 relative ${
            showCart 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <FiShoppingCart className="w-5 h-5" />
          <span>Keranjang</span>
          {totalCartItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>

      {/* MAIN POS CONTAINER */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* AREA KIRI: KATALOG PRODUK & FILTER */}
        <div className={`${showCart ? 'hidden' : 'flex'} md:flex flex-1 flex-col overflow-hidden`}>
          
          {/* Header Filter */}
          <div className="shrink-0 border-b border-gray-200 bg-white">
            <TransactionFilters
              search={transaction.search}
              setSearch={transaction.setSearch}
              channel={transaction.channel}
              setChannel={transaction.setChannel}
              categories={transaction.categories}
              categoryId={transaction.categoryId}
              setCategoryId={transaction.setCategoryId}
              pagination={transaction.pagination}
              setPage={transaction.setPage}
            />
          </div>

          {/* Grid Produk */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <TransactionProductGrid
              products={transaction.products}
              onAddToCart={transaction.addToCart}
              isLoading={transaction.isLoadingProducts}
              channel={transaction.channel}
            />
          </div>
        </div>

        {/* AREA KANAN: KERANJANG */}
        <div className={`${!showCart ? 'hidden' : 'flex'} md:flex w-full md:w-[400px] bg-white border-t md:border-t-0 md:border-l border-gray-200 flex-col h-full shrink-0`}>
          <TransactionOrderSummary
            cartItems={transaction.cartItems}
            updateQty={transaction.updateQty}
            removeItem={transaction.removeItem}
            clearCart={transaction.clearCart}
            subtotal={transaction.subtotal}
            grandTotal={transaction.grandTotal}
            customerName={transaction.customerName}
            setCustomerName={transaction.setCustomerName}
            onCheckout={transaction.handleCheckout}
            channel={transaction.channel} 
          />
        </div>
      </div>

      {/* MODAL PEMBAYARAN */}
      <TransactionPaymentModal
        isOpen={transaction.isPaymentModalOpen}
        onClose={transaction.closePaymentModal}
        grandTotal={transaction.grandTotal}
        customerName={transaction.customerName}
        channel={transaction.channel}
        storeQrisUrl={transaction.storeQrisUrl}
        storeInfo={transaction.storeInfo}
        onConfirmPayment={transaction.confirmPayment}
      />

      {/* 🆕 MODUL STRUK (Muncul otomatis setelah transaksi berhasil) */}
      {transaction.receiptData && (
        <ReceiptModal 
          receiptData={transaction.receiptData} 
          onClose={transaction.finishReceipt} 
        />
      )}
      
    </PageLayout>
  );
}