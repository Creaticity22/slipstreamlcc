
-- CO2 leaderboard view
CREATE OR REPLACE VIEW public.co2_leaderboard AS
  SELECT
    p.user_id,
    COALESCE(NULLIF(p.display_name, ''), 'Traveller') AS display_name,
    COALESCE(SUM(t.co2_saved_kg), 0)::numeric(8,2) AS total_co2_saved_kg,
    COUNT(t.id) AS trip_count
  FROM public.profiles p
  LEFT JOIN public.trips t ON t.user_id = p.user_id
  GROUP BY p.user_id, p.display_name
  ORDER BY total_co2_saved_kg DESC
  LIMIT 50;

GRANT SELECT ON public.co2_leaderboard TO anon, authenticated;

-- Saved routes
CREATE TABLE IF NOT EXISTS public.saved_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  from_place text NOT NULL,
  to_place text NOT NULL,
  from_coords jsonb,
  to_coords jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_routes TO authenticated;
GRANT ALL ON public.saved_routes TO service_role;

ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved routes"
  ON public.saved_routes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
