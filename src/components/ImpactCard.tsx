import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const CO2_PER_KM_KG = 0.082;
const AVG_TRIP_KM = 8;

export default function ImpactCard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!user) {
      setTrips(0);
      setPoints(0);
      return;
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    (async () => {
      const [{ count }, { data: profile }] = await Promise.all([
        supabase
          .from("trips")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("started_at", sevenDaysAgo),
        supabase
          .from("profiles")
          .select("total_points")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setTrips(count ?? 0);
      setPoints(profile?.total_points ?? 0);
    })();
  }, [user]);

  const co2Kg = (trips * AVG_TRIP_KM * CO2_PER_KM_KG).toFixed(1);

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
          <p className="text-2xl font-display font-bold">{co2Kg} kg</p>
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
