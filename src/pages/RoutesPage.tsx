import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import RouteCard from "@/components/RouteCard";
import { planJourney, type JourneyOption } from "@/services/journeyPlannerService";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLiveBusOverlay } from "@/hooks/useLiveBusOverlay";


const RoutesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    from,
    to,
    fromCoords,
    toCoords,
  } = (location.state as {
    from?: string;
    to?: string;
    fromCoords?: { lat: number; lng: number };
    toCoords?: { lat: number; lng: number };
  }) || {};

  const fromLabel = from || "Your location";
  const toLabel = to || "Destination";

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<JourneyOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const geo = useGeolocation();
  const bbox = geo.toBbox(10);
  const overlaidOptions = useLiveBusOverlay(options, bbox);


  const search = useCallback(async () => {
    if (!from || !to) {
      setLoading(false);
      setError("Please enter a start and destination");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await planJourney(from, to, fromCoords, toCoords);
    setOptions(result.options);
    setError(result.source === "error" ? result.error ?? "No routes found" : null);
    setLoading(false);
  }, [from, to, fromCoords, toCoords]);

  useEffect(() => {
    search();
  }, [search]);

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
              {fromLabel} → {toLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              {loading ? "Searching…" : options.length > 0 ? `${options.length} options` : "No options"}
            </p>
          </div>
          <button
            onClick={search}
            disabled={loading}
            className="p-1.5"
            aria-label="Search again"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </motion.div>

        {loading && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">Finding your routes…</p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse h-32" />
            ))}
          </div>
        )}

        {!loading && options.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-2xl p-5 text-center space-y-3"
          >
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">No routes found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error || "We couldn't find a route between these places."}
              </p>
            </div>
            <button
              onClick={search}
              className="bg-gradient-primary text-primary-foreground font-semibold text-sm px-4 py-2 rounded-xl"
            >
              Try again
            </button>
          </motion.div>
        )}

        {!loading && options.length > 0 && (
          <div className="space-y-3">
            {options.map((opt, i) => (
              <motion.div
                key={`${opt.type}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <RouteCard {...opt} />
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center mt-5">
          Journey times from TransportAPI · Live tracking from BODS
        </p>
      </div>
    </div>
  );
};

export default RoutesPage;
