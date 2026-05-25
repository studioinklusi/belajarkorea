-- Create ai_buddy_sessions table
CREATE TABLE IF NOT EXISTS public.ai_buddy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  level TEXT NOT NULL,
  persona TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_buddy_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own sessions
CREATE POLICY "Users can select their own AI Buddy sessions"
  ON public.ai_buddy_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI Buddy sessions"
  ON public.ai_buddy_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI Buddy sessions"
  ON public.ai_buddy_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI Buddy sessions"
  ON public.ai_buddy_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_ai_buddy_sessions_updated ON public.ai_buddy_sessions;
CREATE TRIGGER on_ai_buddy_sessions_updated
  BEFORE UPDATE ON public.ai_buddy_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger function to limit chat sessions to 5 per user
CREATE OR REPLACE FUNCTION public.limit_user_chat_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.ai_buddy_sessions
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id
      FROM public.ai_buddy_sessions
      WHERE user_id = NEW.user_id
      ORDER BY updated_at DESC
      LIMIT 5
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce the 5-session limit after inserting a new session
DROP TRIGGER IF EXISTS enforce_max_chat_sessions ON public.ai_buddy_sessions;
CREATE TRIGGER enforce_max_chat_sessions
  AFTER INSERT ON public.ai_buddy_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.limit_user_chat_sessions();
