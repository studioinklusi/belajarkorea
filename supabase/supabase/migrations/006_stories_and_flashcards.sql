-- Migration: 006_stories_and_flashcards.sql
-- Description: Add tables for reading stories, reading progress, and personal flashcards (SRS).

-- 1. Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ko TEXT NOT NULL,
    title_id TEXT NOT NULL,
    title_en TEXT,
    content_ko TEXT NOT NULL,
    content_id TEXT NOT NULL,
    content_en TEXT,
    content_tokens JSONB NOT NULL DEFAULT '[]'::jsonb, -- Morphological tokens array
    level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT NOT NULL DEFAULT 'general',
    cover_image_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for public.stories.updated_at
DROP TRIGGER IF EXISTS trg_stories_updated_at ON public.stories;
CREATE TRIGGER trg_stories_updated_at
    BEFORE UPDATE ON public.stories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Create user_stories_progress table
CREATE TABLE IF NOT EXISTS public.user_stories_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

-- 3. Create user_flashcards table (with SM-2 SRS parameters)
CREATE TABLE IF NOT EXISTS public.user_flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    word_ko TEXT NOT NULL,
    word_base_ko TEXT NOT NULL,
    translation_id TEXT NOT NULL,
    translation_en TEXT,
    romanization TEXT,
    part_of_speech TEXT,
    context_sentence_ko TEXT NOT NULL,
    context_sentence_id TEXT NOT NULL,
    story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
    
    -- SRS Parameters (SM-2 Algorithm)
    box_level INTEGER NOT NULL DEFAULT 1 CHECK (box_level BETWEEN 1 AND 5),
    interval_days INTEGER NOT NULL DEFAULT 1,
    ease_factor NUMERIC NOT NULL DEFAULT 2.5,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, word_ko, context_sentence_ko)
);

-- Trigger for public.user_flashcards.updated_at
DROP TRIGGER IF EXISTS trg_user_flashcards_updated_at ON public.user_flashcards;
CREATE TRIGGER trg_user_flashcards_updated_at
    BEFORE UPDATE ON public.user_flashcards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcards ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Stories SELECT: Users with active subscriptions, gated by package/slug
-- Basic gets only beginner, Pro/Premium gets intermediate/advanced as well. Admins get everything.
DROP POLICY IF EXISTS "stories_select_policy" ON public.stories;
CREATE POLICY "stories_select_policy" ON public.stories
    FOR SELECT USING (
        public.is_admin(auth.uid()) OR
        (is_published = TRUE AND (
            -- Level Beginner is open to any active subscription
            (level = 'beginner' AND EXISTS (
                SELECT 1 FROM public.v_active_subscriptions 
                WHERE user_id = auth.uid() AND computed_status = 'active'
            ))
            OR
            -- Level Intermediate/Advanced requires Pro or Premium active subscription
            (level IN ('intermediate', 'advanced') AND EXISTS (
                SELECT 1 FROM public.v_active_subscriptions 
                WHERE user_id = auth.uid() AND computed_status = 'active'
                  AND SPLIT_PART(package_slug, '-', 1) IN ('pro', 'premium')
            ))
        ))
    );

-- Admin CRUD for stories
DROP POLICY IF EXISTS "stories_admin_policy" ON public.stories;
CREATE POLICY "stories_admin_policy" ON public.stories
    FOR ALL USING (public.is_admin(auth.uid()));

-- User stories progress policies
DROP POLICY IF EXISTS "progress_select_own" ON public.user_stories_progress;
CREATE POLICY "progress_select_own" ON public.user_stories_progress
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "progress_insert_own" ON public.user_stories_progress;
CREATE POLICY "progress_insert_own" ON public.user_stories_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "progress_update_own" ON public.user_stories_progress;
CREATE POLICY "progress_update_own" ON public.user_stories_progress
    FOR UPDATE USING (user_id = auth.uid());

-- User flashcards policies
DROP POLICY IF EXISTS "flashcards_select_own" ON public.user_flashcards;
CREATE POLICY "flashcards_select_own" ON public.user_flashcards
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "flashcards_insert_own" ON public.user_flashcards;
CREATE POLICY "flashcards_insert_own" ON public.user_flashcards
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "flashcards_update_own" ON public.user_flashcards;
CREATE POLICY "flashcards_update_own" ON public.user_flashcards
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "flashcards_delete_own" ON public.user_flashcards;
CREATE POLICY "flashcards_delete_own" ON public.user_flashcards
    FOR DELETE USING (user_id = auth.uid());

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_level_published ON public.stories(level, is_published);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_review ON public.user_flashcards(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_progress_user_story ON public.user_stories_progress(user_id, story_id);
