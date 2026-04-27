import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FrequentJourney {
  id: string;
  from_location: string;
  to_location: string;
  label: string | null;
  usage_count: number;
  last_used_at: string;
}

export function useFrequentJourneys(limit = 4) {
  const { user } = useAuth();
  const [journeys, setJourneys] = useState<FrequentJourney[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setJourneys([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("favourite_routes")
      .select("id, from_location, to_location, label, usage_count, last_used_at")
      .eq("user_id", user.id)
      .order("usage_count", { ascending: false })
      .order("last_used_at", { ascending: false })
      .limit(limit);
    if (!error && data) setJourneys(data as FrequentJourney[]);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Records or increments usage of a journey. Safe to fire-and-forget. */
  const logJourney = useCallback(
    async (from: string, to: string) => {
      if (!user || !from?.trim() || !to?.trim()) return;
      const { error } = await supabase.rpc("log_journey_usage", {
        p_from: from.trim(),
        p_to: to.trim(),
      });
      if (!error) refresh();
    },
    [user, refresh]
  );

  const removeJourney = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("favourite_routes").delete().eq("id", id);
      if (!error) setJourneys((prev) => prev.filter((j) => j.id !== id));
    },
    []
  );

  return { journeys, loading, refresh, logJourney, removeJourney };
}
