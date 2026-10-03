Berikut adalah versi **`DATABASE.md`** yang telah disesuaikan dan diperbarui berdasarkan skema SQL terbaru. 

Perubahan utama pada versi ini adalah **penambahan kolom rekening bank** pada tabel `stores`, **penambahan kolom catatan & total yield** pada tabel `recipes`, serta **penghapusan tabel `waste_logs` dan `conversions`** karena tidak ada di dalam skema SQL terbaru.

---

# 🗄️ Dokumentasi Skema Database (Database Schema)

Dokumen ini berisi spesifikasi tabel, kolom, tipe data, serta penjelasan fungsi bisnis dari skema database sistem POS UMKM Frozen Food.

---

## 📄 Ringkasan Tabel

- **`merchants`**: Profil Pemilik Usaha / Akun Utama
- **`stores`**: Cabang Toko / Lokasi Fisik & Informasi Rekening
- **`categories`**: Kategori Produk
- **`raw_materials`**: Bahan Baku Mentah & Kemasan
- **`products`**: Produk Jadi (Barang Siap Jual)
- **`product_prices`**: Penyesuaian Harga Multi-Channel Penjualan
- **`recipes`**: Header Resep Produksi Produk (1:1 dengan Produk)
- **`recipe_ingredients`**: Detail Komposisi Bahan Baku Resep
- **`sales`**: Header Transaksi Penjualan (Struk)
- **`sale_items`**: Rincian Barang Penjualan
- **`inventory`**: Stok Fisik Gudang & Toko
- **`backups`**: Riwayat & Log Ekspor Data

---

## 📊 Detail Tabel & Kolom

### 1. 🧑‍💼 `merchants`
Mengelompokkan data profil pengguna/pemilik usaha yang terhubung langsung dengan Supabase Auth (1:1).

- **`id`** (`uuid` - PK): ID unik dari Supabase Auth.
- **`full_name`** (`varchar`): Nama lengkap pemilik usaha.
- **`phone`** (`varchar`): Nomor telepon/WhatsApp.
- **`store_name`** (`varchar`): Nama merek/bisnis utama.
- **`store_logo_url`** (`text`): URL file logo brand utama.
- **`created_at`** (`timestamptz`): Waktu pembuatan akun.

---

### 2. 🏪 `stores`
Menyimpan data cabang, lokasi tempat usaha beroperasi, serta informasi rekening bank untuk operasional toko.

- **`id`** (`int8` - PK): ID unik cabang toko.
- **`user_id`** (`uuid` - FK): Merujuk ke `merchants.id`.
- **`name`** (`varchar`): Nama lokasi/cabang.
- **`type`** (`varchar`): Tipe lokasi (misal: `frozen_food`, `gudang`, `outlet`).
- **`address`** (`text`): Alamat fisik lokasi.
- **`logo_url`** (`varchar`): URL logo spesifik cabang.
- **`is_active`** (`bool`): Status aktif lokasi (`true`/`false`).
- **`created_at`** (`timestamptz`): Waktu pendaftaran lokasi.
- **`qris_code_url`** (`text`): URL gambar/sumber kode QRIS toko.
- **`qris_merchant_id`** (`text`): ID Merchant QRIS resmi.
- **`default_online_markup_pct`** (`int4`): Persentase default kenaikan harga untuk penjualan online.
- **`bank_name`** (`varchar`): Nama bank untuk rekening operasional toko.
- **`account_number`** (`varchar`): Nomor rekening bank toko.
- **`account_name`** (`varchar`): Nama pemilik rekening bank toko.

---

### 3. 🏷️ `categories`
Pengelompokan jenis produk jadi.

- **`id`** (`int8` - PK): ID unik kategori.
- **`store_id`** (`int8` - FK): Merujuk ke `stores.id`.
- **`name`** (`varchar`): Nama kategori (contoh: "Sosis", "Nugget").
- **`created_at`** (`timestamptz`): Waktu pembuatan.

---

### 4. 🥩 `raw_materials`
Daftar persediaan bahan baku dan kemasan mentah.

- **`id`** (`int8` - PK): ID unik bahan baku.
- **`store_id`** (`int8` - FK): Merujuk ke `stores.id`.
- **`name`** (`varchar`): Nama bahan mentah/kemasan.
- **`unit`** (`varchar`): Satuan ukur (`kg`, `gram`, `pcs`, dll.).
- **`cost_per_unit`** (`numeric`): Biaya/modal per unit satuan.
- **`is_perishable`** (`bool`): Indikator bahan mudah membusuk/rusak.
- **`shelf_life_days`** (`int4`): Masa simpan ideal (dalam satuan hari).
- **`created_at`** (`timestamptz`): Tanggal pendaftaran.

---

### 5. 🍗 `products`
Daftar produk jadi yang dijual ke pelanggan.

- **`id`** (`int8` - PK): ID unik produk.
- **`store_id`** (`int8` - FK): Merujuk ke `stores.id`.
- **`category_id`** (`int8` - FK): Merujuk ke `categories.id`.
- **`name`** (`varchar`): Nama produk jadi.
- **`sku`** (`varchar` - Unique): Stock Keeping Unit / Kode unik barang.
- **`type`** (`varchar`): Tipe produk (default: `finished_good`).
- **`unit`** (`varchar`): Satuan produk (`pack`, `box`, `pcs`).
- **`base_price`** (`numeric`): Harga jual standar (offline/fisik).
- **`hpp`** (`numeric`): Modal / Harga Pokok Penjualan per unit.
- **`image_url`** (`varchar`): URL foto produk.
- **`is_active`** (`bool`): Status ketersediaan/penjualan produk.
- **`created_at`** (`timestamptz`): Waktu pembuatan data produk.
- **`discount_pct`** (`numeric`): Persentase diskon langsung pada produk.
- **`online_markup_pct`** (`int4`): Persentase markup spesifik online untuk produk ini.

---

### 6. 💰 `product_prices`
Pengaturan harga multi-channel (Shopee, GrabMart, Tokopedia, dll.).

- **`id`** (`int8` - PK): ID unik penyesuaian harga.
- **`product_id`** (`int8` - FK): Merujuk ke `products.id`.
- **`channel`** (`varchar`): Nama channel (`offline`, `shopee`, `grabmart`, dll.).
- **`price`** (`numeric`): Harga jual khusus untuk channel tersebut.
- **`platform_fee_pct`** (`numeric`): Persentase biaya potongan platform/admin.
- **`updated_at`** (`timestamptz`): Tanggal pembaruan harga.

---

### 7. 📜 `recipes`
Header formula resep untuk 1 batch pembuatan produk. *(Catatan: Relasi 1:1 dengan produk, 1 produk hanya memiliki 1 resep aktif di tabel ini).*

- **`id`** (`int8` - PK): ID unik resep.
- **`product_id`** (`int8` - FK - Unique): Merujuk ke `products.id`.
- **`total_hpp`** (`numeric`): Akumulasi total biaya/HPP 1 batch resep.
- **`yield_qty`** (`int4`): Jumlah porsi/pack hasil dari 1 batch resep.
- **`total_yield`** (`int4`): Total kapasitas yield produksi (default: 1).
- **`effective_date`** (`date`): Tanggal awal berlakunya resep.
- **`notes`** (`text`): Catatan atau instruksi tambahan untuk resep.
- **`created_at`** (`timestamptz`): Tanggal pembuatan resep.

---

### 8. 🧂 `recipe_ingredients`
Rincian takaran bahan baku dalam suatu resep.

- **`id`** (`int8` - PK): ID unik rincian resep.
- **`recipe_id`** (`int8` - FK): Merujuk ke `recipes.id`.
- **`raw_material_id`** (`int8` - FK): Merujuk ke `raw_materials.id`.
- **`qty_needed`** (`numeric`): Jumlah/takaran bahan yang dibutuhkan.
- **`unit`** (`varchar`): Satuan takaran.

---

### 9. 🧾 `sales`
Header transaksi penjualan (Nota/Struk Penjualan).

- **`id`** (`int8` - PK): Nomor/ID transaksi.
- **`store_id`** (`int8` - FK): Merujuk ke `stores.id`.
- **`sale_date`** (`timestamptz`): Waktu transaksi terjadi.
- **`channel`** (`varchar`): Channel penjualan.
- **`payment_method`** (`varchar`): Metode pembayaran (`cash`, `qris`, `transfer`).
- **`subtotal`** (`numeric`): Total harga sebelum diskon/biaya platform.
- **`discount`** (`numeric`): Total potongan diskon.
- **`platform_fee`** (`numeric`): Potongan biaya admin marketplace.
- **`grand_total`** (`numeric`): Nilai akhir pembayaran.
- **`notes`** (`text`): Catatan transaksi.
- **`qris_reference`** (`varchar`): Nomor referensi/ID transaksi QRIS.
- **`qris_status`** (`varchar`): Status bayar (`pending`, `success`, `failed`).
- **`qris_paid_at`** (`timestamptz`): Tanggal & waktu pelunasan QRIS.
- **`created_at`** (`timestamptz`): Waktu pencatatan data.

---

### 10. 🛒 `sale_items`
Detail produk yang dibeli dalam satu nomor transaksi.

- **`id`** (`int8` - PK): ID unik baris transaksi.
- **`sale_id`** (`int8` - FK): Merujuk ke `sales.id`.
- **`product_id`** (`int8` - FK): Merujuk ke `products.id`.
- **`qty`** (`numeric`): Jumlah barang dibeli.
- **`unit_price`** (`numeric`): Harga satuan saat transaksi.
- **`hpp_snapshot`** (`numeric`): Snapshot HPP produksi saat transaksi terjadi.
- **`line_total`** (`numeric`): Total nilai item (`qty * unit_price`).

---

### 11. 📦 `inventory`
Pencatatan stok riil fisik (produk jadi maupun bahan baku).

- **`id`** (`int8` - PK): ID unik pencatatan stok.
- **`store_id`** (`int8` - FK): Merujuk ke `stores.id`.
- **`product_id`** (`int8` - FK - Opsional): Merujuk ke `products.id` (null jika bahan baku).
- **`raw_material_id`** (`int8` - FK - Opsional): Merujuk ke `raw_materials.id` (null jika produk).
- **`qty_on_hand`** (`numeric`): Jumlah stok riil di lokasi fisik.
- **`last_updated`** (`timestamptz`): Waktu pembaruan stok terakhir.

---

### 12. 💾 `backups`
Pencatatan riwayat ekspor dan pengarsipan data.

- **`id`** (`int8` - PK): ID unik backup.
- **`store_id`** (`int8` - FK): Merujuk ke `stores.id`.
- **`user_id`** (`uuid` - FK): Merujuk ke `merchants.id`.
- **`backup_type`** (`varchar`): Jenis data yang diekspor.
- **`file_url`** (`varchar`): Tautan/Link unduh file backup.
- **`file_size_kb`** (`int4`): Ukuran berkas (dalam KB).
- **`file_format`** (`varchar`): Format berkas (`xlsx`, `csv`, `pdf`).
- **`date_from`** (`date`): Batas awal periode data.
- **`date_to`** (`date`): Batas akhir periode data.
- **`status`** (`varchar`): Status ekspor (`pending`, `completed`, dll.).
- **`completed_at`** (`timestamptz`): Tanggal & waktu penyelesaian ekspor.
- **`created_at`** (`timestamptz`): Tanggal pembuatan permintaan ekspor.