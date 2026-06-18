ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS distance_km numeric,
  ADD COLUMN IF NOT EXISTS co2_saved_kg numeric,
  ADD COLUMN IF NOT EXISTS mode text;

ALTER TABLE public.preferences
  ADD COLUMN IF NOT EXISTS home_destination text;