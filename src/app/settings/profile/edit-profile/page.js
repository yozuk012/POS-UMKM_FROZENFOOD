'use client';

import { useState } from 'react';
import { 
  FiArrowLeft, 
  FiUser, 
  FiCamera, 
  FiMapPin, 
  FiPhone, 
  FiCreditCard, 
  FiImage, 
  FiTrash2 
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { uploadFile } from '@/lib/supabase';

export default function EditProfilePage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    storeName: '',
    address: '',
    phoneNumber: '',
    qris: '',
    bankAccount: '',
  });
  
  const [previewLogo, setPreviewLogo] = useState(null);

  // State untuk upload gambar QRIS
  const [qrisFile, setQrisFile] = useState(null);
  const [previewQris, setPreviewQris] = useState(null);
  const [qrisError, setQrisError] = useState('');

  const [showBankDetails, setShowBankDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ==========================================
  // HANDLER UPLOAD GAMBAR QRIS
  // ==========================================
  const handleQrisChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      setQrisError('File harus berupa gambar (JPG, PNG, atau WEBP).');
      e.target.value = '';
      return;
    }

    // Validasi ukuran file (maksimal 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setQrisError('Ukuran gambar QRIS maksimal 2MB.');
      e.target.value = '';
      return;
    }

    setQrisError('');
    setQrisFile(file);

    // Preview gambar yang dipilih
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewQris(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQris = () => {
    setQrisFile(null);
    setPreviewQris(null);
    setQrisError('');
    setFormData(prev => ({ ...prev, qris: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Upload gambar QRIS ke Supabase Storage jika user memilih file baru.
      // Hasilnya berupa URL gambar yang nantinya disimpan ke kolom stores.qris_code_url.
      let qrisUrl = formData.qris;

      if (showBankDetails && qrisFile) {
        const fileName = `qris-${Date.now()}-${qrisFile.name.replace(/\s/g, '-')}`;
        const uploadResult = await uploadFile(qrisFile, 'qris-toko', fileName);
        if (!uploadResult.success) throw new Error('Gagal upload gambar QRIS: ' + uploadResult.error);
        qrisUrl = uploadResult.url;
      }

      // TODO: Add your API call here to update profile
      // Jika showBankDetails false, Anda mungkin ingin mengosongkan atau mengabaikan field qris & bankAccount
      const payload = showBankDetails 
        ? { ...formData, qris: qrisUrl } 
        : { ...formData, qris: '', bankAccount: '' };

      console.log('Updating profile:', payload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success - redirect back to profile
      router.push('/settings/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Gagal mengupdate profile. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Gambar QRIS yang ditampilkan: hasil pilih file terbaru, atau URL gambar yang sudah tersimpan
  const qrisPreviewSrc = previewQris || formData.qris || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300">
      {/* Header */}
      <header className="px-4 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">EDIT PROFILE</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Logo Toko Section */}
        <div className="flex justify-center py-4">
          <div className="relative">
            {/* Logo Circle */}
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border-4 border-white/30">
              {previewLogo ? (
                <img 
                  src={previewLogo} 
                  alt="Logo Toko" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="w-14 h-14 text-gray-400" />
              )}
            </div>
            
            {/* Edit Icon Button */}
            <label className="absolute bottom-0 right-0 bg-blue-700 text-white p-2.5 rounded-full cursor-pointer hover:bg-blue-800 transition-colors shadow-md border-2 border-white">
              <FiCamera className="w-5 h-5" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <p className="text-center text-white/80 text-sm font-medium -mt-2">
          Ketuk untuk ubah Logo Toko
        </p>
      </header>

      {/* Form Section */}
      <main className="px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Nama Toko */}
          <div>
            <label className="block text-white text-sm font-bold mb-2 tracking-wide">
              NAMA TOKO
            </label>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                placeholder="Masukkan nama toko"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-white text-sm font-bold mb-2 tracking-wide">
              ALAMAT TOKO
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Masukkan alamat lengkap toko"
                rows={3}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none"
                required
              />
            </div>
          </div>

          {/* Nomor Telepon */}
          <div>
            <label className="block text-white text-sm font-bold mb-2 tracking-wide">
              NOMOR TELEPON
            </label>
            <div className="relative">
              <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Contoh: 081234567890"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
            </div>
          </div>

          {/* Toggle Switch untuk Detail Pembayaran */}
          <div className="pt-4 pb-2">
            <div 
              className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-4 rounded-xl cursor-pointer border border-white/20"
              onClick={() => setShowBankDetails(!showBankDetails)}
            >
              <div className="flex items-center gap-3">
                <FiCreditCard className="text-white w-5 h-5" />
                <span className="text-white font-medium">Edit Detail Pembayaran</span>
              </div>
              
              {/* Switch Toggle */}
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${showBankDetails ? 'bg-blue-600' : 'bg-gray-400'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${showBankDetails ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
          </div>

          {/* Conditional Form: QRIS & No Rekening */}
          {showBankDetails && (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* QRIS - Upload Gambar */}
              <div>
                <label className="block text-white text-sm font-bold mb-2 tracking-wide">
                  GAMBAR QRIS
                </label>

                <div className="relative">
                  {/* Dropzone: ketuk untuk memilih file gambar QRIS */}
                  <label className="flex flex-col items-center justify-center w-full h-44 bg-white/90 rounded-xl shadow-sm cursor-pointer overflow-hidden hover:bg-white transition-colors">
                    {qrisPreviewSrc ? (
                      <img
                        src={qrisPreviewSrc}
                        alt="Preview QRIS"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <>
                        <FiImage className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-500">
                          Ketuk untuk pilih gambar QRIS
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          JPG, PNG, atau WEBP (maks 2MB)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      name="qris"
                      accept="image/*"
                      onChange={handleQrisChange}
                      className="hidden"
                    />
                  </label>

                  {/* Tombol hapus gambar */}
                  {qrisPreviewSrc && (
                    <button
                      type="button"
                      onClick={handleRemoveQris}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-md transition-colors"
                      aria-label="Hapus gambar QRIS"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Error Message */}
                {qrisError && (
                  <div className="mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                    {qrisError}
                  </div>
                )}

                <p className="text-xs text-white/80 mt-2">
                  Unggah foto atau screenshot kode QRIS toko. Gambar akan diunggah saat menekan SIMPAN PERUBAHAN.
                </p>
              </div>

              {/* Nomor Rekening */}
              <div>
                <label className="block text-white text-sm font-bold mb-2 tracking-wide">
                  NOMOR REKENING
                </label>
                <div className="relative">
                  <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleInputChange}
                    placeholder="Contoh: BCA 1234567890 a.n Toko"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6 pb-10">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                'SIMPAN PERUBAHAN'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}