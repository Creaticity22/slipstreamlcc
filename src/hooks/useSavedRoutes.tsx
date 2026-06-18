import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SavedRoute {
  id: string;
  label: string;
  from_place: string;
  to_place: string;
  from_coords: { lat: number; lng: number } | null;
  to_coords: { lat: number; lng: number } | null;
  created_at: string;
}

export function useSavedRoutes() {
  const { user } = useAuth();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSavedRoutes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("saved_routes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && Array.isArray(data)) {
      setSavedRoutes(data as SavedRoute[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveRoute = useCallback(
    async (
      label: string,
      from: string,
      to: string,
      fromCoords?: { lat: number; lng: number },
      toCoords?: { lat: number; lng: number }
    ) => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("saved_routes")
        .insert({
          user_id: user.id,
          label,
          from_place: from,
          to_place: to,
          from_coords: fromCoords ?? null,
          to_coords: toCoords ?? null,
        })
        .select()
        .single();
      if (!error && data) {
        setSavedRoutes((prev) => [data as SavedRoute, ...prev]);
        return data as SavedRoute;
      }
      return null;
    },
    [user]
  );

  const deleteRoute = useCallback(async (id: string) => {
    const { error } = await (supabase as any).from("saved_routes").delete().eq("id", id);
    if (!error) {
      setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
    }
  }, []);

  return { savedRoutes, loading, saveRoute, deleteRoute, refresh };
}
