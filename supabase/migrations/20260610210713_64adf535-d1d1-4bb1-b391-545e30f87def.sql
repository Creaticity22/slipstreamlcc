-- Prevent users from modifying gamification columns on their profile via client
CREATE OR REPLACE FUNCTION public.prevent_profile_gamification_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only block when the change comes from anon/authenticated (not service_role/definer flows)
  IF current_setting('request.jwt.claims', true) IS NOT NULL
     AND (current_setting('request.jwt.claims', true)::jsonb ->> 'role') IN ('authenticated','anon') THEN
    IF NEW.total_points IS DISTINCT FROM OLD.total_points
       OR NEW.level IS DISTINCT FROM OLD.level
       OR NEW.streak_days IS DISTINCT FROM OLD.streak_days
       OR NEW.total_co2_saved IS DISTINCT FROM OLD.total_co2_saved THEN
      RAISE EXCEPTION 'Gamification fields can only be modified by the server';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_lock_gamification ON public.profiles;
CREATE TRIGGER profiles_lock_gamification
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_gamification_updates();