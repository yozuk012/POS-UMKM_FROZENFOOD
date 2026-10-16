-- Menambahkan kolom untuk fitur Impor Data pada tabel backups
ALTER TABLE backups
-- 1. Kolom untuk menyimpan ringkasan hasil import (JSON)
ADD COLUMN IF NOT EXISTS import_summary jsonb,

-- 2. Kolom untuk menyimpan link file log error (jika ada baris yang gagal diimpor)
ADD COLUMN IF NOT EXISTS error_log_url varchar;

-- (Opsional) Memberikan deskripsi pada kolom agar mudah diingat di Table Editor
COMMENT ON COLUMN backups.import_summary IS 'Menyimpan JSON hasil import, contoh: {"success": 97, "failed": 3, "skipped": 0}';
COMMENT ON COLUMN backups.error_log_url IS 'Link file Excel berisi baris data yang gagal diimpor beserta alasan errornya';
