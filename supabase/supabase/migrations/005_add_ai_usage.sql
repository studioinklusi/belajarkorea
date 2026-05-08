-- Migration: Add AI usage tracking for rate limiting

CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_stamp DATE NOT NULL DEFAULT CURRENT_DATE,
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date_stamp)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage(user_id, date_stamp);

-- Trigger to auto update 'updated_at'
DROP TRIGGER IF EXISTS trg_ai_usage_updated_at ON public.ai_usage;
CREATE TRIGGER trg_ai_usage_updated_at
    BEFORE UPDATE ON public.ai_usage
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS (allow users to read their own usage)
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ai usage"
    ON public.ai_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage ai usage"
    ON public.ai_usage FOR ALL
    USING (true);
