// src/lib/receiptLayout.js
//
// Penyusun tata letak struk (murni, tanpa DOM).
// File ini adalah SATU SUMBER KEBENARAN untuk 4 output struk:
//   1. Preview di layar          -> ReceiptModal
//   2. Cetak via dialog browser  -> ReceiptModal (react-to-print)
//   3. Cetak Bluetooth / ESC-POS -> useBluetoothPrinter
//   4. Unduhan PNG & PDF         -> lib/receiptOutput
//
// Semua output memakai grid karakter monospace yang sama
// (32 karakter untuk kertas 58 mm, 48 karakter untuk kertas 80 mm)
// supaya tampilan preview = hasil cetak = hasil unduhan.

import { formatRupiah } from './productUtils';

export const RECEIPT_PAPER_SIZES = {
  58: { value: 58, label: '58 mm', chars: 32, dots: 384 },
  80: { value: 80, label: '80 mm', chars: 48, dots: 576 },
};

export const DEFAULT_PAPER_WIDTH = 58;

export const getPaperConfig = (paperWidth) =>
  RECEIPT_PAPER_SIZES[paperWidth] || RECEIPT_PAPER_SIZES[DEFAULT_PAPER_WIDTH];

// ==========================================
// HELPER TEKS (semua fungsi di bawah murni string)
// ==========================================

// Buang karakter kontrol yang bisa merusak layout struk.
const sanitizeText = (value) =>
  String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const padRight = (text, width) => text + ' '.repeat(Math.max(0, width - text.length));

export const padLeft = (text, width) => ' '.repeat(Math.max(0, width - text.length)) + text;

export const padCenter = (text, width) => {
  if (text.length >= width) return text;
  const space = width - text.length;
  const left = Math.floor(space / 2);
  return ' '.repeat(left) + text + ' '.repeat(space - left);
};

// Bungkus teks panjang agar tidak melebihi lebar struk.
export const wrapText = (text, width) => {
  const clean = sanitizeText(text);
  if (!clean) return [''];
  if (width <= 0) return [clean];

  const words = clean.split(' ');
  const lines = [];
  let current = '';

  words.forEach((word) => {
    let chunk = word;

    // Kata yang lebih panjang dari lebar struk dipotong paksa.
    while (chunk.length > width) {
      if (current) {
        lines.push(current);
        current = '';
      }
      lines.push(chunk.slice(0, width));
      chunk = chunk.slice(width);
    }

    if (!current) {
      current = chunk;
    } else if (current.length + 1 + chunk.length <= width) {
      current = `${current} ${chunk}`;
    } else {
      lines.push(current);
      current = chunk;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : [''];
};

// ==========================================
// PENYUSUN TATA LETAK
// ==========================================

/**
 * Susun struk menjadi daftar baris logis.
 * Jenis baris: 'text' (align/bold), 'row' (kiri-kanan), 'hr' (garis putus), 'space'.
 */
export function buildReceiptLayout(receiptData, options = {}) {
  const paper = getPaperConfig(options.paperWidth);
  const width = paper.chars;
  const data = receiptData || {};
  const store = data.store || {};
  const items = Array.isArray(data.items) ? data.items : [];
  const paymentMethod = sanitizeText(data.payment_method).toLowerCase();
  const lines = [];

  const pushText = (text, { align = 'left', bold = false } = {}) => {
    wrapText(text, width).forEach((chunk) => lines.push({ kind: 'text', text: chunk, align, bold }));
  };

  const pushRow = (left, right, { bold = false } = {}) => {
    lines.push({
      kind: 'row',
      left: sanitizeText(left),
      right: sanitizeText(right),
      bold,
    });
  };

  // 1. HEADER TOKO
  pushText(store.name || 'NAMA TOKO', { align: 'center', bold: true });
  if (store.address) pushText(store.address, { align: 'center' });
  if (store.phone) pushText(`Telp: ${store.phone}`, { align: 'center' });
  lines.push({ kind: 'hr' });

  // 2. INFO TRANSAKSI
  pushRow('No. Transaksi', data.transaction_id || '-');
  pushRow('Tanggal', data.date || '-');
  pushRow('Kasir', data.cashier_name || 'Admin');
  pushRow('Pelanggan', data.customer_name || '-');
  pushRow('Pembayaran', paymentMethod ? paymentMethod.toUpperCase() : '-');
  lines.push({ kind: 'hr' });

  // 3. RINCIAN ITEM
  if (items.length === 0) {
    pushText('(Tidak ada item)', { align: 'center' });
  } else {
    items.forEach((item) => {
      const qty = Number(item.qty) || 0;
      pushText(item.name || '-');
      pushRow(`${qty} x ${formatRupiah(item.unit_price)}`, formatRupiah(item.line_total));
    });
  }
  lines.push({ kind: 'hr' });

  // 4. TOTAL
  const discount = Number(data.discount) || 0;
  pushRow('Subtotal', formatRupiah(data.subtotal));
  if (discount > 0) pushRow('Diskon', `-${formatRupiah(discount)}`);
  pushRow('TOTAL', formatRupiah(data.grand_total), { bold: true });
  pushRow('Dibayar', formatRupiah(data.amount_paid));
  pushRow('Kembalian', formatRupiah(data.change));

  // 5. INFO TRANSFER (hanya kalau metode pembayaran transfer)
  if (paymentMethod === 'transfer' && store.bank_name) {
    lines.push({ kind: 'hr' });
    pushText('Silakan transfer ke:', { align: 'center' });
    pushText(`${store.bank_name} ${store.account_number || ''}`, { align: 'center', bold: true });
    if (store.account_name) pushText(`a/n ${store.account_name}`, { align: 'center' });
  }

  // 6. FOOTER
  lines.push({ kind: 'hr' });
  pushText(options.footerNote || 'Terima kasih telah berbelanja', { align: 'center' });
  pushText('Barang yang sudah dibeli tidak dapat ditukar', { align: 'center' });
  lines.push({ kind: 'space' });

  return {
    paperWidth: paper.value,
    chars: width,
    dots: paper.dots,
    lines,
  };
}

// ==========================================
// BARIS SIAP CETAK (dipakai semua renderer)
// ==========================================

const makeLine = (text, align, bold, width) => {
  const safeText = text.length > width ? text.slice(0, width) : text;
  return {
    text: safeText,
    raw: safeText.trim(),
    align,
    bold: Boolean(bold),
  };
};

/**
 * Ubah baris logis menjadi baris monospace yang sudah di-pad
 * sehingga semua renderer bisa mencetak rata kiri apa adanya.
 */
export function toPrintableLines(layout) {
  const width = layout?.chars || getPaperConfig(layout?.paperWidth).chars;
  const logicalLines = layout?.lines || [];
  const result = [];

  logicalLines.forEach((line) => {
    if (line.kind === 'hr') {
      result.push(makeLine('-'.repeat(width), 'left', false, width));
      return;
    }

    if (line.kind === 'space') {
      result.push(makeLine('', 'left', false, width));
      return;
    }

    if (line.kind === 'row') {
      const { left = '', right = '', bold = false } = line;

      if (!right) {
        result.push(makeLine(padRight(left, width), 'left', bold, width));
        return;
      }

      // Nilai terlalu panjang -> tampilkan label, lalu nilai dibungkus ke bawah.
      if (right.length + 1 > width) {
        result.push(makeLine(padRight(left, width), 'left', bold, width));
        wrapText(right, width).forEach((chunk) => {
          result.push(makeLine(padRight(chunk, width), 'left', bold, width));
        });
        return;
      }

      if (left.length + 1 + right.length <= width) {
        result.push(makeLine(padRight(left, width - right.length) + right, 'left', bold, width));
        return;
      }

      // Tidak muat satu baris -> label di atas, nilai rata kanan di bawahnya.
      result.push(makeLine(padRight(left, width), 'left', bold, width));
      result.push(makeLine(padLeft(right, width), 'right', bold, width));
      return;
    }

    const text = line.text || '';
    const align = line.align || 'left';
    const padded =
      align === 'center'
        ? padCenter(text, width)
        : align === 'right'
          ? padLeft(text, width)
          : padRight(text, width);

    result.push(makeLine(padded, align, line.bold, width));
  });

  return result;
}

/** Struk versi teks biasa (untuk tombol "Salin Teks" / aplikasi RawBT). */
export function layoutToPlainText(layout) {
  return toPrintableLines(layout)
    .map((line) => line.text.replace(/\s+$/, ''))
    .join('\n');
}


// ==========================================
// ESC/POS (printer thermal Bluetooth)
// ==========================================

const ESC = 0x1b;
const GS = 0x1d;

const concatBytes = (chunks) => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
};

// Printer ESC/POS (code page PC437) hanya aman untuk karakter ASCII.
const toEscPosText = (value) => String(value ?? '').replace(/[^\x20-\x7e]/g, '?');

// ==========================================
// LOGO MONOKROM (raster bit image GS v 0)
// ==========================================
//
// Printer thermal hanya punya 1 bit per dot (hitam atau putih), jadi logo
// dikirim sebagai bitmap hitam-putih dengan resolusi diturunkan ke lebar
// head printer (384 dot untuk 58 mm, 576 dot untuk 80 mm).

export const RECEIPT_LOGO_SIZES = {
  kecil: { label: 'Kecil', ratio: 0.4 },
  sedang: { label: 'Sedang', ratio: 0.6 },
  besar: { label: 'Besar', ratio: 0.8 },
};

export const DEFAULT_LOGO_SIZE = 'sedang';

// Batas tinggi aman: satu perintah raster yang terlalu tinggi sering membuat
// buffer printer murah tersendat.
export const MAX_LOGO_HEIGHT_DOTS = 255;

export const getLogoSizeConfig = (size) => RECEIPT_LOGO_SIZES[size] || RECEIPT_LOGO_SIZES[DEFAULT_LOGO_SIZE];

/**
 * Lebar maksimum logo (dalam dot) untuk lebar kertas tertentu.
 * Dibulatkan ke bawah ke kelipatan 8 karena GS v 0 menghitung lebar per byte.
 */
export function getLogoMaxWidthDots(paperWidth, widthRatio = getLogoSizeConfig().ratio) {
  const { dots } = getPaperConfig(paperWidth);
  const ratio = Number(widthRatio) > 0 ? Number(widthRatio) : getLogoSizeConfig().ratio;
  return Math.max(8, Math.floor((dots * ratio) / 8) * 8);
}

/**
 * Susun perintah raster bit image (GS v 0) dari bitmap 1 bit.
 * `raster.data` menyimpan bit per baris: bit paling kiri = MSB, nilai 1 = hitam.
 * @returns {Uint8Array|null} null kalau bitmap tidak valid (logo dilewati saja)
 */
export function buildRasterImageCommand(raster) {
  const widthDots = Math.floor((Number(raster?.widthDots) || 0) / 8) * 8;
  const heightDots = Math.min(Number(raster?.heightDots) || 0, MAX_LOGO_HEIGHT_DOTS);
  const data = raster?.data;

  if (widthDots < 8 || heightDots < 1 || !data) return null;

  const bytesPerRow = widthDots / 8;
  const total = bytesPerRow * heightDots;
  if (data.length < total) return null;

  return concatBytes([
    Uint8Array.from([
      GS,
      0x76,
      0x30,
      0x00, // GS v 0 0 -> raster bit image, mode normal
      bytesPerRow & 0xff,
      (bytesPerRow >> 8) & 0xff, // xL xH -> lebar gambar (byte)
      heightDots & 0xff,
      (heightDots >> 8) & 0xff, // yL yH -> tinggi gambar (dot)
    ]),
    data.slice(0, total),
  ]);
}

/**
 * Susun perintah ESC/POS siap kirim ke printer thermal.
 * @param {object} [options]
 * @param {boolean} [options.cut]      potong kertas setelah cetak
 * @param {number}  [options.feedLines] jumlah baris kosong sebelum potong
 * @param {object}  [options.logo]     bitmap monokrom dari lib/receiptOutput.buildLogoRaster()
 * @returns {Uint8Array}
 */
export function buildReceiptEscPos(layout, options = {}) {
  const { cut = true, feedLines = 3, logo = null } = options;
  const chunks = [];
  const pushBytes = (...values) => chunks.push(Uint8Array.from(values));
  const pushText = (text) => chunks.push(new TextEncoder().encode(text));

  pushBytes(ESC, 0x40); // ESC @   -> reset printer
  pushBytes(ESC, 0x74, 0x00); // ESC t 0 -> code page PC437
  pushBytes(ESC, 0x61, 0x00); // ESC a 0 -> rata kiri

  // Logo dicetak paling atas (di atas nama toko), rata tengah.
  const logoCommand = buildRasterImageCommand(logo);
  if (logoCommand) {
    pushBytes(ESC, 0x61, 0x01); // ESC a 1 -> rata tengah
    chunks.push(logoCommand);
    pushBytes(ESC, 0x61, 0x00); // ESC a 0 -> kembali rata kiri
    pushText('\n'); // jarak satu baris setelah logo
  }

  let boldActive = false;
  toPrintableLines(layout).forEach((line) => {
    if (line.bold !== boldActive) {
      boldActive = line.bold;
      pushBytes(ESC, 0x45, boldActive ? 0x01 : 0x00); // ESC E n -> bold on/off
    }
    pushText(`${toEscPosText(line.text)}\n`);
  });

  pushBytes(ESC, 0x45, 0x00); // matikan bold
  pushBytes(ESC, 0x64, Math.max(0, Math.min(feedLines, 255))); // ESC d n -> feed kertas
  if (cut) pushBytes(GS, 0x56, 0x42, 0x00); // GS V 66 0 -> potong kertas (kalau ada cutter)

  return concatBytes(chunks);
}

