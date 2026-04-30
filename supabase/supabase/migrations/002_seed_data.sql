-- ============================================================
-- SEED: 002_seed_data.sql
-- Untuk keperluan development & testing
-- JANGAN dijalankan di production
-- ============================================================

-- Sample courses
INSERT INTO public.courses (id, title, slug, description, level, is_published, sort_order, required_package)
VALUES
  ('11111111-0000-0000-0000-000000000001',
   'Belajar Hangul dari Nol', 'belajar-hangul',
   'Kuasai alfabet Korea (Hangul) dari dasar hingga bisa membaca kata sederhana.',
   'beginner', TRUE, 1, ARRAY['basic', 'pro', 'premium']),

  ('11111111-0000-0000-0000-000000000002',
   'Percakapan Sehari-hari', 'percakapan-sehari-hari',
   'Pelajari frasa dan kalimat yang sering digunakan dalam kehidupan sehari-hari.',
   'beginner', TRUE, 2, ARRAY['basic', 'pro', 'premium']),

  ('11111111-0000-0000-0000-000000000003',
   'Tata Bahasa Menengah', 'tata-bahasa-menengah',
   'Struktur kalimat dan pola grammar tingkat intermediate.',
   'intermediate', FALSE, 3, ARRAY['pro', 'premium']),

  ('11111111-0000-0000-0000-000000000004',
   'Bahasa Korea Profesional', 'bahasa-korea-profesional',
   'Vocabulary dan ekspresi untuk konteks pekerjaan dan bisnis.',
   'advanced', FALSE, 4, ARRAY['pro', 'premium']);


-- Sample lessons (course: Belajar Hangul)
-- youtube_video_id = ID YouTube (unlisted), bukan full URL
INSERT INTO public.lessons (course_id, title, description, youtube_video_id, duration_seconds, sort_order, is_published, is_preview)
VALUES
  ('11111111-0000-0000-0000-000000000001',
   'Apa itu Hangul?', 'Pengenalan sistem penulisan Korea dan sejarah singkatnya.',
   'YOUTUBE_ID_PLACEHOLDER_1', 180, 1, TRUE, TRUE),  -- is_preview: bisa ditonton gratis

  ('11111111-0000-0000-0000-000000000001',
   'Huruf Vokal Dasar', 'Pelajari 10 huruf vokal dasar dalam Hangul.',
   'YOUTUBE_ID_PLACEHOLDER_2', 240, 2, TRUE, FALSE),

  ('11111111-0000-0000-0000-000000000001',
   'Huruf Konsonan Dasar', 'Pelajari 14 huruf konsonan dasar dalam Hangul.',
   'YOUTUBE_ID_PLACEHOLDER_3', 270, 3, TRUE, FALSE),

  ('11111111-0000-0000-0000-000000000001',
   'Membaca Suku Kata', 'Cara menggabungkan vokal dan konsonan menjadi suku kata.',
   'YOUTUBE_ID_PLACEHOLDER_4', 300, 4, TRUE, FALSE),

  ('11111111-0000-0000-0000-000000000001',
   'Latihan Membaca Kata', 'Praktik membaca kata-kata sederhana bahasa Korea.',
   'YOUTUBE_ID_PLACEHOLDER_5', 240, 5, TRUE, FALSE);


-- Sample quiz questions (lesson 2: Huruf Vokal Dasar)
-- Ambil id lesson dulu
DO $$
DECLARE
  v_lesson_id UUID;
BEGIN
  SELECT id INTO v_lesson_id
  FROM public.lessons
  WHERE title = 'Huruf Vokal Dasar'
  LIMIT 1;

  INSERT INTO public.quiz_questions (lesson_id, question_text, options, correct_answer, explanation, sort_order)
  VALUES
    (v_lesson_id,
     'Huruf vokal mana yang melambangkan bunyi "A" dalam Hangul?',
     '[{"key":"a","text":"ㅏ"},{"key":"b","text":"ㅣ"},{"key":"c","text":"ㅗ"},{"key":"d","text":"ㅜ"}]',
     'a', 'ㅏ dibaca seperti "a" dalam kata "apa".', 1),

    (v_lesson_id,
     'Vokal ㅣ dibaca seperti bunyi apa?',
     '[{"key":"a","text":"u"},{"key":"b","text":"o"},{"key":"c","text":"i"},{"key":"d","text":"e"}]',
     'c', 'ㅣ dibaca seperti "i" dalam kata "ikan".', 2),

    (v_lesson_id,
     'Huruf vokal mana yang melambangkan bunyi "U"?',
     '[{"key":"a","text":"ㅏ"},{"key":"b","text":"ㅗ"},{"key":"c","text":"ㅣ"},{"key":"d","text":"ㅜ"}]',
     'd', 'ㅜ dibaca seperti "u" dalam kata "untuk".', 3),

    (v_lesson_id,
     'Berapa jumlah huruf vokal dasar dalam Hangul?',
     '[{"key":"a","text":"8"},{"key":"b","text":"10"},{"key":"c","text":"12"},{"key":"d","text":"14"}]',
     'b', 'Hangul memiliki 10 huruf vokal dasar (모음).', 4),

    (v_lesson_id,
     'Vokal ㅗ dibaca seperti bunyi apa?',
     '[{"key":"a","text":"a"},{"key":"b","text":"i"},{"key":"c","text":"o"},{"key":"d","text":"u"}]',
     'c', 'ㅗ dibaca seperti "o" dalam kata "obat".', 5);
END $$;


-- Sample digital product
INSERT INTO public.digital_products (title, description, price, file_path, product_type, is_active, download_limit)
VALUES
  ('Flashcard Hangul Lengkap',
   'Kumpulan 50+ flashcard digital huruf Hangul dengan contoh kata, cocok untuk pemula.',
   49000,
   'pdf/flashcard-hangul-v1.pdf',
   'pdf', TRUE, 5),

  ('Worksheet Latihan Menulis Hangul',
   'Lembar kerja printable untuk latihan menulis huruf Korea dari dasar.',
   29000,
   'pdf/worksheet-hangul-v1.pdf',
   'pdf', TRUE, 5);
