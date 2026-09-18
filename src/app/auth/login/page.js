// src/app/auth/login/page.js
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  // Ambil semua state dan fungsi logic dari useAuth
  const { loginForm } = useAuth();

  // Class Tailwind yang disesuaikan dengan desain screenshot
  const inputClass = "mt-1 block w-full px-4 py-3 bg-gray-200 border-0 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-150 ease-in-out";
  const labelClass = "block text-sm font-semibold text-gray-800 mt-6";

  return (
    <div className="min-h-screen bg-white flex flex-col py-12 px-6">
      {/* Title */}
      <div className="flex-1 flex flex-col justify-center">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-12">
          MASUK
        </h1>

        {/* Form Section */}
        <form className="space-y-4" onSubmit={loginForm.handleSubmit}>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>EMAIL</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={loginForm.formData.email}
              onChange={loginForm.handleChange}
              className={inputClass}
              placeholder="Masukkan email Anda"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={labelClass}>PASSWORD</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={loginForm.formData.password}
              onChange={loginForm.handleChange}
              className={inputClass}
              placeholder="Masukkan password Anda"
            />
          </div>

          {/* Error Message Display */}
          {loginForm.error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-600 text-center">{loginForm.error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={loginForm.isSubmitting}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {loginForm.isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                'MASUK'
              )}
            </button>
          </div>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="font-semibold text-blue-600 hover:text-blue-700 transition">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}