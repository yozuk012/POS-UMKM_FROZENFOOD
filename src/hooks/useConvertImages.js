// src/hooks/useConvert.js
'use client';

/**
 * Hook untuk konversi gambar ke format WebP
 * Menggunakan Canvas API browser (tidak perlu library tambahan)
 */
export function useConvert() {
  
  /**
   * Konversi gambar ke WebP
   * @param {File} file - File gambar asli (jpg, jpeg, png)
   * @param {number} quality - Kualitas kompresi (0.1 - 1.0, default 0.8)
   * @returns {Promise<{success: boolean, file?: File, error?: string}>}
   */
  const convertToWebP = async (file, quality = 0.8) => {
    // Validasi format file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Format file tidak didukung. Hanya JPG, JPEG, dan PNG yang diizinkan.'
      };
    }

    // Validasi ukuran file (max 5MB sebelum konversi)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'Ukuran file terlalu besar. Maksimal 5MB.'
      };
    }

    try {
      // 1. Baca file sebagai Data URL
      const dataUrl = await readFileAsDataURL(file);

      // 2. Muat gambar ke Image object
      const img = await loadImage(dataUrl);

      // 3. Buat canvas dengan dimensi yang sama
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      // 4. Gambar gambar ke canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // 5. Konversi canvas ke Blob WebP
      const webpBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Gagal mengkonversi gambar ke WebP'));
            }
          },
          'image/webp',
          quality
        );
      });

      // 6. Buat File object baru dari Blob
      const webpFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
      const webpFile = new File([webpBlob], webpFileName, {
        type: 'image/webp',
        lastModified: Date.now(),
      });

      // 7. Log informasi (opsional, untuk debugging)
      console.log(`✅ Konversi berhasil:`);
      console.log(`   Asli: ${(file.size / 1024).toFixed(2)} KB (${file.type})`);
      console.log(`   WebP: ${(webpFile.size / 1024).toFixed(2)} KB (image/webp)`);
      console.log(`   Penghematan: ${((1 - webpFile.size / file.size) * 100).toFixed(1)}%`);

      return {
        success: true,
        file: webpFile,
      };

    } catch (err) {
      console.error('Error converting to WebP:', err);
      return {
        success: false,
        error: err.message || 'Terjadi kesalahan saat mengkonversi gambar.',
      };
    }
  };

  /**
   * Helper: Baca file sebagai Data URL
   */
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  };

  /**
   * Helper: Muat gambar dari Data URL
   */
  const loadImage = (dataUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.src = dataUrl;
    });
  };

  return {
    convertToWebP,
  };
}

export default useConvert;