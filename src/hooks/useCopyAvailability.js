'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import {
  ACTIVE_STORE_EVENT,
  getActiveStoreId,
  isMainStore,
  resolveActiveStore,
} from '@/lib/activeStore';

export default function useCopyAvailability() {
  const { user } = useAuth();
  const [canCopy, setCanCopy] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkCopyAvailability = async () => {
      if (!user?.id) {
        if (isMounted) setCanCopy(false);
        return;
      }

      const { data: stores, error } = await supabase
        .from('stores')
        .select('id, name, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (!isMounted) return;
      if (error) {
        console.error('Gagal menentukan akses fitur salin:', error);
        setCanCopy(false);
        return;
      }

      const activeStore = resolveActiveStore(stores || [], getActiveStoreId());
      setCanCopy(Boolean(activeStore && !isMainStore(activeStore, stores || [])));
    };

    checkCopyAvailability();
    window.addEventListener(ACTIVE_STORE_EVENT, checkCopyAvailability);
    return () => {
      isMounted = false;
      window.removeEventListener(ACTIVE_STORE_EVENT, checkCopyAvailability);
    };
  }, [user?.id]);

  return { canCopy };
}
