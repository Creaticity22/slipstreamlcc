
DO $$
DECLARE
  demo_id uuid;
BEGIN
  SELECT id INTO demo_id FROM auth.users WHERE email = 'demo@slipstreamapp.co.uk';
  IF demo_id IS NULL THEN RETURN; END IF;

  -- Display name on profile (profiles keys off user_id)
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (demo_id, 'Demo Rider')
  ON CONFLICT (user_id) DO UPDATE SET display_name = 'Demo Rider';

  -- Trips (using actual schema: from_label / to_label / distance_km / co2_saved_kg)
  IF NOT EXISTS (SELECT 1 FROM public.trips WHERE user_id = demo_id) THEN
    INSERT INTO public.trips (user_id, from_label, to_label, distance_km, co2_saved_kg, created_at) VALUES
      (demo_id, '📍 My location', 'Leeds City College', 4.2, 0.37, now() - interval '1 day'),
      (demo_id, 'Headingley', 'Leeds City College', 3.8, 0.34, now() - interval '2 days'),
      (demo_id, '📍 My location', 'Leeds City College', 4.2, 0.37, now() - interval '3 days'),
      (demo_id, 'Kirkstall', 'Leeds City College', 2.9, 0.26, now() - interval '4 days'),
      (demo_id, '📍 My location', 'Leeds City College', 4.2, 0.37, now() - interval '5 days'),
      (demo_id, 'Headingley', 'University of Leeds', 1.4, 0.12, now() - interval '6 days'),
      (demo_id, '📍 My location', 'Leeds City College', 4.2, 0.37, now() - interval '7 days'),
      (demo_id, 'Burley', 'Leeds City College', 3.1, 0.28, now() - interval '8 days'),
      (demo_id, '📍 My location', 'Leeds City College', 4.2, 0.37, now() - interval '9 days'),
      (demo_id, 'Headingley', 'Leeds City College', 3.8, 0.34, now() - interval '10 days');
  END IF;

  -- Saved route
  IF NOT EXISTS (SELECT 1 FROM public.saved_routes WHERE user_id = demo_id) THEN
    INSERT INTO public.saved_routes (user_id, label, from_place, to_place)
    VALUES (demo_id, 'Home → College', 'Headingley', 'Leeds City College');
  END IF;

  -- Streak
  UPDATE public.profiles
     SET current_streak = 7,
         longest_streak = 12,
         last_trip_date = (now() - interval '1 day')::date
   WHERE user_id = demo_id;
END $$;
