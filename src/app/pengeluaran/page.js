'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import useHppOperasional from '@/hooks/useHppOperasional';

import ExpenseSummary from './components/ExpenseSummary';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';

import { FiArrowLeft, FiTrendingDown } from 'react-icons/fi';

export default function PengeluaranPage() {
  const router = useRouter();
  
  // 1. Panggil Hook Operasional
  const {
    expenses,
    isLoading,
    isSubmitting,
    error,
    totalOperationalCost,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useHppOperasional();

  // 2. State Lokal untuk Mode Edit
  const [editingItem, setEditingItem] = useState(null);
  const formRef = useRef(null);

  // 3. Handler Submit Form (Tambah / Update)
  const handleSubmitForm = async (formData) => {
    let result;

    if (editingItem) {
      // --- MODE UPDATE ---
      result = await updateExpense(editingItem.id, formData);
    } else {
      // --- MODE TAMBAH BARU ---
      result = await addExpense(formData);
    }

    if (result.success) {
      alert(result.message);
      setEditingItem(null); // Reset mode edit
    } else {
      alert(`Gagal menyimpan: ${result.message}`);
    }
  };

  // 4. Handler Tombol Edit
  const handleEdit = (item) => {
    setEditingItem(item);
    
    // Scroll otomatis ke form agar user langsung bisa edit
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 5. Handler Tombol Hapus
  const handleDelete = async (id) => {
    const result = await deleteExpense(id);
    if (result.success) {
      alert(result.message);
    } else {
      alert(`Gagal menghapus: ${result.message}`);
    }
  };

  // 6. Handler Batal Edit
  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  // Tampilkan error global jika ada (selain dari hook)
  useEffect(() => {
    if (error) {
      console.error('Error dari hook:', error);
    }
  }, [error]);

  return (
    <PageLayout title="Pengeluaran Operasional">
      <div className="min-h-screen bg-gray-50 -mx-4 -mt-4 md:-mx-6 md:-mt-6 p-4 md:p-6 pb-20">
        
        {/* Header Halaman */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 hover:bg-white rounded-full transition-colors text-gray-600"
              aria-label="Kembali"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FiTrendingDown className="text-orange-500" />
                Pengeluaran Operasional
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Catat semua biaya tidak langsung (Listrik, Gas, Sewa, Gaji, dll)
              </p>
            </div>
          </div>
        </div>

        {/* Area Konten Utama */}
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Potongan 1: Ringkasan Total Pengeluaran */}
          <ExpenseSummary 
            totalOperationalCost={totalOperationalCost}
            isLoading={isLoading}
          />

          {/* Potongan 2: Form Input Pengeluaran */}
          <div ref={formRef}>
            <ExpenseForm 
              onSubmit={handleSubmitForm}
              isSubmitting={isSubmitting}
              editingItem={editingItem}
              onCancel={handleCancelEdit}
            />
          </div>

          {/* Potongan 3: Daftar Riwayat Pengeluaran */}
          <ExpenseList 
            expenses={expenses}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

        </div>
      </div>
    </PageLayout>
  );
}