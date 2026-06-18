import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useFrequentJourneys } from "@/hooks/useFrequentJourneys";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchLiveDepartures, type LiveDeparture } from "@/services/bodsService";

export default function LiveNudge() {
  const { journeys } = useFrequentJourneys(1);
  const { toBbox } = useGeolocation();
  const [dep, setDep] = useState<LiveDeparture | null>(null);

  useEffect(() => {
    const top = journeys[0];
    const bbox = toBbox(11); // ~0.1° radius
    if (!top || !bbox) {
      setDep(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await fetchLiveDepartures(undefined, bbox);
      if (cancelled || result.source === "error") return;
      const target = top.to_location.toLowerCase();
      const match = result.departures
        .filter(
          (d) =>
            d.minutesAway != null &&
            d.minutesAway >= 5 &&
            d.minutesAway <= 30 &&
            (d.destination?.toLowerCase().includes(target) ||
              target.includes(d.destination?.toLowerCase() ?? ""))
        )
        .sort((a, b) => (a.minutesAway ?? 0) - (b.minutesAway ?? 0))[0];
      setDep(match ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [journeys, toBbox]);

  if (!dep) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-4 bg-card rounded-xl p-3.5 border border-border shadow-card flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-slipstream-gold/15 flex items-center justify-center shrink-0">
        <Zap className="w-5 h-5 text-slipstream-gold" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">
          Leave in {dep.minutesAway} minutes
        </p>
        <p className="text-xs text-muted-foreground">
          {dep.lineName} to {dep.destination} {dep.status === "on-time" ? "is on time" : `is ${dep.status}`} 🚌
        </p>
      </div>
    </motion.div>
  );
}
