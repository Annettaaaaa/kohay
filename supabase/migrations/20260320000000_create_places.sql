CREATE TABLE IF NOT EXISTS public.places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT,
  confidence TEXT DEFAULT 'medium',
  source_url TEXT,
  source_caption TEXT,
  source_username TEXT,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Public read and insert (no auth required for now)
CREATE POLICY "Allow public read" ON public.places FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.places FOR INSERT WITH CHECK (true);
