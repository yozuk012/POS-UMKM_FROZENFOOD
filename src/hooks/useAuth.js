// src/hooks/useAuth.js
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, uploadFile } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();

  // ==========================================
  // 1. GLOBAL AUTH STATE
  // ==========================================
  const [user, setUser] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================
  // 2. CORE UTILITY (DIPINDAH KE ATAS AGAR BISA DIAKSES OLENG FUNGSI LAIN)
  // ==========================================
  const fetchMerchant = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase.from('merchants').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      setMerchant(data);
      return data;
    } catch (err) {
      console.error('Fetch merchant error:', err);
      return null;
    }
  }, []);

  // ==========================================
  // 3. REGISTER FORM STATE & LOGIC
  // ==========================================
  const [regFormData, setRegFormData] = useState({
    fullName: '', email: '', phone: '', storeName: '', password: '', confirmPassword: '',
  });
  const [regLogoFile, setRegLogoFile] = useState(null);
  const [regLogoPreview, setRegLogoPreview] = useState(null);
  const [regError, setRegError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegChange = useCallback((e) => {
    const { name, value } = e.target;
    setRegFormData((prev) => ({ ...prev, [name]: value }));
    setRegError(null);
  }, []);

  const handleRegFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setRegError('Ukuran logo maksimal 2MB'); return; }
    if (!file.type.startsWith('image/')) { setRegError('File harus berupa gambar (JPG, PNG, dll)'); return; }
    setRegLogoFile(file);
    setRegLogoPreview(URL.createObjectURL(file));
    setRegError(null);
  }, []);

  const submitRegister = useCallback(async (e) => {
    if (e) e.preventDefault();
    setRegError(null);
    setIsRegistering(true);

    try {
      if (!regFormData.fullName.trim()) throw new Error('Nama lengkap wajib diisi');
      if (!regFormData.email.trim()) throw new Error('Email wajib diisi');
      if (!regFormData.phone.trim()) throw new Error('Nomor telepon wajib diisi');
      if (!regFormData.storeName.trim()) throw new Error('Nama toko wajib diisi');
      if (!regFormData.password) throw new Error('Password wajib diisi');
      if (regFormData.password.length < 6) throw new Error('Password minimal 6 karakter');
      if (regFormData.password !== regFormData.confirmPassword) throw new Error('Konfirmasi password tidak cocok');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regFormData.email.trim(),
        password: regFormData.password,
        options: { data: { full_name: regFormData.fullName.trim(), store_name: regFormData.storeName.trim() } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registrasi gagal: User tidak ditemukan');

      let storeLogoUrl = null;
      if (regLogoFile) {
        const fileName = `logo-${authData.user.id}-${Date.now()}`;
        const uploadResult = await uploadFile(regLogoFile, 'logo-toko', fileName);
        if (!uploadResult.success) throw new Error('Gagal upload logo: ' + uploadResult.error);
        storeLogoUrl = uploadResult.url;
      }

      const { error: merchantError } = await supabase.from('merchants').insert({
        id: authData.user.id,
        full_name: regFormData.fullName,
        phone: regFormData.phone || null,
        store_name: regFormData.storeName,
        store_logo_url: storeLogoUrl || null,
      });
      if (merchantError) throw merchantError;

      const { error: storeError } = await supabase.from('stores').insert({
        user_id: authData.user.id,
        name: regFormData.storeName + ' - Cabang Utama',
        type: 'frozen_food',
        address: null,
        logo_url: storeLogoUrl || null,
        is_active: true,
      });
      if (storeError) throw storeError;

      alert('Registrasi berhasil! Silakan login dengan email dan password Anda.');
      setRegFormData({ fullName: '', email: '', phone: '', storeName: '', password: '', confirmPassword: '' });
      setRegLogoFile(null);
      setRegLogoPreview(null);
      router.push('/auth/login'); 

    } catch (err) {
      console.error('Register error:', err);
      setRegError(err.message);
    } finally {
      setIsRegistering(false);
    }
  }, [regFormData, regLogoFile, router]);


  // ==========================================
  // 4. LOGIN FORM STATE & LOGIC
  // ==========================================
  const [loginFormData, setLoginFormData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginChange = useCallback((e) => {
    const { name, value } = e.target;
    setLoginFormData((prev) => ({ ...prev, [name]: value }));
    setLoginError(null);
  }, []);

  const submitLogin = useCallback(async (e) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      if (!loginFormData.email.trim()) throw new Error('Email wajib diisi');
      if (!loginFormData.password) throw new Error('Password wajib diisi');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginFormData.email.trim(),
        password: loginFormData.password,
      });

      if (error) throw error;
      
      if (data.user) {
        setUser(data.user);
        await fetchMerchant(data.user.id); // Sekarang aman karena fetchMerchant sudah dideklarasikan di atas
        router.push('/'); // Redirect ke dashboard setelah login berhasil
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Email atau password yang Anda masukkan salah.');
    } finally {
      setIsLoggingIn(false);
    }
  }, [loginFormData, fetchMerchant, router]);


  // ==========================================
  // 5. SESSION CHECK EFFECT
  // ==========================================
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
          await fetchMerchant(session.user.id);
        } else {
          setUser(null);
          setMerchant(null);
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchMerchant(session.user.id);
      } else {
        setUser(null);
        setMerchant(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchMerchant]);

  // ==========================================
  // 6. LOGOUT
  // ==========================================
  const logout = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setUser(null);
      setMerchant(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);


  // ==========================================
  // 7. RETURN VALUES
  // ==========================================
  return {
    user, merchant, loading, error, logout, isAuthenticated: !!user,
    
    // Register Controller
    registerForm: {
      formData: regFormData, logoFile: regLogoFile, logoPreview: regLogoPreview,
      error: regError, isSubmitting: isRegistering,
      handleChange: handleRegChange, handleFileChange: handleRegFileChange, handleSubmit: submitRegister,
    },
    
    // Login Controller
    loginForm: {
      formData: loginFormData,
      error: loginError,
      isSubmitting: isLoggingIn,
      handleChange: handleLoginChange,
      handleSubmit: submitLogin,
    }
  };
}

export default useAuth;