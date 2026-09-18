// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Ambil variabel environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validasi - pastikan variabel environment ada
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local file.');
}

// Buat Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Simpan session di localStorage
    autoRefreshToken: true, // Auto refresh token
  },
});

// ==========================================
// FUNGSI UPLOAD KE SUPABASE STORAGE
// ==========================================
export const uploadFile = async (file, folder, fileName) => {
  try {
    // Ambil ekstensi file (contoh: 'jpg', 'png')
    const fileExt = file.name.split('.').pop();
    // Buat path file: contoh 'logo-toko/logo-1690000000000.jpg'
    const filePath = `${folder}/${fileName}.${fileExt}`;

    // Upload file ke bucket 'UMKM-POS'
    const { data, error } = await supabase.storage
      .from('UMKM-POS')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Timpa file jika nama sama (opsional, tapi aman dengan timestamp)
      });

    if (error) throw error;

    // Dapatkan URL publik agar bisa langsung ditampilkan di <img>
    const { data: urlData } = supabase.storage
      .from('UMKM-POS')
      .getPublicUrl(filePath);

    return { 
      success: true, 
      url: urlData.publicUrl, 
      path: data.path 
    };
  } catch (err) {
    console.error('❌ [Supabase Storage] Upload error:', err.message);
    return { success: false, error: err.message };
  }
};

// ==========================================
// FUNGSI TEST KONEKSI DATABASE
// ==========================================
export const testConnection = async () => {
  try {
    // Coba query sederhana ke tabel merchants
    const { data, error } = await supabase
      .from('merchants')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ [Supabase] Connection test failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ [Supabase] Connection successful!');
    return { success: true, data };
  } catch (err) {
    console.error('❌ [Supabase] Connection test error:', err.message);
    return { success: false, error: err.message };
  }
};

export default supabase;