'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export function useForgotPassword() {
  const [step, setStep] = useState('pin');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [merchantData, setMerchantData] = useState(null);

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'gray' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label, color;
    if (score <= 2) { label = 'Lemah'; color = 'red'; }
    else if (score <= 4) { label = 'Sedang'; color = 'yellow'; }
    else { label = 'Kuat'; color = 'green'; }

    return { score, label, color };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
    setError(null);
  };

  // ==========================================
  // VERIFY PIN - DENGAN ALERT USER-FRIENDLY
  // ==========================================
  const handleVerifyPin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (pin.length !== 6) {
        throw new Error('PIN harus 6 digit angka');
      }

      const { data: merchant, error: fetchError } = await supabase
        .from('merchants')
        .select('id, recovery_pin_hash, pin_attempts, pin_locked_until')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw new Error('Gagal mengambil data: ' + fetchError.message);
      if (!merchant) throw new Error('Data merchant tidak ditemukan');

      if (!merchant.recovery_pin_hash) {
        throw new Error('PIN pemulihan belum diatur. Silakan hubungi CS untuk bantuan.');
      }

      // Cek lock
      if (merchant.pin_locked_until) {
        const lockTime = new Date(merchant.pin_locked_until);
        const now = new Date();
        
        if (lockTime > now) {
          const remainingMinutes = Math.ceil((lockTime - now) / 60000);
          const lockMessage = `PIN terkunci karena terlalu banyak percobaan gagal.\n\nCoba lagi dalam ${remainingMinutes} menit atau hubungi CS via WhatsApp.`;
          
          // Tampilkan ALERT POPUP untuk user
          alert('🔒 ' + lockMessage);
          throw new Error(lockMessage);
        } else {
          await supabase
            .from('merchants')
            .update({ pin_attempts: 0, pin_locked_until: null })
            .eq('id', merchant.id);
        }
      }

      // Verifikasi PIN
      const isPinValid = await bcrypt.compare(pin, merchant.recovery_pin_hash);

      if (!isPinValid) {
        const currentAttempts = merchant.pin_attempts || 0;
        const newAttempts = currentAttempts + 1;

        if (newAttempts >= 3) {
          const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          
          await supabase
            .from('merchants')
            .update({ 
              pin_attempts: newAttempts, 
              pin_locked_until: lockUntil.toISOString() 
            })
            .eq('id', merchant.id);

          const lockMessage = 
            `PIN yang Anda masukkan salah!\n\n` +
            `Anda telah mencoba 3 kali.\n` +
            `Akun dikunci selama 15 menit untuk keamanan.\n\n` +
            `Silakan hubungi CS via WhatsApp untuk bantuan.`;
          
          // Tampilkan ALERT POPUP
          alert('❌ ' + lockMessage);
          throw new Error(lockMessage);
        }

        await supabase
          .from('merchants')
          .update({ pin_attempts: newAttempts })
          .eq('id', merchant.id);

        const remainingAttempts = 3 - newAttempts;
        const errorMessage = `PIN yang Anda masukkan salah.\n\nSisa percobaan: ${remainingAttempts} kali.`;
        
        // Tampilkan ALERT POPUP untuk error PIN salah
        alert('⚠️ ' + errorMessage);
        throw new Error(errorMessage);
      }

      // PIN BENAR!
      await supabase
        .from('merchants')
        .update({ pin_attempts: 0, pin_locked_until: null })
        .eq('id', merchant.id);

      setMerchantData(merchant);
      setStep('newPassword');
      setPin('');
      
      // Feedback sukses
      alert('✅ PIN berhasil diverifikasi!\n\nSilakan buat password baru Anda.');

    } catch (err) {
      // Gunakan console.warn (bukan console.error) agar tidak muncul merah di console
      console.warn('Verify PIN warning:', err.message);
      setError(err.message || 'Terjadi kesalahan saat memverifikasi PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    if (name === 'newPassword') setNewPassword(value);
    else if (name === 'confirmPassword') setConfirmPassword(value);
    setError(null);
  };

  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!newPassword) throw new Error('Password baru wajib diisi');
      if (newPassword.length < 6) throw new Error('Password minimal 6 karakter');
      if (newPassword !== confirmPassword) throw new Error('Konfirmasi password tidak cocok');

      const simplePasswords = ['password', '123456', 'qwerty', 'admin123'];
      if (simplePasswords.includes(newPassword.toLowerCase())) {
        throw new Error('Password terlalu mudah ditebak. Gunakan kombinasi yang lebih kuat.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw new Error('Gagal update password: ' + updateError.message);

      setStep('success');

    } catch (err) {
      console.warn('Update password warning:', err.message);
      // Tampilkan alert untuk error update password
      alert('❌ ' + (err.message || 'Terjadi kesalahan saat mengubah password'));
      setError(err.message || 'Terjadi kesalahan saat mengubah password');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('pin');
    setPin('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setMerchantData(null);
  };

  const goBackToPin = () => {
    setStep('pin');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  return {
    step,
    pin,
    newPassword,
    confirmPassword,
    error,
    isLoading,
    passwordStrength,
    handlePinChange,
    handleVerifyPin,
    handlePasswordChange,
    handleUpdatePassword,
    resetForm,
    goBackToPin,
  };
}

export default useForgotPassword;