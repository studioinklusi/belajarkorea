-- ============================================================
-- MIGRATION: 001_initial_schema.sql (v2 — Idempotent)
-- Project  : Korean Learning Platform
-- PRD Ver  : v2.0
-- SAFE TO RE-RUN: menggunakan IF NOT EXISTS di semua statement
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS (CREATE OR REPLACE = aman di-rerun)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_subscription_grace()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL THEN
    NEW.grace_until = NEW.expires_at + INTERVAL '3 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_progress_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.has_active_subscription(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = uid
      AND status IN ('active', 'grace_period')
      AND grace_until > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_role(uid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role IN ('content_admin', 'super_admin') FROM public.profiles WHERE id = uid),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'super_admin' FROM public.profiles WHERE id = uid),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'student'
              CHECK (role IN ('student', 'content_admin', 'super_admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 2. PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  price         INTEGER NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  description   TEXT,
  features      JSONB,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.packages (name, slug, price, duration_days, description, features, sort_order)
VALUES
  ('Basic',   'basic',   0, 30, 'Akses course level Beginner',
   '["Akses kursus Beginner","Progress tracking","5 soal quiz per lesson"]'::jsonb, 1),
  ('Pro',     'pro',     0, 30, 'Akses semua level course',
   '["Akses semua level","Progress tracking","5 soal quiz per lesson","Sertifikat completion"]'::jsonb, 2),
  ('Premium', 'premium', 0, 30, 'Akses semua level + produk digital',
   '["Akses semua level","Progress tracking","5 soal quiz per lesson","Sertifikat completion","Produk digital (PDF & template)"]'::jsonb, 3)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 3. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id  UUID NOT NULL REFERENCES public.packages(id),
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'grace_period', 'expired', 'cancelled')),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  grace_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON public.subscriptions(expires_at);

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_subscription_grace ON public.subscriptions;
CREATE TRIGGER trg_subscription_grace
  BEFORE INSERT OR UPDATE OF expires_at ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_subscription_grace();


-- ============================================================
-- 4. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.digital_products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  description    TEXT,
  price          INTEGER NOT NULL,
  file_path      TEXT NOT NULL,
  thumbnail_url  TEXT,
  product_type   TEXT NOT NULL DEFAULT 'pdf'
                 CHECK (product_type IN ('pdf', 'template', 'other')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  download_limit INTEGER NOT NULL DEFAULT 5,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.digital_products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.digital_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id          UUID REFERENCES public.packages(id),
  product_id          UUID REFERENCES public.digital_products(id),
  order_id            TEXT NOT NULL UNIQUE,
  amount              INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'success', 'failed', 'expired', 'refunded')),
  payment_type        TEXT,
  midtrans_order_id   TEXT UNIQUE,
  snap_token          TEXT,
  webhook_received_at TIMESTAMPTZ,
  idempotency_key     TEXT UNIQUE,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status  ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_order   ON public.transactions(order_id);

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- 5. COURSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  level            TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  thumbnail_url    TEXT,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  required_package TEXT[] NOT NULL DEFAULT ARRAY['pro', 'premium'],
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_level     ON public.courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_slug      ON public.courses(slug);

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- 6. LESSONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  youtube_video_id TEXT NOT NULL,
  duration_seconds INTEGER,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  is_preview       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_sort      ON public.lessons(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_preview   ON public.lessons(is_preview) WHERE is_preview = TRUE;

DROP TRIGGER IF EXISTS trg_lessons_updated_at ON public.lessons;
CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================
-- 7. USER PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id      UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'not_started'
                 CHECK (status IN ('not_started', 'in_progress', 'completed')),
  watch_duration INTEGER NOT NULL DEFAULT 0,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user_id   ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson_id ON public.user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_progress_status    ON public.user_progress(user_id, status);

DROP TRIGGER IF EXISTS trg_progress_updated_at ON public.user_progress;
CREATE TRIGGER trg_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_progress_completion ON public.user_progress;
CREATE TRIGGER trg_progress_completion
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_progress_completion();


-- ============================================================
-- 8. QUIZ QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id      UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question_text  TEXT NOT NULL,
  options        JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation    TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson ON public.quiz_questions(lesson_id);


-- ============================================================
-- 9. QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id      UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  answers        JSONB NOT NULL,
  score          INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  passed         BOOLEAN NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_lesson ON public.quiz_attempts(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_id     ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score  ON public.quiz_attempts(user_id, lesson_id, score DESC);


-- ============================================================
-- 10. PRODUCT PURCHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_purchases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES public.digital_products(id),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.product_purchases(user_id);

-- FK packages
CREATE INDEX IF NOT EXISTS idx_packages_slug ON public.packages(slug);


-- ============================================================
-- ROW LEVEL SECURITY (aman di-rerun — ALTER tidak error jika sudah aktif)
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;


-- Drop policies dulu sebelum re-create (idempotent)
DO $$ BEGIN
  -- profiles
  DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_role"  ON public.profiles;
  -- packages
  DROP POLICY IF EXISTS "packages_select_all"   ON public.packages;
  DROP POLICY IF EXISTS "packages_admin_write"  ON public.packages;
  -- subscriptions
  DROP POLICY IF EXISTS "subscriptions_select_own"    ON public.subscriptions;
  DROP POLICY IF EXISTS "subscriptions_insert_system" ON public.subscriptions;
  DROP POLICY IF EXISTS "subscriptions_update_admin"  ON public.subscriptions;
  -- transactions
  DROP POLICY IF EXISTS "transactions_select_own"    ON public.transactions;
  DROP POLICY IF EXISTS "transactions_insert_own"    ON public.transactions;
  DROP POLICY IF EXISTS "transactions_update_system" ON public.transactions;
  -- courses
  DROP POLICY IF EXISTS "courses_select_published" ON public.courses;
  DROP POLICY IF EXISTS "courses_admin_write"      ON public.courses;
  -- lessons
  DROP POLICY IF EXISTS "lessons_select"      ON public.lessons;
  DROP POLICY IF EXISTS "lessons_admin_write" ON public.lessons;
  -- user_progress
  DROP POLICY IF EXISTS "progress_select_own"  ON public.user_progress;
  DROP POLICY IF EXISTS "progress_insert_own"  ON public.user_progress;
  DROP POLICY IF EXISTS "progress_update_own"  ON public.user_progress;
  -- quiz_questions
  DROP POLICY IF EXISTS "quiz_questions_select"      ON public.quiz_questions;
  DROP POLICY IF EXISTS "quiz_questions_admin_write" ON public.quiz_questions;
  -- quiz_attempts
  DROP POLICY IF EXISTS "attempts_select_own"  ON public.quiz_attempts;
  DROP POLICY IF EXISTS "attempts_insert_own"  ON public.quiz_attempts;
  -- digital_products
  DROP POLICY IF EXISTS "products_select_active" ON public.digital_products;
  DROP POLICY IF EXISTS "products_admin_write"   ON public.digital_products;
  -- product_purchases
  DROP POLICY IF EXISTS "purchases_select_own"    ON public.product_purchases;
  DROP POLICY IF EXISTS "purchases_insert_system" ON public.product_purchases;
  DROP POLICY IF EXISTS "purchases_update_own"    ON public.product_purchases;
END $$;

-- RLS: profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_update_role" ON public.profiles
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

-- RLS: packages
CREATE POLICY "packages_select_all" ON public.packages
  FOR SELECT USING (is_active = TRUE OR public.is_admin(auth.uid()));
CREATE POLICY "packages_admin_write" ON public.packages
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS: subscriptions
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "subscriptions_insert_system" ON public.subscriptions
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "subscriptions_update_admin" ON public.subscriptions
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- RLS: transactions
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "transactions_update_system" ON public.transactions
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

-- RLS: courses
CREATE POLICY "courses_select_published" ON public.courses
  FOR SELECT USING (is_published = TRUE OR public.is_admin(auth.uid()));
CREATE POLICY "courses_admin_write" ON public.courses
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS: lessons (KRITIS — youtube_video_id terlindungi)
CREATE POLICY "lessons_select" ON public.lessons
  FOR SELECT USING (
    is_published = TRUE
    AND (
      is_preview = TRUE
      OR public.has_active_subscription(auth.uid())
      OR public.is_admin(auth.uid())
    )
  );
CREATE POLICY "lessons_admin_write" ON public.lessons
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS: user_progress
CREATE POLICY "progress_select_own" ON public.user_progress
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "progress_insert_own" ON public.user_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "progress_update_own" ON public.user_progress
  FOR UPDATE USING (user_id = auth.uid());

-- RLS: quiz_questions
CREATE POLICY "quiz_questions_select" ON public.quiz_questions
  FOR SELECT USING (public.has_active_subscription(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "quiz_questions_admin_write" ON public.quiz_questions
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS: quiz_attempts
CREATE POLICY "attempts_select_own" ON public.quiz_attempts
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "attempts_insert_own" ON public.quiz_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid() AND public.has_active_subscription(auth.uid()));

-- RLS: digital_products
CREATE POLICY "products_select_active" ON public.digital_products
  FOR SELECT USING (is_active = TRUE OR public.is_admin(auth.uid()));
CREATE POLICY "products_admin_write" ON public.digital_products
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS: product_purchases
CREATE POLICY "purchases_select_own" ON public.product_purchases
  FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "purchases_insert_system" ON public.product_purchases
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "purchases_update_own" ON public.product_purchases
  FOR UPDATE USING (user_id = auth.uid());


-- ============================================================
-- VIEWS
-- ============================================================
CREATE OR REPLACE VIEW public.v_active_subscriptions AS
SELECT
  s.id, s.user_id,
  p.full_name,
  pk.name AS package_name,
  pk.slug AS package_slug,
  s.status, s.started_at, s.expires_at, s.grace_until,
  CASE
    WHEN s.expires_at > NOW()   THEN 'active'
    WHEN s.grace_until > NOW()  THEN 'grace_period'
    ELSE 'expired'
  END AS computed_status,
  GREATEST(0, EXTRACT(EPOCH FROM (s.expires_at - NOW())) / 86400)::INTEGER AS days_remaining
FROM public.subscriptions s
JOIN public.profiles p  ON p.id = s.user_id
JOIN public.packages pk ON pk.id = s.package_id
WHERE s.status IN ('active', 'grace_period');

CREATE OR REPLACE VIEW public.v_course_progress AS
SELECT
  up.user_id, l.course_id,
  c.title AS course_title,
  c.level AS course_level,
  COUNT(l.id) AS total_lessons,
  COUNT(up.id) FILTER (WHERE up.status = 'completed') AS completed_lessons,
  ROUND(
    COUNT(up.id) FILTER (WHERE up.status = 'completed')::NUMERIC
    / NULLIF(COUNT(l.id), 0) * 100
  ) AS completion_percentage
FROM public.lessons l
JOIN public.courses c ON c.id = l.course_id
LEFT JOIN public.user_progress up ON up.lesson_id = l.id
WHERE l.is_published = TRUE
GROUP BY up.user_id, l.course_id, c.title, c.level;

CREATE OR REPLACE VIEW public.v_best_quiz_scores AS
SELECT
  user_id, lesson_id,
  MAX(score)        AS best_score,
  MAX(passed::INT)  AS ever_passed,
  COUNT(*)          AS total_attempts,
  MAX(completed_at) AS last_attempt_at
FROM public.quiz_attempts
GROUP BY user_id, lesson_id;


-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('digital-products', 'digital-products', FALSE),
  ('thumbnails',       'thumbnails',       TRUE)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  DROP POLICY IF EXISTS "digital_products_download" ON storage.objects;
  DROP POLICY IF EXISTS "digital_products_upload"   ON storage.objects;
  DROP POLICY IF EXISTS "thumbnails_public_read"    ON storage.objects;
  DROP POLICY IF EXISTS "thumbnails_upload"         ON storage.objects;
END $$;

CREATE POLICY "digital_products_download" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'digital-products'
    AND auth.uid() IN (
      SELECT pp.user_id FROM public.product_purchases pp
      JOIN public.digital_products dp ON dp.id = pp.product_id
      WHERE dp.file_path = storage.objects.name
    )
  );

CREATE POLICY "digital_products_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'digital-products' AND public.is_admin(auth.uid())
  );

CREATE POLICY "thumbnails_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' AND public.is_admin(auth.uid())
  );


-- ============================================================
-- DONE — Schema Korean Learning Platform v2.0
-- ============================================================
