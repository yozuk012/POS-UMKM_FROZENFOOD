Tentu! Ini adalah langkah yang sangat cerdas. Sebelum menyentuh kode, memahami **bisnis di balik setiap tabel dan field** akan membuat Anda jauh lebih cepat dan minim bug saat coding nanti. 

Mari kita bedah ke-14 tabel ini secara lengkap, dengan contoh kasus nyata untuk usaha **Frozen Food** Anda.

---

### 1. 🧑💼 `merchants` (Profil Pemilik Usaha)
**Fungsi:** Menyimpan data profil pemilik akun. Tabel ini terhubung 1:1 dengan `auth.users` (Supabase Auth).
*   `id` (UUID): ID unik dari Supabase Auth. Ini adalah "KTP" digital user.
*   `full_name` (Varchar): Nama asli pemilik (misal: "Budi Santoso").
*   `phone` (Varchar): Nomor HP/WA untuk kontak darurat atau notifikasi.
*   `store_name` (Varchar): Nama Brand/Usaha utama (misal: "Frozen Food Pak Budi").
*   `store_logo_url` (Text): URL gambar logo yang diupload ke bucket `UMKM POS/logo-toko`.
*   `created_at` (Timestamp): Kapan akun ini pertama kali didaftarkan.

### 2.  `stores` (Cabang Toko / Lokasi)
**Fungsi:** Menyimpan data lokasi fisik tempat usaha beroperasi. 1 Merchant bisa punya banyak Store (Multi-cabang).
*   `id` (Bigint): ID unik cabang toko.
*   `user_id` (UUID): Foreign Key ke `merchants`. Menunjukkan siapa pemilik cabang ini.
*   `name` (Varchar): Nama spesifik cabang (misal: "Cabang Pusat Depok", "Gudang Bekasi").
*   `type` (Varchar): Jenis lokasi (misal: `frozen_food`, `gudang`, `outlet`).
*   `address` (Text): Alamat lengkap cabang.
*   `logo_url` (Varchar): Opsional. Jika cabang punya spanduk/logo berbeda dari brand utama.
*   `is_active` (Boolean): `TRUE` jika toko masih buka, `FALSE` jika tutup sementara/permanen.
*   `created_at` (Timestamp): Kapan cabang ini ditambahkan ke sistem.

### 3. 🏷️ `categories` (Kategori Produk)
**Fungsi:** Mengelompokkan produk agar laporan dan tampilan di kasir rapi.
*   `id` (Bigint): ID unik kategori.
*   `store_id` (Bigint): Kategori ini milik toko mana (karena tiap cabang bisa punya kategori beda).
*   `name` (Varchar): Nama kategori (misal: "Nugget & Sosis", "Bakso", "Dimsum", "Minuman").
*   `created_at` (Timestamp): Waktu pembuatan kategori.

### 4.  `raw_materials` (Bahan Baku)
**Fungsi:** Menyimpan daftar bahan mentah untuk membuat produk frozen food. Ini adalah kunci perhitungan HPP.
*   `id` (Bigint): ID unik bahan baku.
*   `store_id` (Bigint): Bahan ini disimpan di gudang/toko mana.
*   `name` (Varchar): Nama bahan (misal: "Daging Ayam Giling", "Tepung Panir", "Kemasan Vakum").
*   `unit` (Varchar): Satuan pembelian (misal: `gram`, `kg`, `liter`, `pcs`).
*   `cost_per_unit` (Decimal): Harga beli per satuan (misal: Rp 50/gram). Ini akan dikalikan jumlah di resep untuk dapat HPP.
*   `is_perishable` (Boolean): `TRUE` jika bahan cepat busuk (seperti daging/sayur), `FALSE` jika awet (tepung/kemasan).
*   `shelf_life_days` (Int): Berapa hari bahan bisa bertahan (misal: Daging = 3 hari, Tepung = 180 hari).
*   `created_at` (Timestamp): Kapan bahan ini didata.

### 5. 🍗 `products` (Produk Jadi)
**Fungsi:** Menyimpan barang jadi yang siap dijual ke pelanggan.
*   `id` (Bigint): ID unik produk.
*   `store_id` (Bigint): Produk ini dijual di toko mana.
*   `category_id` (Bigint): Masuk ke kategori apa (misal: "Nugget & Sosis").
*   `name` (Varchar): Nama produk (misal: "Nugget Ayam Original 500gr").
*   `sku` (Varchar): Kode barang unik untuk stok (misal: "NUG-ORI-500").
*   `type` (Varchar): Jenis produk, defaultnya `finished_good` (produk jadi).
*   `unit` (Varchar): Satuan jual (misal: `pack`, `pcs`, `box`).
*   `base_price` (Decimal): Harga dasar normal (harga offline/toko fisik).
*   `hpp` (Decimal): Harga Pokok Penjualan (Modal per pack). Bisa diisi manual atau otomatis dari resep.
*   `image_url` (Varchar): URL foto produk dari bucket `UMKM POS/product-toko`.
*   `is_active` (Boolean): `TRUE` jika masih dijual, `FALSE` jika produk sudah dihentikan (discontinued).
*   `created_at` (Timestamp): Kapan produk ditambahkan.

### 6. 💰 `product_prices` (Harga Multi-Channel)
**Fungsi:** Mengatur harga jual yang berbeda-beda tergantung platform (Online vs Offline) untuk menutupi biaya admin marketplace.
*   `id` (Bigint): ID unik harga.
*   `product_id` (Bigint): Produk apa yang diatur harganya.
*   `channel` (Varchar): Platform penjualan (`offline`, `shopee`, `grabmart`, `tokopedia`).
*   `price` (Decimal): Harga jual di channel tersebut (misal: Offline Rp35.000, Shopee Rp43.750).
*   `platform_fee_pct` (Decimal): Persentase potongan admin marketplace (misal: Shopee 5%, Grabmart 20%).
*   `updated_at` (Timestamp): Kapan harga ini terakhir diubah.

### 7. 📜 `recipes` (Header Resep)
**Fungsi:** Menyimpan data utama resep untuk menghasilkan 1 batch produk jadi.
*   `id` (Bigint): ID unik resep.
*   `product_id` (Bigint): Resep ini untuk membuat produk apa.
*   `total_hpp` (Decimal): Total modal untuk membuat 1 batch resep ini.
*   `yield_qty` (Int): Berapa banyak produk jadi yang dihasilkan dari 1 resep ini (misal: 1 resep adonan = 10 pack nugget).
*   `effective_date` (Date): Tanggal resep ini mulai berlaku (berguna jika nanti resep berubah/harga bahan naik).
*   `created_at` (Timestamp): Kapan resep dibuat.

### 8. 🧂 `recipe_ingredients` (Detail Bahan Resep)
**Fungsi:** Menjabarkan bahan apa saja dan berapa jumlahnya yang dibutuhkan untuk membuat resep di atas.
*   `id` (Bigint): ID unik detail.
*   `recipe_id` (Bigint): Mengacu ke header resep.
*   `raw_material_id` (Bigint): Bahan baku apa yang dipakai (misal: Daging Ayam).
*   `qty_needed` (Decimal): Berapa banyak bahan yang dibutuhkan (misal: 400).
*   `unit` (Varchar): Satuan (harus sama dengan satuan di `raw_materials`, misal: `gram`).

### 9. 🧾 `sales` (Transaksi Penjualan - Header)
**Fungsi:** Mencatat data utama setiap kali terjadi penjualan (Struk belanja).
*   `id` (Bigint): ID unik transaksi (Nomor Invoice).
*   `store_id` (Bigint): Penjualan terjadi di toko mana.
*   `sale_date` (Timestamp): Kapan transaksi terjadi.
*   `channel` (Varchar): Dari mana penjualan berasal (`offline`, `shopee`, dll).
*   `payment_method` (Varchar): Cara bayar (`cash`, `qris`, `transfer`).
*   `subtotal` (Decimal): Total harga barang sebelum diskon/fee.
*   `discount` (Decimal): Potongan harga yang diberikan ke pelanggan.
*   `platform_fee` (Decimal): Biaya admin marketplace yang ditanggung penjual (dihitung otomatis dari `product_prices`).
*   `grand_total` (Decimal): Uang bersih yang diterima/dibayar pelanggan.
*   `notes` (Text): Catatan dari kasir/pembeli (misal: "Tolong pakai bubble wrap tebal").
*   `qris_reference` (Varchar): Nomor referensi dari notifikasi QRIS (untuk audit).
*   `qris_status` (Varchar): Status bayar (`pending`, `success`, `failed`).
*   `qris_paid_at` (Timestamp): Kapan pembayaran QRIS dikonfirmasi lunas.
*   `created_at` (Timestamp): Waktu data dicatat di sistem.

### 10.  `sale_items` (Detail Barang dalam Transaksi)
**Fungsi:** Mencatat barang apa saja yang dibeli dalam 1 struk (1 transaksi bisa beli 3 jenis produk berbeda).
*   `id` (Bigint): ID unik item.
*   `sale_id` (Bigint): Mengacu ke nomor transaksi (Header).
*   `product_id` (Bigint): Produk apa yang dibeli.
*   `qty` (Decimal): Berapa banyak yang dibeli (misal: 2 pack).
*   `unit_price` (Decimal): Harga jual per unit saat transaksi itu terjadi.
*   `hpp_snapshot` (Decimal): **SANGAT PENTING!** Ini adalah HPP (modal) produk *pada saat detik itu juga*. Ini mengunci laba/rugi agar tidak berubah meski harga bahan baku naik di masa depan.
*   `line_total` (Decimal): `qty` dikali `unit_price` (Total harga untuk item ini).

### 11. 📦 `inventory` (Stok Gudang)
**Fungsi:** Mencatat jumlah stok fisik saat ini, baik untuk bahan baku maupun produk jadi.
*   `id` (Bigint): ID unik stok.
*   `store_id` (Bigint): Stok ini ada di gudang/toko mana.
*   `product_id` (Bigint): ID produk jadi (Kosongkan jika ini stok bahan baku).
*   `raw_material_id` (Bigint): ID bahan baku (Kosongkan jika ini stok produk jadi).
*   `qty_on_hand` (Decimal): Jumlah fisik barang yang ada di freezer/gudang saat ini.
*   `last_updated` (Timestamp): Kapan stok ini terakhir kali diopname/diubah.

### 12. 🗑️ `waste_logs` (Catatan Kerugian / Bahan Buang)
**Fungsi:** Mencatat bahan yang terbuang sia-sia. Ini akan langsung mengurangi Laba Bersih di laporan keuangan.
*   `id` (Bigint): ID unik catatan.
*   `store_id` (Bigint): Kejadian di toko mana.
*   `raw_material_id` (Bigint): Bahan apa yang terbuang.
*   `qty_wasted` (Decimal): Berapa banyak yang terbuang (misal: 500 gram).
*   `reason` (Varchar): Alasan pembuangan (`expired`, `freezer_mati`, `tumpah`, `kemasan_rusak`).
*   `loss_amount` (Decimal): Nilai uang yang hilang (Dihitung: `qty_wasted` x `cost_per_unit`).
*   `recorded_by` (UUID): Siapa (merchant) yang mencatat kerugian ini.
*   `recorded_at` (Timestamp): Kapan kejadian ini dicatat.

### 13. 🔄 `conversions` (Konversi Bahan -> Produk Baru)
**Fungsi:** Fitur "Penyelamat" untuk Frozen Food. Mencatat ketika bahan hampir expired diolah menjadi produk baru agar tidak jadi limbah.
*   `id` (Bigint): ID unik konversi.
*   `store_id` (Bigint): Kejadian di toko mana.
*   `source_material_id` (Bigint): Bahan apa yang mau dibuang (misal: Ayam sisa 2 hari lagi expired).
*   `target_product_id` (Bigint): Diubah jadi produk apa (misal: "Bakso Ayam Emergency").
*   `qty_converted` (Decimal): Berapa banyak bahan yang diolah.
*   `conversion_date` (Date): Tanggal pengolahan.
*   `notes` (Text): Catatan (misal: "Daging sisa stok minggu lalu, diolah jadi bakso").
*   `created_by` (UUID): Siapa yang melakukan konversi.
*   `created_at` (Timestamp): Waktu konversi dicatat.

### 14. 💾 `backups` (Riwayat Export Data)
**Fungsi:** Mencatat riwayat ketika Owner meminta download laporan/data untuk arsip pribadi atau akuntan.
*   `id` (Bigint): ID unik backup.
*   `store_id` (Bigint): Data toko mana yang di-backup.
*   `user_id` (UUID): Merchant yang meminta backup.
*   `backup_type` (Varchar): Jenis backup (`laporan_penjualan`, `stok_gudang`, `data_transaksi`).
*   `file_url` (Varchar): Link download file (bisa dari Supabase Storage atau link sementara).
*   `file_size_kb` (Int): Ukuran file (untuk info user).
*   `file_format` (Varchar): Format file (`xlsx`, `csv`, `pdf`).
*   `date_from` & `date_to` (Date): Periode data yang di-backup (misal: 1 Maret - 31 Maret).
*   `status` (Varchar): Status proses (`pending`, `processing`, `completed`, `failed`).
*   `completed_at` (Timestamp): Kapan file berhasil digenerate.
*   `created_at` (Timestamp): Kapan user menekan tombol "Backup".

---

### 🎯 Kesimpulan Besar
Dengan memahami 14 tabel ini, Anda memegang kendali penuh atas alur bisnis Frozen Food:
1. **Beli Bahan** -> Masuk `raw_materials` & `inventory`.
2. **Olah Bahan** -> `recipes` & `recipe_ingredients` menghitung modal (`hpp`).
3. **Jual Produk** -> `products`, `product_prices`, `sales`, & `sale_items` mencatat pendapatan.
4. **Cek Laba** -> `sale_items` (Pendapatan) dikurangi `waste_logs` (Kerugian).
5. **Selamatkan Stok** -> `conversions` mengubah bahan sekarat jadi uang.

Sekarang Anda sudah punya "peta harta karun" yang lengkap. Beri tahu saya jika ada bagian yang masih membingungkan, atau jika Anda sudah siap untuk mulai membuat **Model Sequelize** yang pertama! 🚀