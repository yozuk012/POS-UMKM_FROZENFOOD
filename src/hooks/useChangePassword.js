'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function useChangePassword() {
  const { user, logout } = useAuth();

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [requireRelogin, setRequireRelogin] = useState(false); // Flag untuk redirect setelah sukses

  // ==========================================
  // 2. PASSWORD STRENGTH INDICATOR
  // ==========================================
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'gray', suggestions: [] };

    let score = 0;
    const suggestions = [];

    // Panjang minimal
    if (password.length >= 6) score += 1;
    else suggestions.push('Minimal 6 karakter');

    if (password.length >= 8) score += 1;
    else if (password.length >= 6) suggestions.push('Lebih baik 8 karakter atau lebih');

    // Huruf besar
    if (/[A-Z]/.test(password)) score += 1;
    else suggestions.push('Tambahkan huruf besar (A-Z)');

    // Huruf kecil
    if (/[a-z]/.test(password)) score += 1;
    else suggestions.push('Tambahkan huruf kecil (a-z)');

    // Angka
    if (/[0-9]/.test(password)) score += 1;
    else suggestions.push('Tambahkan angka (0-9)');

    // Karakter spesial
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else suggestions.push('Tambahkan simbol (!@#$%^&*)');

    // Label berdasarkan score
    let label, color;
    if (score <= 2) {
      label = 'Lemah';
      color = 'red';
    } else if (score <= 4) {
      label = 'Sedang';
      color = 'yellow';
    } else {
      label = 'Kuat';
      color = 'green';
    }

    return { score, label, color, suggestions };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  // ==========================================
  // 3. FORM HANDLERS
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMessage('');
  };

  const resetForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError(null);
    setSuccessMessage('');
  };

  // ==========================================
  // 4. VALIDASI
  // ==========================================
  const validateForm = () => {
    if (!formData.currentPassword.trim()) {
      return 'Password saat ini wajib diisi.';
    }
    if (!formData.newPassword.trim()) {
      return 'Password baru wajib diisi.';
    }
    if (formData.newPassword.length < 6) {
      return 'Password baru minimal 6 karakter.';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      return 'Konfirmasi password tidak cocok.';
    }
    if (formData.currentPassword === formData.newPassword) {
      return 'Password baru tidak boleh sama dengan password lama.';
    }
    // Cek password terlalu sederhana (opsional)
    const simplePasswords = ['password', '123456', 'qwerty', 'admin123'];
    if (simplePasswords.includes(formData.newPassword.toLowerCase())) {
      return 'Password terlalu mudah ditebak. Gunakan kombinasi yang lebih kuat.';
    }
    return null;
  };

  // ==========================================
  // 5. SUBMIT (CHANGE PASSWORD)
  // ==========================================
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validasi form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user?.email) {
      setError('User tidak ditemukan. Silakan login ulang.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      // Step 1: Verifikasi password lama dengan mencoba login ulang
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Password saat ini salah. Silakan periksa kembali.');
        }
        throw new Error('Verifikasi gagal: ' + signInError.message);
      }

      // Step 2: Update password baru
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        throw new Error('Gagal mengubah password: ' + updateError.message);
      }

      // Step 3: Sukses
      setSuccessMessage(
        '🎉 Password berhasil diubah!\n\n' +
        'Anda akan otomatis logout untuk keamanan.\n' +
        'Silakan login kembali menggunakan password baru Anda.'
      );
      setRequireRelogin(true);
      resetForm();

      // Auto logout dan redirect setelah 2.5 detik
      setTimeout(async () => {
        try {
          await logout();
        } catch (err) {
          console.warn('Logout warning:', err.message);
          // Fallback: paksa redirect jika logout gagal
          window.location.href = '/auth/login';
        }
      }, 2500);

    } catch (err) {
      console.error('Change password error:', err);
      setError(err.message || 'Terjadi kesalahan saat mengubah password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 6. HANDLE LUPA PASSWORD LAMA
  // ==========================================
  // Jika user tidak ingat password lama sama sekali,
  // arahkan ke halaman forgot-password (via PIN Recovery)
  const handleForgotCurrentPassword = () => {
    const confirm = window.confirm(
      '⚠️ PERHATIAN!\n\n' +
      'Jika Anda tidak ingat password lama, Anda akan diarahkan ke halaman Lupa Password.\n' +
      'Anda perlu memasukkan PIN Pemulihan 6 digit yang telah dibuat saat registrasi.\n\n' +
      'Lanjutkan?'
    );

    if (confirm) {
      // Bisa gunakan router.push('/auth/forgot-password') di komponen
      // Atau redirect langsung
      window.location.href = '/auth/forgot-password';
    }
  };

  return {
    // Form state
    formData,
    isSubmitting,
    error,
    successMessage,
    requireRelogin,

    // Password strength indicator
    passwordStrength,

    // Handlers
    handleChange,
    handleSubmit,
    resetForm,
    handleForgotCurrentPassword,
  };
}

export default useChangePassword;