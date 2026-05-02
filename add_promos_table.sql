-- Create promos table
CREATE TABLE IF NOT EXISTS public.promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active promos
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.promos FOR SELECT
  USING (true);

-- Allow admins to do everything
CREATE POLICY "Admins can manage promos"
  ON public.promos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_promos_updated ON public.promos;
CREATE TRIGGER on_promos_updated
  BEFORE UPDATE ON public.promos
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
