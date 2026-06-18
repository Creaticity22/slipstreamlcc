import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Preferences {
  id?: string;
  user_id?: string;
  route_priority: "fastest" | "cheapest" | "fewest_changes" | "lowest_co2";
  step_free: boolean;
  low_walking: boolean;
  avoid_hills: boolean;
  late_night_default: boolean;
  low_data_mode: boolean;
  confidence_level: number;
  home_destination?: string | null;
}

const DEFAULTS: Preferences = {
  route_priority: "fewest_changes",
  step_free: false,
  low_walking: false,
  avoid_hills: false,
  late_night_default: false,
  low_data_mode: false,
  confidence_level: 3,
  home_destination: null,
};

export function usePreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPrefs(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setPrefs((data as Preferences) ?? { ...DEFAULTS, user_id: user.id });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (updates: Partial<Preferences>) => {
      if (!user) return;
      const next = { ...DEFAULTS, ...prefs, ...updates, user_id: user.id };
      const { data, error } = await supabase
        .from("preferences")
        .upsert(next, { onConflict: "user_id" })
        .select()
        .single();
      if (!error && data) setPrefs(data as Preferences);
    },
    [user, prefs]
  );

  return { prefs, loading, save, refresh };
}
