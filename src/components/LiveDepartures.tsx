import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bus, Train, AlertTriangle, Clock, RefreshCw, WifiOff } from "lucide-react";
import { fetchLiveDepartures, LiveDeparture } from "@/services/bodsService";

const POLL_INTERVAL_MS = 30_000;

// Static fallback data (original mock)
const fallbackDepartures = [
  { mode: "bus" as const, line: "72", destination: "Leeds City Centre", time: "3 min", status: "on-time" as const, crowding: "Low" },
  { mode: "bus" as const, line: "X6", destination: "Bradford Interchange", time: "7 min", status: "on-time" as const, crowding: "Medium" },
  { mode: "train" as const, line: "Northern", destination: "Huddersfield", time: "12 min", status: "delayed" as const, crowding: "High" },
  { mode: "bus" as const, line: "110", destination: "Wakefield", time: "15 min", status: "on-time" as const, crowding: "Low" },
  { mode: "train" as const, line: "TPE", destination: "Manchester Piccadilly", time: "18 min", status: "on-time" as const, crowding: "Medium" },
];

const statusBadge = {
  "on-time": "bg-slipstream-teal/15 text-slipstream-teal",
  delayed: "bg-slipstream-coral/15 text-slipstream-coral",
  early: "bg-slipstream-purple/15 text-slipstream-purple",
};

const crowdingFromDelay = (delayMinutes: number): string => {
  if (delayMinutes > 5) return "High";
  if (delayMinutes > 2) return "Medium";
  return "Low";
};
const crowdingDots: Record<string, number> = { Low: 1, Medium: 2, High: 3 };

interface DisplayDeparture {
  mode: "bus" | "train";
  line: string;
  destination: string;
  time: string;
  status: "on-time" | "delayed" | "early";
  crowding: string;
}

function liveToDeparture(dep: LiveDeparture): DisplayDeparture {
  const mins = dep.minutesAway;
  return {
    mode: dep.mode,
    line: dep.lineName || dep.lineRef,
    destination: dep.destination || "Unknown",
    time: mins !== null && mins !== undefined ? (mins <= 0 ? "Due" : `${mins} min`) : "--",
    status: dep.status,
    crowding: crowdingFromDelay(dep.delayMinutes),
  };
}

const LiveDepartures = () => {
  const [departures, setDepartures] = useState<DisplayDeparture[]>(fallbackDepartures);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchLiveDepartures();

      if (result.source === "error" || result.departures.length === 0) {
        // Fallback to static data
        setDepartures(fallbackDepartures);
        setIsLive(false);
        setError(result.error || "No live data available");
      } else {
        const mapped = result.departures.map(liveToDeparture);
        setDepartures(mapped.length > 0 ? mapped : fallbackDepartures);
        setIsLive(mapped.length > 0);
        setLastUpdated(new Date(result.updatedAt));
        setError(null);
      }
    } catch {
      setDepartures(fallbackDepartures);
      setIsLive(false);
      setError("Live data unavailable");
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
    <div className="space-y-4">
      <div className="bg-card rounded-2xl shadow-card overflow-hidden border border-border">
        <div className="bg-gradient-primary px-4 py-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-foreground" />
          <span className="text-sm font-semibold text-primary-foreground">
            {isLive ? "Live departures near you" : "Scheduled departures"}
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
          {departures.map((dep, i) => (
            <motion.div
              key={`${dep.line}-${dep.destination}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="px-4 py-3 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dep.mode === "bus" ? "bg-slipstream-coral/15" : "bg-slipstream-purple/15"}`}>
                {dep.mode === "bus" ? (
                  <Bus className="w-4 h-4 text-slipstream-coral" />
                ) : (
                  <Train className="w-4 h-4 text-slipstream-purple" />
                )}
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
                </div>
              </div>
              <span className="text-lg font-display font-bold text-foreground whitespace-nowrap">{dep.time}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fallback notice */}
      {!isLive && error && (
        <div className="bg-slipstream-gold/10 border border-slipstream-gold/30 rounded-xl p-3 flex items-start gap-2.5">
          <WifiOff className="w-4 h-4 text-slipstream-gold mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Live data unavailable</p>
            <p className="text-xs text-muted-foreground mt-0.5">Showing scheduled times. We'll keep trying to connect.</p>
          </div>
        </div>
      )}

      {/* Heads up tip (only when live) */}
      {isLive && (
        <div className="bg-slipstream-gold/10 border border-slipstream-gold/30 rounded-xl p-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-slipstream-gold mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Heads up!</p>
            <p className="text-xs text-muted-foreground mt-0.5">Data sourced from BODS. Times may vary—plan a few minutes' buffer 😊</p>
          </div>
        </div>
      )}

      {/* Updated at timestamp */}
      <p className="text-center text-[10px] text-muted-foreground">
        {lastUpdated
          ? `Updated at ${formatTime(lastUpdated)}`
          : "Fetching live data…"}
      </p>
    </div>
  );
};

export default LiveDepartures;
