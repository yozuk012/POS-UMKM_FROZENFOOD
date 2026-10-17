// src/app/auth/register/page.js
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { registerForm } = useAuth();
  
  const {
    step,
    formData,
    logoPreview,
    error,
    isSubmitting: loading,
    handleChange,
    handleFileChange,
    handleSubmit,
    pinSetup
  } = registerForm;

  // Class Tailwind yang disesuaikan untuk mobile
  const inputClass = "mt-2 block w-full px-4 py-3.5 bg-gray-200 border-0 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-150 ease-in-out text-base sm:text-sm";
  const labelClass = "block text-sm font-semibold text-gray-800 mt-5";
  
  // Class khusus untuk input PIN (centered, tracking lebar)
  const pinInputClass = "mt-2 block w-full px-4 py-4 bg-gray-200 border-0 rounded-lg shadow-sm text-center text-2xl tracking-[0.5em] font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-150 ease-in-out";

  // ==========================================
  // STEP 1: FORM REGISTRASI
  // ==========================================
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-white flex flex-col px-4 sm:px-6 py-6 sm:py-12">
        {/* Back Button */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/auth/login" 
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-800 hover:bg-gray-100 transition active:scale-95"
            aria-label="Kembali"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">1</div>
            <span className="text-sm font-semibold text-gray-800">Data Akun</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm">2</div>
            <span className="text-sm font-medium text-gray-400">PIN Pemulihan</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2 px-2">
          DAFTAR
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6 sm:mb-8 px-2">
          Langkah 1 dari 2: Lengkapi data akun Anda
        </p>

        {/* Form Section */}
        <form className="flex-1 space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
          
          {/* Nama Lengkap */}
          <div>
            <label htmlFor="fullName" className={labelClass}>NAMA LENGKAP</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              className={inputClass}
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
            />
          </div>

          {/* Nomor Telepon */}
          <div>
            <label htmlFor="phone" className={labelClass}>NOMOR TELEPON</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              className={inputClass}
              placeholder="Contoh: 08123456789"
              autoComplete="tel"
            />
          </div>

          {/* Nama Toko */}
          <div>
            <label htmlFor="storeName" className={labelClass}>NAMA TOKO</label>
            <input
              id="storeName"
              name="storeName"
              type="text"
              required
              value={formData.storeName}
              onChange={handleChange}
              className={inputClass}
              placeholder="Masukkan nama toko"
              autoComplete="organization"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>EMAIL</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="Masukkan email"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={labelClass}>PASSWORD</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className={inputClass}
              placeholder="Masukkan password"
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>KONFIRMASI PASSWORD</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={inputClass}
              placeholder="Konfirmasi password"
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          {/* Upload Logo */}
          <div>
            <label htmlFor="logo" className={labelClass}>UNGGAH LOGO</label>
            <div className="mt-2">
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="logo-dropzone" 
                  className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition touch-manipulation"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Preview Logo" 
                        className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-md mb-2" 
                      />
                    ) : (
                      <>
                        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="text-xs text-gray-500 text-center">Klik untuk upload logo</p>
                      </>
                    )}
                  </div>
                  <input 
                  id="logo-dropzone" 
                  name="logo" 
                  type="file" 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/jpg" // Lebih spesifik agar iOS membuka galeri
                  onChange={handleFileChange}
                  // Atribut 'capture' dihapus total
                />
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 sm:p-4 border border-red-200 animate-pulse">
              <p className="text-sm text-red-600 text-center font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 sm:mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out touch-manipulation active:scale-[0.98]"
              style={{ minHeight: '52px' }}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                <>
                  Lanjut
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center pb-4">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link 
                href="/auth/login" 
                className="font-semibold text-blue-600 hover:text-blue-700 active:text-blue-800 transition"
              >
                Masuk
              </Link>
            </p>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // STEP 2: SETUP PIN PEMULIHAN
  // ==========================================
  if (step === 'pin-setup') {
    return (
      <div className="min-h-screen bg-white flex flex-col px-4 sm:px-6 py-6 sm:py-12">
        {/* Back Button (kembali ke form) */}
        <div className="mb-6 sm:mb-8">
          <button 
            onClick={pinSetup.handleBack}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-gray-800 hover:bg-gray-100 transition active:scale-95"
            aria-label="Kembali"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-600">Data Akun</span>
          </div>
          <div className="flex-1 h-0.5 bg-green-500 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">2</div>
            <span className="text-sm font-semibold text-gray-800">PIN Pemulihan</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="text-center mb-6 px-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            BUAT PIN PEMULIHAN
          </h1>
          <p className="text-sm text-gray-500">
            Langkah 2 dari 2: Amankan akun Anda
          </p>
        </div>

        {/* Warning Box */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-yellow-800 font-bold text-sm">PENTING!</p>
              <p className="text-yellow-700 text-xs mt-1 leading-relaxed">
                PIN 6 digit ini digunakan untuk <strong>mereset password</strong> jika Anda lupa. 
                Hafalkan atau catat di tempat aman. <strong>Jangan bagikan ke siapa pun.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Form PIN */}
        <form className="flex-1 space-y-3 sm:space-y-4" onSubmit={pinSetup.handleSubmit}>
          
          {/* PIN Input */}
          <div>
            <label htmlFor="pin" className={labelClass}>
              PIN PEMULIHAN (6 DIGIT)
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={pinSetup.pinData.pin}
              onChange={pinSetup.handleChange}
              className={pinInputClass}
              placeholder="• • • • • •"
              maxLength={6}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tersisa: <span className="font-semibold text-blue-600">{6 - pinSetup.pinData.pin.length}</span> digit
            </p>
          </div>

          {/* Konfirmasi PIN */}
          <div>
            <label htmlFor="confirmPin" className={labelClass}>
              KONFIRMASI PIN
            </label>
            <input
              id="confirmPin"
              name="confirmPin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={pinSetup.pinData.confirmPin}
              onChange={pinSetup.handleChange}
              className={pinInputClass}
              placeholder="• • • • • •"
              maxLength={6}
              autoComplete="off"
            />
            {pinSetup.pinData.pin && pinSetup.pinData.confirmPin && pinSetup.pinData.pin !== pinSetup.pinData.confirmPin && (
              <p className="text-xs text-red-500 mt-1 font-medium">
                ⚠️ Konfirmasi PIN tidak cocok
              </p>
            )}
            {pinSetup.pinData.pin && pinSetup.pinData.confirmPin && pinSetup.pinData.pin === pinSetup.pinData.confirmPin && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                ✓ PIN cocok
              </p>
            )}
          </div>

          {/* Error Message */}
          {pinSetup.error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 sm:p-4 border border-red-200 animate-pulse">
              <p className="text-sm text-red-600 text-center font-medium">{pinSetup.error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 sm:mt-8">
            <button
              type="submit"
              disabled={pinSetup.isSubmitting || pinSetup.pinData.pin.length !== 6 || pinSetup.pinData.pin !== pinSetup.pinData.confirmPin}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-full shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out touch-manipulation active:scale-[0.98]"
              style={{ minHeight: '52px' }}
            >
              {pinSetup.isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan PIN...
                </span>
              ) : (
                <>
                  Selesai & Daftar
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Skip Button */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={pinSetup.handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 transition"
            >
              Lewati step ini (tidak direkomendasikan)
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 leading-relaxed text-center">
              💡 <strong>Tips:</strong> Gunakan PIN yang mudah diingat tetapi sulit ditebak orang lain. 
              Hindari tanggal lahir atau angka berurutan seperti <code className="bg-blue-100 px-1 rounded">123456</code>.
            </p>
          </div>

          {/* Spacer */}
          <div className="pb-4" />
        </form>
      </div>
    );
  }

  // ==========================================
  // FALLBACK (Loading State)
  // ==========================================
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-500">Memuat...</p>
      </div>
    </div>
  );
}