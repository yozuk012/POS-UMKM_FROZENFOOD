'use client';

import Link from 'next/link';
import { FiArrowLeft, FiLock, FiShield, FiKey, FiAlertCircle, FiEye, FiEyeOff, FiMessageCircle } from 'react-icons/fi';
import useForgotPassword from '@/hooks/useForgotPassword';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const {
    step,
    pin,
    newPassword,
    confirmPassword,
    error,
    isLoading,
    passwordStrength,
    handlePinChange,
    handleVerifyPin,
    handlePasswordChange,
    handleUpdatePassword,
    resetForm,
    goBackToPin,
  } = useForgotPassword();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Nomor WhatsApp CS (ganti dengan nomor CS Anda)
  const CS_WHATSAPP_NUMBER = '6281234567890'; // Format: 62xxx (tanpa + atau 0)
  
  const whatsappMessage = encodeURIComponent(
    'Halo CS POS, saya lupa PIN pemulihan akun saya.\n\n' +
    'Mohon bantuannya untuk reset password.\n\n' +
    'Terima kasih.'
  );
  
  const whatsappLink = `https://wa.me/${CS_WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  // ==========================================
  // STEP 1: INPUT PIN
  // ==========================================
  if (step === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 flex flex-col px-4 sm:px-6 py-6 sm:py-12">
        {/* Back Button */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/auth/login" 
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 transition active:scale-95"
            aria-label="Kembali"
          >
            <FiArrowLeft className="w-6 h-6" />
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <FiKey className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            LUPA PASSWORD
          </h1>
          <p className="text-white/90 text-sm">
            Masukkan PIN Pemulihan 6 digit Anda
          </p>
        </div>

        {/* Form PIN */}
        <form onSubmit={handleVerifyPin} className="space-y-6 flex-1">
          {/* Info Box */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex gap-3">
              <FiShield className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              <p className="text-white text-sm leading-relaxed">
                PIN ini dibuat saat Anda pertama kali mendaftar. Jika Anda lupa PIN, silakan hubungi CS via WhatsApp.
              </p>
            </div>
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-white text-sm font-bold mb-2 tracking-wide">
              PIN PEMULIHAN (6 DIGIT)
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={handlePinChange}
              placeholder="• • • • • •"
              maxLength={6}
              className="w-full text-center text-3xl tracking-[1em] px-4 py-5 rounded-2xl border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/50 shadow-lg font-mono disabled:opacity-60"
              required
              disabled={isLoading}
              autoComplete="off"
            />
            <div className="flex justify-between items-center mt-2 px-1">
              <p className="text-xs text-white/80">
                Tersisa: <span className="font-bold text-white">{6 - pin.length}</span> digit
              </p>
              {pin.length === 6 && (
                <span className="text-xs text-green-200 font-semibold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  PIN lengkap
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm flex gap-2 items-start">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="whitespace-pre-line">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || pin.length !== 6}
              className="w-full bg-white text-blue-600 font-bold py-4 px-8 rounded-full shadow-lg hover:bg-gray-50 active:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              style={{ minHeight: '56px' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memverifikasi...
                </span>
              ) : (
                'Verifikasi PIN'
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-white/30" />
            <span className="text-white/80 text-xs font-semibold">ATAU</span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          {/* WhatsApp CS Button */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all active:scale-[0.98] touch-manipulation"
            style={{ minHeight: '56px' }}
          >
            <FiMessageCircle className="w-5 h-5" />
            <span>Lupa PIN? Hubungi CS via WhatsApp</span>
          </a>

          {/* Info Footer */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-6">
            <p className="text-white/90 text-xs leading-relaxed text-center">
              💡 <strong>Tips:</strong> CS akan membantu Anda setelah verifikasi identitas. 
              Pastikan Anda memiliki akses ke email atau nomor telepon yang terdaftar.
            </p>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // STEP 2: BUAT PASSWORD BARU
  // ==========================================
  if (step === 'newPassword') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 flex flex-col px-4 sm:px-6 py-6 sm:py-12">
        {/* Back Button */}
        <div className="mb-6 sm:mb-8">
          <button 
            onClick={goBackToPin}
            disabled={isLoading}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white hover:bg-white/10 transition active:scale-95 disabled:opacity-50"
            aria-label="Kembali"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 backdrop-blur-sm mb-4">
            <svg className="w-10 h-10 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            PIN TERVERIFIKASI!
          </h1>
          <p className="text-white/90 text-sm">
            Buat password baru untuk akun Anda
          </p>
        </div>

        {/* Form Password Baru */}
        <form onSubmit={handleUpdatePassword} className="space-y-5 flex-1">
          {/* Password Baru */}
          <div>
            <label className="block text-white text-sm font-bold mb-2 tracking-wide">
              PASSWORD BARU
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={newPassword}
                onChange={handlePasswordChange}
                placeholder="Masukkan password baru"
                className="w-full px-4 py-4 pr-12 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:opacity-60"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-3 space-y-2 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        i <= passwordStrength.score
                          ? passwordStrength.color === 'red'
                            ? 'bg-red-400'
                            : passwordStrength.color === 'yellow'
                            ? 'bg-yellow-400'
                            : 'bg-green-400'
                          : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold ${
                    passwordStrength.color === 'red' ? 'text-red-100' :
                    passwordStrength.color === 'yellow' ? 'text-yellow-100' :
                    'text-green-100'
                  }`}>
                    Kekuatan: {passwordStrength.label}
                  </span>
                  <span className="text-xs text-white/80 font-mono">
                    {passwordStrength.score}/6
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label className="block text-white text-sm font-bold mb-2 tracking-wide">
              KONFIRMASI PASSWORD BARU
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Konfirmasi password baru"
                className="w-full px-4 py-4 pr-12 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:opacity-60"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Real-time Match Indicator */}
            {newPassword && confirmPassword && (
              <div className={`mt-2 flex items-center gap-2 text-xs font-medium ${
                newPassword === confirmPassword 
                  ? 'text-green-200' 
                  : 'text-red-200'
              }`}>
                {newPassword === confirmPassword ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Password cocok</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Password tidak cocok</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm flex gap-2 items-start">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full bg-white text-blue-600 font-bold py-4 px-8 rounded-full shadow-lg hover:bg-gray-50 active:bg-gray-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              style={{ minHeight: '56px' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengubah password...
                </span>
              ) : (
                'Simpan Password Baru'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // STEP 3: SUKSES
  // ==========================================
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-600 via-green-500 to-gray-300 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm mb-6 animate-bounce">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            BERHASIL!
          </h1>
          <p className="text-white/90 text-base max-w-md">
            Password Anda telah berhasil diubah. Silakan login dengan password baru Anda.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-md w-full">
          <div className="flex gap-3">
            <FiLock className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold mb-2">Tips Keamanan:</p>
              <ul className="text-white/90 text-sm space-y-1">
                <li>• Simpan password di tempat aman</li>
                <li>• Jangan bagikan ke siapa pun</li>
                <li>• Gunakan password yang unik untuk setiap akun</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Button ke Login */}
        <Link
          href="/auth/login"
          className="w-full max-w-md bg-white text-green-600 font-bold py-4 px-8 rounded-full shadow-lg hover:bg-gray-50 active:bg-gray-100 transition-all active:scale-[0.98] text-center touch-manipulation"
          style={{ minHeight: '56px' }}
        >
          Masuk Sekarang
        </Link>

        {/* Auto redirect info */}
        <p className="text-white/70 text-xs mt-4 text-center">
          Anda juga akan otomatis diarahkan dalam 5 detik...
        </p>

        {/* Auto redirect effect */}
        <AutoRedirect />
      </div>
    );
  }

  return null;
}

// Component untuk auto redirect
function AutoRedirect() {
  const router = require('next/navigation').useRouter();
  
  require('react').useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/auth/login');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return null;
}