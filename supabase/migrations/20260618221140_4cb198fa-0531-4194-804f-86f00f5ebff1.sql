-- Restrict authenticated UPDATE on profiles to safe columns only.
-- Gamification columns can only be modified by service_role (server-side).
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, avatar_url, onboarded) ON public.profiles TO authenticated;
-- service_role retains full access via existing GRANT ALL.