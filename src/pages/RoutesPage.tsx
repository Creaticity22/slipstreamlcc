import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, WifiOff, RefreshCw } from "lucide-react";
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

const staticRoutes: RouteData[] = [
  {
    type: "fastest",
    departureTime: "07:42",
    arrivalTime: "08:15",
    duration: "33 min",
    co2: "0.4 kg CO₂e",
    crowding: "High",
    legs: [
      { mode: "bus", line: "72", duration: "18 min" },
      { mode: "train", line: "Northern", duration: "12 min" },
    ],
    delay: 2,
  },
  {
    type: "least-busy",
    departureTime: "07:50",
    arrivalTime: "08:28",
    duration: "38 min",
    co2: "0.3 kg CO₂e",
    crowding: "Low",
    legs: [
      { mode: "bus", line: "X6", duration: "25 min" },
      { mode: "walk", line: "Walk", duration: "8 min" },
    ],
  },
  {
    type: "lowest-carbon",
    departureTime: "07:45",
    arrivalTime: "08:22",
    duration: "37 min",
    co2: "0.2 kg CO₂e",
    crowding: "Medium",
    legs: [
      { mode: "bus", line: "110", duration: "30 min" },
      { mode: "walk", line: "Walk", duration: "5 min" },
    ],
  },
];

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

/** Merge live BODS data into static routes */
function mergeWithLive(routes: RouteData[], liveDeps: LiveDeparture[]): RouteData[] {
  return routes.map((route) => {
    // Find the first bus leg and try to match a live vehicle
    const busLeg = route.legs.find((l) => l.mode === "bus");
    if (!busLeg) return route;

    // Find closest live vehicle for this line
    const matching = liveDeps.filter(
      (d) => (d.lineName || d.lineRef) === busLeg.line
    );

    if (matching.length === 0) return route;

    // Pick closest vehicle to reference point
    const closest = matching.reduce((best, d) => {
      if (!d.location) return best;
      if (!best) return d;
      const distD = haversineKm(REF_LAT, REF_LNG, d.location.lat, d.location.lng);
      const distBest = best.location
        ? haversineKm(REF_LAT, REF_LNG, best.location.lat, best.location.lng)
        : Infinity;
      return distD < distBest ? d : best;
    }, null as LiveDeparture | null);

    if (!closest) return route;

    // Estimate minutes away
    let estMins = 0;
    if (closest.minutesAway !== null && closest.minutesAway !== undefined) {
      estMins = closest.minutesAway;
    } else if (closest.location) {
      const distKm = haversineKm(REF_LAT, REF_LNG, closest.location.lat, closest.location.lng);
      estMins = Math.round((distKm / 25) * 60);
    }

    // Calculate new departure time from now + estimated minutes
    const now = new Date();
    const depTime = addMinutes(nowHHMM(), estMins);

    // Calculate total journey duration (sum of all legs)
    const totalMins = route.legs.reduce((sum, l) => {
      const match = l.duration.match(/(\d+)/);
      return sum + (match ? parseInt(match[1], 10) : 0);
    }, 0);

    const arrTime = addMinutes(depTime, totalMins - parseInt(busLeg.duration) + estMins > 0 ? totalMins : totalMins);

    // Determine delay
    const delay = closest.status === "delayed" ? closest.delayMinutes : 0;

    // Crowding from data freshness
    const recAge = closest.recordedAtTime
      ? (Date.now() - new Date(closest.recordedAtTime).getTime()) / 60000
      : 0;
    const crowding: "Low" | "Medium" | "High" = recAge > 5 ? "High" : recAge > 2 ? "Medium" : "Low";

    return {
      ...route,
      departureTime: depTime,
      arrivalTime: addMinutes(depTime, totalMins),
      delay: delay > 0 ? delay : undefined,
      crowding,
      legs: route.legs.map((l) =>
        l.line === busLeg.line
          ? { ...l, duration: estMins <= 1 ? "Due" : `~${estMins} min` }
          : l
      ),
    };
  });
}

const RoutesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { from, to } = (location.state as { from?: string; to?: string }) || {};

  const [routes, setRoutes] = useState<RouteData[]>(staticRoutes);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLiveDepartures();
      if (result.source !== "error" && result.departures.length > 0) {
        setRoutes(mergeWithLive(staticRoutes, result.departures));
        setIsLive(true);
        setLastUpdated(new Date(result.updatedAt));
      } else {
        setRoutes(staticRoutes);
        setIsLive(false);
      }
    } catch {
      setRoutes(staticRoutes);
      setIsLive(false);
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
              {isLive ? "Live times" : "Scheduled times"} · Today
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
            className="bg-slipstream-gold/10 border border-slipstream-gold/30 rounded-xl p-2.5 flex items-center gap-2 mb-3"
          >
            <WifiOff className="w-3.5 h-3.5 text-slipstream-gold shrink-0" />
            <p className="text-xs text-muted-foreground">Live data unavailable – showing scheduled times</p>
          </motion.div>
        )}

        <div className="space-y-3">
          {routes.map((route, i) => (
            <motion.div
              key={route.type}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <RouteCard {...route} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-4 space-y-1"
        >
          <p className="text-xs text-muted-foreground">
            Nice one—the green route saves 0.7 kg CO₂e 🌱
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isLive && lastUpdated
              ? `● Live · Updated at ${formatTime(lastUpdated)}`
              : loading
              ? "Fetching live data…"
              : "Using scheduled times"}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RoutesPage;
