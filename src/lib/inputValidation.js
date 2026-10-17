// src/lib/inputValidation.js
//
// Validasi teks bebas agar user tidak bisa menyimpan perintah SQL atau script
// (HTML/JavaScript) ke database. Dipakai di halaman Pengeluaran Operasional
// dan bisa dipakai ulang untuk form teks bebas lainnya.
//
// Catatan: Supabase sudah memakai query parameterized, jadi ini bukan satu-satunya
// lapisan keamanan. Validasi ini menjaga data tetap bersih dan mencegah input
// yang tidak masuk akal (mis. "<script>alert(1)</script>" atau "DROP TABLE").

export const MAX_TEXT_LENGTH = 255;

const FORBIDDEN_INPUT_RULES = [
  // ---------- Script / HTML ----------
  {
    label: 'tag HTML/script',
    pattern: /<\s*\/?\s*[a-zA-Z][^>]*>/,
  },
  {
    label: 'protokol javascript',
    pattern: /(?:javascript|vbscript)\s*:/i,
  },
  {
    label: 'event handler inline',
    pattern: /\bon(?:click|dblclick|error|load|unload|mouseover|mouseout|mouseenter|mouseleave|mousemove|mousedown|mouseup|focus|blur|submit|change|input|keydown|keyup|keypress|touchstart|touchend|touchmove|contextmenu|wheel|scroll|drag|dragstart|dragend|drop|paste|copy|cut|animationstart|animationend|transitionend)\s*=/i,
  },
  {
    label: 'fungsi script',
    pattern: /\b(?:eval|alert|prompt|confirm|setTimeout|setInterval|fetch)\s*\(/i,
  },
  {
    label: 'akses DOM',
    pattern: /\b(?:document|window|localStorage|sessionStorage)\s*\./i,
  },

  // ---------- SQL ----------
  {
    label: 'perintah SQL',
    pattern: /\b(?:select\b[\s\S]{0,120}\bfrom\b|insert\s+(?:into|ignore)\b|update\s+\S+\s+set\b|delete\s+from\b|drop\s+(?:table|database|schema|index|view)\b|truncate\s+table\b|alter\s+table\b|create\s+(?:table|database|schema|index|view|user)\b|grant\s+\w+|revoke\s+\w+|exec(?:ute)?\s+\w+)/i,
  },
  {
    label: 'UNION SQL',
    pattern: /\bunion\b[\s\S]{0,40}\bselect\b/i,
  },
  {
    label: 'komentar SQL',
    pattern: /--(?=\s|$)|\/\*|\*\//,
  },
  {
    label: 'kondisi SQL selalu benar',
    pattern: /\b(?:or|and)\b\s+(?:['"][^'"]*['"]|\d+)\s*=\s*(?:['"][^'"]*['"]|\d+)/i,
  },
  {
    label: 'fungsi SQL berbahaya',
    pattern: /\b(?:xp_cmdshell|information_schema|pg_catalog|benchmark\s*\(|sleep\s*\(|load_file\s*\()/i,
  },
];

/**
 * Cari pola terlarang pada teks.
 * @param {string} value
 * @returns {string|null} Label aturan yang terdeteksi, atau null jika aman.
 */
export const findForbiddenInput = (value) => {
  if (typeof value !== 'string' || value.trim() === '') return null;

  // Normalisasi unicode & buang zero-width char agar tidak bisa dipakai untuk bypass.
  const normalized = value
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');

  const rule = FORBIDDEN_INPUT_RULES.find(({ pattern }) => pattern.test(normalized));
  return rule ? rule.label : null;
};

/**
 * Validasi teks bebas (kategori, keterangan, catatan, dll).
 * @param {string} value
 * @param {{ label?: string, maxLength?: number }} options
 * @returns {{ isValid: boolean, message: string, value: string }}
 */
export const validateSafeText = (value, { label = 'Input', maxLength = MAX_TEXT_LENGTH } = {}) => {
  const text = typeof value === 'string' ? value.normalize('NFKC').trim() : '';

  if (text.length > maxLength) {
    return {
      isValid: false,
      message: `${label} maksimal ${maxLength} karakter.`,
      value: text,
    };
  }

  const forbidden = findForbiddenInput(text);
  if (forbidden) {
    return {
      isValid: false,
      message: `${label} tidak boleh berisi perintah SQL atau script (terdeteksi: ${forbidden}).`,
      value: text,
    };
  }

  return { isValid: true, message: '', value: text };
};

/**
 * Bersihkan teks sebelum disimpan: normalisasi unicode, buang karakter kontrol
 * & zero-width, rapikan spasi, lalu potong sesuai batas maksimum.
 * @param {string} value
 * @param {number} maxLength
 * @returns {string}
 */
export const sanitizeText = (value, maxLength = MAX_TEXT_LENGTH) => {
  if (typeof value !== 'string') return '';

  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
};
