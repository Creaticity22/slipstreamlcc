import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const CACHE_TTL_MS = 60_000;

export default function ImpactCard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState(0);
  const [points, setPoints] = useState(0);
  const [co2, setCo2] = useState(0);
  const lastFetchRef = useRef(0);

  useEffect(() => {
    if (!user) {
      setTrips(0);
      setPoints(0);
      setCo2(0);
      lastFetchRef.current = 0;
      return;
    }
    if (Date.now() - lastFetchRef.current < CACHE_TTL_MS) return;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    (async () => {
      const [{ data: tripRows }, { data: profile }] = await Promise.all([
        supabase
          .from("trips")
          .select("co2_saved_kg")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("started_at", sevenDaysAgo),
        supabase
          .from("profiles")
          .select("total_points")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      const rows = tripRows ?? [];
      setTrips(rows.length);
      setCo2(rows.reduce((s, r) => s + Number(r.co2_saved_kg ?? 0), 0));
      setPoints(profile?.total_points ?? 0);
      lastFetchRef.current = Date.now();
    })();
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="mt-5 bg-gradient-primary rounded-2xl p-4 text-primary-foreground"
    >
      <div className="flex items-center gap-2 mb-2">
        <Leaf className="w-4 h-4" />
        <span className="text-xs font-semibold opacity-80">Your impact this week</span>
      </div>
      <div className="flex gap-6">
        <div>
          <p className="text-2xl font-display font-bold">{co2.toFixed(1)} kg</p>
          <p className="text-xs opacity-70">CO₂ saved</p>
        </div>
        <div>
          <p className="text-2xl font-display font-bold">{trips}</p>
          <p className="text-xs opacity-70">green trips</p>
        </div>
        <div>
          <p className="text-2xl font-display font-bold">{points}</p>
          <p className="text-xs opacity-70">total points</p>
        </div>
      </div>
    </motion.div>
  );
}
