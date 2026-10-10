// src/components/CopyDataModal.jsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getActiveStoreId } from '@/lib/activeStore';
import { fetchItemsForCopy, executeCopyStoreData } from '@/lib/copyStoreData';
import { FiCopy, FiX, FiSearch, FiCheckSquare, FiSquare, FiArrowRight, FiCheck } from 'react-icons/fi';

/**
 * Modal untuk Menyalin Data (Kategori, Bahan Baku, Produk) antar cabang toko.
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - type: 'categories' | 'raw_materials' | 'products'
 * - title: string (contoh: "Kategori", "Bahan Baku", "Produk")
 * - onCopySuccess: function (callback untuk refresh data halaman setelah copy)
 */
export default function CopyDataModal({ isOpen, onClose, type, title, onCopySuccess }) {
  const { user } = useAuth();

  // State daftar toko
  const [stores, setStores] = useState([]);
  const [sourceStoreId, setSourceStoreId] = useState('');
  const [targetStoreId, setTargetStoreId] = useState('');

  // State data item dari toko sumber
  const [items, setItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // State proses copy
  const [isCopying, setIsCopying] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // 1. Ambil daftar cabang toko milik user saat modal dibuka
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchUserStores = async () => {
      setSelectedIds([]);
      setSearchQuery('');
      setStatusMessage(null);
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, name, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setStores(data || []);

        const activeId = getActiveStoreId();
        // Target default: toko yang sedang aktif dibuka
        const initialTargetId = activeId || (data?.[0]?.id ? String(data[0].id) : '');
        setTargetStoreId(initialTargetId);

        // Sumber default: toko lain selain target
        const otherStore = (data || []).find((s) => String(s.id) !== String(initialTargetId));
        setSourceStoreId(otherStore ? String(otherStore.id) : '');
      } catch (err) {
        console.error('Gagal mengambil daftar toko:', err);
      }
    };

    fetchUserStores();
  }, [isOpen, user?.id]);

  // 2. Ambil data item saat toko sumber berubah
  useEffect(() => {
    let isMounted = true;
    if (isOpen && sourceStoreId) {
      Promise.resolve().then(() => {
        if (!isMounted) return;
        setIsLoadingItems(true);
        fetchItemsForCopy(type, sourceStoreId)
          .then((data) => {
            if (isMounted) {
              setItems(data || []);
              setSelectedIds([]);
              setIsLoadingItems(false);
            }
          })
          .catch((err) => {
            if (isMounted) {
              console.error('Gagal mengambil item toko sumber:', err);
              setStatusMessage({ type: 'error', text: 'Gagal memuat item dari cabang sumber.' });
              setIsLoadingItems(false);
            }
          });
      });
    } else {
      Promise.resolve().then(() => {
        if (isMounted) setItems([]);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, type, sourceStoreId]);

  // 3. Filter items berdasarkan search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) =>
      item.name.toLowerCase().includes(q) || (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // 4. Handler Seleksi (Single & Multi-Select)
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  // 5. Handler Eksekusi Salin
  const handleCopy = async () => {
    if (selectedIds.length === 0) {
      alert('Pilih setidaknya satu item yang ingin disalin.');
      return;
    }
    if (!sourceStoreId || !targetStoreId) {
      alert('Pilih cabang asal dan cabang tujuan terlebih dahulu.');
      return;
    }
    if (String(sourceStoreId) === String(targetStoreId)) {
      alert('Cabang asal dan cabang tujuan tidak boleh sama.');
      return;
    }

    const targetStore = stores.find((s) => String(s.id) === String(targetStoreId));
    const confirmMsg = `Salin ${selectedIds.length} ${title} terpilih ke cabang "${targetStore?.name || 'Tujuan'}"?` +
      (type === 'products' ? '\n\n💡 Resep (recipes) & komposisi bahan baku (recipe_ingredients) akan ikut disalin secara otomatis.' : '');

    if (!window.confirm(confirmMsg)) return;

    setIsCopying(true);
    setStatusMessage(null);

    try {
      const result = await executeCopyStoreData(type, sourceStoreId, targetStoreId, selectedIds);
      setStatusMessage({
        type: 'success',
        text: `Berhasil menyalin ${result.count} ${title} ke cabang "${targetStore?.name}".`,
      });

      // Panggil callback refresh halaman jika toko target adalah toko aktif saat ini
      if (onCopySuccess) {
        onCopySuccess();
      }

      // Beri jeda 1 detik lalu tutup modal
      setTimeout(() => {
        setIsCopying(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saat menyalin data:', err);
      setStatusMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyalin: ' + (err.message || 'Silakan coba lagi.'),
      });
      setIsCopying(false);
    }
  };

  if (!isOpen) return null;

  const isAllSelected = filteredItems.length > 0 && selectedIds.length === filteredItems.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <FiCopy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                Salin {title} Antar Cabang
              </h3>
              <p className="text-xs text-gray-500">
                Pilih cabang sumber dan cabang tujuan untuk menduplikasi data.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isCopying}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* BODY MODAL */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' && <FiCheck className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* PERINGATAN JIKA HANYA 1 TOKO */}
          {stores.length < 2 ? (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-sm">
              <p className="font-semibold mb-1">⚠️ Cabang Toko Kurang dari 2</p>
              <p className="text-xs text-yellow-700">
                Anda hanya memiliki {stores.length} cabang toko. Fitur salin data membutuhkan minimal 2 cabang toko.
                Silakan tambahkan cabang toko baru di menu <strong>Pengaturan &gt; Manajemen Cabang Toko</strong> terlebih dahulu.
              </p>
            </div>
          ) : (
            <>
              {/* BARIS PILIH CABANG (SUMBER -> TUJUAN) */}
              <div className="bg-gray-50 p-3.5 sm:p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                {/* Toko Sumber */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dari Cabang (Sumber):
                  </label>
                  <select
                    value={sourceStoreId}
                    onChange={(e) => setSourceStoreId(e.target.value)}
                    disabled={isCopying}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>-- Pilih Cabang Sumber --</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id} disabled={String(s.id) === String(targetStoreId)}>
                        {s.name} {String(s.id) === String(targetStoreId) ? '(Tujuan)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Toko Tujuan */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <span>Ke Cabang (Tujuan):</span>
                    <FiArrowRight className="w-3.5 h-3.5 text-blue-600 hidden sm:inline" />
                  </label>
                  <select
                    value={targetStoreId}
                    onChange={(e) => setTargetStoreId(e.target.value)}
                    disabled={isCopying}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>-- Pilih Cabang Tujuan --</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id} disabled={String(s.id) === String(sourceStoreId)}>
                        {s.name} {String(s.id) === String(sourceStoreId) ? '(Sumber)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {type === 'products' && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <strong>Penyalinan Lengkap Otomatis:</strong> Saat menyalin produk, resep (<em>recipes</em>), komposisi bahan baku (<em>recipe_ingredients</em>), kategori, dan harga multi-channel akan otomatis ikut disalin ke cabang tujuan!
                  </div>
                </div>
              )}

              {/* SEARCH & SELECT ALL TOOLBAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                {/* Search Input */}
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Cari ${title.toLowerCase()}...`}
                    disabled={isLoadingItems || items.length === 0}
                    className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Tombol Pilih Semua */}
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={isLoadingItems}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shrink-0"
                  >
                    {isAllSelected ? (
                      <>
                        <FiCheckSquare className="w-4 h-4 text-blue-600" />
                        <span>Batal Pilih Semua</span>
                      </>
                    ) : (
                      <>
                        <FiSquare className="w-4 h-4 text-gray-400" />
                        <span>Pilih Semua ({filteredItems.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* LIST ITEM DENGAN CHECKBOX (MULTI-SELECT / SELECT) */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-gray-50/80 px-3 py-2 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span>Daftar {title} ({filteredItems.length})</span>
                  <span className="font-semibold text-blue-600">
                    {selectedIds.length} dipilih
                  </span>
                </div>

                <div className="max-h-60 sm:max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {isLoadingItems ? (
                    <div className="p-8 text-center text-xs sm:text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      Memuat daftar {title.toLowerCase()}...
                    </div>
                  ) : items.length === 0 ? (
                    <div className="p-8 text-center text-xs sm:text-sm text-gray-400">
                      Cabang sumber ini belum memiliki data {title.toLowerCase()}.
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      Tidak ada {title.toLowerCase()} yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
                    </div>
                  ) : (
                    filteredItems.map((item) => {
                      const isChecked = selectedIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSelect(item.id)}
                          className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Controlled by row click
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                                {item.name}
                              </p>
                              {item.recipeBadge && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    item.hasRecipe
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {item.recipeBadge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="p-3 sm:p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="text-xs text-gray-500">
            {selectedIds.length > 0 ? (
              <span className="font-medium text-blue-700">
                {selectedIds.length} {title.toLowerCase()} siap disalin
              </span>
            ) : (
              <span>Pilih {title.toLowerCase()} untuk disalin</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isCopying}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-200/70 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={
                isCopying ||
                selectedIds.length === 0 ||
                !sourceStoreId ||
                !targetStoreId ||
                String(sourceStoreId) === String(targetStoreId)
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all shadow-sm ${
                isCopying || selectedIds.length === 0 || String(sourceStoreId) === String(targetStoreId)
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
              }`}
            >
              <FiCopy className="w-4 h-4" />
              <span>{isCopying ? 'Menyalin...' : `Salin ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
