
-- 1) Remove insecure public-shared-trips SELECT policy on trips.
-- Public access goes through get_shared_trip(token) SECURITY DEFINER RPC.
DROP POLICY IF EXISTS "Public view shared trips" ON public.trips;

-- 2) Lock down weekly_challenges writes from clients.
DROP POLICY IF EXISTS "users manage own challenges" ON public.weekly_challenges;

CREATE POLICY "Users view own challenges"
  ON public.weekly_challenges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE intentionally restricted to service_role and SECURITY DEFINER functions.

REVOKE INSERT, UPDATE, DELETE ON public.weekly_challenges FROM authenticated;
GRANT SELECT ON public.weekly_challenges TO authenticated;

-- 3) SECURITY DEFINER RPCs so the client can seed weekly rows and bump progress
-- without being able to forge completed_at / points_awarded.

CREATE OR REPLACE FUNCTION public.ensure_weekly_challenges(
  p_week_start date,
  p_picks jsonb
)
RETURNS SETOF public.weekly_challenges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pick jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR v_pick IN SELECT * FROM jsonb_array_elements(p_picks) LOOP
    INSERT INTO public.weekly_challenges (user_id, week_start, challenge_key, target)
    VALUES (
      v_uid,
      p_week_start,
      v_pick->>'challenge_key',
      GREATEST(COALESCE((v_pick->>'target')::int, 1), 1)
    )
    ON CONFLICT (user_id, week_start, challenge_key) DO NOTHING;
  END LOOP;

  RETURN QUERY
    SELECT * FROM public.weekly_challenges
    WHERE user_id = v_uid AND week_start = p_week_start;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_challenge_progress(
  p_challenge_id uuid,
  p_progress integer
)
RETURNS public.weekly_challenges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.weekly_challenges;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row
    FROM public.weekly_challenges
   WHERE id = p_challenge_id AND user_id = auth.uid()
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  -- Cannot modify a completed challenge, and cannot decrease progress.
  IF v_row.completed_at IS NOT NULL THEN
    RETURN v_row;
  END IF;

  UPDATE public.weekly_challenges
     SET progress = LEAST(GREATEST(v_row.progress, p_progress), v_row.target - 1)
   WHERE id = p_challenge_id
   RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_weekly_challenges(date, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_weekly_challenges(date, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.update_challenge_progress(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_challenge_progress(uuid, integer) TO authenticated;
