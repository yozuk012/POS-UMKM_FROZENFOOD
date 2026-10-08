alter table raw_materials
  add column if not exists purchase_unit varchar,
  add column if not exists purchase_quantity numeric,
  add column if not exists purchase_price numeric;

comment on column raw_materials.unit is 'Unit dasar untuk stok dan HPP, misalnya gram atau ml.';
comment on column raw_materials.purchase_unit is 'Unit yang dipakai saat pembelian dan ditampilkan ke pengguna.';
comment on column raw_materials.purchase_quantity is 'Jumlah pada satu pembelian dalam purchase_unit.';
comment on column raw_materials.purchase_price is 'Harga total untuk purchase_quantity purchase_unit.';

-- Backfill aman untuk data lama yang belum memiliki metadata pembelian.
-- Satuan asli pembelian tidak dapat diketahui kembali dari unit dasar saja,
-- jadi jangan menebak gram sebagai kg atau ml sebagai liter.
update raw_materials
set purchase_unit = unit,
    purchase_quantity = 1,
    purchase_price = cost_per_unit
where purchase_unit is null;

-- Untuk data lama yang Anda ketahui input aslinya, perbaiki secara eksplisit.
-- Contoh: Tepung Terigu Pro Tinggi dibeli 25 kg seharga Rp300.000.
-- Jalankan setelah meninjau nama bahan yang tepat:
-- update raw_materials
-- set purchase_unit = 'kg', purchase_quantity = 25, purchase_price = 300000
-- where name = 'Tepung Terigu Pro Tinggi';