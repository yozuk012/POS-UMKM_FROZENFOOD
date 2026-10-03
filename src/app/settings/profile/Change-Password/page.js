'use client';

import { useState } from 'react';
import { FiArrowLeft, FiUser, FiLock, FiEye, FiEyeOff, FiX, FiMail } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State untuk Forgot Password Modal
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError('Password baru tidak boleh sama dengan password lama.');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Add your API call here to change password
      console.log('Changing password:', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Password berhasil diubah!');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });

      // Redirect after success
      setTimeout(() => {
        router.push('/settings/profile');
      }, 1500);
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Gagal mengubah password. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setForgotLoading(true);

    // Validation
    if (!forgotEmail) {
      setError('Email harus diisi.');
      setForgotLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setError('Format email tidak valid.');
      setForgotLoading(false);
      return;
    }

    try {
      // TODO: Add your API call here to send reset password email
      console.log('Sending reset password to:', forgotEmail);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setForgotSuccess(true);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setForgotSuccess(false);
        setForgotEmail('');
      }, 2000);
    } catch (err) {
      console.error('Error sending reset password:', err);
      setError('Gagal mengirim email reset password. Silakan coba lagi.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
    setError('');
    setForgotSuccess(false);
  };

  const closeModal = () => {
    setShowForgotPasswordModal(false);
    setError('');
    setForgotSuccess(false);
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300">
      {/* Header */}
      <header className="px-4 py-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white text-center">CHANGE<br />PASSWORD</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Profile Avatar Section */}
        <div className="flex justify-center py-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center shadow-lg">
            <FiUser className="w-12 h-12 text-gray-500" />
          </div>
        </div>
      </header>

      {/* Form Section */}
      <main className="px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Old Password Input */}
          <div>
            <label className="block text-white text-sm font-bold mb-2 tracking-wide">
              PASSWORD LAMA
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleInputChange}
                placeholder="Masukkan password lama"
                className="w-full px-4 py-4 pr-12 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showOldPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
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
                onChange={handleInputChange}
                placeholder="Masukkan password baru"
                className="w-full px-4 py-4 pr-12 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
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
                onChange={handleInputChange}
                placeholder="Konfirmasi password baru"
                className="w-full px-4 py-4 pr-12 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 flex flex-col items-center">
            <button
              type="submit"
              disabled={isLoading}
              className="w-48 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                'SUBMIT'
              )}
            </button>

            {/* Forgot Password Link */}
            <button
              type="button"
              onClick={handleForgotPassword}
              className="mt-4 text-gray-700 text-xs font-bold hover:text-blue-700 transition-colors uppercase tracking-wide"
            >
              LUPA PASSWORD?
            </button>
          </div>
        </form>
      </main>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-blue-600 via-blue-500 to-gray-300 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-4 flex items-center justify-between">
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-bold text-white text-center flex-1">
                LUPA PASSWORD
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-4 py-8">
              {forgotSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Email Terkirim!</h3>
                  <p className="text-gray-700 text-sm">
                    Link reset password telah dikirim ke email Anda.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label className="block text-white text-sm font-bold mb-2 tracking-wide">
                      EMAIL
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <FiMail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          setError('');
                        }}
                        placeholder="Masukkan email Anda"
                        className="w-full pl-12 pr-4 py-4 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {forgotLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Mengirim...
                        </span>
                      ) : (
                        'SUBMIT'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}