-- Add usage tracking to favourite_routes so we can surface most-used journeys
ALTER TABLE public.favourite_routes
  ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone NOT NULL DEFAULT now();

-- Helpful index for ordering by frequency
CREATE INDEX IF NOT EXISTS favourite_routes_user_frequency_idx
  ON public.favourite_routes (user_id, usage_count DESC, last_used_at DESC);

-- Function to upsert a journey: increments usage_count if same from/to exists,
-- otherwise inserts a new row. Uses SECURITY INVOKER so RLS still applies.
CREATE OR REPLACE FUNCTION public.log_journey_usage(
  p_from text,
  p_to text
)
RETURNS public.favourite_routes
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  existing public.favourite_routes;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO existing
  FROM public.favourite_routes
  WHERE user_id = auth.uid()
    AND lower(from_location) = lower(p_from)
    AND lower(to_location) = lower(p_to)
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.favourite_routes
       SET usage_count = existing.usage_count + 1,
           last_used_at = now()
     WHERE id = existing.id
     RETURNING * INTO existing;
    RETURN existing;
  END IF;

  INSERT INTO public.favourite_routes (user_id, from_location, to_location, usage_count, last_used_at)
  VALUES (auth.uid(), p_from, p_to, 1, now())
  RETURNING * INTO existing;

  RETURN existing;
END;
$$;

-- Allow users to update their own favourites (needed for the increment path
-- when called outside the function, e.g. renaming labels)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'favourite_routes'
      AND policyname = 'Users can update own favourites'
  ) THEN
    CREATE POLICY "Users can update own favourites"
      ON public.favourite_routes
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;