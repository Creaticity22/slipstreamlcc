
-- Streak columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_trip_date date;

-- weekly_challenges table
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  challenge_key text NOT NULL,
  target integer NOT NULL DEFAULT 1,
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start, challenge_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_challenges TO authenticated;
GRANT ALL ON public.weekly_challenges TO service_role;

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own challenges" ON public.weekly_challenges;
CREATE POLICY "users manage own challenges"
  ON public.weekly_challenges
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Security-definer function: complete a challenge and credit points atomically.
-- Idempotent: only credits points if completed_at was null.
CREATE OR REPLACE FUNCTION public.complete_weekly_challenge(
  p_challenge_id uuid,
  p_points integer
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

  IF v_row.completed_at IS NOT NULL THEN
    RETURN v_row; -- already completed, idempotent
  END IF;

  UPDATE public.weekly_challenges
     SET completed_at = now(),
         points_awarded = GREATEST(p_points, 0),
         progress = GREATEST(progress, target)
   WHERE id = p_challenge_id
   RETURNING * INTO v_row;

  -- Credit points on the profile, bypassing the client-side lock (SECURITY DEFINER)
  UPDATE public.profiles
     SET total_points = COALESCE(total_points, 0) + GREATEST(p_points, 0)
   WHERE user_id = auth.uid();

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_weekly_challenge(uuid, integer) TO authenticated;
