-- Jalankan script SQL ini di SQL Editor Supabase Anda untuk menambahkan fitur Lampiran Materi.

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS resource_title TEXT,
ADD COLUMN IF NOT EXISTS resource_url TEXT;

-- Tambahkan komentar untuk dokumentasi database
COMMENT ON COLUMN public.lessons.resource_title IS 'Judul file atau tombol materi pendukung (misal: Download PDF Hangul)';
COMMENT ON COLUMN public.lessons.resource_url IS 'URL link Google Drive, Notion, atau file pendukung lainnya';
