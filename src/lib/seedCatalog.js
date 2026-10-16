// src/lib/seedCatalog.js
// ==========================================
// SUMBER DATA SEED (MASTER KATALOG AWAL)
// ==========================================
// File ini mengubah hasil scraping di src/seeds/data.json menjadi payload
// yang siap dimasukkan ke tabel `categories` & `products`.
//
// Aturan seed (sesuai kebutuhan bisnis):
// - base_price  : selalu 0 (produk di-seed TANPA HARGA)
// - hpp         : selalu 0 (diisi nanti lewat menu Hitung HPP)
// - type        : 'finished_good' (produk jadi)
// - unit        : diturunkan dari catatan penjualan (kg / pcs / box / pack)
// - image_url   : dari folder gambar di src/seeds/images
// - harga sumber (harga GoFood) hanya dipakai untuk preview, TIDAK di-seed.

import seedRaw from '@/seeds/data.json';

export const SEED_IMAGE_API_BASE = '/api/seed-images';
export const SEED_DEFAULT_UNIT = 'pack';
export const SEED_PRODUCT_TYPE = 'finished_good';

// Kunci pembanding nama agar tidak case/space sensitive
export const normalizeKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

// Ubah teks menjadi slug aman untuk nama file di Supabase Storage
export const slugify = (value) => {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug || 'produk';
};

// Deteksi satuan dari catatan (contoh: "500gr", "1kg", "isi 15pc")
export const deriveUnit = (note) => {
  const text = String(note || '').toLowerCase();
  if (!text) return SEED_DEFAULT_UNIT;

  if (/\d\s*(kg|kilo|kilogram)\b|\bkilogram\b/.test(text)) return 'kg';
  if (/\b\d+\s*(pc|pcs|porsi|lembar|buah|biji|bks)\b/.test(text)) return 'pcs';
  if (/\b(box|dus)\b/.test(text)) return 'box';

  return SEED_DEFAULT_UNIT;
};

// SKU mengikuti pola yang dipakai form produk: 3 huruf awal nama + nomor urut
export const buildSkuPrefix = (name) => {
  const prefix = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 3);
  return prefix.length > 0 ? prefix : 'SKU';
};

export const buildSku = (name, index) =>
  `${buildSkuPrefix(name)}-${String(index + 1).padStart(4, '0')}`;

// Pastikan SKU tidak bentrok (kolom `sku` bersifat unik di database)
export const ensureUniqueSku = (sku, usedSkus) => {
  const base = String(sku || 'SKU').toUpperCase();
  let candidate = base;
  let counter = 1;

  while (usedSkus.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  usedSkus.add(candidate);
  return candidate;
};

/**
 * Bangun katalog seed dari data.json.
 * Mengembalikan { categories, products, ...statistik }.
 */
export const buildSeedCatalog = () => {
  const items = Array.isArray(seedRaw?.items) ? seedRaw.items : [];

  const products = [];
  const usedNames = new Set();
  const usedSkus = new Set();
  let duplicatesRemoved = 0;
  let missingImage = 0;

  items.forEach((item) => {
    const name = String(item?.nama || '').trim();
    if (!name) return;

    const nameKey = normalizeKey(name);
    if (usedNames.has(nameKey)) {
      // data sumber punya beberapa nama kembar (produk sama tampil 2x)
      duplicatesRemoved += 1;
      return;
    }
    usedNames.add(nameKey);

    const imageFile = String(item?.gambar || '')
      .trim()
      .replace(/^images\//, '');
    if (!imageFile) missingImage += 1;

    products.push({
      name,
      sku: ensureUniqueSku(buildSku(name, products.length), usedSkus),
      type: SEED_PRODUCT_TYPE,
      unit: deriveUnit(item?.catatan),
      base_price: 0,
      hpp: 0,
      category_name: String(item?.kategori || '').trim() || 'Tanpa Kategori',
      image_file: imageFile,
      image_local_url: imageFile
        ? `${SEED_IMAGE_API_BASE}/${encodeURIComponent(imageFile)}`
        : null,
      note: String(item?.catatan || '').trim(),
      // Hanya untuk preview di UI, tidak pernah dikirim ke database
      source_price: Number(item?.harga) || 0,
    });
  });

  // Urutkan kategori sesuai kemunculan pertama pada data sumber
  const categoryNames = [];
  products.forEach((product) => {
    if (!categoryNames.includes(product.category_name)) {
      categoryNames.push(product.category_name);
    }
  });

  const categories = categoryNames.map((name) => ({
    name,
    slug: slugify(name),
    product_count: products.filter((p) => p.category_name === name).length,
  }));

  return {
    sourceUrl: seedRaw?.sourceUrl || '',
    scrapedAt: seedRaw?.scrapedAt || '',
    restaurant: seedRaw?.restaurant || null,
    categories,
    products,
    totalSourceItems: items.length,
    duplicatesRemoved,
    missingImage,
  };
};

export default buildSeedCatalog;
