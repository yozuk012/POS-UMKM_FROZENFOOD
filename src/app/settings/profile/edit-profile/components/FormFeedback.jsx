'use client';

import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

/**
 * FormFeedback
 * Komponen presentasional untuk menampilkan pesan error atau sukses dari hook.
 * 
 * @param {string|null} error - Pesan error yang akan ditampilkan (merah)
 * @param {string|null} successMessage - Pesan sukses yang akan ditampilkan (hijau)
 */
export default function FormFeedback({ error, successMessage }) {
  // Jika tidak ada pesan sama sekali, jangan render apa-apa
  if (!error && !successMessage) return null;

  return (
    <div className="space-y-3 mb-4">
      {/* Feedback Error */}
      {error && (
        <div 
          className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
          role="alert"
        >
          <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Feedback Success */}
      {successMessage && (
        <div 
          className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
          role="status"
        >
          <FiCheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}
    </div>
  );
}