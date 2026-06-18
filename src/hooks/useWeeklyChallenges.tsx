import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ChallengeDefinition,
  currentWeekStart,
  getChallengeDefinition,
  pickWeeklyChallenges,
} from "@/lib/challenges";

export interface WeeklyChallengeRow {
  id: string;
  challenge_key: string;
  target: number;
  progress: number;
  completed_at: string | null;
  points_awarded: number;
  week_start: string;
  definition: ChallengeDefinition;
}

export function useWeeklyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<WeeklyChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setChallenges([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const weekStart = currentWeekStart();
    const picks = pickWeeklyChallenges(user.id, weekStart);

    // Seed any missing rows via SECURITY DEFINER RPC (clients cannot write directly).
    const { data: ensured } = await supabase.rpc("ensure_weekly_challenges", {
      p_week_start: weekStart,
      p_picks: picks.map((p) => ({ challenge_key: p.key, target: p.target })) as any,
    });

    const data = ensured ?? [];

    const enriched: WeeklyChallengeRow[] = (data ?? [])
      .map((r) => {
        const def = getChallengeDefinition(r.challenge_key);
        if (!def) return null;
        return { ...r, definition: def } as WeeklyChallengeRow;
      })
      .filter((r): r is WeeklyChallengeRow => r !== null)
      // keep deterministic order matching the pool order
      .sort((a, b) => picks.findIndex((p) => p.key === a.challenge_key) - picks.findIndex((p) => p.key === b.challenge_key));

    setChallenges(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const updateProgress = useCallback(
    async (challengeKey: string, newProgress: number) => {
      if (!user) return;
      const row = challenges.find((c) => c.challenge_key === challengeKey);
      if (!row) return;
      // No-op if already complete or no increase
      if (row.completed_at) return;
      const capped = Math.max(row.progress, Math.floor(newProgress));
      if (capped === row.progress && capped < row.target) return;

      if (capped >= row.target) {
        // Server-side completion + points (idempotent)
        const { data, error } = await supabase.rpc("complete_weekly_challenge", {
          p_challenge_id: row.id,
          p_points: row.definition.pointsReward,
        });
        if (!error && data) {
          setChallenges((prev) =>
            prev.map((c) =>
              c.id === row.id
                ? {
                    ...c,
                    progress: Math.max(c.progress, c.target),
                    completed_at: data.completed_at,
                    points_awarded: data.points_awarded,
                  }
                : c
            )
          );
        }
      } else {
        const { data, error } = await supabase.rpc("update_challenge_progress", {
          p_challenge_id: row.id,
          p_progress: capped,
        });
        if (!error && data) {
          setChallenges((prev) =>
            prev.map((c) => (c.id === row.id ? { ...c, progress: data.progress } : c))
          );
        }
      }
    },
    [user, challenges]
  );

  return { challenges, loading, updateProgress, refresh: load };
}
