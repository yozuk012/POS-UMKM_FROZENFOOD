// src/app/auth/register/page.js
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const { registerForm } = useAuth();
  
  const {
    formData,
    logoPreview,
    error,
    isSubmitting: loading,
    handleChange,
    handleFileChange,
    handleSubmit
  } = registerForm;

  // Class Tailwind yang disesuaikan untuk mobile
  const inputClass = "mt-2 block w-full px-4 py-3.5 bg-gray-200 border-0 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-150 ease-in-out text-base sm:text-sm";
  const labelClass = "block text-sm font-semibold text-gray-800 mt-5";

  return (
    <div className="min-h-screen bg-white flex flex-col px-4 sm:px-6 py-6 sm:py-12">
      {/* Back Button - Lebih besar untuk mobile */}
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

      {/* Title - Responsive font size */}
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-8 px-2">
        DAFTAR
      </h1>

      {/* Form Section */}
      <form className="flex-1 space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
        
        {/* Nama Lengkap (DITAMBAHKAN) */}
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

        {/* Nomor Telepon (DITAMBAHKAN) */}
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

        {/* Upload Logo - Mobile optimized */}
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
                  accept="image/*" 
                  onChange={handleFileChange}
                  capture="environment"
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

        {/* Submit Button - Mobile optimized */}
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
              'DAFTAR'
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