import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function todayISO(d = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86_400_000);
}

export function useStreak() {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lastTripDate, setLastTripDate] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("current_streak, longest_streak, last_trip_date")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setCurrentStreak(data.current_streak ?? 0);
      setLongestStreak(data.longest_streak ?? 0);
      setLastTripDate(data.last_trip_date ?? null);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordTrip = useCallback(async () => {
    if (!user) return;
    const today = todayISO();
    if (lastTripDate === today) return;

    let next = 1;
    if (lastTripDate && daysBetween(lastTripDate, today) === 1) {
      next = currentStreak + 1;
    }
    const longest = Math.max(longestStreak, next);

    const { error } = await supabase
      .from("profiles")
      .update({
        current_streak: next,
        longest_streak: longest,
        last_trip_date: today,
      })
      .eq("user_id", user.id);

    if (!error) {
      setCurrentStreak(next);
      setLongestStreak(longest);
      setLastTripDate(today);
    }
    return next;
  }, [user, lastTripDate, currentStreak, longestStreak]);

  return { currentStreak, longestStreak, lastTripDate, recordTrip, refresh };
}
