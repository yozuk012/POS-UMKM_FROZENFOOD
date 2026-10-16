import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // Sesuaikan path jika perlu
import * as XLSX from 'xlsx';

// ==========================================
// KONSTANTA: Label ramah UMKM (bukan nama kolom database)
// ==========================================
const SCOPE_LABELS = {
  sales_report: 'Laporan Penjualan',
  master_data: 'Master Data',
  inventory: 'Stok Master Data',
  expenses: 'Biaya Operasional',
  full_backup: 'Full',
};

const SCOPE_BACKUP_TYPES = {
  sales_report: 'EXPORT_SALES',
  master_data: 'EXPORT_MASTER',
  inventory: 'EXPORT_INVENTORY',
  expenses: 'EXPORT_EXPENSES',
  full_backup: 'EXPORT_FULL',
};

const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const CHANNEL_LABELS = {
  offline: 'Toko (Offline)',
  online: 'Online',
  shopee: 'Shopee',
  tokopedia: 'Tokopedia',
  grabmart: 'GrabMart',
  gofood: 'GoFood',
  tiktok: 'TikTok Shop',
};

const PAYMENT_LABELS = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer Bank',
  bank_transfer: 'Transfer Bank',
  debit: 'Kartu Debit',
  credit: 'Kartu Kredit',
  ewallet: 'Dompet Digital',
};

const RUPIAH_FORMAT = '#,##0';
const QTY_FORMAT = '#,##0.###';

const pad2 = (value) => String(value).padStart(2, '0');

// ==========================================
// HELPER: Format tanggal & waktu Indonesia
// ==========================================
// Ubah nilai apa pun menjadi Date yang valid (aman untuk kolom `date` & `timestamptz`)
const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    // Kolom bertipe `date` (YYYY-MM-DD) diparse sebagai tanggal lokal agar tidak bergeser
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// 14/10/2026
const formatTanggal = (value) => {
  const date = parseDateValue(value);
  if (!date) return '-';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

// 14/10/2026 14:30
const formatTanggalWaktu = (value) => {
  const date = parseDateValue(value);
  if (!date) return '-';
  return `${formatTanggal(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

// 14 Oktober 2026
const formatTanggalPanjang = (value) => {
  const date = parseDateValue(value);
  if (!date) return '-';
  return `${date.getDate()} ${BULAN_INDONESIA[date.getMonth()]} ${date.getFullYear()}`;
};

// 14:30
const formatJam = (value) => {
  const date = parseDateValue(value);
  if (!date) return '-';
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

// ==========================================
// HELPER: Terjemahan nilai teknis dari database
// ==========================================
const formatChannel = (value) => {
  if (!value) return '-';
  return CHANNEL_LABELS[String(value).toLowerCase()] || value;
};

const formatPayment = (value) => {
  if (!value) return '-';
  return PAYMENT_LABELS[String(value).toLowerCase()] || value;
};

const formatYaTidak = (value) => (value ? 'Ya' : 'Tidak');

// ==========================================
// HELPER: Judul file backup, contoh "Frozen Abercio Food Backups Full"
// ==========================================
const sanitizeFileName = (value) =>
  String(value || 'Toko')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

const buildBackupFileName = (storeName, typeLabel) =>
  `${sanitizeFileName(storeName)} Backups ${typeLabel}`;

// ==========================================
// HELPER SHEET EXCEL: agar laporan rapi & mudah dibaca
// ==========================================
const setColumnWidths = (ws, widths) => {
  if (!ws || !widths) return ws;
  ws['!cols'] = widths.map((width) => ({ wch: width }));
  return ws;
};

// Terapkan format angka pada kolom tertentu (opsional dibatasi rentang baris)
const applyNumberFormats = (ws, formatsByColumnIndex, rowRange = null) => {
  if (!ws || !ws['!ref'] || !formatsByColumnIndex) return ws;
  const range = XLSX.utils.decode_range(ws['!ref']);
  const startRow = rowRange && rowRange.startRow != null ? rowRange.startRow : range.s.r;
  const endRow = rowRange && rowRange.endRow != null ? rowRange.endRow : range.e.r;

  Object.entries(formatsByColumnIndex).forEach(([columnIndex, format]) => {
    const col = Number(columnIndex);
    for (let row = startRow; row <= endRow; row++) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell && cell.t === 'n') cell.z = format;
    }
  });
  return ws;
};

// Aktifkan filter otomatis tepat pada baris judul kolom
const enableAutoFilter = (ws, headerRowIndex = 0) => {
  if (!ws || !ws['!ref']) return ws;
  const range = XLSX.utils.decode_range(ws['!ref']);
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRowIndex, c: 0 },
      e: { r: range.e.r, c: range.e.c },
    }),
  };
  return ws;
};

// Sheet tabel siap pakai: judul kolom di baris pertama + lebar kolom + format angka
const createTableSheet = (headers, rows, options = {}) => {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  setColumnWidths(ws, options.widths);
  applyNumberFormats(ws, options.numberFormats);
  if (options.autoFilter !== false) enableAutoFilter(ws, 0);
  return ws;
};

// Sheet "Ringkasan": informasi toko + jumlah data pada file backup
const createSummarySheet = ({ storeName, storeId, userName, typeLabel, dateFrom, dateTo, counts }) => {
  const now = new Date();
  const periode = (dateFrom || dateTo)
    ? `${dateFrom ? formatTanggalPanjang(dateFrom) : 'Awal'} s/d ${dateTo ? formatTanggalPanjang(dateTo) : 'Sekarang'}`
    : 'Seluruh periode data';

  const aoa = [
    ['INFORMASI BACKUP DATA'],
    ['Nama Toko', storeName || 'Tidak Diketahui'],
    ['ID Toko', storeId ?? '-'],
    ['Jenis Backup', typeLabel],
    ['Periode Data', periode],
    ['Tanggal Ekspor', `${formatTanggalPanjang(now)} pukul ${formatJam(now)} WIB`],
    ['Dibuat Oleh', userName || 'Sistem'],
    [''],
    ['RINGKASAN JUMLAH DATA'],
    ['Jenis Data', 'Jumlah'],
    ...(counts || []).map((item) => [item.label, item.count]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 30 }, { wch: 44 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
  ];
  return ws;
};

// ==========================================
// HELPER: Susunan kolom & baris data tiap laporan
// (judul kolom memakai istilah yang mudah dipahami UMKM)
// ==========================================
const PRODUCT_HEADERS = [
  'SKU', 'Nama Produk', 'Kategori', 'Satuan', 'HPP (Rp)', 'Harga Jual (Rp)',
  'Diskon (%)', 'Jual Online?', 'Harga Online (Rp)', 'Stok Saat Ini', 'Status Aktif',
];
const PRODUCT_WIDTHS = [16, 32, 20, 10, 14, 16, 11, 12, 16, 13, 12];
const PRODUCT_NUMBER_FORMATS = { 4: RUPIAH_FORMAT, 5: RUPIAH_FORMAT, 6: QTY_FORMAT, 8: RUPIAH_FORMAT, 9: QTY_FORMAT };

const MATERIAL_HEADERS = [
  'Nama Bahan / Kemasan', 'Satuan', 'Harga per Satuan (Rp)', 'Satuan Pembelian',
  'Jumlah Pembelian', 'Harga Beli (Rp)', 'Mudah Basi?', 'Masa Simpan (Hari)', 'Stok Saat Ini',
];
const MATERIAL_WIDTHS = [30, 12, 20, 18, 16, 16, 12, 16, 13];
const MATERIAL_NUMBER_FORMATS = { 2: RUPIAH_FORMAT, 4: QTY_FORMAT, 5: RUPIAH_FORMAT, 7: QTY_FORMAT, 8: QTY_FORMAT };

const RECIPE_HEADERS = [
  'SKU Produk', 'Nama Produk', 'Target Hasil', 'Total HPP per Batch (Rp)',
  'Nama Bahan Baku', 'Takaran Dibutuhkan', 'Satuan',
];
const RECIPE_WIDTHS = [16, 30, 18, 22, 28, 18, 12];
const RECIPE_NUMBER_FORMATS = { 3: RUPIAH_FORMAT, 5: QTY_FORMAT };

const SALES_HEADERS = [
  'No. Struk', 'Tanggal', 'Jam', 'Channel', 'Metode Pembayaran', 'Nama Produk',
  'Jumlah', 'Harga Satuan (Rp)', 'HPP per Unit (Rp)', 'Subtotal Item (Rp)',
  'Diskon Struk (Rp)', 'Potongan Platform (Rp)', 'Total Akhir Struk (Rp)',
  'Ref QRIS / Catatan', 'Waktu Lunas QRIS',
];
const SALES_WIDTHS = [12, 12, 8, 16, 18, 30, 10, 16, 16, 16, 16, 20, 18, 26, 18];
const SALES_NUMBER_FORMATS = {
  6: QTY_FORMAT, 7: RUPIAH_FORMAT, 8: RUPIAH_FORMAT, 9: RUPIAH_FORMAT,
  10: RUPIAH_FORMAT, 11: RUPIAH_FORMAT, 12: RUPIAH_FORMAT,
};

const STOCK_HEADERS = [
  'Tipe Item', 'SKU / Kode', 'Nama Item', 'Kategori', 'Stok Fisik', 'Satuan',
  'Estimasi Nilai Stok (Rp)', 'Terakhir Diperbarui',
];
const STOCK_WIDTHS = [16, 16, 32, 22, 12, 12, 22, 22];
const STOCK_NUMBER_FORMATS = { 4: QTY_FORMAT, 6: RUPIAH_FORMAT };

const EXPENSE_HEADERS = ['Tanggal', 'Kategori Biaya', 'Keterangan / Deskripsi', 'Jumlah (Rp)'];
const EXPENSE_WIDTHS = [14, 22, 46, 18];
const EXPENSE_NUMBER_FORMATS = { 3: RUPIAH_FORMAT };

const buildCategoryMap = (categories = []) =>
  new Map(categories.map((item) => [item.id, item.name]));

const buildInventoryMaps = (inventory = []) => {
  const byProduct = new Map();
  const byMaterial = new Map();
  inventory.forEach((row) => {
    if (row.product_id != null) byProduct.set(row.product_id, row);
    if (row.raw_material_id != null) byMaterial.set(row.raw_material_id, row);
  });
  return { byProduct, byMaterial };
};

// Baris "Master Produk": tanpa ID database, semua keterangan mudah dibaca
const buildProductRows = (products = [], categoryMap = new Map(), inventoryByProduct = new Map()) =>
  products.map((product) => {
    const stock = inventoryByProduct.get(product.id);
    const markup = Number(product.online_markup_pct) || 0;
    const basePrice = Number(product.base_price) || 0;
    return [
      product.sku || '-',
      product.name || '-',
      categoryMap.get(product.category_id) || 'Tanpa Kategori',
      product.unit || '-',
      Number(product.hpp) || 0,
      basePrice,
      Number(product.discount_pct) || 0,
      formatYaTidak(markup > 0),
      markup > 0 ? Math.round(basePrice * (1 + markup / 100)) : '-',
      stock ? Number(stock.qty_on_hand) || 0 : 0,
      formatYaTidak(product.is_active),
    ];
  });

// Baris "Bahan Baku & Kemasan"
const buildMaterialRows = (materials = [], inventoryByMaterial = new Map()) =>
  materials.map((material) => {
    const stock = inventoryByMaterial.get(material.id);
    return [
      material.name || '-',
      material.unit || '-',
      Number(material.cost_per_unit) || 0,
      material.purchase_unit || '-',
      Number(material.purchase_quantity) || 0,
      Number(material.purchase_price) || 0,
      formatYaTidak(material.is_perishable),
      material.shelf_life_days != null ? Number(material.shelf_life_days) : '-',
      stock ? Number(stock.qty_on_hand) || 0 : 0,
    ];
  });

// Baris "Resep": memakai nama produk & nama bahan, bukan ID
const buildRecipeRows = (recipes = [], recipeIngredients = [], products = [], rawMaterials = []) => {
  const productMap = new Map(products.map((item) => [item.id, item]));
  const materialMap = new Map(rawMaterials.map((item) => [item.id, item]));
  return recipeIngredients.map((ingredient) => {
    const recipe = recipes.find((item) => item.id === ingredient.recipe_id);
    const product = productMap.get(recipe?.product_id);
    const material = materialMap.get(ingredient.raw_material_id);
    return [
      product?.sku || '-',
      product?.name || '-',
      recipe ? `${recipe.yield_qty ?? 0} ${product?.unit || 'pcs'}` : '-',
      Number(recipe?.total_hpp) || 0,
      material?.name || 'Bahan Dihapus',
      Number(ingredient.qty_needed) || 0,
      ingredient.unit || material?.unit || '-',
    ];
  });
};

// Baris stok: nama item + SKU + kategori + nilai stok, bukan ID database
const buildStockRows = (products = [], materials = [], inventory = [], categoryMap = new Map()) => {
  const { byProduct, byMaterial } = buildInventoryMaps(inventory);

  const productRows = products.map((product) => {
    const stock = byProduct.get(product.id);
    const qty = Number(stock?.qty_on_hand) || 0;
    return [
      'Produk Jadi',
      product.sku || '-',
      product.name || '-',
      categoryMap.get(product.category_id) || 'Tanpa Kategori',
      qty,
      product.unit || '-',
      Math.round(qty * (Number(product.hpp) || 0)),
      stock?.last_updated ? formatTanggalWaktu(stock.last_updated) : '-',
    ];
  });

  const materialRows = materials.map((material) => {
    const stock = byMaterial.get(material.id);
    const qty = Number(stock?.qty_on_hand) || 0;
    return [
      'Bahan Baku',
      '-',
      material.name || '-',
      'Bahan Baku & Kemasan',
      qty,
      material.unit || '-',
      Math.round(qty * (Number(material.cost_per_unit) || 0)),
      stock?.last_updated ? formatTanggalWaktu(stock.last_updated) : '-',
    ];
  });

  return [...productRows, ...materialRows];
};

export function useBackupsData(storeId, userId) {
  const [backups, setBackups] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // 1. FETCH RIWAYAT BACKUP
  // ==========================================
  const fetchBackups = useCallback(async () => {
    if (!storeId) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBackups(data || []);
    } catch (err) {
      setError('Gagal memuat riwayat backup: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchBackups(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchBackups]);

  // Ambil nama toko untuk judul file backup yang diunduh
  useEffect(() => {
    if (!storeId) {
      const resetTimer = setTimeout(() => { setStoreName(''); }, 0);
      return () => clearTimeout(resetTimer);
    }

    let isCancelled = false;
    const loadStoreName = async () => {
      const { data, error: storeError } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .single();
      if (!isCancelled && !storeError) setStoreName(data?.name || '');
    };

    loadStoreName();
    return () => { isCancelled = true; };
  }, [storeId]);

  // ==========================================
  // 2. FUNGSI EXPORT (Generate Excel & Upload)
  // ==========================================
  const handleExport = async (scope, dateFrom = null, dateTo = null) => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!storeId || !userId) {
        throw new Error('Toko aktif atau pengguna belum tersedia. Silakan pilih toko terlebih dahulu.');
      }

      const wb = XLSX.utils.book_new();

      // --- Metadata untuk judul file & sheet Ringkasan ---
      const { data: storeData } = await supabase.from('stores').select('name').eq('id', storeId).single();
      const { data: userData } = await supabase.from('merchants').select('full_name').eq('id', userId).single();

      const namaToko = storeData?.name || storeName || 'Toko';
      const namaPembuat = userData?.full_name || 'Sistem';
      const typeLabel = SCOPE_LABELS[scope] || 'Data';
      const backupType = SCOPE_BACKUP_TYPES[scope] || `EXPORT_${String(scope).toUpperCase()}`;

      // Judul file yang diunduh, contoh: "Frozen Abercio Food Backups Full"
      const downloadName = buildBackupFileName(namaToko, typeLabel);

      const summaryOptions = {
        storeName: namaToko,
        storeId,
        userName: namaPembuat,
        typeLabel,
        dateFrom,
        dateTo,
      };

      let recordCounts = [];

      // ==========================================
      // LOGIKA FULL BACKUP (5 SHEETS SESUAI TEMPLATE)
      // ==========================================
      if (scope === 'full_backup') {
        // A. Fetch Semua Data Secara Paralel
        const [productsRes, categoriesRes, rawMaterialsRes, recipesRes, recipeIngredientsRes, salesRes, saleItemsRes, expensesRes, inventoryRes] = await Promise.all([
          supabase.from('products').select('*').eq('store_id', storeId),
          supabase.from('categories').select('*').eq('store_id', storeId),
          supabase.from('raw_materials').select('*').eq('store_id', storeId),
          supabase.from('recipes').select('*'),
          supabase.from('recipe_ingredients').select('*'),
          supabase.from('sales').select('*').eq('store_id', storeId).order('sale_date', { ascending: false }),
          supabase.from('sale_items').select('*'),
          supabase.from('operational_expenses').select('*').eq('store_id', storeId),
          supabase.from('inventory').select('*').eq('store_id', storeId)
        ]);

        if (productsRes.error) throw productsRes.error;

        const products = productsRes.data || [];
        const categories = categoriesRes.data || [];
        const rawMaterials = rawMaterialsRes.data || [];
        const productIds = new Set(products.map((product) => product.id));
        const recipes = (recipesRes.data || []).filter((recipe) => productIds.has(recipe.product_id));
        const recipeIds = new Set(recipes.map((recipe) => recipe.id));
        const recipeIngredients = (recipeIngredientsRes.data || []).filter((ingredient) => recipeIds.has(ingredient.recipe_id));
        const sales = salesRes.data || [];
        const saleIds = new Set(sales.map((sale) => sale.id));
        const saleItems = (saleItemsRes.data || []).filter((item) => saleIds.has(item.sale_id));
        const expenses = expensesRes.data || [];
        const inventory = inventoryRes.data || [];

        const categoryMap = buildCategoryMap(categories);
        const productMap = new Map(products.map((product) => [product.id, product]));
        const { byProduct: inventoryByProduct, byMaterial: inventoryByMaterial } = buildInventoryMaps(inventory);

        recordCounts = [
          { label: 'Master Produk', count: products.length },
          { label: 'Bahan Baku & Kemasan', count: rawMaterials.length },
          { label: 'Transaksi Penjualan', count: sales.length },
          { label: 'Pengeluaran Operasional', count: expenses.length },
        ];

        // --- SHEET 1: RINGKASAN ---
        XLSX.utils.book_append_sheet(
          wb,
          createSummarySheet({ ...summaryOptions, counts: recordCounts }),
          'Ringkasan'
        );

        // --- SHEET 2: MASTER PRODUK ---
        XLSX.utils.book_append_sheet(
          wb,
          createTableSheet(
            PRODUCT_HEADERS,
            buildProductRows(products, categoryMap, inventoryByProduct),
            { widths: PRODUCT_WIDTHS, numberFormats: PRODUCT_NUMBER_FORMATS }
          ),
          'Master Produk'
        );

        // --- SHEET 3: BAHAN & RESEP (layout 2 bagian) ---
        const materialRows = buildMaterialRows(rawMaterials, inventoryByMaterial);
        const recipeRows = buildRecipeRows(recipes, recipeIngredients, products, rawMaterials);
        const bahanResepData = [
          ['MASTER BAHAN BAKU & KEMASAN'],
          MATERIAL_HEADERS,
          ...materialRows,
          [''],
          ['FORMULASI RESEP PRODUKSI'],
          RECIPE_HEADERS,
          ...recipeRows,
        ];
        const wsBahanResep = XLSX.utils.aoa_to_sheet(bahanResepData);
        setColumnWidths(wsBahanResep, MATERIAL_WIDTHS);
        applyNumberFormats(wsBahanResep, MATERIAL_NUMBER_FORMATS, {
          startRow: 2,
          endRow: 1 + materialRows.length,
        });
        applyNumberFormats(wsBahanResep, RECIPE_NUMBER_FORMATS, {
          startRow: 5 + materialRows.length,
          endRow: 4 + materialRows.length + recipeRows.length,
        });
        XLSX.utils.book_append_sheet(wb, wsBahanResep, 'Bahan & Resep');

        // --- SHEET 4: RIWAYAT PENJUALAN ---
        const salesMap = new Map(sales.map((sale) => [sale.id, sale]));
        const salesRows = saleItems.map((item) => {
          const sale = salesMap.get(item.sale_id);
          const product = productMap.get(item.product_id);
          return [
            item.sale_id,
            formatTanggal(sale?.sale_date),
            formatJam(sale?.sale_date),
            formatChannel(sale?.channel),
            formatPayment(sale?.payment_method),
            product?.name || 'Produk Dihapus',
            Number(item.qty) || 0,
            Number(item.unit_price) || 0,
            Number(item.hpp_snapshot) || 0,
            Number(item.line_total) || 0,
            Number(sale?.discount) || 0,
            Number(sale?.platform_fee) || 0,
            Number(sale?.grand_total) || 0,
            sale?.qris_reference || sale?.notes || '-',
            sale?.qris_paid_at ? formatTanggalWaktu(sale.qris_paid_at) : '-',
          ];
        });
        XLSX.utils.book_append_sheet(
          wb,
          createTableSheet(SALES_HEADERS, salesRows, {
            widths: SALES_WIDTHS,
            numberFormats: SALES_NUMBER_FORMATS,
          }),
          'Riwayat Penjualan'
        );

        // --- SHEET 5: STOK & OPERASIONAL (layout 2 bagian) ---
        const stockRows = buildStockRows(products, rawMaterials, inventory, categoryMap);
        const expenseRows = expenses.map((expense) => [
          formatTanggal(expense.expense_date),
          expense.category || '-',
          expense.description || '-',
          Number(expense.amount) || 0,
        ]);
        const totalExpense = expenseRows.reduce((sum, row) => sum + (Number(row[3]) || 0), 0);
        const stockLastRow = 1 + stockRows.length;
        const expenseFirstRow = stockLastRow + 4; // 1 spacer + 1 judul + 1 header

        const stokOperasionalData = [
          ['PENCATATAN STOK FISIK (PRODUK & BAHAN BAKU)'],
          STOCK_HEADERS,
          ...stockRows,
          [''],
          ['PENGELUARAN BIAYA OPERASIONAL'],
          EXPENSE_HEADERS,
          ...expenseRows,
          ['TOTAL PENGELUARAN', '', '', totalExpense],
        ];
        const wsStokOperasional = XLSX.utils.aoa_to_sheet(stokOperasionalData);
        setColumnWidths(wsStokOperasional, STOCK_WIDTHS);
        applyNumberFormats(wsStokOperasional, STOCK_NUMBER_FORMATS, {
          startRow: 2,
          endRow: stockLastRow,
        });
        applyNumberFormats(wsStokOperasional, EXPENSE_NUMBER_FORMATS, {
          startRow: expenseFirstRow,
          endRow: expenseFirstRow + expenseRows.length,
        });
        XLSX.utils.book_append_sheet(wb, wsStokOperasional, 'Stok & Operasional');
      }

      // ==========================================
      // LOGIKA SCOPE LAINNYA (Penjualan, Master Data, Stok, Biaya)
      // ==========================================
      else if (scope === 'sales_report') {
        let query = supabase.from('sales').select('*, sale_items(*)').eq('store_id', storeId);
        if (dateFrom) query = query.gte('sale_date', dateFrom);
        if (dateTo) query = query.lte('sale_date', dateTo);
        const { data, error } = await query.order('sale_date', { ascending: false });
        if (error) throw error;

        const sales = data || [];
        const { data: productData } = await supabase
          .from('products')
          .select('id, name, sku')
          .eq('store_id', storeId);
        const productMap = new Map((productData || []).map((product) => [product.id, product]));

        const rows = [];
        sales.forEach((sale) => {
          (sale.sale_items || []).forEach((item) => {
            const product = productMap.get(item.product_id);
            rows.push([
              sale.id,
              formatTanggal(sale.sale_date),
              formatJam(sale.sale_date),
              formatChannel(sale.channel),
              formatPayment(sale.payment_method),
              product?.name || 'Produk Dihapus',
              Number(item.qty) || 0,
              Number(item.unit_price) || 0,
              Number(item.hpp_snapshot) || 0,
              Number(item.line_total) || 0,
              Number(sale.discount) || 0,
              Number(sale.platform_fee) || 0,
              Number(sale.grand_total) || 0,
              sale.qris_reference || sale.notes || '-',
              sale.qris_paid_at ? formatTanggalWaktu(sale.qris_paid_at) : '-',
            ]);
          });
        });

        const totalOmzet = sales.reduce((sum, sale) => sum + (Number(sale.grand_total) || 0), 0);
        const totalItemTerjual = rows.reduce((sum, row) => sum + (Number(row[6]) || 0), 0);

        recordCounts = [
          { label: 'Jumlah Struk / Transaksi', count: sales.length },
          { label: 'Jumlah Baris Produk Terjual', count: rows.length },
          { label: 'Total Item Terjual', count: totalItemTerjual },
          { label: 'Total Omzet (Rp)', count: totalOmzet },
        ];

        XLSX.utils.book_append_sheet(
          wb,
          createSummarySheet({ ...summaryOptions, counts: recordCounts }),
          'Ringkasan'
        );
        XLSX.utils.book_append_sheet(
          wb,
          createTableSheet(SALES_HEADERS, rows, {
            widths: SALES_WIDTHS,
            numberFormats: SALES_NUMBER_FORMATS,
          }),
          'Detail Penjualan'
        );
      }

      else if (scope === 'master_data') {
        const [prodRes, catRes, rawRes, invRes, recipeRes, ingRes] = await Promise.all([
          supabase.from('products').select('*').eq('store_id', storeId),
          supabase.from('categories').select('*').eq('store_id', storeId),
          supabase.from('raw_materials').select('*').eq('store_id', storeId),
          supabase.from('inventory').select('*').eq('store_id', storeId),
          supabase.from('recipes').select('*'),
          supabase.from('recipe_ingredients').select('*'),
        ]);
        if (prodRes.error) throw prodRes.error;

        const products = prodRes.data || [];
        const categories = catRes.data || [];
        const materials = rawRes.data || [];
        const inventory = invRes.data || [];
        const productIds = new Set(products.map((product) => product.id));
        const recipes = (recipeRes.data || []).filter((recipe) => productIds.has(recipe.product_id));
        const recipeIds = new Set(recipes.map((recipe) => recipe.id));
        const recipeIngredients = (ingRes.data || []).filter((ingredient) => recipeIds.has(ingredient.recipe_id));

        const categoryMap = buildCategoryMap(categories);
        const { byProduct: inventoryByProduct, byMaterial: inventoryByMaterial } = buildInventoryMaps(inventory);
        const productCountByCategory = products.reduce((acc, product) => {
          const key = categoryMap.get(product.category_id) || 'Tanpa Kategori';
          acc.set(key, (acc.get(key) || 0) + 1);
          return acc;
        }, new Map());

        recordCounts = [
          { label: 'Master Produk', count: products.length },
          { label: 'Kategori Produk', count: categories.length },
          { label: 'Bahan Baku & Kemasan', count: materials.length },
          { label: 'Baris Resep Produksi', count: recipeIngredients.length },
        ];

        XLSX.utils.book_append_sheet(
          wb,
          createSummarySheet({ ...summaryOptions, counts: recordCounts }),
          'Ringkasan'
        );
        XLSX.utils.book_append_sheet(
          wb,
          createTableSheet(
            PRODUCT_HEADERS,
            buildProductRows(products, categoryMap, inventoryByProduct),
            { widths: PRODUCT_WIDTHS, numberFormats: PRODUCT_NUMBER_FORMATS }
          ),
          'Master Produk'
        );
        XLSX.utils.book_append_sheet(
          wb,
          createTableSheet(
            MATERIAL_HEADERS,
            buildMaterialRows(materials, inventoryByMaterial),
            { widths: MATERIAL_WIDTHS, numberFormats: MATERIAL_NUMBER_FORMATS }
          ),
          'Bahan Baku'
        );
        XLSX.utils.book_append_sheet(
          wb,
          createTableSheet(
            ['Nama Kategori', 'Jumlah Produk'],
            Array.from(productCountByCategory.entries()).map(([nama, jumlah]) => [nama, jumlah]),
            { widths: [30, 16], numberFormats: { 1: QTY_FORMAT } }
          ),
          'Kategori'
        );
        XLSX.utils.book_append_sheet(
          wb,
          createTableSheet(
            RECIPE_HEADERS,
            buildRecipeRows(recipes, recipeIngredients, products, materials),
            { widths: RECIPE_WIDTHS, numberFormats: RECIPE_NUMBER_FORMATS }
          ),
          'Resep'
        );
      }

      else if (scope === 'inventory') {
        const [prodRes, rawRes, invRes, catRes] = await Promise.all([
          supabase.from('products').select('*').eq('store_id', storeId),
          supabase.from('raw_materials').select('*').eq('store_id', storeId),
          supabase.from('inventory').select('*').eq('store_id', storeId),
          supabase.from('categories').select('*').eq('store_id', storeId),
        ]);
        if (prodRes.error) throw prodRes.error;

        const products = prodRes.data || [];
        const materials = rawRes.data || [];
        const inventory = invRes.data || [];
        const categoryMap = buildCategoryMap(catRes.data || []);
        const stockRows = buildStockRows(products, materials, inventory, categoryMap);
        const totalNilaiStok = stockRows.reduce((sum, row) => sum + (Number(row[6]) || 0), 0);

        recordCounts = [
          { label: 'Jumlah Produk Jadi', count: products.length },
          { label: 'Jumlah Bahan Baku & Kemasan', count: materials.length },
          { label: 'Total Estimasi Nilai Stok (Rp)', count: totalNilaiStok },
        ];

        XLSX.utils.book_append_sheet(
          wb,
          createSummarySheet({ ...summaryOptions, counts: recordCounts }),
          'Ringkasan'
        );
        XLSX.utils.book_append_sheet(
          wb,
          createTableSheet(STOCK_HEADERS, stockRows, {
            widths: STOCK_WIDTHS,
            numberFormats: STOCK_NUMBER_FORMATS,
          }),
          'Stok Master Data'
        );
      }

      else if (scope === 'expenses') {
        let query = supabase
          .from('operational_expenses')
          .select('*')
          .eq('store_id', storeId)
          .order('expense_date', { ascending: false });
        if (dateFrom) query = query.gte('expense_date', dateFrom);
        if (dateTo) query = query.lte('expense_date', dateTo);
        const { data, error } = await query;
        if (error) throw error;

        const expenses = data || [];
        const expenseRows = expenses.map((expense) => [
          formatTanggal(expense.expense_date),
          expense.category || '-',
          expense.description || '-',
          Number(expense.amount) || 0,
        ]);
        const totalExpense = expenseRows.reduce((sum, row) => sum + (Number(row[3]) || 0), 0);

        recordCounts = [
          { label: 'Jumlah Catatan Biaya', count: expenses.length },
          { label: 'Total Biaya Operasional (Rp)', count: totalExpense },
        ];

        XLSX.utils.book_append_sheet(
          wb,
          createSummarySheet({ ...summaryOptions, counts: recordCounts }),
          'Ringkasan'
        );
        XLSX.utils.book_append_sheet(
          wb,
          createTableSheet(
            EXPENSE_HEADERS,
            [...expenseRows, ['TOTAL PENGELUARAN', '', '', totalExpense]],
            { widths: EXPENSE_WIDTHS, numberFormats: EXPENSE_NUMBER_FORMATS }
          ),
          'Biaya Operasional'
        );
      }

      else {
        throw new Error('Jenis ekspor tidak dikenali.');
      }

      // ==========================================
      // 3. GENERATE FILE, UPLOAD, & SIMPAN KE DB
      // ==========================================
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const safeName = sanitizeFileName(downloadName);
      const timestamp = new Date().getTime();
      const file = new File([excelBuffer], `${safeName}.xlsx`, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Path di storage tetap memakai timestamp agar tidak bentrok,
      // sedangkan nama file yang diunduh memakai nama toko + jenis backup.
      const filePath = `backups/${storeId}/${backupType}/${safeName}_${timestamp}.xlsx`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('backups') // Pastikan bucket ini sudah dibuat dan Private
        .upload(filePath, file, { upsert: false });

      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from('backups').insert({
        store_id: storeId,
        user_id: userId,
        backup_type: backupType,
        file_url: storageData.path,
        file_size_kb: Math.round(file.size / 1024),
        file_format: 'xlsx',
        date_from: dateFrom,
        date_to: dateTo,
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      if (dbError) throw dbError;

      await downloadBackupFile(storageData.path, `${safeName}.xlsx`);
      await fetchBackups();
      return { success: true, message: `Ekspor berhasil! File "${safeName}.xlsx" siap diunduh.` };

    } catch (err) {
      setError('Gagal melakukan ekspor: ' + err.message);
      console.error(err);
      return { success: false, message: err.message };
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 4. FUNGSI IMPORT
  // ==========================================
  const handleImport = async (file, scope) => {
    setIsProcessing(true);
    setError(null);
    let successCount = 0;
    let failedCount = 0;
    let errorLogs = [];

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      let jsonData = [];
      if (scope === 'master_data') {
        const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('produk')) || workbook.SheetNames[0];
        jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      }

      if (jsonData.length === 0) throw new Error('File Excel kosong atau format salah.');

      if (scope === 'master_data') {
        for (const row of jsonData) {
          try {
            const namaProduk = row['Nama Produk'];
            const sku = row['SKU'] ?? row['SKU / Kode'];

            if (!namaProduk || !sku) {
              throw new Error('Nama produk atau SKU kosong');
            }

            // Menerima judul kolom hasil ekspor terbaru maupun format lama
            const hargaJual = Number(row['Harga Jual (Rp)'] ?? row['Harga Base'] ?? 0) || 0;
            const hpp = Number(row['HPP (Rp)'] ?? 0) || 0;
            const jualOnline = String(row['Jual Online?'] ?? '').trim().toLowerCase();
            const statusAktif = String(row['Status Aktif'] ?? '').trim().toLowerCase();
            const nilaiYa = ['ya', 'aktif', 'true', '1'];

            const { error } = await supabase.from('products').upsert({
              store_id: storeId,
              name: namaProduk,
              sku: sku,
              base_price: hargaJual,
              hpp: hpp,
              unit: row.Satuan || 'pcs',
              online_markup_pct: nilaiYa.includes(jualOnline) ? 25 : 0, // Fallback logic
              is_active: nilaiYa.includes(statusAktif)
            }, { onConflict: 'sku' });

            if (error) throw error;
            successCount++;
          } catch (rowErr) {
            failedCount++;
            errorLogs.push({
              'SKU': row['SKU'] || row['SKU / Kode'] || 'N/A',
              'Nama Produk': row['Nama Produk'] || '-',
              'Penyebab Gagal': rowErr.message,
            });
          }
        }
      }

      // Arsipkan file asli yang diimpor agar riwayat tetap bisa ditelusuri
      const archivePath = `backups/${storeId}/IMPORT_ARCHIVES/import_${scope}_${Date.now()}.xlsx`;
      const { error: archiveError } = await supabase.storage
        .from('backups')
        .upload(archivePath, file);

      if (archiveError) throw archiveError;

      // Log data yang gagal diunggah terpisah (hanya jika ada baris gagal)
      let errorLogPath = null;
      if (errorLogs.length > 0) {
        const errorWs = createTableSheet(
          ['SKU', 'Nama Produk', 'Penyebab Gagal'],
          errorLogs.map((log) => [log.SKU, log['Nama Produk'], log['Penyebab Gagal']]),
          { widths: [18, 32, 60] }
        );
        const errorWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(errorWb, errorWs, 'Data Gagal Diimpor');
        const errorBuffer = XLSX.write(errorWb, { bookType: 'xlsx', type: 'array' });
        const errorFile = new File([errorBuffer], `error_log_${Date.now()}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        errorLogPath = `backups/${storeId}/IMPORT_LOGS/error_log_${Date.now()}.xlsx`;
        await supabase.storage.from('backups').upload(errorLogPath, errorFile);
      }

      await supabase.from('backups').insert({
        store_id: storeId,
        user_id: userId,
        backup_type: `IMPORT_${scope.toUpperCase()}`,
        file_url: archivePath,
        file_size_kb: Math.round(file.size / 1024),
        file_format: 'xlsx',
        status: failedCount > 0 ? 'completed_with_errors' : 'completed',
        import_summary: { success: successCount, failed: failedCount, total: jsonData.length },
        error_log_url: errorLogPath,
        completed_at: new Date().toISOString()
      });

      await fetchBackups();
      return { success: true, successCount, failedCount, message: `Impor selesai. ${successCount} sukses, ${failedCount} gagal.` };

    } catch (err) {
      setError('Gagal melakukan impor: ' + err.message);
      console.error(err);
      return { success: false, message: err.message };
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 5. FUNGSI DOWNLOAD FILE DARI STORAGE
  // ==========================================
  const downloadBackupFile = async (filePath, downloadName) => {
    try {
      const { data, error } = await supabase.storage
        .from('backups')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName || filePath.split('/').pop() || 'backup.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Gagal mengunduh file: ' + err.message);
      console.error(err);
    }
  };

  return {
    backups,
    storeName,
    isLoading,
    isProcessing,
    error,
    setError,
    handleExport,
    handleImport,
    downloadBackupFile,
    refreshBackups: fetchBackups,
  };
}
