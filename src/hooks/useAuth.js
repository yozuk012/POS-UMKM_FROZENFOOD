'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, uploadFile } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs'; // ⚠️ Pastikan sudah install: npm install bcryptjs

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
  // 2. CORE UTILITY
  // ==========================================
  const fetchMerchant = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase.from('merchants').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      setMerchant(data);
      return data;
    } catch (err) {
      console.warn('Fetch merchant warning:', err.message);
      return null;
    }
  }, []);

  // ==========================================
  // 3. REGISTER FORM STATE & LOGIC (DENGAN STEP PIN)
  // ==========================================
  
  // STEP CONTROLLER: 'form' | 'pin-setup'
  const [registerStep, setRegisterStep] = useState('form');
  
  // Data user yang baru diregister (untuk step 2)
  const [registeredUserId, setRegisteredUserId] = useState(null);

  // Step 1: Form Registrasi
  const [regFormData, setRegFormData] = useState({
    fullName: '', email: '', phone: '', storeName: '', password: '', confirmPassword: '',
  });
  const [regLogoFile, setRegLogoFile] = useState(null);
  const [regLogoPreview, setRegLogoPreview] = useState(null);
  const [regError, setRegError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Step 2: Setup PIN Pemulihan
  const [pinData, setPinData] = useState({ pin: '', confirmPin: '' });
  const [pinError, setPinError] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);

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

  const handlePinChange = useCallback((e) => {
    const { name, value } = e.target;
    // Hanya izinkan angka untuk PIN
    const sanitizedValue = name === 'pin' || name === 'confirmPin' 
      ? value.replace(/\D/g, '').slice(0, 6) 
      : value;
    setPinData((prev) => ({ ...prev, [name]: sanitizedValue }));
    setPinError(null);
  }, []);

  // STEP 1: Submit Register (Auth + Merchant + Store)
  const submitRegister = useCallback(async (e) => {
    if (e) e.preventDefault();
    setRegError(null);
    setIsRegistering(true);

    try {
      // Validasi
      if (!regFormData.fullName.trim()) throw new Error('Nama lengkap wajib diisi');
      if (!regFormData.email.trim()) throw new Error('Email wajib diisi');
      if (!regFormData.phone.trim()) throw new Error('Nomor telepon wajib diisi');
      if (!regFormData.storeName.trim()) throw new Error('Nama toko wajib diisi');
      if (!regFormData.password) throw new Error('Password wajib diisi');
      if (regFormData.password.length < 6) throw new Error('Password minimal 6 karakter');
      if (regFormData.password !== regFormData.confirmPassword) throw new Error('Konfirmasi password tidak cocok');

      // 1. Buat user di Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regFormData.email.trim(),
        password: regFormData.password,
        options: { 
          data: { 
            full_name: regFormData.fullName.trim(), 
            store_name: regFormData.storeName.trim(),
            phone: regFormData.phone.trim()
          } 
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registrasi gagal: User tidak ditemukan');

      // 2. Upload logo jika ada
      let storeLogoUrl = null;
      if (regLogoFile) {
        const fileName = `logo-${authData.user.id}-${Date.now()}`;
        const uploadResult = await uploadFile(regLogoFile, 'logo-toko', fileName);
        if (!uploadResult.success) throw new Error('Gagal upload logo: ' + uploadResult.error);
        storeLogoUrl = uploadResult.url;
      }

      // 3. Insert ke tabel merchants
      const { error: merchantError } = await supabase.from('merchants').insert({
        id: authData.user.id,
        full_name: regFormData.fullName,
        phone: regFormData.phone || null,
        store_name: regFormData.storeName,
        store_logo_url: storeLogoUrl || null,
        // recovery_pin_hash, pin_attempts, pin_locked_until default NULL/0
      });
      if (merchantError) throw merchantError;

      // 4. Insert ke tabel stores (cabang utama)
      const { error: storeError } = await supabase.from('stores').insert({
        user_id: authData.user.id,
        name: regFormData.storeName + ' - Cabang Utama',
        type: 'frozen_food',
        address: null,
        logo_url: storeLogoUrl || null,
        is_active: true,
      });
      if (storeError) throw storeError;

      // 5. Simpan User ID & Pindah ke Step 2 (Setup PIN)
      setRegisteredUserId(authData.user.id);
      setRegisterStep('pin-setup');

      // Bersihkan form registrasi (tidak diperlukan lagi)
      setRegFormData({ fullName: '', email: '', phone: '', storeName: '', password: '', confirmPassword: '' });
      setRegLogoFile(null);
      setRegLogoPreview(null);

    } catch (err) {
      console.warn('Register warning:', err.message);
      setRegError(err.message);
    } finally {
      setIsRegistering(false);
    }
  }, [regFormData, regLogoFile]);

  // STEP 2: Submit Recovery PIN
  const submitRecoveryPin = useCallback(async (e) => {
    if (e) e.preventDefault();
    setPinError(null);
    setIsSettingPin(true);

    try {
      // Validasi PIN
      if (!pinData.pin) throw new Error('PIN wajib diisi');
      if (pinData.pin.length !== 6) throw new Error('PIN harus 6 digit angka');
      if (pinData.pin !== pinData.confirmPin) throw new Error('Konfirmasi PIN tidak cocok');
      if (!registeredUserId) throw new Error('Sesi registrasi tidak valid. Silakan daftar ulang.');

      // Cek PIN terlalu sederhana (opsional tapi direkomendasikan)
      const simplePins = ['123456', '654321', '111111', '000000', '121212', '696969'];
      if (simplePins.includes(pinData.pin)) {
        throw new Error('PIN terlalu mudah ditebak. Gunakan kombinasi angka yang lebih aman.');
      }

      // Hash PIN dengan bcrypt (10 rounds)
      const saltRounds = 10;
      const hashedPin = await bcrypt.hash(pinData.pin, saltRounds);

      // Update merchants dengan PIN hash
      const { error: updateError } = await supabase
        .from('merchants')
        .update({ 
          recovery_pin_hash: hashedPin,
          pin_attempts: 0,
          pin_locked_until: null
        })
        .eq('id', registeredUserId);

      if (updateError) throw updateError;

      // Sukses! Reset state dan redirect ke login
      alert('🎉 Registrasi berhasil!\n\nPIN Pemulihan telah disimpan.\nSilakan login dengan email dan password Anda.\n\n📌 PENTING: Simpan PIN Anda di tempat aman!');
      
      // Reset semua state register
      setRegisterStep('form');
      setRegisteredUserId(null);
      setPinData({ pin: '', confirmPin: '' });
      
      // Redirect ke halaman login
      router.push('/auth/login');

    } catch (err) {
      console.warn('Setup PIN warning:', err.message);
      setPinError(err.message);
    } finally {
      setIsSettingPin(false);
    }
  }, [pinData, registeredUserId, router]);

  // Fungsi untuk skip setup PIN (jika user ingin nanti saja - opsional)
  const skipPinSetup = useCallback(async () => {
    if (!registeredUserId) return;
    
    const confirm = window.confirm(
      '⚠️ PERINGATAN!\n\n' +
      'Jika Anda skip setup PIN sekarang, Anda TIDAK BISA mereset password sendiri jika lupa.\n' +
      'Anda harus menghubungi CS untuk bantuan.\n\n' +
      'Yakin ingin melewati step ini?'
    );

    if (!confirm) return;

    // Redirect tanpa set PIN
    setRegisterStep('form');
    setRegisteredUserId(null);
    setPinData({ pin: '', confirmPin: '' });
    router.push('/auth/login');
  }, [registeredUserId, router]);

  // Fungsi untuk kembali ke step form (jika user ingin ubah data)
  const backToRegisterForm = useCallback(() => {
    // WARNING: Ini akan membuat user "gantung" di auth.users tanpa merchant
    // Tapi untuk UX, kita izinkan dan biarkan mereka register ulang
    const confirm = window.confirm(
      'Kembali ke form registrasi akan membatalkan pendaftaran.\n' +
      'Anda harus mendaftar ulang dari awal.\n\n' +
      'Lanjutkan?'
    );
    
    if (confirm) {
      setRegisterStep('form');
      setRegisteredUserId(null);
      setPinData({ pin: '', confirmPin: '' });
      setPinError(null);
    }
  }, []);


  // ==========================================
  // 4. LOGIN FORM STATE & LOGIC (TETAP SAMA)
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

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email atau password yang Anda masukkan salah.');
        }
        throw new Error(error.message);
      }
      
      if (data.user) {
        setUser(data.user);
        const merchantData = await fetchMerchant(data.user.id);
        
        // CEK: Apakah user sudah setup PIN?
        if (merchantData && !merchantData.recovery_pin_hash) {
          // User lama yang belum setup PIN, arahkan ke halaman setup
          setRegisteredUserId(data.user.id);
          router.push('/auth/setup-pin');
          return;
        }
        
        router.push('/');
      }
    } catch (err) {
      console.warn('Login gagal:', err.message);
      setLoginError(err.message);
      alert(err.message);
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
        console.warn('Session check warning:', err.message);
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
      console.warn('Logout warning:', err.message);
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
    
    // Register Controller (dengan Step Management)
    registerForm: {
      // State
      step: registerStep, // 'form' | 'pin-setup'
      formData: regFormData, 
      logoFile: regLogoFile, 
      logoPreview: regLogoPreview,
      error: regError, 
      isSubmitting: isRegistering,
      
      // Handlers Step 1
      handleChange: handleRegChange, 
      handleFileChange: handleRegFileChange, 
      handleSubmit: submitRegister,

      // State & Handlers Step 2 (PIN)
      pinSetup: {
        userId: registeredUserId,
        pinData: pinData,
        error: pinError,
        isSubmitting: isSettingPin,
        handleChange: handlePinChange,
        handleSubmit: submitRecoveryPin,
        handleSkip: skipPinSetup,
        handleBack: backToRegisterForm,
      }
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