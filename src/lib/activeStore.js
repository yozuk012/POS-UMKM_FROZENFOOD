// src/lib/activeStore.js
// Sumber tunggal untuk "toko aktif" yang dipakai di seluruh aplikasi.
// Nilai disimpan di localStorage + disiarkan lewat custom event, sehingga
// semua hook/komponen ikut ter-update ketika user berpindah toko.

import { useSyncExternalStore } from 'react';

export const ACTIVE_STORE_KEY = 'active_store_id';
export const ACTIVE_STORE_EVENT = 'active-store-change';

export const getActiveStoreId = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_STORE_KEY);
};

export const setActiveStoreId = (storeId) => {
  if (typeof window === 'undefined') return;
  const value = storeId ? String(storeId) : '';
  window.localStorage.setItem(ACTIVE_STORE_KEY, value);
  window.dispatchEvent(new CustomEvent(ACTIVE_STORE_EVENT, { detail: value }));
};

export const resolveActiveStore = (stores, preferredId = null) => {
  if (!Array.isArray(stores) || stores.length === 0) return null;
  const targetId = preferredId || getActiveStoreId();
  if (targetId) {
    const matched = stores.find((s) => String(s.id) === String(targetId) && s.is_active !== false);
    if (matched) return matched;
  }
  return stores.find((s) => s.is_active !== false) || stores[0] || null;
};

// ==========================================
// DETEKSI CABANG UTAMA
// Dipakai oleh fitur yang hanya boleh aktif di cabang utama (mis. Diskon
// Cepat di halaman Transaksi). Urutan deteksi, dari yang paling eksplisit:
//   1. Kolom `is_main` di tabel stores (kalau nanti ditambahkan via migrasi).
//   2. Nama cabang mengandung "Cabang Utama" — format bawaan saat registrasi:
//      "<Nama Usaha> - Cabang Utama".
//   3. Cabang tertua (id terkecil) dianggap cabang utama.
// ==========================================
export const MAIN_STORE_NAME_PATTERN = /cabang\s*utama/i;

export const isMainStore = (store, allStores = []) => {
  if (!store) return false;
  if (store.is_main === true) return true;
  if (store.is_main === false) return false;
  if (MAIN_STORE_NAME_PATTERN.test(String(store.name || ''))) return true;

  const ids = (Array.isArray(allStores) ? allStores : [])
    .map((s) => Number(s?.id))
    .filter((id) => Number.isFinite(id));

  if (ids.length === 0) return false;
  return Number(store.id) === Math.min(...ids);
};


// ==========================================
// HOOK: useActiveStore()
// Mengembalikan { storeId } toko yang sedang aktif dan otomatis
// re-render ketika toko diganti (setActiveStoreId) atau ketika tab
// lain mengubah localStorage yang sama.
// ==========================================
const subscribeActiveStore = (onStoreChange) => {
  if (typeof window === 'undefined') return () => {};
  const handleChange = () => onStoreChange();
  window.addEventListener(ACTIVE_STORE_EVENT, handleChange);
  window.addEventListener('storage', handleChange);
  return () => {
    window.removeEventListener(ACTIVE_STORE_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
};

export function useActiveStore() {
  const storeId = useSyncExternalStore(
    subscribeActiveStore,
    getActiveStoreId,
    () => null
  );

  return { storeId };
}
