'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useChangePassword() {
  const { user } = useAuth();

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

  // ==========================================
  // 2. FORM HANDLERS
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
  // 3. VALIDASI
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
    return null;
  };

  // ==========================================
  // 4. SUBMIT (CHANGE PASSWORD)
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
        throw new Error('Password saat ini salah. Silakan coba lagi.');
      }

      // Step 2: Update password baru
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        throw new Error('Gagal mengubah password: ' + updateError.message);
      }

      // Step 3: Sukses
      setSuccessMessage('Password berhasil diubah! Silakan gunakan password baru untuk login berikutnya.');
      resetForm();

    } catch (err) {
      console.error('Change password error:', err);
      setError(err.message || 'Terjadi kesalahan saat mengubah password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    error,
    successMessage,
    handleChange,
    handleSubmit,
    resetForm,
  };
}

export default useChangePassword;