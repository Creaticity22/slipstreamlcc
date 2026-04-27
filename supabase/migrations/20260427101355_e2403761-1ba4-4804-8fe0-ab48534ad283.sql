-- PLACES
CREATE TABLE public.places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  address_text TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own places" ON public.places FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own places" ON public.places FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own places" ON public.places FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own places" ON public.places FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_places_updated BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PREFERENCES (one row per user)
CREATE TABLE public.preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  route_priority TEXT NOT NULL DEFAULT 'fewest_changes',
  step_free BOOLEAN NOT NULL DEFAULT false,
  low_walking BOOLEAN NOT NULL DEFAULT false,
  avoid_hills BOOLEAN NOT NULL DEFAULT false,
  late_night_default BOOLEAN NOT NULL DEFAULT false,
  low_data_mode BOOLEAN NOT NULL DEFAULT false,
  confidence_level INTEGER NOT NULL DEFAULT 3,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own prefs" ON public.preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own prefs" ON public.preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prefs" ON public.preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER trg_prefs_updated BEFORE UPDATE ON public.preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SAFETY CONTACTS
CREATE TABLE public.safety_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  phone_or_email TEXT NOT NULL,
  preferred_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.safety_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own contacts" ON public.safety_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own contacts" ON public.safety_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own contacts" ON public.safety_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own contacts" ON public.safety_contacts FOR DELETE USING (auth.uid() = user_id);

-- TRIPS
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_label TEXT,
  to_label TEXT,
  plan_json JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress',
  current_step_number INTEGER NOT NULL DEFAULT 1,
  last_check_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own trips" ON public.trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);

-- CHECK INS
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own checkins" ON public.check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own checkins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TRIP SHARES (public read by token)
CREATE TABLE public.trip_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages shares" ON public.trip_shares FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view by token" ON public.trip_shares FOR SELECT USING (expires_at > now());

-- Allow public read of the trip + check-ins linked to a non-expired share
CREATE POLICY "Public view shared trips" ON public.trips FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trip_shares s WHERE s.trip_id = trips.id AND s.expires_at > now()));
CREATE POLICY "Public view shared checkins" ON public.check_ins FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.trip_shares s WHERE s.trip_id = check_ins.trip_id AND s.expires_at > now()));

-- GLOSSARY (public read)
CREATE TABLE public.glossary_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads glossary" ON public.glossary_terms FOR SELECT USING (true);

-- Seed glossary
INSERT INTO public.glossary_terms (term, definition, category) VALUES
  ('Peak time', 'The busiest travel times — usually 6:30–9:30am and 4–7pm on weekdays. Tickets can cost more.', 'tickets'),
  ('Off-peak', 'Quieter travel times outside of rush hour. Tickets are usually cheaper.', 'tickets'),
  ('Interchange', 'A place where you switch from one bus, train or tram to another to continue your journey.', 'travel'),
  ('Platform', 'The numbered area at a station where you wait for a specific train.', 'travel'),
  ('Stop', 'A bus stop is where the bus picks you up. Each stop has a code (e.g. Stop A3).', 'travel'),
  ('Step-free', 'A route or station with no stairs — useful for wheelchairs, prams or anyone who cannot use steps.', 'accessibility'),
  ('Single', 'A one-way ticket for one journey.', 'tickets'),
  ('Return', 'A ticket that covers the trip there and back.', 'tickets'),
  ('Day ticket', 'Unlimited travel on one operator''s services for one day.', 'tickets'),
  ('Tap on / tap off', 'Touching your contactless card or phone on the reader when you board and leave (used on some buses, trains, trams).', 'tickets'),
  ('Termini', 'The end of the line — where the bus or train finishes its route.', 'travel'),
  ('Operator', 'The company that runs the bus or train (e.g. First Bus, Arriva, Northern).', 'travel'),
  ('Live arrival', 'The actual time a bus or train is expected, based on its current GPS position.', 'travel'),
  ('Cancelled', 'A service that will not run. Look for the next departure or an alternative route.', 'travel');