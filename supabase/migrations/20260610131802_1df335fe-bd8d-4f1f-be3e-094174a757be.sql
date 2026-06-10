
-- 1. Trip shares: remove public select policy
DROP POLICY IF EXISTS "Public can view by token" ON public.trip_shares;

-- 2. Check-ins: remove public-via-shares policy
DROP POLICY IF EXISTS "Public view shared checkins" ON public.check_ins;

-- 3. Points log: remove user insert policy (only service_role/edge functions may insert)
DROP POLICY IF EXISTS "Users can insert own points" ON public.points_log;

-- 4. Secure RPC to fetch a shared trip by its token
CREATE OR REPLACE FUNCTION public.get_shared_trip(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share public.trip_shares;
  v_trip public.trips;
  v_checkins jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_share
    FROM public.trip_shares
   WHERE share_token = p_token
     AND expires_at > now()
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_trip FROM public.trips WHERE id = v_share.trip_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'type', c.type,
        'created_at', c.created_at
      ) ORDER BY c.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_checkins
  FROM public.check_ins c
  WHERE c.trip_id = v_share.trip_id;

  RETURN jsonb_build_object(
    'share', jsonb_build_object(
      'id', v_share.id,
      'trip_id', v_share.trip_id,
      'expires_at', v_share.expires_at
    ),
    'trip', to_jsonb(v_trip),
    'check_ins', v_checkins
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_trip(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_trip(text) TO anon, authenticated;

-- 5. Lock down SECURITY DEFINER trigger function (callable only by trigger / service_role)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
