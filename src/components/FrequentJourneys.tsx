import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Repeat, ArrowRight, X } from "lucide-react";
import { useFrequentJourneys } from "@/hooks/useFrequentJourneys";
import { useGeolocation } from "@/hooks/useGeolocation";

const FrequentJourneys = () => {
  const navigate = useNavigate();
  const geo = useGeolocation();
  const { journeys, loading, removeJourney } = useFrequentJourneys(4);

  if (!loading && journeys.length === 0) return null;

  const handleGo = (from: string, to: string) => {
    const isMyLocation = from.startsWith("📍 My location");
    const fromCoords =
      isMyLocation && geo.position
        ? { lat: geo.position.lat, lng: geo.position.lng }
        : undefined;
    navigate("/routes", {
      state: {
        from,
        to,
        fromCoords,
        toCoords: undefined,
      },
    });
  };

  const truncate = (s: string, n = 22) =>
    s.length > n ? `${s.slice(0, n - 1)}…` : s;

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Repeat className="w-3.5 h-3.5" /> Frequent journeys
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {journeys.map((j, idx) => (
          <motion.div
            key={j.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="group relative bg-card rounded-xl border border-border shadow-card p-3 flex items-center gap-3 hover:border-primary/40 transition-colors"
          >
            <button
              onClick={() => handleGo(j.from_location, j.to_location)}
              className="flex-1 text-left flex items-center gap-2 min-w-0"
              aria-label={`Plan ${j.from_location} to ${j.to_location}`}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Repeat className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                  <span className="truncate">{truncate(j.from_location)}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{truncate(j.to_location)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Used {j.usage_count}× · tap to plan
                </div>
              </div>
            </button>
            <button
              onClick={() => removeJourney(j.id)}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
              aria-label="Remove from frequent journeys"
              title="Remove"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FrequentJourneys;
