
DROP VIEW IF EXISTS public.co2_leaderboard;

CREATE OR REPLACE FUNCTION public.get_co2_leaderboard()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  total_co2_saved_kg numeric,
  trip_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_co2_leaderboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_co2_leaderboard() TO authenticated;
