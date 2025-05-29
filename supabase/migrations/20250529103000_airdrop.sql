-- project/supabase/migrations/YOUR_TIMESTAMP_create_airdrop_activities_full.sql (ganti YOUR_TIMESTAMP)

/*
  Migrasi Lengkap:
  1. Membuat tabel 'activities' jika belum ada, termasuk kolom baru untuk status.
  2. Menambahkan Row Level Security (RLS) dan kebijakan dasar untuk tabel 'activities'.
  3. Menghapus trigger dan fungsi proyek lama untuk menghindari konflik.
  4. Membuat fungsi dan trigger baru yang spesifik untuk mencatat aktivitas Airdrop (pembuatan dan pembaruan).
*/

-- Bagian 1: Buat tabel 'activities' jika belum ada
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type VARCHAR NOT NULL, -- e.g., 'airdrop_created', 'airdrop_updated'
  entity_type VARCHAR NOT NULL,   -- e.g., 'project'
  entity_id uuid NOT NULL,        -- ID dari proyek yang terpengaruh
  entity_name VARCHAR,            -- Nama/judul proyek yang terpengaruh
  description TEXT,               -- Deskripsi detail aktivitas
  created_at timestamptz DEFAULT now(),
  metadata JSONB,                 -- Untuk data tambahan seperti slug
  project_status_before VARCHAR,  -- Status proyek sebelum pembaruan (opsional)
  project_status_after VARCHAR    -- Status proyek setelah pembaruan (opsional)
);

-- Bagian 2: Tambahkan Kebijakan Keamanan Tingkat Baris (RLS) untuk tabel 'activities'
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk pengguna terautentikasi (admin) untuk mengelola data 'activities'
CREATE POLICY "Authenticated users can manage activities"
  ON activities
  FOR ALL
  TO authenticated
  USING (true);

-- Kebijakan untuk pengguna anonim (publik) untuk membaca data 'activities'
CREATE POLICY "Anonymous users can read activities"
  ON activities
  FOR SELECT
  TO anon
  USING (true);


-- Bagian 3: Nonaktifkan dan hapus trigger dan fungsi proyek lama untuk menghindari konflik
-- Ini penting jika Anda telah menjalankan skrip trigger sebelumnya
DROP TRIGGER IF EXISTS project_created_trigger ON projects;
DROP FUNCTION IF EXISTS log_project_created();
DROP TRIGGER IF EXISTS project_updated_trigger ON projects;
DROP FUNCTION IF EXISTS log_project_updated();


-- Bagian 4: Fungsi dan Trigger baru yang spesifik untuk Airdrop

-- Fungsi untuk mencatat pembuatan proyek HANYA jika itu mencakup kategori 'Airdrop'.
CREATE OR REPLACE FUNCTION log_airdrop_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Periksa apakah proyek baru memiliki 'Airdrop' dalam array kategorinya (jsonb @> array operator)
  IF NEW.categories @> '["Airdrop"]'::jsonb THEN
    INSERT INTO activities (activity_type, entity_type, entity_id, entity_name, description, created_at, metadata)
    VALUES (
      'airdrop_created', -- Tipe aktivitas spesifik untuk Airdrop yang baru dibuat
      'project',         -- Tipe entitas yang terpengaruh adalah 'project'
      NEW.id,            -- ID proyek baru
      NEW.title,         -- Judul proyek baru
      'New Airdrop: "' || NEW.title || '" was added.', -- Deskripsi aktivitas
      NEW.created_at,    -- Waktu pembuatan proyek
      jsonb_build_object('slug', NEW.slug) -- Simpan slug proyek untuk penghubungan langsung di UI
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk pembuatan Airdrop (hanya untuk proyek dengan kategori 'Airdrop')
-- Trigger ini akan aktif setelah INSERT pada tabel `projects`
CREATE TRIGGER airdrop_creation_trigger
AFTER INSERT ON projects
FOR EACH ROW EXECUTE FUNCTION log_airdrop_created();


-- Fungsi untuk mencatat pembaruan proyek HANYA jika itu mencakup kategori 'Airdrop'
-- (baik sebelum atau sesudah pembaruan, agar perubahan kategori juga tercatat).
CREATE OR REPLACE FUNCTION log_airdrop_updated()
RETURNS TRIGGER AS $$
DECLARE
  changes_summary TEXT := '';
  is_airdrop_before BOOLEAN := OLD.categories @> '["Airdrop"]'::jsonb;
  is_airdrop_after BOOLEAN := NEW.categories @> '["Airdrop"]'::jsonb;
BEGIN
  -- Hanya catat jika proyek adalah atau pernah menjadi Airdrop
  IF is_airdrop_before OR is_airdrop_after THEN
    -- Lacak perubahan spesifik pada kolom-kolom yang menarik
    IF NEW.description IS DISTINCT FROM OLD.description THEN
      changes_summary := changes_summary || 'Description was updated. ';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      changes_summary := changes_summary || 'Status changed from "' || OLD.status || '" to "' || NEW.status || '". ';
    END IF;

    IF NEW.title IS DISTINCT FROM OLD.title THEN
      changes_summary := changes_summary || 'Title changed from "' || OLD.title || '" to "' || NEW.title || '". ';
    END IF;

    IF NEW.categories IS DISTINCT FROM OLD.categories THEN
        IF NOT is_airdrop_before AND is_airdrop_after THEN
            changes_summary := changes_summary || 'Category "Airdrop" was added. ';
        ELSIF is_airdrop_before AND NOT is_airdrop_after THEN
            changes_summary := changes_summary || 'Category "Airdrop" was removed. ';
        ELSE
            changes_summary := changes_summary || 'Categories were updated. ';
        END IF;
    END IF;

    -- Sisipkan aktivitas hanya jika ada perubahan relevan yang terdeteksi
    IF changes_summary != '' THEN
      INSERT INTO activities (activity_type, entity_type, entity_id, entity_name, description, created_at, metadata, project_status_before, project_status_after)
      VALUES (
        'airdrop_updated', -- Tipe aktivitas spesifik untuk Airdrop yang diperbarui
        'project',
        NEW.id,
        NEW.title,
        'Airdrop "' || NEW.title || '" was updated. ' || changes_summary, -- Deskripsi gabungan
        NEW.updated_at, -- Waktu pembaruan proyek
        jsonb_build_object('slug', NEW.slug), -- Simpan slug
        OLD.status, -- Status sebelum perubahan
        NEW.status  -- Status setelah perubahan
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk pembaruan Airdrop (hanya untuk proyek yang adalah/pernah menjadi Airdrop)
-- Trigger ini akan aktif setelah UPDATE pada tabel `projects`, hanya jika ada perbedaan data.
CREATE TRIGGER airdrop_update_trigger
AFTER UPDATE ON projects
FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*) -- Hanya aktifkan jika ada perubahan pada baris
EXECUTE FUNCTION log_airdrop_updated();