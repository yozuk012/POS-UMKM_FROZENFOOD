'use client';

import { useState } from 'react';
import { FiArrowLeft, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function PersentaseOnlinePage() {
  const router = useRouter();
  const [percentage, setPercentage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setPercentage(value);
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!percentage) {
      setError('Persentase harus diisi.');
      return;
    }

    const numPercentage = parseInt(percentage);
    if (numPercentage < 0 || numPercentage > 100) {
      setError('Persentase harus antara 0 dan 100.');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Add your API call here to update online percentage
      console.log('Updating online percentage:', numPercentage);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Persentase online berhasil diubah!');

      // Redirect after success
      setTimeout(() => {
        router.push('/settings/profile');
      }, 1500);
    } catch (err) {
      console.error('Error updating percentage:', err);
      setError('Gagal mengubah persentase online. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-lg font-bold text-white text-center">PERSENTASE<br />ONLINE</h1>
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
          {/* Percentage Input */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Persentase Produk Online
            </label>
            <div className="relative">
              <input
                type="text"
                value={percentage}
                onChange={handleInputChange}
                placeholder="Masukkan persentase (0-100)"
                className="w-full px-4 py-4 rounded-full border-0 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                %
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 flex justify-center">
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
          </div>
        </form>
      </main>
    </div>
  );
}