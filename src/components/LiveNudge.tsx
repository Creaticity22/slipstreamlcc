import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useFrequentJourneys } from "@/hooks/useFrequentJourneys";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchLiveDepartures, type LiveDeparture } from "@/services/bodsService";
import { fetchNearbyStops } from "@/services/naptanService";

const WALK_KMH = 4;
const BUFFER_MIN = 2;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeMinutesAway(dep: LiveDeparture): number | null {
  const t = dep.expectedDepartureTime || dep.aimedDepartureTime;
  if (!t) return null;
  return Math.max(0, Math.round((new Date(t).getTime() - Date.now()) / 60000));
}

export default function LiveNudge() {
  const { journeys } = useFrequentJourneys(1);
  const { position, toBbox } = useGeolocation();
  const [dep, setDep] = useState<LiveDeparture | null>(null);
  const [walkMin, setWalkMin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minutesAway, setMinutesAway] = useState<number | null>(null);

  const top = journeys[0];
  const bbox = toBbox(11);
  const hasContext = !!(top && bbox && position);

  useEffect(() => {
    if (!hasContext) {
      setDep(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const [stopsRes, liveRes] = await Promise.all([
          fetchNearbyStops(position!.lat, position!.lng, 1),
          fetchLiveDepartures(undefined, bbox!),
        ]);
        if (cancelled) return;
        if (liveRes.source === "error") {
          setDep(null);
          return;
        }
        const target = top!.to_location.toLowerCase();
        const match = liveRes.departures
          .map((d) => ({ d, m: computeMinutesAway(d) }))
          .filter(
            ({ d, m }) =>
              m != null &&
              (d.destination?.toLowerCase().includes(target) ||
                target.includes(d.destination?.toLowerCase() ?? ""))
          )
          .sort((a, b) => (a.m ?? 0) - (b.m ?? 0))[0];

        const nearestStop = stopsRes.stops[0];
        const walkKm = nearestStop
          ? haversineKm(position!.lat, position!.lng, nearestStop.lat, nearestStop.lng)
          : 0.3;
        setWalkMin(Math.ceil((walkKm / WALK_KMH) * 60) + BUFFER_MIN);
        setDep(match?.d ?? null);
        setMinutesAway(match ? match.m : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [journeys, toBbox, position]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live countdown without re-fetching
  useEffect(() => {
    if (!dep) return;
    const tick = () => setMinutesAway(computeMinutesAway(dep));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [dep]);

  if (!hasContext) return null;
  if (loading) {
    return <div className="mt-4 h-16 rounded-xl bg-muted animate-pulse" />;
  }
  if (!dep || minutesAway == null) return null;

  const leaveIn = minutesAway - walkMin;
  let title: string;
  let tone = "text-foreground";
  if (minutesAway < 5) {
    title = "Leave now — bus is close!";
    tone = "text-slipstream-coral";
  } else if (minutesAway > 25) {
    title = `Next bus in ${minutesAway} mins — no rush`;
  } else {
    title = `Leave in ${Math.max(1, leaveIn)} minutes`;
  }

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
        <p className={`text-sm font-semibold ${tone}`}>{title}</p>
        <p className="text-xs text-muted-foreground">
          {dep.lineName} to {dep.destination} · {dep.status === "on-time" ? "on time" : dep.status} 🚌
        </p>
      </div>
    </motion.div>
  );
}
