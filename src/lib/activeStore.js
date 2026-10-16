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
