
-- Server-side canonical points/targets per challenge_key
CREATE OR REPLACE FUNCTION public.complete_weekly_challenge(p_challenge_id uuid, p_points integer DEFAULT NULL)
RETURNS public.weekly_challenges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.weekly_challenges;
  v_points integer;
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

  IF v_row.completed_at IS NOT NULL THEN
    RETURN v_row;
  END IF;

  v_points := CASE v_row.challenge_key
    WHEN 'trips_5'    THEN 50
    WHEN 'early_bird' THEN 40
    WHEN 'new_route'  THEN 60
    WHEN 'co2_1kg'    THEN 75
    WHEN 'streak_3'   THEN 45
    ELSE 0
  END;

  UPDATE public.weekly_challenges
     SET completed_at = now(),
         points_awarded = v_points,
         progress = GREATEST(progress, target)
   WHERE id = p_challenge_id
   RETURNING * INTO v_row;

  UPDATE public.profiles
     SET total_points = COALESCE(total_points, 0) + v_points
   WHERE user_id = auth.uid();

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_weekly_challenges(p_week_start date, p_picks jsonb)
RETURNS SETOF public.weekly_challenges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_pick jsonb;
  v_key text;
  v_target integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR v_pick IN SELECT * FROM jsonb_array_elements(p_picks) LOOP
    v_key := v_pick->>'challenge_key';

    v_target := CASE v_key
      WHEN 'trips_5'    THEN 5
      WHEN 'early_bird' THEN 3
      WHEN 'new_route'  THEN 1
      WHEN 'co2_1kg'    THEN 1
      WHEN 'streak_3'   THEN 3
      ELSE NULL
    END;

    IF v_target IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.weekly_challenges (user_id, week_start, challenge_key, target)
    VALUES (v_uid, p_week_start, v_key, v_target)
    ON CONFLICT (user_id, week_start, challenge_key) DO NOTHING;
  END LOOP;

  RETURN QUERY
    SELECT * FROM public.weekly_challenges
    WHERE user_id = v_uid AND week_start = p_week_start;
END;
$$;
