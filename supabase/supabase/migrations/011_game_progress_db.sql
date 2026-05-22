-- ============================================================
-- MIGRATION: 011_game_progress_db.sql
-- Description: Create user_game_scores table to persist game history and progress
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_game_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_slug   TEXT NOT NULL,
  game_mode   TEXT NOT NULL,
  score       INTEGER NOT NULL,
  accuracy    INTEGER NOT NULL,
  xp_earned   INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS user_game_scores_user_id_idx ON public.user_game_scores (user_id);
CREATE INDEX IF NOT EXISTS user_game_scores_game_slug_idx ON public.user_game_scores (game_slug);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_game_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own game scores" ON public.user_game_scores
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game scores" ON public.user_game_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
