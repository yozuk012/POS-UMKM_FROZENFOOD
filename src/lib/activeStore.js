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