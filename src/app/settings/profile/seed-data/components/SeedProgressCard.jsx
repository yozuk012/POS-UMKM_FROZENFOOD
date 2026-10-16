'use client';

import { useRef, useEffect } from 'react';
import {
  FiPlay,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiTerminal,
  FiTrendingUp,
} from 'react-icons/fi';

const LOG_STYLES = {
  success: { icon: FiCheckCircle, className: 'text-green-600' },
  error: { icon: FiAlertCircle, className: 'text-red-600' },
  info: { icon: FiInfo, className: 'text-blue-600' },
};

export default function SeedProgressCard({
  isSeeding,
  progress,
  phase,
  log,
  onRun,
  disabled,
  totalProducts,
}) {
  const logEndRef = useRef(null);

  // Auto-scroll ke log terbaru
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [log]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FiTrendingUp className="text-blue-600" size={20} />
        Jalankan Seed
      </h2>

      {/* Tombol aksi */}
      <button
        type="button"
        onClick={onRun}
        disabled={disabled || isSeeding}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {isSeeding ? (
          <>
            <FiLoader className="animate-spin" size={18} />
            Sedang memproses...
          </>
        ) : (
          <>
            <FiPlay size={18} />
            Mulai Seed {totalProducts ? `(${totalProducts} produk)` : ''}
          </>
        )}
      </button>

      {/* Progress bar */}
      {(isSeeding || progress > 0) && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>{phase || 'Memproses...'}</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Log proses */}
      {log.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiTerminal size={14} /> Log Proses
          </p>
          <div className="max-h-64 overflow-y-auto bg-gray-900 rounded-lg p-3 space-y-1.5">
            {log.map((entry, index) => {
              const style = LOG_STYLES[entry.type] || LOG_STYLES.info;
              const Icon = style.icon;

              return (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <Icon className={`${style.className} shrink-0 mt-0.5`} size={13} />
                  <span className="text-gray-200 flex-1">{entry.message}</span>
                  <span className="text-gray-500 shrink-0">
                    {new Date(entry.time).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
