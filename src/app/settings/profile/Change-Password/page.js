'use client';

import { useState } from 'react';
import { FiArrowLeft, FiUser, FiLock, FiEye, FiEyeOff, FiShield, FiAlertCircle, FiKey } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import useChangePassword from '@/hooks/useChangePassword';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Ambil logic dari custom hook
  const {
    formData,
    isSubmitting,
    error,
    successMessage,
    requireRelogin,
    passwordStrength,
    handleChange,
    handleSubmit,
    handleForgotCurrentPassword,
  } = useChangePassword();

  // Local state untuk toggle visibility password
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300">
      {/* Header */}
      <header className="px-4 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            disabled={isSubmitting || requireRelogin}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white disabled:opacity-50"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white text-center">CHANGE<br />PASSWORD</h1>
          <div className="w-10" />
        </div>

        {/* Profile Avatar Section */}
        <div className="flex justify-center py-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center shadow-lg">
            <FiUser className="w-12 h-12 text-gray-500" />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex gap-3">
            <FiShield className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <p className="text-white text-sm leading-relaxed">
              Gunakan password yang kuat dan belum pernah digunakan sebelumnya untuk keamanan akun Anda.
            </p>
          </div>
        </div>
      </header>

      {/* Form Section */}
      <main className="px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex gap-2 items-start">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="whitespace-pre-line">{successMessage}</div>
            </div>
            {requireRelogin && (
              <div className="mt-3 flex items-center gap-2 pl-7">
                <svg className="animate-spin h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs">Mengalihkan ke halaman login...</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Old Password Input */}
          <div>
            <label className="block text-white text-sm font-bold mb-2 tracking-wide">
              PASSWORD SAAT INI
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Masukkan password saat ini"
                className="w-full px-4 py-4 pr-12 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:opacity-60"
                required
                disabled={isSubmitting || requireRelogin}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                disabled={isSubmitting || requireRelogin}
              >
                {showOldPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Link Lupa Password */}
            <button
              type="button"
              onClick={handleForgotCurrentPassword}
              disabled={isSubmitting || requireRelogin}
              className="mt-2 flex items-center gap-1 text-xs text-white/90 hover:text-white underline underline-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiKey className="w-3 h-3" />
              <span>Lupa password saat ini?</span>
            </button>
          </div>

          {/* New Password Input */}
          <div>
            <label className="block text-white text-sm font-bold mb-2 tracking-wide">
              PASSWORD BARU
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Masukkan password baru"
                className="w-full px-4 py-4 pr-12 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:opacity-60"
                required
                disabled={isSubmitting || requireRelogin}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                disabled={isSubmitting || requireRelogin}
              >
                {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="mt-3 space-y-2 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                {/* Progress Bar */}
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
                {/* Label & Score */}
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold ${
                    passwordStrength.color === 'red' ? 'text-red-100' :
                    passwordStrength.color === 'yellow' ? 'text-yellow-100' :
                    'text-green-100'
                  }`}>
                    {passwordStrength.label === 'Lemah' && '⚠️ '}
                    {passwordStrength.label === 'Sedang' && '⚡ '}
                    {passwordStrength.label === 'Kuat' && '✓ '}
                    Kekuatan: {passwordStrength.label}
                  </span>
                  <span className="text-xs text-white/80 font-mono">
                    {passwordStrength.score}/6
                  </span>
                </div>
                {/* Suggestions */}
                {passwordStrength.suggestions.length > 0 && passwordStrength.color !== 'green' && (
                  <ul className="text-xs text-white/90 space-y-0.5 pt-1 border-t border-white/20">
                    {passwordStrength.suggestions.slice(0, 2).map((suggestion, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="text-yellow-300">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm New Password Input */}
          <div>
            <label className="block text-white text-sm font-bold mb-2 tracking-wide">
              KONFIRMASI PASSWORD BARU
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Konfirmasi password baru"
                className="w-full px-4 py-4 pr-12 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:opacity-60"
                required
                disabled={isSubmitting || requireRelogin}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                disabled={isSubmitting || requireRelogin}
              >
                {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Real-time Match Indicator */}
            {formData.newPassword && formData.confirmPassword && (
              <div className={`mt-2 flex items-center gap-2 text-xs font-medium ${
                formData.newPassword === formData.confirmPassword 
                  ? 'text-green-200' 
                  : 'text-red-200'
              }`}>
                {formData.newPassword === formData.confirmPassword ? (
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

          {/* Submit Button */}
          <div className="pt-6 flex flex-col items-center">
            <button
              type="submit"
              disabled={isSubmitting || requireRelogin}
              className="w-48 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : requireRelogin ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Berhasil!
                </span>
              ) : (
                'SUBMIT'
              )}
            </button>
          </div>
        </form>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
          <div className="flex gap-3">
            <FiLock className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-semibold mb-1">Tips Keamanan</p>
              <ul className="text-white/90 text-xs space-y-1">
                <li>• Minimal 8 karakter dengan kombinasi huruf, angka & simbol</li>
                <li>• Jangan gunakan tanggal lahir atau informasi pribadi</li>
                <li>• Ganti password secara berkala (3-6 bulan sekali)</li>
                <li>• Jangan bagikan password kepada siapa pun</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}