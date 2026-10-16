// src/lib/receiptOutput.js
//
// Renderer output struk yang bisa diunduh / dibuka di luar aplikasi:
//   1. PDF  -> font Courier standar (tanpa library tambahan)
//   2. PNG  -> digambar manual di canvas (tanpa library tambahan)
//
// Keduanya memakai baris dari lib/receiptLayout.js supaya isi struk
// sama persis dengan yang tampil di preview dan yang dicetak.

import { getLogoMaxWidthDots, getPaperConfig, toPrintableLines } from './receiptLayout';

const MM_TO_PT = 72 / 25.4; // 1 mm = 2.8346 point
const COURIER_CHAR_RATIO = 0.6; // lebar karakter Courier = 0.6 x font-size

const formatNumber = (value) => String(Math.round(value * 100) / 100);

// ==========================================
// 1. PDF
// ==========================================

const escapePdfText = (value) =>
  String(value ?? '')
    .replace(/[^\x20-\xff]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

/**
 * Buat struk versi PDF (1 halaman panjang, ukuran sesuai kertas struk).
 * @returns {Blob} Blob bertipe application/pdf
 */
export function buildReceiptPdfBlob(layout, options = {}) {
  const margin = options.margin ?? 6; // satuan point
  const printable = toPrintableLines(layout);
  const paper = getPaperConfig(layout?.paperWidth);
  const chars = layout?.chars || paper.chars;
  const pageWidth = (layout?.paperWidth || paper.value) * MM_TO_PT;
  const usableWidth = Math.max(40, pageWidth - margin * 2);
  const fontSize = Math.min(9, usableWidth / (COURIER_CHAR_RATIO * chars));
  const lineHeight = fontSize * 1.35;
  const pageHeight = margin * 2 + printable.length * lineHeight;

  // Content stream: satu blok teks per baris supaya posisinya presisi.
  const contentParts = [];
  printable.forEach((line, index) => {
    const y = pageHeight - margin - fontSize - index * lineHeight;
    const font = line.bold ? '/F2' : '/F1';
    contentParts.push(
      `BT ${font} ${formatNumber(fontSize)} Tf 1 0 0 1 ${formatNumber(margin)} ${formatNumber(y)} Tm (${escapePdfText(line.text)}) Tj ET`,
    );
  });
  const stream = contentParts.join('\n');

  // Susun objek PDF + catat offset byte untuk tabel xref.
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  let objectCount = 0;

  const addObject = (body) => {
    objectCount += 1;
    offsets[objectCount] = pdf.length;
    pdf += `${objectCount} 0 obj\n${body}\nendobj\n`;
    return objectCount;
  };

  // Urutan objek (nomor dipakai pada referensi di bawah): 1..6
  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${formatNumber(pageWidth)} ${formatNumber(pageHeight)}] ` +
      '/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
  );
  addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>');

  const size = objectCount + 1; // objek 0 adalah entri bebas (free)
  const startXref = pdf.length;

  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objectCount; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += xref;
  pdf += `trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  // Semua karakter di atas masih 1 byte (Latin-1) sehingga length = jumlah byte.
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i += 1) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }

  return new Blob([bytes], { type: 'application/pdf' });
}

// ==========================================
// 2. PNG (preview gambar struk)
// ==========================================

const loadImageSafe = (url) =>
  new Promise((resolve) => {
    if (!url || typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const image = new Image();
    // Tanpa header CORS, gambar gagal dimuat -> logo dilewati saja.
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });

const canvasToBlob = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat gambar struk.'))),
      'image/png',
    );
  });

const drawReceiptCanvas = (layout, { scale, logo }) => {
  const printable = toPrintableLines(layout);
  const chars = layout?.chars || getPaperConfig(layout?.paperWidth).chars;
  const fontSize = 20 * scale;
  const cellWidth = fontSize * COURIER_CHAR_RATIO;
  const lineHeight = Math.round(fontSize * 1.35);
  const padding = Math.round(12 * scale);
  const width = Math.ceil(chars * cellWidth + padding * 2);

  const maxLogoWidth = Math.round(width * 0.6);
  const maxLogoHeight = Math.round(60 * scale);
  let logoWidth = 0;
  let logoHeight = 0;

  if (logo && logo.width && logo.height) {
    const ratio = Math.min(maxLogoWidth / logo.width, maxLogoHeight / logo.height, 1);
    logoWidth = Math.round(logo.width * ratio);
    logoHeight = Math.round(logo.height * ratio);
  }

  const gapAfterLogo = logoHeight ? Math.round(10 * scale) : 0;
  const height = padding * 2 + logoHeight + gapAfterLogo + printable.length * lineHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // kertas struk selalu putih
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  let y = padding;
  if (logoHeight) {
    ctx.drawImage(logo, (width - logoWidth) / 2, y, logoWidth, logoHeight);
    y += logoHeight + gapAfterLogo;
  }

  printable.forEach((line) => {
    ctx.font = `${line.bold ? 'bold ' : ''}${fontSize}px "Courier New", Courier, monospace`;
    ctx.fillText(line.text, padding, y);
    y += lineHeight;
  });

  return canvas;
};

/**
 * Render struk menjadi gambar PNG (kertas putih, ukuran sesuai kertas struk).
 * @returns {Promise<Blob>} Blob bertipe image/png
 */
export async function renderReceiptPngBlob(layout, options = {}) {
  const scale = options.scale ?? 3;
  const logo = await loadImageSafe(options.logoUrl);

  try {
    return await canvasToBlob(drawReceiptCanvas(layout, { scale, logo }));
  } catch (error) {
    // Logo dari domain lain bisa membuat canvas "tainted" -> ulangi tanpa logo.
    if (logo) {
      return canvasToBlob(drawReceiptCanvas(layout, { scale, logo: null }));
    }
    throw error;
  }
}

// ==========================================
// 3. LOGO HITAM-PUTIH UNTUK PRINTER THERMAL
// ==========================================
//
// Printer thermal mencetak 1 bit per dot (hitam/putih), jadi logo harus:
//   1. Diturunkan resolusinya ke lebar head printer (384 dot / 58 mm, 576 dot / 80 mm)
//   2. Diubah ke grayscale
//   3. Dibinerkan (dithering Floyd-Steinberg atau ambang batas)
//   4. Dipaketkan jadi bitmap 1 bit (1 byte = 8 dot, bit kiri = MSB)

export const LOGO_BW_MODES = {
  dither: 'dither', // foto / logo berwarna -> pakai sebaran error
  threshold: 'threshold', // logo garis / teks -> hitam-putih tegas
};

const DEFAULT_LOGO_THRESHOLD = 128;

// Transparan dianggap putih (kertas struk selalu putih).
const toLuminance = (red, green, blue, alpha) => {
  if (alpha === 0) return 255;
  const value = 0.299 * red + 0.587 * green + 0.114 * blue;
  return (value * alpha + 255 * (255 - alpha)) / 255;
};

// Binerkan + paketkan jadi bitmap 1 bit. `gray` dimodifikasi in-place oleh dither.
const packMonochrome = (pixels, widthDots, heightDots, { mode, threshold }) => {
  const bytesPerRow = widthDots / 8;
  const output = new Uint8Array(bytesPerRow * heightDots);
  const gray = new Float32Array(widthDots * heightDots);

  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4;
    gray[index] = toLuminance(pixels[offset], pixels[offset + 1], pixels[offset + 2], pixels[offset + 3]);
  }

  if (mode === LOGO_BW_MODES.dither) {
    // Floyd-Steinberg: error kuantisasi disebar ke tetangga supaya gradasi
    // logo tetap terbaca meski printer hanya punya 2 warna.
    for (let y = 0; y < heightDots; y += 1) {
      for (let x = 0; x < widthDots; x += 1) {
        const index = y * widthDots + x;
        const oldValue = gray[index];
        const newValue = oldValue < threshold ? 0 : 255;
        const error = oldValue - newValue;
        gray[index] = newValue;

        const spread = (dx, dy, factor) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= widthDots || ny >= heightDots) return;
          gray[ny * widthDots + nx] += error * factor;
        };

        spread(1, 0, 7 / 16);
        spread(-1, 1, 3 / 16);
        spread(0, 1, 5 / 16);
        spread(1, 1, 1 / 16);
      }
    }
  }

  for (let y = 0; y < heightDots; y += 1) {
    for (let x = 0; x < widthDots; x += 1) {
      if (gray[y * widthDots + x] >= threshold) continue; // putih -> bit 0
      output[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }

  return output;
};

/**
 * Ubah logo toko menjadi bitmap hitam-putih beresolusi rendah siap kirim
 * lewat perintah GS v 0 (lihat buildRasterImageCommand di lib/receiptLayout).
 *
 * @param {string} logoUrl URL logo (harus bisa dibaca browser; butuh header CORS)
 * @param {object} [options]
 * @param {number|string} [options.paperWidth] lebar kertas struk (58 / 80)
 * @param {number} [options.widthRatio] porsi lebar kertas yang dipakai logo (0-1)
 * @param {number} [options.maxHeightDots] tinggi maksimum bitmap (default 255)
 * @param {number} [options.threshold] ambang hitam-putih 0-255 (default 128)
 * @param {'dither'|'threshold'} [options.mode] cara binersisasi (default 'dither')
 * @returns {Promise<{widthDots:number,heightDots:number,data:Uint8Array}|null>} null kalau logo tidak bisa diproses
 */
export async function buildLogoRaster(logoUrl, options = {}) {
  if (!logoUrl || typeof document === 'undefined') return null;

  const maxWidthDots = getLogoMaxWidthDots(options.paperWidth, options.widthRatio);
  const maxHeightDots = Math.min(Number(options.maxHeightDots) || 255, 255);
  const threshold = Math.min(Math.max(Number(options.threshold) || DEFAULT_LOGO_THRESHOLD, 1), 254);
  const mode = options.mode === LOGO_BW_MODES.threshold ? LOGO_BW_MODES.threshold : LOGO_BW_MODES.dither;

  const image = await loadImageSafe(logoUrl);
  if (!image?.width || !image?.height) return null;

  // Turunkan resolusi: rasio dipilih agar muat lebar & tinggi maksimum.
  const ratio = Math.min(maxWidthDots / image.width, maxHeightDots / image.height);
  const drawWidth = Math.max(8, Math.min(image.width * ratio, maxWidthDots));
  const drawHeight = Math.max(1, Math.min(Math.round(image.height * ratio), maxHeightDots));
  // Lebar raster wajib kelipatan 8 dot supaya per baris pas jadi byte utuh.
  const widthDots = Math.min(maxWidthDots, Math.max(8, Math.ceil(drawWidth / 8) * 8));

  const canvas = document.createElement('canvas');
  canvas.width = widthDots;
  canvas.height = drawHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthDots, drawHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, (widthDots - drawWidth) / 2, 0, drawWidth, drawHeight);

  let imageData;
  try {
    imageData = ctx.getImageData(0, 0, widthDots, drawHeight);
  } catch {
    return null; // canvas "tainted" (logo tanpa header CORS) -> logo dilewati
  }

  return {
    widthDots,
    heightDots: drawHeight,
    data: packMonochrome(imageData.data, widthDots, drawHeight, { mode, threshold }),
  };
}

// ==========================================
// 4. HELPER UNDUHAN
// ==========================================

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildReceiptFileName(receiptData, extension) {
  const transactionId = String(receiptData?.transaction_id || 'STRUK').replace(/[^\w-]/g, '_');
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('') + '-' + [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0')].join('');
  return `Struk_${transactionId}_${stamp}.${extension}`;
}

