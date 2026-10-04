'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import { useEditProfile } from '@/hooks/useEditProfile';

// Import semua komponen yang sudah kita buat
import StoreLogoSection from './components/StoreLogoSection';
import BasicInfoForm from './components/BasicInfoForm';
import PaymentToggle from './components/PaymentToggle';
import PaymentDetailsForm from './components/PaymentDetailsForm';
import FormFeedback from './components/FormFeedback';
import SubmitButton from './components/SubmitButton';

export default function EditProfilePage() {
  const router = useRouter();
  
  // ==========================================
  // 1. PANGGIL HOOK (LOGIC & DATA)
  // ==========================================
  const {
    loading,
    isSubmitting,
    error,
    successMessage,
    merchantForm,
    storeForm,
    imagePreviews,
    handleMerchantChange,
    handleStoreChange,
    handleFileChange,
    handleSubmit,
    resetQrisFile, // Fungsi untuk reset file QRIS
  } = useEditProfile();

  // ==========================================
  // 2. STATE UI LOKAL (MURNI UNTUK TAMPILAN)
  // ==========================================
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [qrisError, setQrisError] = useState('');

  // ==========================================
  // 3. MAPPING DATA & HANDLER (JEMBATAN HOOK KE KOMPONEN)
  // ==========================================
  
  // Mapping data untuk BasicInfoForm (Termasuk fullName)
  const basicInfoData = {
    fullName: merchantForm.full_name,
    storeName: storeForm.name,
    address: storeForm.address,
    phoneNumber: merchantForm.phone,
  };

  // Mapping data untuk PaymentDetailsForm
  const paymentInfoData = {
    qris_merchant_id: storeForm.qris_merchant_id,
    bank_name: storeForm.bank_name,
    account_number: storeForm.account_number,
    account_name: storeForm.account_name,
  };

  // Handler untuk BasicInfoForm (Meneruskan ke handler hook yang sesuai)
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'fullName') {
      handleMerchantChange({ target: { name: 'full_name', value } });
    } else if (name === 'storeName') {
      handleStoreChange({ target: { name: 'name', value } });
    } else if (name === 'address') {
      handleStoreChange({ target: { name: 'address', value } });
    } else if (name === 'phoneNumber') {
      handleMerchantChange({ target: { name: 'phone', value } });
    }
  };

  // Handler khusus untuk Upload QRIS (Validasi UI sebelum masuk ke hook)
  const handleQrisFileChange = (e) => {
    setQrisError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setQrisError('File harus berupa gambar (JPG, PNG, atau WEBP).');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setQrisError('Ukuran gambar QRIS maksimal 2MB.');
      e.target.value = '';
      return;
    }
    
    // Jika lolos validasi, lempar ke hook untuk konversi WebP & upload
    handleFileChange(e, 'qris');
  };

  // Handler untuk Hapus QRIS
  const handleRemoveQris = () => {
    setQrisError('');
    resetQrisFile(); // Memanggil fungsi reset dari hook
  };

  // ==========================================
  // 4. RENDER UI (LOADING STATE)
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 flex items-center justify-center">
        <p className="text-white text-lg font-medium">Memuat data profil...</p>
      </div>
    );
  }

  // ==========================================
  // 5. RENDER UI (HALAMAN UTUH)
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300">
      
      {/* HEADER */}
      <header className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            aria-label="Kembali"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">EDIT PROFILE</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* KOMPONEN 1: LOGO TOKO */}
        <StoreLogoSection 
          logoPreview={imagePreviews.logo} 
          storeName={merchantForm.store_name}
          onLogoChange={(e) => handleFileChange(e, 'logo')} 
        />
      </header>

      {/* MAIN FORM */}
      <main className="px-4 py-6">
        {/* KOMPONEN 2: FEEDBACK (ERROR/SUCCESS) */}
        <FormFeedback error={error} successMessage={successMessage} />

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* KOMPONEN 3: FORM DASAR (NAMA LENGKAP, NAMA TOKO, ALAMAT, TELEPON) */}
          <BasicInfoForm 
            formData={basicInfoData} 
            onChange={handleBasicInfoChange} 
          />

          {/* KOMPONEN 4: TOGGLE DETAIL PEMBAYARAN */}
          <PaymentToggle 
            isOpen={showBankDetails} 
            onToggle={() => setShowBankDetails(!showBankDetails)} 
          />

          {/* KOMPONEN 5: FORM DETAIL PEMBAYARAN (MUNCUL JIKA TOGGLE AKTIF) */}
          {showBankDetails && (
            <PaymentDetailsForm
              qrisPreview={imagePreviews.qris}
              qrisError={qrisError}
              formData={paymentInfoData}
              onFileChange={handleQrisFileChange}
              onRemoveQris={handleRemoveQris}
              onInputChange={handleStoreChange}
            />
          )}

          {/* KOMPONEN 6: TOMBOL SIMPAN */}
          <SubmitButton isLoading={isSubmitting} />

        </form>
      </main>
    </div>
  );
}