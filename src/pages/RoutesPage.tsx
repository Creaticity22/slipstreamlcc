import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, WifiOff, RefreshCw, Bus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import RouteCard from "@/components/RouteCard";
import { fetchLiveDepartures, LiveDeparture } from "@/services/bodsService";

const POLL_INTERVAL_MS = 30_000;

const REF_LAT = 53.825;
const REF_LNG = -1.576;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface RouteData {
  type: "fastest" | "least-busy" | "lowest-carbon";
  departureTime: string;
  arrivalTime: string;
  duration: string;
  co2: string;
  crowding: "Low" | "Medium" | "High";
  legs: { mode: "bus" | "train" | "walk"; line: string; duration: string }[];
  delay?: number;
}

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// CO₂ estimate: bus ~0.089 kg/km, walk = 0
function estimateCo2(distKm: number): string {
  const co2 = distKm * 0.089;
  return `${co2.toFixed(1)} kg CO₂e`;
}

/** Build route options entirely from BODS live departures */
function buildRoutesFromLive(departures: LiveDeparture[]): RouteData[] {
  if (departures.length === 0) return [];

  // Group by line, pick closest vehicle per line
  const byLine = new Map<string, LiveDeparture & { distKm: number }>();
  for (const dep of departures) {
    if (!dep.location) continue;
    const distKm = haversineKm(REF_LAT, REF_LNG, dep.location.lat, dep.location.lng);
    const lineName = dep.lineName || dep.lineRef;
    const existing = byLine.get(lineName);
    if (!existing || distKm < existing.distKm) {
      byLine.set(lineName, { ...dep, distKm });
    }
  }

  if (byLine.size === 0) return [];

  // Sort by estimated arrival time (distance-based)
  const sorted = Array.from(byLine.entries()).sort(
    ([, a], [, b]) => a.distKm - b.distKm
  );

  const routes: RouteData[] = [];
  const types: Array<"fastest" | "least-busy" | "lowest-carbon"> = [
    "fastest",
    "least-busy",
    "lowest-carbon",
  ];

  for (let i = 0; i < Math.min(sorted.length, 3); i++) {
    const [lineName, dep] = sorted[i];
    const estMinutes = Math.round((dep.distKm / 25) * 60);
    const depTime = addMinutes(nowHHMM(), estMinutes);

    // Estimate total journey as bus time + 5 min walk to stop
    const walkMinutes = 5;
    const busMinutes = Math.max(estMinutes, 5);
    const totalMinutes = walkMinutes + busMinutes;
    const arrTime = addMinutes(nowHHMM(), totalMinutes);

    // Crowding from data freshness
    const recAge = dep.recordedAtTime
      ? (Date.now() - new Date(dep.recordedAtTime).getTime()) / 60000
      : 0;
    const crowding: "Low" | "Medium" | "High" =
      recAge > 5 ? "High" : recAge > 2 ? "Medium" : "Low";

    const destination = (dep.destination || "").replace(/_/g, " ");

    routes.push({
      type: types[i] || "fastest",
      departureTime: depTime,
      arrivalTime: arrTime,
      duration: `${totalMinutes} min`,
      co2: estimateCo2(dep.distKm + 2), // +2km for assumed route length beyond straight-line
      crowding,
      legs: [
        { mode: "walk", line: "Walk", duration: `${walkMinutes} min` },
        {
          mode: "bus",
          line: lineName,
          duration: estMinutes <= 1 ? "Due" : `~${estMinutes} min`,
        },
      ],
      delay: dep.delayMinutes > 0 ? dep.delayMinutes : undefined,
    });
  }

  return routes;
}

const RoutesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { from, to } = (location.state as { from?: string; to?: string }) || {};

  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLiveDepartures();
      if (result.source !== "error" && result.departures.length > 0) {
        const built = buildRoutesFromLive(result.departures);
        setRoutes(built);
        setIsLive(built.length > 0);
        setLastUpdated(new Date(result.updatedAt));
        setError(null);
      } else {
        setRoutes([]);
        setIsLive(false);
        setError(result.error || "No buses found in this area");
      }
    } catch {
      setRoutes([]);
      setIsLive(false);
      setError("Could not reach BODS");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-5"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-card"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {from || "Your location"} → {to || "Destination"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isLive ? "● Live from BODS" : loading ? "Loading…" : "No live data"} · Today
            </p>
          </div>
          <button onClick={refresh} className="p-1.5" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </motion.div>

        {!isLive && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slipstream-gold/10 border border-slipstream-gold/30 rounded-xl p-3 flex items-center gap-2.5 mb-3"
          >
            <WifiOff className="w-4 h-4 text-slipstream-gold shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">No routes available</p>
              <p className="text-xs text-muted-foreground">
                {error || "No buses found near you right now. We'll keep checking every 30 seconds."}
              </p>
            </div>
          </motion.div>
        )}

        {routes.length > 0 && (
          <div className="space-y-3">
            {routes.map((route, i) => (
              <motion.div
                key={`${route.type}-${route.legs.map(l => l.line).join("-")}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <RouteCard {...route} />
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-4 space-y-1"
        >
          {isLive && routes.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {routes.length} route options from live BODS data 🚌
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            {isLive && lastUpdated
              ? `Updated at ${formatTime(lastUpdated)} · data.bus-data.dft.gov.uk`
              : loading
              ? "Fetching live data from BODS…"
              : "Waiting for BODS data"}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RoutesPage;
