'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useProfile() {
  const { user } = useAuth();
  const [data, setData] = useState({
    fullName: 'Memuat...',
    storeName: 'Memuat...',
    logoUrl: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data: merchant, error } = await supabase
        .from('merchants')
        .select('full_name, store_name, store_logo_url')
        .eq('id', user.id)
        .single();

      if (merchant && !error) {
        setData({
          fullName: merchant.full_name || 'Pengguna',
          storeName: merchant.store_name || 'Nama Toko',
          logoUrl: merchant.store_logo_url,
        });
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user?.id]);

  return { data, loading };
}