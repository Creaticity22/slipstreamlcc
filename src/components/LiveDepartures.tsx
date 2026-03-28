import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, AlertTriangle, Clock, RefreshCw, WifiOff, MapPin, Navigation } from "lucide-react";
import { fetchLiveDepartures, LiveDeparture } from "@/services/bodsService";
import { GeoPosition } from "@/hooks/useGeolocation";
import { getWalkingDirections, WalkingRoute } from "@/services/directionsService";
import WalkingDirections from "@/components/WalkingDirections";

const POLL_INTERVAL_MS = 30_000;

const statusBadge: Record<string, string> = {
  "on-time": "bg-slipstream-teal/15 text-slipstream-teal",
  delayed: "bg-slipstream-coral/15 text-slipstream-coral",
  early: "bg-slipstream-purple/15 text-slipstream-purple",
};

const crowdingDots: Record<string, number> = { Low: 1, Medium: 2, High: 3 };

interface DisplayDeparture {
  mode: "bus" | "train";
  line: string;
  destination: string;
  time: string;
  status: "on-time" | "delayed" | "early";
  crowding: string;
  operator: string;
  distanceKm: number | null;
  busLat: number | null;
  busLng: number | null;
}

interface Props {
  userPosition?: GeoPosition | null;
  bbox?: { minLat: number; maxLat: number; minLon: number; maxLon: number } | null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDestination(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function liveToDeparture(dep: LiveDeparture, refLat: number, refLng: number): DisplayDeparture {
  let timeStr = "Nearby";
  let distanceKm: number | null = null;

  if (dep.location) {
    distanceKm = haversineKm(refLat, refLng, dep.location.lat, dep.location.lng);
    const estMinutes = Math.round((distanceKm / 25) * 60);
    if (estMinutes <= 1) timeStr = "Due";
    else timeStr = `~${estMinutes} min`;
  }

  if (dep.minutesAway !== null && dep.minutesAway !== undefined) {
    timeStr = dep.minutesAway <= 0 ? "Due" : `${dep.minutesAway} min`;
  }

  const recAge = dep.recordedAtTime ? (Date.now() - new Date(dep.recordedAtTime).getTime()) / 60000 : 0;
  const crowding = recAge > 5 ? "High" : recAge > 2 ? "Medium" : "Low";

  return {
    mode: dep.mode,
    line: dep.lineName || dep.lineRef,
    destination: formatDestination(dep.destination || "Unknown"),
    time: timeStr,
    status: dep.status,
    crowding,
    operator: dep.operatorRef,
    distanceKm,
    busLat: dep.location?.lat ?? null,
    busLng: dep.location?.lng ?? null,
  };
}

function deduplicateDepartures(deps: DisplayDeparture[]): DisplayDeparture[] {
  const seen = new Map<string, DisplayDeparture>();
  for (const dep of deps) {
    const key = `${dep.line}-${dep.destination}`;
    const existing = seen.get(key);
    if (!existing || (dep.distanceKm !== null && (existing.distanceKm === null || dep.distanceKm < existing.distanceKm))) {
      seen.set(key, dep);
    }
  }
  return Array.from(seen.values()).sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
}

const LiveDepartures = ({ userPosition, bbox }: Props) => {
  const [departures, setDepartures] = useState<DisplayDeparture[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walkingRoute, setWalkingRoute] = useState<WalkingRoute | null>(null);
  const [walkingLoading, setWalkingLoading] = useState(false);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);

  const refLat = userPosition?.lat ?? 53.825;
  const refLng = userPosition?.lng ?? -1.576;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLiveDepartures(undefined, bbox ?? undefined);

      if (result.source === "error" || result.departures.length === 0) {
        setDepartures([]);
        setIsLive(false);
        setError(result.error || "No live data available");
      } else {
        const mapped = deduplicateDepartures(
          result.departures.map(d => liveToDeparture(d, refLat, refLng))
        );
        setDepartures(mapped);
        setIsLive(true);
        setLastUpdated(new Date(result.updatedAt));
        setError(null);
      }
    } catch {
      setDepartures([]);
      setIsLive(false);
      setError("Live data unavailable");
    } finally {
      setLoading(false);
    }
  }, [refLat, refLng, bbox]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleGetDirections = async (dep: DisplayDeparture) => {
    if (!userPosition || !dep.busLat || !dep.busLng) return;
    const key = `${dep.line}-${dep.destination}`;
    if (selectedBus === key) {
      setSelectedBus(null);
      setWalkingRoute(null);
      return;
    }
    setSelectedBus(key);
    setWalkingLoading(true);
    const route = await getWalkingDirections(userPosition, dep.busLat, dep.busLng);
    setWalkingRoute(route);
    setWalkingLoading(false);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl shadow-card overflow-hidden border border-border">
        <div className="bg-gradient-primary px-4 py-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-foreground" />
          <span className="text-sm font-semibold text-primary-foreground">
            {isLive ? "Live buses near you" : loading ? "Loading…" : "No buses found"}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            {isLive ? (
              <span className="text-[10px] text-primary-foreground/70 animate-pulse-soft">● Live</span>
            ) : (
              <WifiOff className="w-3 h-3 text-primary-foreground/50" />
            )}
            <button onClick={refresh} className="p-0.5" aria-label="Refresh">
              <RefreshCw className={`w-3 h-3 text-primary-foreground/70 ${loading ? "animate-spin" : ""}`} />
            </button>
          </span>
        </div>

        <div className="divide-y divide-border">
          {departures.length === 0 && !loading && (
            <div className="px-4 py-8 text-center">
              <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No live buses found near you right now</p>
              <p className="text-xs text-muted-foreground mt-1">Data sourced from BODS – try refreshing in a moment</p>
            </div>
          )}
          {departures.map((dep, i) => {
            const key = `${dep.line}-${dep.destination}`;
            const isSelected = selectedBus === key;
            return (
              <motion.div
                key={`${key}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/50"}`}
                onClick={() => handleGetDirections(dep)}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slipstream-coral/15">
                  <Bus className="w-4 h-4 text-slipstream-coral" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{dep.line}</span>
                    <span className="text-sm text-foreground truncate">{dep.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${statusBadge[dep.status]}`}>
                      {dep.status === "delayed" && <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />}
                      {dep.status === "on-time" ? "On time" : dep.status === "delayed" ? "Delayed" : "Early"}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div
                          key={j}
                          className={`w-1.5 h-1.5 rounded-full ${j < crowdingDots[dep.crowding] ? "bg-slipstream-coral" : "bg-border"}`}
                        />
                      ))}
                    </div>
                    {dep.distanceKm !== null && (
                      <span className="text-[10px] text-muted-foreground">{dep.distanceKm.toFixed(1)} km away</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dep.busLat && userPosition && (
                    <Navigation className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-muted-foreground/40"}`} />
                  )}
                  <span className="text-lg font-display font-bold text-foreground whitespace-nowrap">{dep.time}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Walking directions panel */}
      <AnimatePresence>
        {(walkingRoute || walkingLoading) && selectedBus && (
          <WalkingDirections
            route={walkingRoute}
            loading={walkingLoading}
            stopName={departures.find(d => `${d.line}-${d.destination}` === selectedBus)?.destination || "bus stop"}
            onClose={() => {
              setSelectedBus(null);
              setWalkingRoute(null);
            }}
          />
        )}
      </AnimatePresence>

      {!isLive && error && !loading && (
        <div className="bg-slipstream-gold/10 border border-slipstream-gold/30 rounded-xl p-3 flex items-start gap-2.5">
          <WifiOff className="w-4 h-4 text-slipstream-gold mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Live data unavailable</p>
            <p className="text-xs text-muted-foreground mt-0.5">Could not reach BODS. We'll keep trying every 30 seconds.</p>
          </div>
        </div>
      )}

      {isLive && (
        <div className="bg-slipstream-teal/10 border border-slipstream-teal/30 rounded-xl p-3 flex items-start gap-2.5">
          <Bus className="w-4 h-4 text-slipstream-teal mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Live from BODS 🚌</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time vehicle positions · Tap a bus for walking directions
            </p>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        {lastUpdated
          ? `Updated at ${formatTime(lastUpdated)} · Source: data.bus-data.dft.gov.uk`
          : loading
          ? "Fetching live data from BODS…"
          : "No data available"}
      </p>
    </div>
  );
};

export default LiveDepartures;
